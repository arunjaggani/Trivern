import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";

// POST /api/n8n/book-meeting
// Called by Zara after client selects a slot
export async function POST(req: Request) {
    try {
        const { phone, slotStart, duration = 20, notes } = await req.json();

        if (!phone || !slotStart) {
            return NextResponse.json({ error: "phone and slotStart required" }, { status: 400 });
        }

        // Find or create client
        let client = await prisma.client.findFirst({ where: { phone } });
        if (!client) {
            client = await prisma.client.create({
                data: { name: "WhatsApp Lead", phone, source: "WhatsApp", status: "BOOKED" },
            });
        }

        const meetingDate = new Date(slotStart);
        const endDate = new Date(meetingDate.getTime() + duration * 60000);

        let calendarEventId: string | null = null;
        let meetLink: string | null = null;

        // Create Google Calendar event + Meet link
        try {
            const calendar = getCalendarClient();
            const event = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                conferenceDataVersion: 1,
                requestBody: {
                    summary: `Trivern × ${client.name}${client.company ? ` (${client.company})` : ""}`,
                    description: [
                        `Client: ${client.name}`,
                        client.company ? `Company: ${client.company}` : "",
                        client.phone ? `Phone: ${client.phone}` : "",
                        client.service ? `Service Interest: ${client.service}` : "",
                        client.context ? `\nContext:\n${client.context}` : "",
                        notes ? `\nNotes:\n${notes}` : "",
                        `\nLead Score: ${client.scoreOverride ?? client.score}/100`,
                    ].filter(Boolean).join("\n"),
                    start: { dateTime: meetingDate.toISOString(), timeZone: "Asia/Kolkata" },
                    end: { dateTime: endDate.toISOString(), timeZone: "Asia/Kolkata" },
                    attendees: client.email ? [{ email: client.email }] : [],
                    conferenceData: {
                        createRequest: {
                            requestId: `trivern-${Date.now()}`,
                            conferenceSolutionKey: { type: "hangoutsMeet" },
                        },
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: "popup", minutes: 30 },
                            { method: "email", minutes: 60 },
                        ],
                    },
                },
            });

            calendarEventId = event.data.id || null;
            meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri || null;
        } catch (calError) {
            console.warn("[n8n/book-meeting] Calendar API unavailable:", calError);
        }

        // Save meeting to DB
        const meeting = await prisma.meeting.create({
            data: {
                clientId: client.id,
                date: meetingDate,
                duration,
                meetLink,
                calendarEventId,
                status: "SCHEDULED",
                remarks: notes || null,
            },
        });

        // Update client status
        await prisma.client.update({
            where: { id: client.id },
            data: { status: "BOOKED" },
        });

        // Trigger confirmation notification
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        if (n8nWebhookUrl) {
            fetch(n8nWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "booking_confirmed",
                    client: { name: client.name, phone: client.phone, company: client.company },
                    meeting: { date: meeting.date, duration, meetLink },
                }),
            }).catch((err) => console.warn("[n8n/book-meeting] Webhook failed:", err));
        }

        // Format confirmation for Zara
        const dateFormatted = meetingDate.toLocaleString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
        });

        return NextResponse.json({
            success: true,
            meetingId: meeting.id,
            meetLink,
            confirmationText: `Perfect, ${client.name} 🎯\n\nYou're confirmed for:\n📅 ${dateFormatted}\n⏰ Duration: ${duration} minutes\n${meetLink ? `🔗 Meeting link: ${meetLink}` : ""}\n\nYou'll receive reminders before the meeting.\nLooking forward to helping you structure this properly.`,
        });
    } catch (error: any) {
        console.error("[n8n/book-meeting] Error:", error);
        return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { logActivity, type ActivityChannel } from "@/lib/activity";

// POST /api/n8n/book-meeting
// Called by Zara after client selects a slot
export async function POST(req: Request) {
    try {
        const { phone, slotStart, duration = 20, notes, channel = "CHAT" } = await req.json();

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
        // Fallback permanent Meet room — used when Calendar API can't generate a link
        const HARDCODED_MEET_LINK = "https://meet.google.com/hvb-zqzt-xtk";
        let meetLink: string | null = process.env.FALLBACK_MEET_LINK || HARDCODED_MEET_LINK;

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
            // If Calendar generates a Meet link, use it — otherwise keep the fallback
            meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri || meetLink;
        } catch (calError: any) {
            console.error("[n8n/book-meeting] Calendar API FAILED:", calError?.message || calError);
            console.error("[n8n/book-meeting] Calendar error details:", JSON.stringify(calError?.errors || calError?.response?.data || {}, null, 2));
            // meetLink still holds FALLBACK_MEET_LINK if set
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
        const prevStatus = client.status;
        await prisma.client.update({
            where: { id: client.id },
            data: { status: "BOOKED" },
        });

        // Log activity — meeting booked
        await logActivity({
            clientId: client.id,
            type: "MEETING_BOOKED",
            channel: (channel as ActivityChannel) || "CHAT",
            title: `Meeting booked via ${channel === "VOICE" ? "Voice (Zara)" : "WhatsApp (Zara)"}`,
            detail: `${new Date(meetingDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${duration}min · ${meetLink || "No meet link"}`,
            meetingId: meeting.id,
            fromStatus: prevStatus,
            toStatus: "BOOKED",
            scoreAtEvent: client.scoreOverride ?? client.score,
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

        const meetLinkLine = meetLink
            ? `🔗 Google Meet: ${meetLink}`
            : `📌 Our team will send the meeting link separately before the call.`;

        // NOTE: meetLink is intentionally excluded from the response.
        // Zara must use confirmationText verbatim — including or excluding the link
        // based purely on what confirmationText contains.
        return NextResponse.json({
            success: true,
            meetingId: meeting.id,
            confirmationText: `Your meeting is confirmed! 🎯\n\n📅 *${dateFormatted}*\n⏰ Duration: ${duration} minutes\n${meetLinkLine}\n\nYou'll get reminders at 24 hours, 2 hours, and 15 minutes before.\nLooking forward to it — come ready with your biggest challenge.`,
        });
    } catch (error: any) {
        console.error("[n8n/book-meeting] Error:", error);
        return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
    }
}

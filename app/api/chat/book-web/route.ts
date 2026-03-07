import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/chat/book-web
// Books a meeting from the web chatbot — saves lead, creates meeting, sends WhatsApp confirmation
// Body: { name, phone, company?, service?, slotStart }

export async function POST(req: Request) {
    try {
        const { name, phone, company, service, slotStart } = await req.json();

        if (!phone || !slotStart) {
            return NextResponse.json({ error: "phone and slotStart are required" }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        const meetingDate = new Date(slotStart);
        const duration = 20;
        const endDate = new Date(meetingDate.getTime() + duration * 60000);

        // Find or create client
        let client = await prisma.client.findFirst({ where: { phone } });
        if (!client) {
            client = await prisma.client.create({
                data: {
                    name,
                    phone,
                    company: company || null,
                    service: service || null,
                    source: "Website",
                    status: "BOOKED",
                },
            });
        } else {
            // Update existing client with latest info
            client = await prisma.client.update({
                where: { id: client.id },
                data: {
                    name: client.name === "WhatsApp Lead" ? name : client.name,
                    company: client.company || company || null,
                    service: client.service || service || null,
                    status: "BOOKED",
                },
            });
        }

        // Try to create Google Calendar event + Meet link
        let meetLink: string | null = process.env.FALLBACK_MEET_LINK || "https://meet.google.com/hvb-zqzt-xtk";
        let calendarEventId: string | null = null;

        try {
            const calendar = getCalendarClient();
            const event = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                conferenceDataVersion: 1,
                requestBody: {
                    summary: `Trivern × ${client.name}${client.company ? ` (${client.company})` : ""}`,
                    description: `Client: ${client.name}\nPhone: ${client.phone}\n${client.company ? `Company: ${client.company}\n` : ""}${client.service ? `Interest: ${client.service}\n` : ""}Source: Website chatbot`,
                    start: { dateTime: meetingDate.toISOString(), timeZone: "Asia/Kolkata" },
                    end: { dateTime: endDate.toISOString(), timeZone: "Asia/Kolkata" },
                    conferenceData: {
                        createRequest: {
                            requestId: `trivern-web-${Date.now()}`,
                            conferenceSolutionKey: { type: "hangoutsMeet" },
                        },
                    },
                },
            });
            calendarEventId = event.data.id || null;
            meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri || meetLink;
        } catch (calErr: any) {
            console.warn("[chat/book-web] Calendar API failed, using fallback meet link:", calErr?.message);
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
                remarks: "Booked via website chatbot",
            },
        });

        // Format date for confirmation
        const dateFormatted = meetingDate.toLocaleString("en-IN", {
            weekday: "long", day: "numeric", month: "short",
            hour: "numeric", minute: "2-digit", hour12: true,
            timeZone: "Asia/Kolkata",
        });

        // Send WhatsApp confirmation
        const waMsg = `Hi ${client.name}! 🎯 Your meeting with Trivern is confirmed.\n\n📅 *${dateFormatted}*\n⏰ Duration: 20 minutes\n🔗 Google Meet: ${meetLink}\n\nYou'll get reminders before the meeting. Come ready with your biggest challenge — we're excited to connect! 🚀`;

        const waResult = await sendWhatsAppMessage(phone, waMsg);
        if (!waResult.success) {
            console.warn("[chat/book-web] WhatsApp notification failed:", waResult.error);
        }

        return NextResponse.json({
            success: true,
            meetingId: meeting.id,
            whatsappSent: waResult.success,
            confirmationText: `Your meeting is confirmed! 🎯\n\n📅 *${dateFormatted}*\n⏰ 20 minutes\n🔗 ${meetLink}\n\nI've sent the details to your WhatsApp too. See you then! 🚀`,
        });

    } catch (error: any) {
        console.error("[chat/book-web] Error:", error);
        return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
    }
}

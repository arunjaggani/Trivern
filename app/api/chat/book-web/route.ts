import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { sendWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/whatsapp";

// POST /api/chat/book-web
// Books a meeting from the web chatbot — saves lead, creates meeting, sends WhatsApp confirmation
// Body: { name, phone, company?, service?, slotStart }

export async function POST(req: Request) {
    try {
        const { name, phone: rawPhone, company, service, slotStart } = await req.json();

        if (!rawPhone || !slotStart) {
            return NextResponse.json({ error: "phone and slotStart are required" }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        // Sanitize phone: strip +, spaces, dashes → Meta needs plain digits e.g. 916309505052
        const phone = rawPhone.replace(/[\s\+\-\(\)]/g, "");

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

        // Send WhatsApp confirmation via N8N Webhook (User requested to use n8n instead)
        const templateName = process.env.WHATSAPP_CONFIRM_TEMPLATE || "trivetn_booking";
        const variables = [
            client.name,               // {{1}} Name
            dateFormatted,             // {{2}} Date constraint
            meetLink || "TBD"          // {{3}} Google Meet link
        ];

        console.log(`[chat/book-web] Triggering N8N Webhook for WhatsApp Template '${templateName}' to: "${phone}"`);
        let waSuccess = false;
        try {
            const webhookUrl = "http://localhost:5678/webhook/send-trivern-template"; // N8N Webhook URL
            const n8nRes = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    templateName,
                    variables,
                    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
                }),
            });

            if (!n8nRes.ok) {
                console.warn("[chat/book-web] N8N Webhook trigger FAILED:", n8nRes.statusText);
            } else {
                console.log("[chat/book-web] N8N Webhook triggered successfully to:", phone);
                waSuccess = true;
            }
        } catch (err: any) {
            console.error("[chat/book-web] N8N Webhook Network error:", err?.message || err);
        }

        // Only claim WhatsApp was sent if it actually succeeded
        const whatsappLine = waSuccess
            ? "\n\nI've sent the details to your WhatsApp too. See you then! 🚀"
            : "\n\nSee you then! 🚀";

        return NextResponse.json({
            success: true,
            meetingId: meeting.id,
            whatsappSent: waSuccess,
            confirmationText: `Your meeting is confirmed! 🎯\n\n📅 *${dateFormatted}*\n⏰ 20 minutes\n🔗 ${meetLink}${whatsappLine}`,
        });

    } catch (error: any) {
        console.error("[chat/book-web] Error:", error);
        return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
    }
}

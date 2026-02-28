import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import prisma from "@/lib/prisma";

// POST /api/calendar/book
// Body: { clientId, date, duration?, notes? }
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clientId, date, duration = 20, notes } = body;

        if (!clientId || !date) {
            return NextResponse.json({ error: "clientId and date are required" }, { status: 400 });
        }

        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const meetingDate = new Date(date);
        const endDate = new Date(meetingDate.getTime() + duration * 60000);

        let calendarEventId: string | null = null;
        let meetLink: string | null = null;

        // Try to create Google Calendar event with Meet link
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
                        client.service ? `Service Interest: ${client.service}` : "",
                        client.context ? `\nContext:\n${client.context}` : "",
                        notes ? `\nNotes:\n${notes}` : "",
                        `\nLead Score: ${client.scoreOverride ?? client.score}/100`,
                    ].filter(Boolean).join("\n"),
                    start: {
                        dateTime: meetingDate.toISOString(),
                        timeZone: "Asia/Kolkata",
                    },
                    end: {
                        dateTime: endDate.toISOString(),
                        timeZone: "Asia/Kolkata",
                    },
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
            console.warn("Calendar API unavailable, creating meeting in DB only:", calError);
            // Generate a placeholder meet link
            meetLink = null;
        }

        // Save meeting to database
        const meeting = await prisma.meeting.create({
            data: {
                clientId,
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
            where: { id: clientId },
            data: { status: "BOOKED" },
        });

        return NextResponse.json({
            success: true,
            meeting: {
                id: meeting.id,
                date: meeting.date,
                duration: meeting.duration,
                meetLink: meeting.meetLink,
                calendarEventId: meeting.calendarEventId,
            },
        });
    } catch (error: any) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
    }
}

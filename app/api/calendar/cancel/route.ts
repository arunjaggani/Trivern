import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import prisma from "@/lib/prisma";

// POST /api/calendar/cancel
// Body: { meetingId }
export async function POST(req: Request) {
    try {
        const { meetingId } = await req.json();

        if (!meetingId) {
            return NextResponse.json({ error: "meetingId is required" }, { status: 400 });
        }

        const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Cancel Google Calendar event if exists
        if (meeting.calendarEventId) {
            try {
                const calendar = getCalendarClient();
                await calendar.events.delete({
                    calendarId: CALENDAR_ID,
                    eventId: meeting.calendarEventId,
                });
            } catch (calError) {
                console.warn("Could not delete calendar event:", calError);
            }
        }

        // Update meeting status in DB
        const updated = await prisma.meeting.update({
            where: { id: meetingId },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json({ success: true, meeting: updated });
    } catch (error: any) {
        console.error("Cancel error:", error);
        return NextResponse.json({ error: "Failed to cancel meeting" }, { status: 500 });
    }
}

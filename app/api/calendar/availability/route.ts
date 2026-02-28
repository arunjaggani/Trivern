import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import prisma from "@/lib/prisma";

// GET /api/calendar/availability?date=2025-03-01
// Returns available 30-minute slots for the given date
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
        return NextResponse.json({ error: "date parameter required (YYYY-MM-DD)" }, { status: 400 });
    }

    try {
        const settings = await prisma.bookingSettings.findFirst();
        const startHour = settings?.startHour ?? 9;
        const endHour = settings?.endHour ?? 21;
        const slotDuration = settings?.slotDuration ?? 30;
        const bufferMinutes = settings?.bufferMinutes ?? 30;
        const maxPerDay = settings?.maxPerDay ?? 6;
        const blockedDates: string[] = JSON.parse(settings?.blockedDates || "[]");

        // Check if date is blocked
        if (blockedDates.includes(dateStr)) {
            return NextResponse.json({ date: dateStr, slots: [], blocked: true });
        }

        // Check how many meetings already booked for this date
        const dayStart = new Date(dateStr + "T00:00:00");
        const dayEnd = new Date(dateStr + "T23:59:59");
        const existingMeetings = await prisma.meeting.count({
            where: {
                date: { gte: dayStart, lte: dayEnd },
                status: { in: ["SCHEDULED", "COMPLETED"] },
            },
        });

        if (existingMeetings >= maxPerDay) {
            return NextResponse.json({ date: dateStr, slots: [], maxReached: true });
        }

        // Get busy times from Google Calendar
        const calendar = getCalendarClient();
        const timeMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
        const timeMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);

        // Use IST timezone
        const timezone = "Asia/Kolkata";

        let busySlots: { start: string; end: string }[] = [];

        try {
            const freeBusy = await calendar.freebusy.query({
                requestBody: {
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    timeZone: timezone,
                    items: [{ id: CALENDAR_ID }],
                },
            });

            busySlots = (freeBusy.data.calendars?.[CALENDAR_ID]?.busy || []) as { start: string; end: string }[];
        } catch (calError) {
            // If calendar API fails (e.g., not configured), continue with DB-only check
            console.warn("Calendar API unavailable, using DB-only slot check:", calError);

            // Get existing meeting times from DB as busy slots
            const dbMeetings = await prisma.meeting.findMany({
                where: {
                    date: { gte: dayStart, lte: dayEnd },
                    status: { in: ["SCHEDULED"] },
                },
                select: { date: true, duration: true },
            });

            busySlots = dbMeetings.map((m) => ({
                start: m.date.toISOString(),
                end: new Date(m.date.getTime() + m.duration * 60000).toISOString(),
            }));
        }

        // Generate available slots
        const slots: { start: string; end: string }[] = [];
        let current = new Date(timeMin);

        while (current.getTime() + slotDuration * 60000 <= timeMax.getTime()) {
            const slotStart = new Date(current);
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);

            // Check if slot overlaps with any busy period (including buffer)
            const isConflict = busySlots.some((busy) => {
                const busyStart = new Date(busy.start).getTime() - bufferMinutes * 60000;
                const busyEnd = new Date(busy.end).getTime() + bufferMinutes * 60000;
                return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
            });

            if (!isConflict) {
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                });
            }

            // Move to next slot
            current = new Date(current.getTime() + slotDuration * 60000);
        }

        return NextResponse.json({
            date: dateStr,
            slots,
            settings: { startHour, endHour, slotDuration, bufferMinutes },
            remainingSlots: maxPerDay - existingMeetings,
        });
    } catch (error: any) {
        console.error("Availability check error:", error);
        return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
    }
}

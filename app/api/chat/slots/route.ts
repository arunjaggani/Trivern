import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { formatSlotForWhatsApp } from "@/lib/types";

// GET /api/chat/slots?phone=919876543210
// Returns 2 available slots for the web chatbot booking flow

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    try {
        const settings = await prisma.bookingSettings.findFirst();
        const startHour = settings?.startHour ?? 9;
        const endHour = settings?.endHour ?? 21;
        const slotDuration = settings?.slotDuration ?? 30;
        const bufferMinutes = settings?.bufferMinutes ?? 30;
        const maxPerDay = settings?.maxPerDay ?? 6;
        const blockedDates: string[] = JSON.parse(settings?.blockedDates || "[]");

        const now = new Date();
        const searchEnd = new Date(now.getTime() + 72 * 3600000); // 72hr window
        const allSlots: { start: string; end: string; formatted: string }[] = [];
        const current = new Date(now);
        current.setMinutes(0, 0, 0);

        while (current < searchEnd && allSlots.length < 2) {
            const dateStr = current.toISOString().split("T")[0];
            if (blockedDates.includes(dateStr)) {
                current.setDate(current.getDate() + 1); current.setHours(startHour, 0, 0, 0); continue;
            }

            const dayStart = new Date(dateStr + "T00:00:00");
            const dayEnd = new Date(dateStr + "T23:59:59");
            const count = await prisma.meeting.count({
                where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ["SCHEDULED", "COMPLETED"] } },
            });
            if (count >= maxPerDay) {
                current.setDate(current.getDate() + 1); current.setHours(startHour, 0, 0, 0); continue;
            }

            let busySlots: { start: string; end: string }[] = [];
            try {
                const cal = getCalendarClient();
                const tMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
                const tMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);
                const fb = await cal.freebusy.query({
                    requestBody: { timeMin: tMin.toISOString(), timeMax: tMax.toISOString(), timeZone: "Asia/Kolkata", items: [{ id: CALENDAR_ID }] },
                });
                busySlots = (fb.data.calendars?.[CALENDAR_ID]?.busy || []) as any;
            } catch {
                const dbMeetings = await prisma.meeting.findMany({
                    where: { date: { gte: dayStart, lte: dayEnd }, status: "SCHEDULED" },
                    select: { date: true, duration: true },
                });
                busySlots = dbMeetings.map((m) => ({
                    start: m.date.toISOString(),
                    end: new Date(m.date.getTime() + m.duration * 60000).toISOString(),
                }));
            }

            const tMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
            const tMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);
            let slotTime = new Date(Math.max(tMin.getTime(), now.getTime() + 3600000));
            slotTime.setMinutes(Math.ceil(slotTime.getMinutes() / 30) * 30, 0, 0);

            while (slotTime.getTime() + slotDuration * 60000 <= tMax.getTime() && allSlots.length < 2) {
                const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
                const conflict = busySlots.some((b) => {
                    const bS = new Date(b.start).getTime() - bufferMinutes * 60000;
                    const bE = new Date(b.end).getTime() + bufferMinutes * 60000;
                    return slotTime.getTime() < bE && slotEnd.getTime() > bS;
                });
                if (!conflict) {
                    allSlots.push({ start: slotTime.toISOString(), end: slotEnd.toISOString(), formatted: formatSlotForWhatsApp(slotTime) });
                }
                slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
            }

            current.setDate(current.getDate() + 1); current.setHours(startHour, 0, 0, 0);
        }

        return NextResponse.json({ success: true, slots: allSlots });
    } catch (error: any) {
        console.error("[chat/slots] Error:", error);
        return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }
}

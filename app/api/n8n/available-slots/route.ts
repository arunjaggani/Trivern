import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { getLeadTier, LEAD_TIERS, formatSlotForWhatsApp } from "@/lib/types";

// GET /api/n8n/available-slots?phone=919876543210&priority=hot|warm|cold|auto
// Returns available slots for Zara to offer — priority determines how soon
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const priorityParam = searchParams.get("priority") || "auto";

    try {
        // If phone provided, auto-detect priority from lead score
        let priority = priorityParam.toUpperCase() as keyof typeof LEAD_TIERS;

        if (phone && priorityParam === "auto") {
            const client = await prisma.client.findFirst({ where: { phone } });
            if (client) {
                priority = getLeadTier(client.scoreOverride ?? client.score);
            } else {
                priority = "WARM"; // Default for unknown leads
            }
        }

        // Fallback if invalid priority
        if (!LEAD_TIERS[priority]) priority = "WARM";

        const settings = await prisma.bookingSettings.findFirst();
        const startHour = settings?.startHour ?? 9;
        const endHour = settings?.endHour ?? 21;
        const slotDuration = settings?.slotDuration ?? 30;
        const bufferMinutes = settings?.bufferMinutes ?? 30;
        const maxPerDay = settings?.maxPerDay ?? 6;
        const blockedDates: string[] = JSON.parse(settings?.blockedDates || "[]");

        const maxHoursAhead = LEAD_TIERS[priority].slotHours;
        const now = new Date();
        const searchEnd = new Date(now.getTime() + maxHoursAhead * 3600000);

        // Collect available slots across multiple days
        const allSlots: { start: Date; end: Date; formatted: string }[] = [];
        const current = new Date(now);
        current.setMinutes(0, 0, 0);

        while (current < searchEnd && allSlots.length < 6) {
            const dateStr = current.toISOString().split("T")[0];

            // Skip blocked dates
            if (blockedDates.includes(dateStr)) {
                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);
                continue;
            }

            // Check daily meeting count
            const dayStart = new Date(dateStr + "T00:00:00");
            const dayEnd = new Date(dateStr + "T23:59:59");
            const existingCount = await prisma.meeting.count({
                where: {
                    date: { gte: dayStart, lte: dayEnd },
                    status: { in: ["SCHEDULED", "COMPLETED"] },
                },
            });

            if (existingCount >= maxPerDay) {
                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);
                continue;
            }

            // Get busy times for this day
            let busySlots: { start: string; end: string }[] = [];

            const timeMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
            const timeMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);

            try {
                const calendar = getCalendarClient();
                const freeBusy = await calendar.freebusy.query({
                    requestBody: {
                        timeMin: timeMin.toISOString(),
                        timeMax: timeMax.toISOString(),
                        timeZone: "Asia/Kolkata",
                        items: [{ id: CALENDAR_ID }],
                    },
                });
                busySlots = (freeBusy.data.calendars?.[CALENDAR_ID]?.busy || []) as any;
            } catch {
                // Fallback to DB
                const dbMeetings = await prisma.meeting.findMany({
                    where: { date: { gte: dayStart, lte: dayEnd }, status: "SCHEDULED" },
                    select: { date: true, duration: true },
                });
                busySlots = dbMeetings.map((m) => ({
                    start: m.date.toISOString(),
                    end: new Date(m.date.getTime() + m.duration * 60000).toISOString(),
                }));
            }

            // Generate slots for this day
            let slotTime = new Date(Math.max(timeMin.getTime(), now.getTime() + 3600000)); // At least 1h from now
            slotTime.setMinutes(Math.ceil(slotTime.getMinutes() / 30) * 30, 0, 0); // Round up to nearest 30

            while (slotTime.getTime() + slotDuration * 60000 <= timeMax.getTime() && allSlots.length < 6) {
                const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);

                const isConflict = busySlots.some((busy) => {
                    const bStart = new Date(busy.start).getTime() - bufferMinutes * 60000;
                    const bEnd = new Date(busy.end).getTime() + bufferMinutes * 60000;
                    return slotTime.getTime() < bEnd && slotEnd.getTime() > bStart;
                });

                if (!isConflict) {
                    allSlots.push({
                        start: new Date(slotTime),
                        end: slotEnd,
                        formatted: formatSlotForWhatsApp(slotTime),
                    });
                }

                slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
            }

            current.setDate(current.getDate() + 1);
            current.setHours(startHour, 0, 0, 0);
        }

        // Return exactly 2 slots for Zara's booking template (or up to 6 for dashboard)
        const twoSlots = allSlots.slice(0, 2);

        return NextResponse.json({
            success: true,
            priority,
            tier: LEAD_TIERS[priority].label,
            slots: allSlots,
            // Ready-to-paste WhatsApp format
            whatsappText: twoSlots.length >= 2
                ? `📅 ${twoSlots[0].formatted}\n📅 ${twoSlots[1].formatted}`
                : twoSlots.length === 1
                    ? `📅 ${twoSlots[0].formatted}`
                    : "No available slots in the selected timeframe.",
            slotsForBooking: twoSlots.map((s) => ({
                start: s.start.toISOString(),
                end: s.end.toISOString(),
                formatted: s.formatted,
            })),
        });
    } catch (error: any) {
        console.error("[n8n/available-slots] Error:", error);
        return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }
}

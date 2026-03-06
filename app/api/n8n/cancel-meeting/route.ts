import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { getLeadTier, LEAD_TIERS, formatSlotForWhatsApp } from "@/lib/types";

// POST /api/n8n/cancel-meeting
// Called by Zara AFTER client confirms cancellation
// Cancels meeting and returns 2 fresh available slots to offer
export async function POST(req: Request) {
    try {
        const { phone, reason } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 });
        }

        const client = await prisma.client.findFirst({ where: { phone } });

        if (!client) {
            return NextResponse.json({
                success: false,
                message: "We couldn't find any bookings under that number. Could you double-check the number you used when booking?",
            });
        }

        const meeting = await prisma.meeting.findFirst({
            where: { clientId: client.id, status: "SCHEDULED" },
            orderBy: { date: "asc" },
        });

        if (!meeting) {
            return NextResponse.json({
                success: false,
                message: "It looks like you don't have any upcoming meetings to cancel. Would you like to book a new one?",
            });
        }

        // Cancel the meeting
        await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
                status: "CANCELLED",
                remarks: reason ? `Client cancelled. Reason: ${reason}` : "Client cancelled via WhatsApp",
            },
        });

        // Update client status back to lead
        await prisma.client.update({
            where: { id: client.id },
            data: { status: "LEAD" },
        });

        const dateFormatted = meeting.date.toLocaleString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
        });

        // Fetch 2 alternative slots to offer client
        let rebookSlots: { start: string; formatted: string }[] = [];
        try {
            const settings = await prisma.bookingSettings.findFirst();
            const startHour = settings?.startHour ?? 9;
            const endHour = settings?.endHour ?? 21;
            const slotDuration = settings?.slotDuration ?? 30;
            const bufferMinutes = settings?.bufferMinutes ?? 30;
            const maxPerDay = settings?.maxPerDay ?? 6;
            const blockedDates: string[] = JSON.parse(settings?.blockedDates || "[]");

            const tier = getLeadTier(client.scoreOverride ?? client.score);
            const maxHoursAhead = LEAD_TIERS[tier]?.slotHours ?? 72;
            const now = new Date();
            const searchEnd = new Date(now.getTime() + maxHoursAhead * 3600000);

            const allSlots: { start: string; formatted: string }[] = [];
            const current = new Date(now);
            current.setMinutes(0, 0, 0);

            while (current < searchEnd && allSlots.length < 2) {
                const dateStr = current.toISOString().split("T")[0];
                if (blockedDates.includes(dateStr)) {
                    current.setDate(current.getDate() + 1);
                    current.setHours(startHour, 0, 0, 0);
                    continue;
                }

                const dayStart = new Date(dateStr + "T00:00:00");
                const dayEnd = new Date(dateStr + "T23:59:59");
                const existingCount = await prisma.meeting.count({
                    where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ["SCHEDULED", "COMPLETED"] } },
                });

                if (existingCount >= maxPerDay) {
                    current.setDate(current.getDate() + 1);
                    current.setHours(startHour, 0, 0, 0);
                    continue;
                }

                let busySlots: { start: string; end: string }[] = [];
                try {
                    const calendar = getCalendarClient();
                    const timeMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
                    const timeMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);
                    const fb = await calendar.freebusy.query({
                        requestBody: { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), timeZone: "Asia/Kolkata", items: [{ id: CALENDAR_ID }] },
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

                const timeMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
                const timeMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);
                let slotTime = new Date(Math.max(timeMin.getTime(), now.getTime() + 3600000));
                slotTime.setMinutes(Math.ceil(slotTime.getMinutes() / 30) * 30, 0, 0);

                while (slotTime.getTime() + slotDuration * 60000 <= timeMax.getTime() && allSlots.length < 2) {
                    const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
                    const isConflict = busySlots.some((busy) => {
                        const bStart = new Date(busy.start).getTime() - bufferMinutes * 60000;
                        const bEnd = new Date(busy.end).getTime() + bufferMinutes * 60000;
                        return slotTime.getTime() < bEnd && slotEnd.getTime() > bStart;
                    });

                    if (!isConflict) {
                        allSlots.push({ start: slotTime.toISOString(), formatted: formatSlotForWhatsApp(slotTime) });
                    }

                    slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
                }

                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);
            }

            rebookSlots = allSlots;
        } catch (slotErr) {
            console.warn("[n8n/cancel-meeting] Could not fetch rebook slots:", slotErr);
        }

        const clientName = client.name && client.name !== "WhatsApp Lead" ? client.name : null;

        const rebookOffer = rebookSlots.length >= 2
            ? `\n\n💡 *Want to reschedule?* Here are two fresh options:\n📅 *Option 1:* ${rebookSlots[0].formatted}\n📅 *Option 2:* ${rebookSlots[1].formatted}\n\nNo pressure — just let me know.`
            : rebookSlots.length === 1
                ? `\n\n💡 *Want to reschedule?* I have one slot available:\n📅 ${rebookSlots[0].formatted}\n\nNo pressure — just say the word.`
                : `\n\nWhenever you're ready to reconnect, I'm here. 🙌`;

        return NextResponse.json({
            success: true,
            cancelledMeetingId: meeting.id,
            rebookSlots,
            confirmationText: `Done — your meeting has been cancelled. ✅\n\n📅 *${dateFormatted}* — removed.${rebookOffer}`,
        });

    } catch (error: any) {
        console.error("[n8n/cancel-meeting] Error:", error);
        return NextResponse.json({ error: "Failed to cancel meeting" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";
import { formatSlotForWhatsApp, getLeadTier, LEAD_TIERS } from "@/lib/types";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/n8n/emergency-cancel
// Called by Zara when ADMIN or EMPLOYEE confirms mass cancellation
// Scope options: today | tomorrow | morning | afternoon | evening | next | all
// Auto-sends WhatsApp apology + rebook offer to each affected client

function getScopeFilter(scope: string, now: Date) {
    const ist = (h: number, m = 0) => {
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
    };
    const todayEnd = ist(23, 59);
    const tomorrowStart = new Date(ist(0)); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const weekEnd = new Date(now.getTime() + 7 * 86400000);

    switch (scope) {
        case "today": return { gte: now, lte: todayEnd };
        case "tomorrow": return { gte: tomorrowStart, lte: tomorrowEnd };
        case "morning": return { gte: now > ist(9) ? now : ist(9), lte: ist(12) };
        case "afternoon": return { gte: now > ist(12) ? now : ist(12), lte: ist(18) };
        case "evening": return { gte: now > ist(18) ? now : ist(18), lte: ist(21) };
        case "all": return { gte: now, lte: weekEnd };
        case "next":
        default: return { gte: now };
    }
}

async function getNextTwoSlots(client: any): Promise<{ formatted: string }[]> {
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
        const slots: { formatted: string }[] = [];
        const current = new Date(now);
        current.setMinutes(0, 0, 0);

        while (current < searchEnd && slots.length < 2) {
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
                const db = await prisma.meeting.findMany({
                    where: { date: { gte: dayStart, lte: dayEnd }, status: "SCHEDULED" },
                    select: { date: true, duration: true },
                });
                busySlots = db.map((m) => ({ start: m.date.toISOString(), end: new Date(m.date.getTime() + m.duration * 60000).toISOString() }));
            }

            const tMin = new Date(dateStr + `T${String(startHour).padStart(2, "0")}:00:00`);
            const tMax = new Date(dateStr + `T${String(endHour).padStart(2, "0")}:00:00`);
            let slotTime = new Date(Math.max(tMin.getTime(), now.getTime() + 3600000));
            slotTime.setMinutes(Math.ceil(slotTime.getMinutes() / 30) * 30, 0, 0);

            while (slotTime.getTime() + slotDuration * 60000 <= tMax.getTime() && slots.length < 2) {
                const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
                const conflict = busySlots.some((b) => {
                    const bS = new Date(b.start).getTime() - bufferMinutes * 60000;
                    const bE = new Date(b.end).getTime() + bufferMinutes * 60000;
                    return slotTime.getTime() < bE && slotEnd.getTime() > bS;
                });
                if (!conflict) slots.push({ formatted: formatSlotForWhatsApp(slotTime) });
                slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
            }
            current.setDate(current.getDate() + 1); current.setHours(startHour, 0, 0, 0);
        }
        return slots;
    } catch { return []; }
}

export async function POST(req: Request) {
    try {
        const { ownerPhone, scope = "next", reason = "an urgent situation" } = await req.json();

        // Verify ADMIN / EMPLOYEE
        const user = await prisma.user.findFirst({
            where: { phone: ownerPhone },
            select: { id: true, name: true, role: true },
        });
        if (!user || !["ADMIN", "EMPLOYEE"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized — not a team member" }, { status: 403 });
        }

        const now = new Date();
        const dateFilter = getScopeFilter(scope.toLowerCase(), now);

        const meetings = await prisma.meeting.findMany({
            where: { date: dateFilter, status: "SCHEDULED" },
            include: { client: true },
            orderBy: { date: "asc" },
            ...(scope === "next" ? { take: 1 } : {}),
        });

        if (meetings.length === 0) {
            return NextResponse.json({
                success: true,
                cancelled: 0,
                clientsNotified: 0,
                ownerMessage: `No meetings found for scope *${scope}*. You're all clear, ${user.name}! 👍`,
            });
        }

        // Cancel each meeting
        let clientsNotified = 0;
        const cancelledSummary: string[] = [];

        for (const meeting of meetings) {
            await prisma.meeting.update({
                where: { id: meeting.id },
                data: { status: "CANCELLED", remarks: `Cancelled by ${user.name} (${user.role}). Reason: ${reason}`, attended: false },
            });
            await prisma.client.update({
                where: { id: meeting.clientId },
                data: { status: "CONTACTED" },
            });

            // Delete from Google Calendar
            if (meeting.calendarEventId) {
                try {
                    const cal = getCalendarClient();
                    await cal.events.delete({ calendarId: CALENDAR_ID, eventId: meeting.calendarEventId });
                } catch (e) {
                    console.warn("[emergency-cancel] Calendar delete failed:", e);
                }
            }

            const dateFormatted = meeting.date.toLocaleString("en-IN", {
                weekday: "long", day: "numeric", month: "short",
                hour: "numeric", minute: "2-digit", hour12: true,
                timeZone: "Asia/Kolkata",
            });

            cancelledSummary.push(`• *${meeting.client.name}* — ${dateFormatted}`);

            // Fetch 2 rebook slots for this client
            const rebookSlots = await getNextTwoSlots(meeting.client);

            const rebookLine = rebookSlots.length >= 2
                ? `\n\n📅 *Option 1:* ${rebookSlots[0].formatted}\n📅 *Option 2:* ${rebookSlots[1].formatted}\n\nWhich works for you? Or let me know a time that suits you and I'll make it happen.`
                : `\n\nJust reply whenever you're ready and I'll find the next available slot for you.`;

            const clientMsg = `Hi ${meeting.client.name !== "WhatsApp Lead" ? meeting.client.name : "there"} 👋\n\nI'm reaching out about your scheduled call on *${dateFormatted}*.\n\nDue to ${reason}, we unfortunately need to reschedule. We sincerely apologise for any inconvenience caused. 🙏\n\nWe'd love to connect with you at the earliest opportunity. Here are two available slots:${rebookLine}`;

            const result = await sendWhatsAppMessage(meeting.client.phone, clientMsg);
            if (result.success) clientsNotified++;
            else console.warn(`[emergency-cancel] Failed to notify ${meeting.client.phone}:`, result.error);
        }

        const ownerMessage = `Done ✅ Cancelled *${meetings.length}* meeting${meetings.length > 1 ? "s" : ""}, ${user.name}:\n\n${cancelledSummary.join("\n")}\n\n📲 *${clientsNotified}/${meetings.length}* clients notified with an apology and rebook options.\n${clientsNotified < meetings.length ? `\n⚠️ ${meetings.length - clientsNotified} notification(s) failed — check PM2 logs.` : ""}`;

        return NextResponse.json({
            success: true,
            cancelled: meetings.length,
            clientsNotified,
            cancelledBy: { name: user.name, role: user.role },
            ownerMessage,
        });

    } catch (error: any) {
        console.error("[n8n/emergency-cancel] Error:", error);
        return NextResponse.json({ error: "Failed to process emergency cancellation" }, { status: 500 });
    }
}

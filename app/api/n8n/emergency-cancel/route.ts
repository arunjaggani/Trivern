import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";

// POST /api/n8n/emergency-cancel
// Called by Zara when a team member (ADMIN/EMPLOYEE) sends a cancel request
// Verifies the phone against the User table in DB — no env vars needed
export async function POST(req: Request) {
    try {
        const { ownerPhone, scope = "next", reason = "emergency", meetingId } = await req.json();

        // Verify this phone belongs to an ADMIN or EMPLOYEE in the database
        const user = await prisma.user.findFirst({
            where: { phone: ownerPhone },
            select: { id: true, name: true, role: true },
        });

        if (!user || !["ADMIN", "EMPLOYEE"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized — not a team member" }, { status: 403 });
        }

        const now = new Date();
        let meetings: any[] = [];

        if (meetingId) {
            const m = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { client: true } });
            if (m && m.status === "SCHEDULED") meetings = [m];
        } else {
            let dateFilter: any = {};

            switch (scope) {
                case "today": {
                    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    dateFilter = { gte: now, lt: todayEnd };
                    break;
                }
                case "next": {
                    dateFilter = { gte: now };
                    break;
                }
                case "all": {
                    const weekEnd = new Date(now.getTime() + 7 * 86400000);
                    dateFilter = { gte: now, lte: weekEnd };
                    break;
                }
            }

            meetings = await prisma.meeting.findMany({
                where: { date: dateFilter, status: "SCHEDULED" },
                include: { client: true },
                orderBy: { date: "asc" },
                ...(scope === "next" ? { take: 1 } : {}),
            });
        }

        if (meetings.length === 0) {
            return NextResponse.json({
                success: true,
                cancelled: 0,
                ownerMessage: `No upcoming meetings to cancel, ${user.name}. You're all clear! 👍`,
                clientMessages: [],
            });
        }

        // Cancel each meeting
        const clientMessages: { phone: string; name: string; message: string; meetingDate: string }[] = [];

        for (const meeting of meetings) {
            await prisma.meeting.update({
                where: { id: meeting.id },
                data: { status: "CANCELLED", remarks: `Emergency (${user.name}): ${reason}`, attended: false },
            });

            await prisma.client.update({
                where: { id: meeting.clientId },
                data: { status: "CONTACTED" },
            });

            if (meeting.calendarEventId) {
                try {
                    const calendar = getCalendarClient();
                    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: meeting.calendarEventId });
                } catch (err) {
                    console.warn("[emergency-cancel] Calendar delete failed:", err);
                }
            }

            const dateFormatted = meeting.date.toLocaleString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
            });

            clientMessages.push({
                phone: meeting.client.phone,
                name: meeting.client.name,
                meetingDate: dateFormatted,
                message: `Hi ${meeting.client.name} 👋\n\nI'm reaching out regarding your scheduled call on ${dateFormatted}.\n\nUnfortunately, due to an urgent situation, we need to reschedule. I sincerely apologize for the inconvenience.\n\nI'll find the next best available slot for you — would you prefer:\n\nA) As soon as possible (within 24-48 hours)\nB) Same time slot on a different day\nC) You suggest a time that works\n\nAgain, sorry about this and thank you for understanding 🙏`,
            });
        }

        const cancelledNames = clientMessages.map((c) => `• ${c.name} (${c.meetingDate})`).join("\n");
        const ownerMessage = `Done ✅ Cancelled ${meetings.length} meeting${meetings.length > 1 ? "s" : ""}, ${user.name}:\n\n${cancelledNames}\n\nI've already sent each client a reschedule message with options. I'll handle the rebooking once they reply.\n\nTake care! 🙏`;

        return NextResponse.json({
            success: true,
            cancelled: meetings.length,
            cancelledBy: { name: user.name, role: user.role },
            ownerMessage,
            clientMessages,
        });
    } catch (error: any) {
        console.error("[n8n/emergency-cancel] Error:", error);
        return NextResponse.json({ error: "Failed to process emergency cancellation" }, { status: 500 });
    }
}

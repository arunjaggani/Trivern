import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/n8n/preview-cancellation?ownerPhone=...&scope=today|tomorrow|morning|afternoon|evening|next|all
// PREVIEW ONLY — does NOT cancel anything
// Returns a formatted list of meetings matching the scope so Zara can show the owner before confirming

function getScopeFilter(scope: string, now: Date) {
    const ist = (h: number, m = 0) => {
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const todayStart = ist(0);
    const todayEnd = ist(23, 59);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const weekEnd = new Date(now.getTime() + 7 * 86400000);

    switch (scope) {
        case "today": return { gte: now, lte: todayEnd };
        case "tomorrow": return { gte: tomorrowStart, lte: tomorrowEnd };
        case "morning": return { gte: now > ist(9) ? now : ist(9), lte: ist(12) };    // 9AM–12PM today
        case "afternoon": return { gte: now > ist(12) ? now : ist(12), lte: ist(18) }; // 12PM–6PM today
        case "evening": return { gte: now > ist(18) ? now : ist(18), lte: ist(21) }; // 6PM–9PM today
        case "all": return { gte: now, lte: weekEnd };
        case "next": return { gte: now };  // Will use take:1 below
        default: return { gte: now, lte: todayEnd };
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const ownerPhone = searchParams.get("ownerPhone");
    const scope = (searchParams.get("scope") || "today").toLowerCase();

    if (!ownerPhone) {
        return NextResponse.json({ error: "ownerPhone is required" }, { status: 400 });
    }

    // Verify caller is ADMIN or EMPLOYEE
    const user = await prisma.user.findFirst({
        where: { phone: ownerPhone },
        select: { id: true, name: true, role: true },
    });

    if (!user || !["ADMIN", "EMPLOYEE"].includes(user.role)) {
        return NextResponse.json({ error: "Unauthorized — not a team member" }, { status: 403 });
    }

    try {
        const now = new Date();
        const dateFilter = getScopeFilter(scope, now);

        const meetings = await prisma.meeting.findMany({
            where: { date: dateFilter, status: "SCHEDULED" },
            include: { client: { select: { name: true, phone: true, company: true } } },
            orderBy: { date: "asc" },
            ...(scope === "next" ? { take: 1 } : {}),
        });

        if (meetings.length === 0) {
            return NextResponse.json({
                found: 0,
                scope,
                message: `No scheduled meetings found for scope: *${scope}*. You're all clear, ${user.name}! 👍`,
                previewText: null,
            });
        }

        const list = meetings.map((m, i) => {
            const formatted = m.date.toLocaleString("en-IN", {
                weekday: "short", day: "numeric", month: "short",
                hour: "numeric", minute: "2-digit", hour12: true,
                timeZone: "Asia/Kolkata",
            });
            const client = m.client;
            const name = client.name !== "WhatsApp Lead" ? client.name : "Unknown Client";
            return `${i + 1}. *${name}*${client.company ? ` (${client.company})` : ""} — ${formatted}`;
        });

        const previewText = `Here are the meetings that will be cancelled (scope: *${scope}*):\n\n${list.join("\n")}\n\n⚠️ Should I go ahead and cancel all ${meetings.length} meeting${meetings.length > 1 ? "s" : ""}? Affected clients will be notified automatically.`;

        return NextResponse.json({
            found: meetings.length,
            scope,
            meetingIds: meetings.map((m) => m.id),
            previewText,
        });

    } catch (error: any) {
        console.error("[n8n/preview-cancellation] Error:", error);
        return NextResponse.json({ error: "Failed to preview cancellations" }, { status: 500 });
    }
}

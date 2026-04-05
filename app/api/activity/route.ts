import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/activity
// Returns recent lead activity for the God-View dashboard feed.
// ?clientId=xxx  → Activities for a specific lead (Lead Detail Timeline)
// ?limit=20      → Max records to return (default 20)
// ?global=true   → Cross-lead feed for dashboard overview widget
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const clientId = searchParams.get("clientId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 50);
    const isGlobal = searchParams.get("global") === "true";

    try {
        const activities = await prisma.leadActivity.findMany({
            where: clientId ? { clientId } : undefined,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        phone: true,
                        score: true,
                        scoreOverride: true,
                        status: true,
                    },
                },
            },
        });

        // For the dashboard overview — build a "live feed" format
        const feed = activities.map((a: any) => ({
            id: a.id,
            type: a.type,
            channel: a.channel,
            title: a.title,
            detail: a.detail,
            fromStatus: a.fromStatus,
            toStatus: a.toStatus,
            scoreAtEvent: a.scoreAtEvent,
            triggeredBy: a.triggeredBy,
            createdAt: a.createdAt,
            // Links
            meetingId: a.meetingId,
            voiceCallId: a.voiceCallId,
            conversationId: a.conversationId,
            // Client info for global feed
            ...(isGlobal && {
                client: {
                    id: a.client?.id,
                    name: a.client?.name,
                    company: a.client?.company,
                    score: a.client?.scoreOverride ?? a.client?.score,
                    status: a.client?.status,
                },
            }),
        }));

        return NextResponse.json({ success: true, activities: feed, total: feed.length });
    } catch (error: any) {
        console.error("[api/activity GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/voice/calls — Fetch all voice call logs for dashboard
export async function GET() {
    try {
        const calls = await prisma.voiceCall.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                client: {
                    select: { name: true, company: true, phone: true },
                },
            },
        });

        // Calculate stats
        const totalCalls = calls.length;
        const bookedCalls = calls.filter((c: any) => c.outcome === "booked").length;
        const avgDuration = totalCalls > 0
            ? Math.round(calls.reduce((sum: number, c: any) => sum + c.duration, 0) / totalCalls)
            : 0;
        const hotLeads = calls.filter((c: any) => c.leadTemperature === "hot").length;

        return NextResponse.json({
            success: true,
            calls,
            stats: {
                totalCalls,
                bookedCalls,
                conversionRate: totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0,
                avgDuration,
                hotLeads,
            },
        });
    } catch (error: any) {
        console.error("Voice calls fetch error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

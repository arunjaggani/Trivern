import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meetings-list — Fetch all meetings with client info (for bookings dashboard)
export async function GET() {
    try {
        const meetings = await prisma.meeting.findMany({
            include: { client: true },
            orderBy: { date: "desc" },
            take: 100,
        });

        return NextResponse.json(meetings);
    } catch (error: any) {
        return NextResponse.json([], { status: 500 });
    }
}

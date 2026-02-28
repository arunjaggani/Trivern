import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/n8n/send-reminder
// Returns formatted reminder text for n8n to send via WhatsApp
export async function POST(req: Request) {
    try {
        const { meetingId, type } = await req.json();

        if (!meetingId || !type) {
            return NextResponse.json({ error: "meetingId and type required" }, { status: 400 });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { client: true },
        });

        if (!meeting || meeting.status !== "SCHEDULED") {
            return NextResponse.json({ error: "Meeting not found or not scheduled" }, { status: 404 });
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

        let reminderText: string;

        switch (type) {
            case "24h":
                reminderText = `Hey ${meeting.client.name} 👋\n\nJust a reminder — we have your discovery call scheduled tomorrow.\n\n📅 ${dateFormatted}\n${meeting.meetLink ? `🔗 ${meeting.meetLink}` : ""}\n\nLooking forward to it!`;
                break;

            case "2h":
                reminderText = `Hi ${meeting.client.name} — quick reminder!\n\nYour call is in about 2 hours.\n📅 ${dateFormatted}\n${meeting.meetLink ? `🔗 ${meeting.meetLink}` : ""}\n\nSee you soon 🎯`;
                break;

            case "15min":
                reminderText = `Hey ${meeting.client.name} 👋\n\nStarting in about 15 minutes!\n${meeting.meetLink ? `🔗 Join here: ${meeting.meetLink}` : ""}\n\nSee you there!`;
                break;

            default:
                return NextResponse.json({ error: "Invalid type (24h, 2h, 15min)" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            phone: meeting.client.phone,
            reminderText,
            meetingId: meeting.id,
            meetingDate: meeting.date,
        });
    } catch (error: any) {
        console.error("[n8n/send-reminder] Error:", error);
        return NextResponse.json({ error: "Failed to generate reminder" }, { status: 500 });
    }
}

// GET /api/n8n/send-reminder?window=24h|2h|15min
// Returns all meetings needing reminders right now — used by n8n schedule trigger
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const window = searchParams.get("window") || "24h";

    try {
        const now = new Date();
        let windowStart: Date;
        let windowEnd: Date;

        switch (window) {
            case "24h":
                windowStart = new Date(now.getTime() + 23 * 3600000);
                windowEnd = new Date(now.getTime() + 25 * 3600000);
                break;
            case "2h":
                windowStart = new Date(now.getTime() + 1.5 * 3600000);
                windowEnd = new Date(now.getTime() + 2.5 * 3600000);
                break;
            case "15min":
                windowStart = new Date(now.getTime() + 10 * 60000);
                windowEnd = new Date(now.getTime() + 20 * 60000);
                break;
            default:
                return NextResponse.json({ error: "Invalid window" }, { status: 400 });
        }

        const meetings = await prisma.meeting.findMany({
            where: {
                date: { gte: windowStart, lte: windowEnd },
                status: "SCHEDULED",
            },
            include: { client: true },
        });

        return NextResponse.json({
            success: true,
            window,
            meetings: meetings.map((m) => ({
                meetingId: m.id,
                phone: m.client.phone,
                clientName: m.client.name,
                date: m.date,
                meetLink: m.meetLink,
            })),
        });
    } catch (error: any) {
        console.error("[n8n/send-reminder] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }
}

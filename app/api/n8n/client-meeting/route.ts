import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/n8n/client-meeting?phone=919876543210
// Called by Zara BEFORE cancelling — retrieves meeting details for confirmation
// Does NOT cancel anything — just previews what would be cancelled
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
        return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    try {
        const client = await prisma.client.findFirst({ where: { phone } });

        if (!client) {
            return NextResponse.json({
                found: false,
                message: "We couldn't find any bookings under that number. Could you double-check the number you used when booking?",
            });
        }

        const meeting = await prisma.meeting.findFirst({
            where: {
                clientId: client.id,
                status: "SCHEDULED",
            },
            orderBy: { date: "asc" },
        });

        if (!meeting) {
            return NextResponse.json({
                found: false,
                message: `Hi ${client.name !== "WhatsApp Lead" ? client.name : "there"}! It looks like you don't have any upcoming meetings scheduled under this number. Would you like to book a fresh one?`,
            });
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

        return NextResponse.json({
            found: true,
            clientName: client.name !== "WhatsApp Lead" ? client.name : null,
            meetingId: meeting.id,
            meetingDate: meeting.date.toISOString(),
            dateFormatted,
            meetLink: meeting.meetLink,
            confirmationPrompt: `I found your booking${client.name && client.name !== "WhatsApp Lead" ? `, ${client.name}` : ""}:\n\n📅 *${dateFormatted}*\n⏰ Duration: ${meeting.duration} minutes${meeting.meetLink ? `\n🔗 ${meeting.meetLink}` : ""}\n\nIs this the meeting you'd like to cancel?`,
        });

    } catch (error: any) {
        console.error("[n8n/client-meeting] Error:", error);
        return NextResponse.json({ error: "Failed to retrieve meeting" }, { status: 500 });
    }
}

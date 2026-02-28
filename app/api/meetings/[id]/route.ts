import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";

// PATCH /api/meetings/[id] — Update meeting status from dashboard
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const { status, attended, highlights, requirements, outcome, remarks } = body;

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: { client: true },
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Handle Google Calendar event cleanup on cancel
        if (status === "CANCELLED" && meeting.calendarEventId) {
            try {
                const calendar = getCalendarClient();
                await calendar.events.delete({
                    calendarId: CALENDAR_ID,
                    eventId: meeting.calendarEventId,
                });
            } catch (err) {
                console.warn("Calendar event delete failed:", err);
            }
        }

        const updated = await prisma.meeting.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(attended !== undefined && { attended }),
                ...(highlights && { highlights }),
                ...(requirements && { requirements }),
                ...(outcome && { outcome }),
                ...(remarks && { remarks }),
            },
        });

        // Update client status based on meeting status
        if (status === "COMPLETED") {
            await prisma.client.update({
                where: { id: meeting.clientId },
                data: { status: "COMPLETED" },
            });
        } else if (status === "NO_SHOW" || status === "CANCELLED") {
            // Trigger n8n webhook for reschedule/cancel message
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
            if (n8nWebhookUrl) {
                const event = status === "NO_SHOW" ? "meeting_no_show" : "meeting_cancelled";
                fetch(n8nWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event,
                        client: {
                            name: meeting.client.name,
                            phone: meeting.client.phone,
                            company: meeting.client.company,
                        },
                        meeting: { id: meeting.id, date: meeting.date },
                        reason: remarks || undefined,
                    }),
                }).catch((err) => console.warn("Webhook failed:", err));
            }
        }

        return NextResponse.json({ success: true, meeting: updated });
    } catch (error: any) {
        console.error("[meetings/PATCH] Error:", error);
        return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
    }
}

// GET /api/meetings/[id] — Fetch single meeting with client info
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const meeting = await prisma.meeting.findUnique({
            where: { id: params.id },
            include: { client: true },
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        return NextResponse.json(meeting);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 });
    }
}

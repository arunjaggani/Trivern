import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCalendarClient, CALENDAR_ID } from "@/lib/google-auth";

// POST /api/n8n/meeting-status
// Updates meeting lifecycle — called by dashboard or n8n for automated flows
export async function POST(req: Request) {
    try {
        const { meetingId, action, reason, highlights, requirements, outcome } = await req.json();

        if (!meetingId || !action) {
            return NextResponse.json({ error: "meetingId and action required" }, { status: 400 });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { client: true },
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        let newStatus: string;
        let webhookEvent: string | null = null;
        let webhookPayload: any = {};

        switch (action) {
            case "complete":
                newStatus = "COMPLETED";
                await prisma.client.update({
                    where: { id: meeting.clientId },
                    data: { status: "COMPLETED" },
                });
                break;

            case "no_show":
                newStatus = "NO_SHOW";
                webhookEvent = "send_reschedule_message";
                webhookPayload = {
                    event: "meeting_no_show",
                    client: {
                        name: meeting.client.name,
                        phone: meeting.client.phone,
                        company: meeting.client.company,
                    },
                    meeting: {
                        id: meeting.id,
                        date: meeting.date,
                        duration: meeting.duration,
                    },
                    message: `Hi ${meeting.client.name}, we noticed you couldn't make it to our scheduled call. No worries! Would you like to reschedule? I can find a new slot that works better for you.`,
                };
                break;

            case "cancel":
                newStatus = "CANCELLED";
                webhookEvent = "send_cancellation_message";
                webhookPayload = {
                    event: "meeting_cancelled",
                    client: {
                        name: meeting.client.name,
                        phone: meeting.client.phone,
                        company: meeting.client.company,
                    },
                    meeting: {
                        id: meeting.id,
                        date: meeting.date,
                    },
                    reason: reason || "Schedule conflict",
                    message: `Hi ${meeting.client.name}, unfortunately we need to reschedule our meeting${reason ? ` due to ${reason}` : ""}. I'll find the next best slot for you — one moment.`,
                };

                // Cancel Google Calendar event
                if (meeting.calendarEventId) {
                    try {
                        const calendar = getCalendarClient();
                        await calendar.events.delete({
                            calendarId: CALENDAR_ID,
                            eventId: meeting.calendarEventId,
                        });
                    } catch (calError) {
                        console.warn("[meeting-status] Calendar delete failed:", calError);
                    }
                }
                break;

            case "reschedule":
                newStatus = "RESCHEDULED";
                webhookEvent = "send_reschedule_message";
                webhookPayload = {
                    event: "meeting_rescheduled",
                    client: {
                        name: meeting.client.name,
                        phone: meeting.client.phone,
                    },
                    meeting: { id: meeting.id },
                    message: `Hi ${meeting.client.name}, let's find a new time that works for you.`,
                };

                // Update client status back to CONTACTED for rebooking
                await prisma.client.update({
                    where: { id: meeting.clientId },
                    data: { status: "CONTACTED" },
                });
                break;

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Update meeting record
        const updated = await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                status: newStatus,
                attended: action === "complete",
                highlights: highlights || meeting.highlights,
                requirements: requirements || meeting.requirements,
                outcome: outcome || meeting.outcome,
                remarks: reason || meeting.remarks,
            },
        });

        // Send webhook to n8n for WhatsApp automation
        if (webhookEvent) {
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
            if (n8nWebhookUrl) {
                fetch(n8nWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(webhookPayload),
                }).catch((err) => console.warn("[meeting-status] Webhook failed:", err));
            }
        }

        return NextResponse.json({
            success: true,
            meeting: updated,
            webhookSent: !!webhookEvent,
        });
    } catch (error: any) {
        console.error("[n8n/meeting-status] Error:", error);
        return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
    }
}

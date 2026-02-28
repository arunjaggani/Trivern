import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/notify/owner
// Body: { clientId, type, message? }
// Types: "new_lead", "escalation", "booking_confirmed", "meeting_reminder"
export async function POST(req: Request) {
    try {
        const { clientId, type, message } = await req.json();

        const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;

        // Build notification payload
        const notifications: { channel: string; payload: any }[] = [];

        switch (type) {
            case "new_lead":
                notifications.push({
                    channel: "webhook",
                    payload: {
                        event: "new_lead",
                        client: client ? {
                            name: client.name,
                            company: client.company,
                            phone: client.phone,
                            email: client.email,
                            service: client.service,
                            score: client.scoreOverride ?? client.score,
                            urgency: client.urgency,
                            source: client.source,
                        } : null,
                        message: message || `New lead: ${client?.name} (Score: ${client?.scoreOverride ?? client?.score})`,
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case "escalation":
                notifications.push({
                    channel: "webhook",
                    payload: {
                        event: "founder_escalation",
                        priority: "HIGH",
                        client: client ? {
                            name: client.name,
                            company: client.company,
                            phone: client.phone,
                            score: client.scoreOverride ?? client.score,
                            escalationReason: client.escalationReason,
                        } : null,
                        message: message || `🚨 FOUNDER ESCALATION: ${client?.name} — ${client?.escalationReason}`,
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case "booking_confirmed":
                const meeting = await prisma.meeting.findFirst({
                    where: { clientId: clientId, status: "SCHEDULED" },
                    orderBy: { createdAt: "desc" },
                });
                notifications.push({
                    channel: "webhook",
                    payload: {
                        event: "booking_confirmed",
                        client: client ? { name: client.name, company: client.company, phone: client.phone } : null,
                        meeting: meeting ? {
                            date: meeting.date,
                            duration: meeting.duration,
                            meetLink: meeting.meetLink,
                        } : null,
                        message: message || `Meeting booked with ${client?.name}`,
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case "meeting_reminder":
                notifications.push({
                    channel: "webhook",
                    payload: {
                        event: "meeting_reminder",
                        client: client ? { name: client.name, company: client.company, phone: client.phone } : null,
                        message: message || `Reminder: Meeting with ${client?.name} in 30 minutes`,
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            default:
                return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
        }

        // Send to n8n webhook if configured
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

        if (n8nWebhookUrl) {
            const results = await Promise.allSettled(
                notifications.map((n) =>
                    fetch(n8nWebhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(n.payload),
                    })
                )
            );

            const sent = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected").length;

            return NextResponse.json({
                success: true,
                sent,
                failed,
                notifications: notifications.map((n) => n.payload),
            });
        } else {
            // No webhook configured — log and return payload for testing
            console.log("[Notification] No N8N_WEBHOOK_URL configured. Payload:", JSON.stringify(notifications, null, 2));
            return NextResponse.json({
                success: true,
                sent: 0,
                mode: "dry_run",
                message: "N8N_WEBHOOK_URL not configured — notification logged but not sent",
                notifications: notifications.map((n) => n.payload),
            });
        }
    } catch (error: any) {
        console.error("Notification error:", error);
        return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }
}

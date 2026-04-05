import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreLead } from "@/lib/lead-scoring";
import { getLeadTier } from "@/lib/types";
import { logActivity } from "@/lib/activity";

// POST /api/n8n/save-lead
// Called by the Voice Agent workflow "Save Lead (Voice)" node.
// Higher-intent than WhatsApp — a phone call signals stronger buying intent.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            phone,
            company,
            industry,
            service,
            context,
            urgency,
            businessType,
            decisionRole,
            budgetHint,
            voiceCallId,   // Optional: link to VoiceCall record
        } = body;

        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 });
        }

        // Voice calls = higher intent, so default urgency is HIGH 
        const effectiveUrgency = urgency || "HIGH";

        const scoreData = {
            service: service || "",
            context: context || "",
            budgetHint: budgetHint || "",
            urgency: effectiveUrgency,
            businessType: businessType || "",
            decisionRole: decisionRole || "founder",
            industry: industry || "",
        };
        const scores = scoreLead(scoreData);

        // Upsert: find by phone (Golden Record) or create new
        let client = await prisma.client.findFirst({ where: { phone } });
        const prevStatus = client?.status;

        if (client) {
            // Enrich existing lead with voice data
            client = await prisma.client.update({
                where: { id: client.id },
                data: {
                    name: name || client.name,
                    company: company ?? client.company,
                    industry: industry ?? client.industry,
                    service: service ?? client.service,
                    context: context
                        ? `${client.context || ""}\n--- Voice Call ---\n${context}`
                        : client.context,
                    urgency: effectiveUrgency,
                    businessType: businessType ?? client.businessType,
                    decisionRole: decisionRole ?? client.decisionRole,
                    budgetHint: budgetHint ?? client.budgetHint,
                    source: "Voice",
                    // Voice = stronger signal → upgrade status if still at early stage
                    status: ["NEW", "CONTACTED"].includes(client.status) ? "QUALIFIED" : client.status,
                    ...scores,
                },
            });

            await logActivity({
                clientId: client.id,
                type: "STATUS_CHANGE",
                channel: "VOICE",
                title: "Lead enriched via Voice call",
                detail: `Score: ${scores.score} · Urgency: ${effectiveUrgency}`,
                voiceCallId: voiceCallId || undefined,
                fromStatus: prevStatus,
                toStatus: client.status,
                scoreAtEvent: scores.score,
            });
        } else {
            // Create new lead — Voice-sourced leads start as QUALIFIED
            client = await prisma.client.create({
                data: {
                    name: name || "Unknown Caller",
                    phone,
                    company,
                    email: body.email,
                    industry,
                    service,
                    context,
                    source: "Voice",
                    urgency: effectiveUrgency,
                    businessType,
                    decisionRole,
                    budgetHint,
                    status: "QUALIFIED",
                    ...scores,
                },
            });

            await logActivity({
                clientId: client.id,
                type: "LEAD_CAPTURED",
                channel: "VOICE",
                title: "New lead captured via Voice call",
                detail: `Service: ${service || "Unknown"} · Score: ${scores.score}`,
                voiceCallId: voiceCallId || undefined,
                fromStatus: "NEW",
                toStatus: "QUALIFIED",
                scoreAtEvent: scores.score,
            });
        }

        // Link VoiceCall to Client if not already linked
        if (voiceCallId) {
            await prisma.voiceCall.update({
                where: { id: voiceCallId },
                data: { clientId: client.id },
            }).catch(() => {}); // Non-fatal
        }

        const tier = getLeadTier(client.scoreOverride ?? client.score);

        // Escalation check
        const shouldEscalate =
            tier === "HOT" ||
            effectiveUrgency === "CRITICAL" ||
            (context && /multi[- ]?location|enterprise|large budget|scaling|partnership/i.test(context));

        if (shouldEscalate && !client.escalated) {
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    escalated: true,
                    escalationReason: `Auto-escalated via Voice: tier=${tier}, urgency=${effectiveUrgency}`,
                },
            });
            await logActivity({
                clientId: client.id,
                type: "ESCALATED",
                channel: "VOICE",
                title: "Lead auto-escalated to Founder (via Voice)",
                detail: `Tier: ${tier} · Urgency: ${effectiveUrgency}`,
                scoreAtEvent: client.scoreOverride ?? client.score,
            });
        }

        return NextResponse.json({
            success: true,
            clientId: client.id,
            score: client.scoreOverride ?? client.score,
            tier,
            status: client.status,
            escalated: shouldEscalate,
            name: client.name,
        });
    } catch (error: any) {
        console.error("[n8n/save-lead] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save voice lead", details: String(error.message || error) },
            { status: 200 } // 200 so n8n doesn't crash the execution branch
        );
    }
}

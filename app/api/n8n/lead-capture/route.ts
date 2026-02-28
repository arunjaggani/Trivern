import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreLead } from "@/lib/lead-scoring";
import { getLeadTier } from "@/lib/types";

// POST /api/n8n/lead-capture
// Called by Zara (n8n AI Agent) after collecting lead info during WhatsApp conversation
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
            source = "WhatsApp",
            urgency,
            businessType,
            decisionRole,
        } = body;

        if (!phone) {
            return NextResponse.json({ error: "phone (wa_id) is required" }, { status: 400 });
        }

        // Check if lead already exists by phone
        let client = await prisma.client.findFirst({ where: { phone } });

        // Prepare scoring data
        const scoreData = {
            service: service || "",
            context: context || "",
            budgetHint: body.budgetHint || "",
            urgency: urgency || "MEDIUM",
            businessType: businessType || "",
            decisionRole: decisionRole || "founder",
            industry: industry || "",
        };

        const scores = scoreLead(scoreData);

        if (client) {
            // Update existing lead with new info
            client = await prisma.client.update({
                where: { id: client.id },
                data: {
                    name: name || client.name,
                    company: company ?? client.company,
                    industry: industry ?? client.industry,
                    service: service ?? client.service,
                    context: context ? `${client.context || ""}\n---\n${context}` : client.context,
                    urgency: urgency ?? client.urgency,
                    businessType: businessType ?? client.businessType,
                    decisionRole: decisionRole ?? client.decisionRole,
                    source: source || client.source,
                    status: client.status === "NEW" ? "CONTACTED" : client.status,
                    ...scores,
                },
            });
        } else {
            // Create new lead
            client = await prisma.client.create({
                data: {
                    name: name || "Unknown",
                    phone,
                    company,
                    email: body.email,
                    industry,
                    service,
                    context,
                    source,
                    urgency,
                    businessType,
                    decisionRole,
                    status: "CONTACTED",
                    ...scores,
                },
            });
        }

        const tier = getLeadTier(client.scoreOverride ?? client.score);

        // Check for founder escalation triggers
        const shouldEscalate =
            tier === "HOT" ||
            urgency === "CRITICAL" ||
            (context && /multi[- ]?location|enterprise|large budget|scaling|partnership|white[- ]?label/i.test(context));

        if (shouldEscalate && !client.escalated) {
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    escalated: true,
                    escalationReason: `Auto-escalated: tier=${tier}, urgency=${urgency || "N/A"}`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            clientId: client.id,
            score: client.scoreOverride ?? client.score,
            tier,
            escalated: shouldEscalate,
            name: client.name,
        });
    } catch (error: any) {
        console.error("[n8n/lead-capture] Error:", error);
        return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
    }
}

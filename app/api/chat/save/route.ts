import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extract lead info from conversation using GPT
async function extractLeadInfo(messages: { role: string; content: string }[]) {
    try {
        const conversation = messages.map(m => `${m.role}: ${m.content}`).join("\n");
        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Extract lead info from this chat conversation. Return ONLY valid JSON, no markdown:
{
  "name": "string or null",
  "phone": "string or null (digits only, include country code if given)",
  "company": "string or null",
  "service": "string or null (what service they're interested in)",
  "industry": "string or null",
  "context": "1-2 sentence summary of their situation/pain",
  "urgency": "LOW | MEDIUM | HIGH | CRITICAL or null",
  "businessType": "string or null (coach, consultant, clinic, etc.)",
  "decisionRole": "string or null (founder, owner, employee, etc.)"
}
Only include info explicitly stated by the visitor. Set null if not mentioned.`,
                },
                { role: "user", content: conversation },
            ],
            temperature: 0,
            max_tokens: 300,
        });

        const text = res.choices[0]?.message?.content?.trim() || "{}";
        // Clean potential markdown wrapping
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(clean);
    } catch {
        return {};
    }
}

// POST — Save conversation + create/update lead
export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || messages.length < 3) {
            return NextResponse.json({ saved: false, reason: "Not enough messages" });
        }

        // Extract lead info from conversation
        const info = await extractLeadInfo(messages);

        // Generate summary
        let summary = "";
        try {
            const summaryRes = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Summarize this chat in 1-2 sentences. Focus on what the visitor wants and their business situation. Be concise.",
                    },
                    {
                        role: "user",
                        content: messages.map((m: any) => `${m.role}: ${m.content}`).join("\n"),
                    },
                ],
                temperature: 0,
                max_tokens: 100,
            });
            summary = summaryRes.choices[0]?.message?.content?.trim() || "";
        } catch { }

        // Format messages for storage
        const formattedMessages = messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "agent",
            content: m.content,
            timestamp: new Date().toISOString(),
        }));

        let clientId: string | null = null;

        // Create or find client if we have enough info
        if (info.name || info.phone) {
            // Try to find existing client by phone
            let existingClient = null;
            if (info.phone) {
                existingClient = await prisma.client.findFirst({
                    where: { phone: info.phone },
                });
            }

            if (existingClient) {
                clientId = existingClient.id;
                // Update with any new info
                await prisma.client.update({
                    where: { id: existingClient.id },
                    data: {
                        ...(info.company && !existingClient.company ? { company: info.company } : {}),
                        ...(info.service && !existingClient.service ? { service: info.service } : {}),
                        ...(info.context ? { context: info.context } : {}),
                        ...(info.industry ? { industry: info.industry } : {}),
                        ...(info.urgency ? { urgency: info.urgency } : {}),
                        ...(info.businessType ? { businessType: info.businessType } : {}),
                        ...(info.decisionRole ? { decisionRole: info.decisionRole } : {}),
                    },
                });
            } else {
                // Create new client
                const client = await prisma.client.create({
                    data: {
                        name: info.name || "Website Visitor",
                        phone: info.phone || `web-${Date.now()}`,
                        company: info.company || null,
                        service: info.service || null,
                        context: info.context || null,
                        source: "Website",
                        status: "NEW",
                        industry: info.industry || null,
                        urgency: info.urgency || null,
                        businessType: info.businessType || null,
                        decisionRole: info.decisionRole || null,
                    },
                });
                clientId = client.id;
            }
        } else {
            // No name or phone — create anonymous visitor
            const client = await prisma.client.create({
                data: {
                    name: "Website Visitor",
                    phone: `web-${Date.now()}`,
                    source: "Website",
                    status: "NEW",
                    context: info.context || summary || null,
                },
            });
            clientId = client.id;
        }

        // Save conversation
        await prisma.conversation.create({
            data: {
                clientId: clientId!,
                messages: JSON.stringify(formattedMessages),
                summary: summary || null,
                status: "active",
                lastMessageAt: new Date(),
            },
        });

        return NextResponse.json({
            saved: true,
            leadName: info.name || "Website Visitor",
            hasPhone: !!info.phone,
        });
    } catch (error) {
        console.error("Save chat error:", error);
        return NextResponse.json({ saved: false, error: "Failed to save" }, { status: 500 });
    }
}

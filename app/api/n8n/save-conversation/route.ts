import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/n8n/save-conversation
// Syncs WhatsApp conversation from n8n to the CRM database
export async function POST(req: Request) {
    try {
        const { phone, messages, summary } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "phone required" }, { status: 400 });
        }

        // Find client by phone
        const client = await prisma.client.findFirst({ where: { phone } });
        if (!client) {
            return NextResponse.json({ error: "Client not found for this phone" }, { status: 404 });
        }

        // Find active conversation or create new one
        let conversation = await prisma.conversation.findFirst({
            where: { clientId: client.id, status: "active" },
            orderBy: { createdAt: "desc" },
        });

        const messagesJson = JSON.stringify(messages || []);
        const now = new Date();

        if (conversation) {
            // Merge messages — append new ones
            const existingMessages = JSON.parse(conversation.messages || "[]");
            const allMessages = [...existingMessages, ...(messages || [])];

            conversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    messages: JSON.stringify(allMessages),
                    summary: summary || conversation.summary,
                    lastMessageAt: now,
                },
            });
        } else {
            conversation = await prisma.conversation.create({
                data: {
                    clientId: client.id,
                    messages: messagesJson,
                    summary: summary || null,
                    status: "active",
                    lastMessageAt: now,
                },
            });
        }

        return NextResponse.json({
            success: true,
            conversationId: conversation.id,
            clientId: client.id,
            messageCount: JSON.parse(conversation.messages).length,
        });
    } catch (error: any) {
        console.error("[n8n/save-conversation] Error:", error);
        return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 });
    }
}

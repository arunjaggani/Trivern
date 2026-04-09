import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sort') || 'createdAt';
        
        const clients = await prisma.client.findMany({
            orderBy: {
                [sortBy === "score" ? "score" : "createdAt"]: "desc"
            }
        });
        
        return NextResponse.json(clients);
    } catch (error) {
        console.error("CRM GET failed:", error);
        return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, status } = await request.json();
        
        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch existing to track From -> To status change
        const currentClient = await prisma.client.findUnique({ where: { id }});
        
        const updated = await prisma.client.update({
            where: { id },
            data: { status }
        });

        // Whenever status changes, log it in LeadActivity
        if (currentClient && currentClient.status !== status) {
            await prisma.leadActivity.create({
                data: {
                    clientId: id,
                    type: "STATUS_CHANGE",
                    channel: "MANUAL",
                    title: `Lead moved to ${status}`,
                    fromStatus: currentClient.status,
                    toStatus: status,
                    scoreAtEvent: updated.score,
                    triggeredBy: "ADMIN"
                }
            });
        }

        return NextResponse.json({ success: true, client: updated });
    } catch (error) {
        console.error("CRM PUT failed:", error);
        return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}

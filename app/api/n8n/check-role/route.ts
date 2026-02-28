import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/n8n/check-role?phone=919876543210
// Called by n8n BEFORE the AI Agent processes a message
// Returns: { role: "ADMIN" | "EMPLOYEE" | "CLIENT", name, userId }
// This lets Zara know if the incoming message is from an owner, employee, or client
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
        return NextResponse.json({ error: "phone required" }, { status: 400 });
    }

    try {
        // Check if this phone belongs to a user (owner/employee)
        const user = await prisma.user.findFirst({
            where: { phone },
            select: { id: true, name: true, role: true, phone: true },
        });

        if (user) {
            return NextResponse.json({
                isTeamMember: true,
                role: user.role,
                name: user.name,
                userId: user.id,
            });
        }

        // Check if this is an existing client
        const client = await prisma.client.findFirst({
            where: { phone },
            select: { id: true, name: true, status: true, score: true },
        });

        return NextResponse.json({
            isTeamMember: false,
            role: "CLIENT",
            name: client?.name || null,
            clientId: client?.id || null,
            isExistingClient: !!client,
            clientStatus: client?.status || null,
            clientScore: client?.score || null,
        });
    } catch (error: any) {
        console.error("[n8n/check-role] Error:", error);
        return NextResponse.json({ error: "Failed to check role" }, { status: 500 });
    }
}

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const conversations = await prisma.conversation.findMany({
            include: { client: true },
            orderBy: { lastMessageAt: "desc" },
        });
        return NextResponse.json(conversations);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}

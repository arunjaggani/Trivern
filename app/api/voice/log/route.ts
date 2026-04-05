import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const AGENT_SECRET = process.env.VOICE_AGENT_SECRET || "";

function verifySecret(req: Request): boolean {
    if (!AGENT_SECRET) return true; // No secret configured — allow all
    return req.headers.get("x-agent-secret") === AGENT_SECRET;
}

// POST /api/voice/log — Create a new VoiceCall record at call start
export async function POST(request: NextRequest) {
    if (!verifySecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            callerNumber,
            roomName,
            language = "en-IN",
            callType = "outbound",
            clientId,
        } = body;

        if (!callerNumber) {
            return NextResponse.json({ error: "callerNumber is required" }, { status: 400 });
        }

        // Try to find existing client by phone number
        let resolvedClientId = clientId;
        if (!resolvedClientId) {
            const client = await prisma.client.findFirst({
                where: { phone: callerNumber },
            });
            resolvedClientId = client?.id ?? undefined;
        }

        const call = await prisma.voiceCall.create({
            data: {
                callerNumber,
                roomName: roomName || null,
                language,
                callType,
                outcome: "unknown",
                leadTemperature: "warm",
                ...(resolvedClientId && { clientId: resolvedClientId }),
            },
        });

        return NextResponse.json({ success: true, callId: call.id });
    } catch (error: any) {
        console.error("[voice/log POST] Error:", error);
        return NextResponse.json({ error: "Failed to create call log" }, { status: 500 });
    }
}

// PATCH /api/voice/log?id=xxx — Update call record at call end
export async function PATCH(request: NextRequest) {
    if (!verifySecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id query param required" }, { status: 400 });
        }

        const body = await request.json();
        const { duration, outcome, transcript, summary, leadTemperature } = body;

        const call = await prisma.voiceCall.findUnique({ where: { id } });
        if (!call) {
            return NextResponse.json({ error: "Call not found" }, { status: 404 });
        }

        // If outcome is booked, try to find/link the client record
        let clientId = call.clientId;
        if (!clientId && call.callerNumber) {
            const client = await prisma.client.findFirst({
                where: { phone: call.callerNumber },
            });
            clientId = client?.id ?? null;
        }

        const updated = await prisma.voiceCall.update({
            where: { id },
            data: {
                ...(duration !== undefined && { duration }),
                ...(outcome && { outcome }),
                ...(transcript && { transcript: JSON.stringify(transcript) }),
                ...(summary && { summary }),
                ...(leadTemperature && { leadTemperature }),
                ...(clientId && { clientId }),
            },
        });

        return NextResponse.json({ success: true, call: updated });
    } catch (error: any) {
        console.error("[voice/log PATCH] Error:", error);
        return NextResponse.json({ error: "Failed to update call log" }, { status: 500 });
    }
}

// GET /api/voice/log — List voice calls with stats
export async function GET() {
    try {
        const calls = await prisma.voiceCall.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                client: {
                    select: { name: true, company: true, phone: true, score: true },
                },
            },
        });

        const totalCalls = calls.length;
        const bookedCalls = calls.filter((c: any) => c.outcome === "booked").length;
        const hotLeads = calls.filter((c: any) => c.leadTemperature === "hot").length;
        const avgDuration = totalCalls > 0
            ? Math.round(calls.reduce((sum: number, c: any) => sum + c.duration, 0) / totalCalls)
            : 0;

        return NextResponse.json({
            success: true,
            calls,
            stats: {
                totalCalls,
                bookedCalls,
                hotLeads,
                avgDuration,
                conversionRate: totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0,
            },
        });
    } catch (error: any) {
        console.error("[voice/log GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
    }
}

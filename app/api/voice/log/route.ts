import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreLead } from "@/lib/lead-scoring";
import { logActivity } from "@/lib/activity";

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
        const { callerNumber, roomName, language = "en-IN", callType = "outbound", clientId } = body;

        if (!callerNumber) {
            return NextResponse.json({ error: "callerNumber is required" }, { status: 400 });
        }

        // Try to find existing client by phone number (Golden Record)
        let resolvedClientId = clientId;
        if (!resolvedClientId) {
            const client = await prisma.client.findFirst({ where: { phone: callerNumber } });
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

        // Log CALL_STARTED activity if we have a linked client
        if (resolvedClientId) {
            await logActivity({
                clientId: resolvedClientId,
                type: "CALL_STARTED",
                channel: "VOICE",
                title: "Outbound call started by Zara",
                detail: `Language: ${language} · Room: ${roomName || "N/A"}`,
                voiceCallId: call.id,
            });
        }

        return NextResponse.json({ success: true, callId: call.id });
    } catch (error: any) {
        console.error("[voice/log POST] Error:", error);
        return NextResponse.json({ error: "Failed to create call log" }, { status: 500 });
    }
}

// PATCH /api/voice/log?id=xxx — Update call record at call end + run scoring
export async function PATCH(request: NextRequest) {
    if (!verifySecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

        const body = await request.json();
        const { duration, outcome, transcript, summary, leadTemperature } = body;

        const call = await prisma.voiceCall.findUnique({ where: { id } });
        if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

        // Resolve client by caller number (Golden Record)
        let clientId = call.clientId;
        let client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;
        if (!client && call.callerNumber) {
            client = await prisma.client.findFirst({ where: { phone: call.callerNumber } });
            clientId = client?.id ?? null;
        }

        // === Auto Lead Scoring from Voice Transcript ===
        let newScores: Record<string, number> = {};
        let newScore = client?.score ?? 0;
        let scoreChanged = false;

        if (client && transcript) {
            const transcriptText = Array.isArray(transcript)
                ? transcript.map((m: any) => m.content || "").join(" ")
                : String(transcript);

            const voiceScoreData = {
                service: client.service || "",
                context: `${client.context || ""}\n${summary || ""}\n${transcriptText}`.trim(),
                budgetHint: client.budgetHint || "",
                urgency: client.urgency || "MEDIUM",
                businessType: client.businessType || "",
                decisionRole: client.decisionRole || "",
                industry: client.industry || "",
            };

            const scored = scoreLead(voiceScoreData);

            // Voice = higher intent signal, so set completesBookingQuickly bonus if outcome is booked
            if (outcome === "booked") {
                scored.engagementScore = Math.min(scored.engagementScore + 5, 15);
                scored.score = Math.min(scored.score + 5, 100);
            }

            newScores = scored;
            newScore = scored.score;
            scoreChanged = true;

            // Update client with new enriched score
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    ...newScores,
                    // Escalate if newly HOT
                    ...(newScore >= 80 && !client.escalated ? {
                        escalated: true,
                        escalationReason: `Auto-escalated via Voice call: score=${newScore}`,
                    } : {}),
                },
            });
        }

        // Update the VoiceCall record
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

        // === Write LeadActivity records ===
        if (clientId && client) {
            const durationStr = duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : "unknown";
            const prevScore = client.score;

            // CALL_ENDED activity
            await logActivity({
                clientId,
                type: "CALL_ENDED",
                channel: "VOICE",
                title: `Voice call ended — Outcome: ${outcome || "unknown"}`,
                detail: `Duration: ${durationStr} · Temperature: ${leadTemperature || "warm"} · Score: ${prevScore}${scoreChanged ? ` → ${newScore}` : ""}`,
                voiceCallId: id,
                scoreAtEvent: newScore,
            });

            // LEAD_SCORED activity (if score changed)
            if (scoreChanged && newScore !== prevScore) {
                await logActivity({
                    clientId,
                    type: "LEAD_SCORED",
                    channel: "VOICE",
                    title: "Lead score updated via Voice transcript",
                    detail: `Score: ${prevScore} → ${newScore}${newScore >= 80 ? " 🔥 HOT" : newScore >= 60 ? " 🟡 WARM" : ""}`,
                    voiceCallId: id,
                    scoreAtEvent: newScore,
                });
            }

            // STATUS_CHANGE activity if outcome is booked
            if (outcome === "booked" && client.status !== "BOOKED") {
                await prisma.client.update({
                    where: { id: client.id },
                    data: { status: "BOOKED" },
                });
                await logActivity({
                    clientId,
                    type: "STATUS_CHANGE",
                    channel: "VOICE",
                    title: "Status changed: BOOKED via Voice",
                    fromStatus: client.status,
                    toStatus: "BOOKED",
                    voiceCallId: id,
                    scoreAtEvent: newScore,
                });
            }
        }

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

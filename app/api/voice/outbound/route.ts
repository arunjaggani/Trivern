import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    let body: Record<string, string>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, phone, city, gender, service, company } = body;

    // Optional: Log to your own DB here or Google Sheets

    // Forward to N8N "New Lead" Webhook OR direct to VPS Voice Agent Outbound API.
    // If you haven't setup N8N yet, this will fail gracefully.
    try {
        // Here you would put your N8N Webhook URL when deployed
        // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_NEW_LEAD || "http://169.254.0.1:5678/webhook/new-lead";

        // OR bypass N8N and hit the LiveKit Agent VPS Outbound API directly for testing:
        const voiceApiUrl = process.env.VOICE_AGENT_OUTBOUND_URL || "http://127.0.0.1:8089/api/call";

        console.log(`[Outbound API] Triggering call to ${phone} via ${voiceApiUrl}`);

        const res = await fetch(voiceApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                phone,
                language: "en-IN", // Fallback, N8N usually handles city mapping
                service,
            }),
        });

        if (!res.ok) {
            console.error("[Outbound API] Voice Agent returned error status:", res.status);
            return NextResponse.json({ error: "Voice agent failed to initiate call" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Outbound API] Internal Error proxying call:", err);
        // Fail gracefully for demonstration
        return NextResponse.json({ error: "Failed to connect to N8N/VPS infrastructure" }, { status: 500 });
    }
}

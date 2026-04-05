import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    let body: Record<string, string>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Accept all form fields — including the ones Zara needs for her prompt
    const {
        name,
        phone,
        city,
        gender,
        service,
        company,
        primary_goal,
        situation,
        whatsapp_number,
        pronoun,
    } = body;

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_NEW_LEAD || "http://127.0.0.1:5678/webhook/new-lead";

    console.log(`[Outbound API] Triggering n8n for ${phone} → ${n8nWebhookUrl}`);

    try {
        const res = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                phone,
                city,
                // Gender/pronoun — both passed so n8n can format for Zara's context
                gender,
                pronoun: pronoun || (gender === "male" ? "Sir / Mr." : gender === "female" ? "Ma'am / Ms." : ""),
                service,
                company,
                // ── Zara-critical fields ──────────────────────────────────
                // These are injected into LiveKit room metadata so Zara can
                // greet the client with their context instead of acting blind.
                primary_goal: primary_goal || service || "",
                situation: situation || "",
                whatsapp_number: whatsapp_number || phone || "",
            }),
        });

        if (!res.ok) {
            console.error("[Outbound API] n8n returned error:", res.status);
            return NextResponse.json({ error: "n8n webhook trigger failed" }, { status: 502 });
        }

        const responseBody = await res.json().catch(() => ({}));
        return NextResponse.json({ success: true, ...responseBody });
    } catch (err) {
        console.error("[Outbound API] Error proxying to n8n:", err);
        return NextResponse.json({ error: "Failed to connect to n8n infrastructure" }, { status: 500 });
    }
}

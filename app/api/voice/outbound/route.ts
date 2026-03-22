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

    // Forward to N8N "New Lead" Webhook so we can see the execution in N8N.
    // Assuming N8N is running on the same VPS on port 5678.
    try {
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_NEW_LEAD || "http://127.0.0.1:5678/webhook/new-lead";

        console.log(`[Outbound API] Triggering N8N Webhook for ${phone} at ${n8nWebhookUrl}`);

        const res = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                phone,
                city,
                gender,
                service,
                company,
            }),
        });

        if (!res.ok) {
            console.error("[Outbound API] N8N Webhook returned error status:", res.status);
            return NextResponse.json({ error: "N8N Webhook failed to receive request" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Outbound API] Internal Error proxying to N8N:", err);
        return NextResponse.json({ error: "Failed to connect to N8N infrastructure" }, { status: 500 });
    }
}

// lib/whatsapp.ts
// Reusable WhatsApp Business Cloud API sender
// Used by backend routes to proactively message clients (e.g. meeting cancellations)

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export async function sendWhatsAppMessage(to: string, text: string): Promise<{ success: boolean; error?: string }> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        console.error("[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars");
        return { success: false, error: "WhatsApp credentials not configured" };
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text, preview_url: false },
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[whatsapp] Send failed:", JSON.stringify(data));
            return { success: false, error: data?.error?.message || "Unknown error" };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[whatsapp] Network error:", err?.message || err);
        return { success: false, error: err?.message };
    }
}

// Send a pre-approved Meta Template (Required for outbound messages outside the 24hr window)
export async function sendWhatsAppTemplate(to: string, templateName: string, variables: string[]): Promise<{ success: boolean; error?: string }> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        console.error("[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars");
        return { success: false, error: "WhatsApp credentials not configured" };
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en" }, // en_US or en_GB works if "en" is used
                    components: [
                        {
                            type: "body",
                            parameters: variables.map(v => ({ type: "text", text: v }))
                        }
                    ]
                }
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[whatsapp] Template Send failed:", JSON.stringify(data));
            return { success: false, error: data?.error?.message || "Unknown error" };
        }

        console.log(`[whatsapp] Meta API Success Response:`, JSON.stringify(data));

        return { success: true };
    } catch (err: any) {
        console.error("[whatsapp] Network error:", err?.message || err);
        return { success: false, error: err?.message };
    }
}

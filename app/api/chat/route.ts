import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ZARA_SYSTEM_PROMPT = `You are Zara, Trivern Solutions' AI Growth Consultant. You're chatting with a visitor on the Trivern website.

# IDENTITY
Warm, professional AI growth consultant. NOT a chatbot. Goal: understand their pain → build trust → qualify → collect contact info → book a discovery call directly in this chat.

# MESSAGE RULES
- Max 80 words per message
- Max 1 question per message
- 3–5 short lines, end with question or next step
- Use emojis sparingly (1–2 max)
- Be conversational, not corporate

# ABOUT TRIVERN
AI Revenue, Operations & Growth Infrastructure for service businesses.
4 Layers: Digital Foundation → Brand & Identity → AI Revenue Engine → Demand & Growth
Clients: coaches, consultants, clinics, real estate, service businesses.

# CONVERSATION FLOW
1. GREET — Warm greeting, ask what brought them here
2. DISCOVER — One question at a time. Understand their business, pain, goals
3. NAME — After 1–2 exchanges: "By the way, what should I call you?"
4. ALIGN — Connect their pain to a Trivern solution
5. TRUST — Share one relevant insight
6. PHONE — After showing value: "What's your WhatsApp number? I'll send you the meeting confirmation there."
7. COMPANY — Naturally ask for their company name before booking
8. BOOK — Once you have name, phone, and company: offer a free 20-min discovery call

# LEAD CAPTURE PRIORITY
- Name: ask early, makes conversation personal
- WhatsApp phone: ask after showing value — needed to send meeting confirmation
- Company: ask naturally before booking
- NEVER demand info. Always offer value in exchange.
- If they skip phone: "No worries! I still need it to send your booking confirmation on WhatsApp."

# BOOKING — CRITICAL INSTRUCTIONS
Once you have the visitor's name AND phone AND they agree to book:
1. Output this marker on its own line (hidden from visitor): [READY_TO_BOOK:name=THEIR_NAME,phone=THEIR_PHONE,company=THEIR_COMPANY]
2. Then say: "Let me pull up the next available slots for you..."
3. The system will show them the slots to pick from. Do NOT fabricate slots.

Example:
[READY_TO_BOOK:name=Ravi,phone=919876543210,company=Ravi Clinic]
Let me pull up the next available slots for you...

# ENERGY SCALING
HOT → Confident: "Let's lock in a slot — you'll get clarity in 20 min."
WARM → Steady: "A quick call would give you a clear roadmap."
LUKEWARM → Low friction: "Even 15 min could help you see what's possible."
COLD → Light: "No rush — I'm here if you want to explore 👋"

# OBJECTIONS
Price → "Our systems pay for themselves. The call is free and gives you a roadmap."
"Think about it" → "What's the one thing you'd want clarity on?"
"Have systems" → "What part still feels manual or leaky?"
"Not now" → "Totally fine. Want me to send you something useful in the meantime?"

# LANGUAGE
Default English. Mirror Telugu or Hindi if visitor uses it.

# RULES
NEVER: quote prices, promise ROI, ask 2+ questions in one message, send walls of text
ALWAYS: be helpful, be human, be brief
IF ASKED IF AI: "I'm Zara — Trivern's AI Growth Consultant. The discovery call is with a real human 😊"`;

export async function POST(req: NextRequest) {
    try {
        // Check settings
        let maxWords = 80;
        let chatEnabled = true;
        try {
            const config = await prisma.siteConfig.findUnique({ where: { key: "chatbot_settings" } });
            if (config) {
                const settings = JSON.parse(config.value);
                chatEnabled = settings.enabled ?? true;
                maxWords = settings.maxWords ?? 80;
            }
        } catch { }

        if (!chatEnabled) {
            return new Response(
                JSON.stringify({ error: "disabled" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Inject dynamic word limit into system prompt
        const prompt = ZARA_SYSTEM_PROMPT.replace("Max 80 words per message", `Max ${maxWords} words per message`);

        const stream = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                { role: "system", content: prompt },
                ...messages.map((m: any) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ],
            stream: true,
            max_completion_tokens: Math.max(150, Math.round(maxWords * 2.5)),
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to generate response" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

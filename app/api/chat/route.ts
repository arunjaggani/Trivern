import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ZARA_SYSTEM_PROMPT = `You are Zara, Trivern's AI Growth Consultant, chatting with a visitor on the website.

# WHO YOU ARE
Warm, friendly, and simple. You speak like a helpful friend — not a salesperson or a robot. NO jargon, NO technical terms. Everyone should understand you.

# MESSAGE RULES
- Max 60 words per message
- Max 1 question per message
- Short lines — 2 to 4 max
- 1 emoji per message max
- Use their name once you know it

# CONVERSATION FLOW — KEEP IT SHORT (3 questions max before booking)

**Message 1 (greeting already shown — skip this)**

**Message 2 — Your FIRST reply:**
Ask their name right away: "Before anything else — what should I call you? 😊"

**Message 3 — After getting name:**
Ask ONE simple business question: "Nice to meet you, [Name]! What's your business about or what are you trying to grow?"

**Message 4 — Connect and ask phone:**
Briefly connect what they said to how Trivern helps. Then ask:
"We can definitely help with that! What's your WhatsApp number? (Include country code, like 919876543210)"

**Message 5 — After getting phone, ask company:**
"Great! And what's the name of your business?"

**Message 6 — BOOK immediately:**
Say something warm and short, then trigger booking.

# BOOKING — CRITICAL
Once you have name + phone + company → output:
[READY_TO_BOOK:name=THEIR_NAME,phone=THEIR_PHONE,company=THEIR_COMPANY]
Let me pull up the next available slots for you...

⚠️ STOP after "Let me pull up the next available slots for you..."
NEVER write slot times. NEVER write "Option 1" or any dates.
The system shows real slots automatically.

# OBJECTIONS (keep responses simple)
Price → "The discovery call is completely free. No pressure."
Not interested → "Totally fine! Feel free to ask me anything."
Already have something → "What part could work better?"

# LANGUAGE
- Default: English
- If visitor writes in Telugu → reply fully in Telugu, stay in Telugu
- If visitor writes in Hindi → reply in Hindi

# RULES
NEVER: make up slot times, quote prices, use technical terms, ask 2+ questions, write long paragraphs
ALWAYS: use their name, keep it simple, sound human
IF ASKED IF AI: "I'm Zara — an AI assistant. The discovery call is with a real person from the Trivern team! 😊"
IF ASKED ABOUT SERVICES: Briefly mention AI systems for growth — website, automation, AI agents, lead generation`;

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
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt },
                ...messages.map((m: any) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: Math.max(150, Math.round(maxWords * 2.5)),
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

import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ZARA_SYSTEM_PROMPT = `You are Zara, Trivern's AI Growth Consultant, chatting with a visitor on the website.

# WHO YOU ARE
Warm, friendly, and simple. You speak like a helpful friend — not a salesperson or a robot. NO jargon, NO technical terms. Everyone should understand you.

# MESSAGE RULES
- Max 60 words per message
- ⚠️ HARD RULE: EXACTLY 1 question per message. NEVER combine questions with "and" or commas.
  - ❌ BAD: "What type of business do you have, and what features do you need?"
  - ✅ GOOD: "What type of business do you have?"
- Short lines — 2 to 4 max
- 1 emoji per message max
- Use their name once you know it

# CONVERSATION FLOW — KEEP IT SHORT (3 questions max before booking)

**Message 1 (greeting already shown — skip this)**

**Message 2 — Your FIRST reply (they just gave their name):**
Warm welcome using their name. Ask ONE simple question:
"Welcome, [Name]! What kind of business are you building or growing?"

**Message 3 — After their answer:**
Acknowledge what they said. Connect to Trivern briefly. Then ask:
"We can definitely help with that, [Name]! What's your WhatsApp number? (Country code first, e.g. 919876543210)"

**Message 4 — After getting phone, ask company:**
"Perfect! And what's the name of your business, [Name]?"

**Message 5 — BOOK immediately, with assurance:**
Say something warm and give assurance. Example:
"Sounds great, [Name]! Our experts will sit down with you and make sure we find the perfect solution for your business. Let me book you a free 20-min call!"
Then trigger booking.

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

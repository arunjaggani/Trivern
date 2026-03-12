import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";

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

**Message 2 — Your FIRST reply:**
Check: did they give their name, or just say hi/hello?
- If they said hi/hello/hey → ask name: "Before anything else, what should I call you? 😊"
- If they gave their name → welcome them: "Welcome, [Name]! What kind of business are you building or growing?"

**Message 3 — After their answer:**
Ask ONE follow-up question to understand their situation better.
Example for a dentist: "Got it! Are you looking to attract more patients, or do you need help with operations and follow-ups?"

**Messages 4–5 — Discovery (2 questions max, then move on):**
Ask 1-2 more questions naturally based on what they share. Understand their pain, goal, or challenge.
Keep each question simple and relevant. Do NOT ask for contact info yet.

**Message 6 — Connect + ask phone:**
Briefly connect their situation to how Trivern can help. Then:
"We can definitely help with that, [Name]! What's your WhatsApp number? (Country code first, e.g. 919876543210)"

**Message 7 — After getting phone, ask company:**
"Perfect! And what's the name of your business, [Name]?"

**Message 5 — BOOK (output this EXACT format, filling in real values):**
[READY_TO_BOOK:name=NAME,phone=PHONE,company=COMPANY]
Sounds great, [Name]! Our experts will make sure we find the perfect solution for you. Let me pull up the next available slots for you...

⚠️ The [READY_TO_BOOK:...] line MUST be the very first line of your response.
⚠️ After "...next available slots for you..." — STOP. Do not say anything else.
⚠️ If the user says "yes" or "ok" or anything after this — do NOT respond again. The system handles it.

# BOOKING — FORMAT RULES
- The marker [READY_TO_BOOK:name=X,phone=Y,company=Z] is hidden from visitor — always include it
- It must appear on its own line at the very START of your booking response
- NEVER write slot times, dates, or options — the system shows real slots automatically
- After "Let me pull up the next available slots for you..." — STOP completely

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

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

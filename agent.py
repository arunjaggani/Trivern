"""
Trivern Voice Agent — Zara (livekit-agents 1.5.x)
==================================================
Full Hybrid Architecture:
  Layer 1 — Sarvam 30B LLM (lean system prompt)
  Layer 2 — ZaraPostProcessor (phrase injection, phonetics)
  Layer 3 — Sarvam bulbul:v3 TTS (sentence chunking)

STT  → Sarvam saaras:v3
LLM  → Sarvam 30B (free, Indian-language optimised)
TTS  → Sarvam bulbul:v3 (custom REST wrapper)
"""

import asyncio
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
)
from livekit.plugins import openai as openai_plugin
from livekit.plugins import sarvam as sarvam_plugin
from livekit.plugins import silero

from sarvam_tts import CustomSarvamTTS, LANGUAGE_SPEAKER_MAP
from zara_processor import (
    process_llm_output,
    pick_thinking_filler,
    pick_tool_filler,
    detect_emergency,
    get_emergency_response,
    detect_sentiment,
    get_industry_phrase,
)
from zara_cache import get_cache
from call_logger import CallLogger

try:
    from tools import create_tools
    TOOLS_AVAILABLE = True
except ImportError:
    TOOLS_AVAILABLE = False

load_dotenv()

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)

LANGUAGE_MAP = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "te-IN": "Telugu",
    "ta-IN": "Tamil",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "mr-IN": "Marathi",
    "pa-IN": "Punjabi",
    "or-IN": "Odia",
    "as-IN": "Assamese",
}

# Industry detection from business keywords
INDUSTRY_KEYWORDS = {
    "hospital": ["hospital", "clinic", "doctor", "medical", "health", "patient", "pharmacy", "dental"],
    "real_estate": ["real estate", "property", "plot", "apartment", "flat", "villa", "land", "house"],
    "coaching": ["coach", "consultant", "training", "course", "mentor", "strategy", "business coach"],
    "service_agency": ["agency", "marketing", "digital", "website", "software", "IT", "technology"],
}


def detect_industry(business_info: str) -> str:
    """Detect industry from business description."""
    if not business_info:
        return "general"
    business_lower = business_info.lower()
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        if any(kw in business_lower for kw in keywords):
            return industry
    return "general"


def load_system_prompt() -> str:
    """Load lean system prompt — personality only, no phrase lists."""
    prompt_path = Path(__file__).parent / "system_prompt.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    logger.warning("system_prompt.md not found — using fallback")
    return """You are Zara, an elite voice AI consultant built by Trivern Solutions.

CORE IDENTITY:
You are warm, professional, empathetic, and action-oriented.
You sound like a real Indian professional — never robotic, never formal.

LANGUAGE RULES (CRITICAL):
- If language is Telugu: respond in Andhra-style Telugu mixed with 30% English. End sentences with -andi or -lendi. Use fillers: Antey..., Chudandi..., Mari..., Okasari...
- If language is Hindi: respond in formal Lakhnavi Hindi mixed with 30% English. Use Ji, Aap. Use fillers: Dekhiye..., Matlab..., Ji bilkul.
- NEVER mix Telugu and Hindi. Never use Hindi words in Telugu. Never use Telugu words in Hindi.
- Use English for: Schedule, Appointment, Payment, Update, Dashboard, CRM, Lead, Booking, Slot, Investment.

CONVERSATION RULES:
- Keep ALL responses under 2 sentences on a phone call.
- Never list things. Speak naturally.
- Always ask ONE question at a time.
- Acknowledge before responding. Never jump to answers.
- If calling a tool: say what you're doing, then do it. Never go silent.

OBJECTION RULES:
- Never say No directly. Reframe always.
- Acknowledge first: Nijame andi / Ji samajh sakti hoon.
- Then bridge: Antey... / Dekhiye...
- Then reframe to value.

TRIVERN CONTEXT:
You represent Trivern Solutions — an AI infrastructure agency building websites, chatbots, WhatsApp agents, voice agents, CRMs, and dashboards for Indian businesses.
If the caller is a business owner, understand their needs and offer Trivern's solutions naturally."""


def build_full_prompt(
    system_prompt: str,
    language_code: str,
    human_language: str,
    caller_name: str,
    industry: str,
    customer_context: str | None,
) -> str:
    """Build the complete session prompt with all context injected."""

    industry_instruction = {
        "hospital": "You are acting as a Care Coordinator. Be calm, reassuring, and low-pitch. Prioritize triage and scheduling.",
        "real_estate": "You are acting as a Growth Specialist. Be high-energy, polished, and aspirational. Push for site visits.",
        "coaching": "You are acting as a Transformation Expert. Be warm, inspiring, and consultative. Drive to discovery calls.",
        "service_agency": "You are acting as a Reliability Expert. Highlight 24/7 availability and AI infrastructure value.",
        "general": "Be versatile and professional.",
    }.get(industry, "Be versatile and professional.")

    memory_section = ""
    if customer_context:
        memory_section = f"\nCALLER CONTEXT (from previous interactions):\n{customer_context}\nUse this context naturally. Don't ask for information you already have.\n"

    return (
        f"{system_prompt}\n\n"
        f"--- SESSION CONFIGURATION ---\n"
        f"Caller language: {human_language} ({language_code})\n"
        f"Caller name: {caller_name}\n"
        f"Industry: {industry}\n"
        f"Industry mode: {industry_instruction}\n"
        f"{memory_section}"
        f"\nRespond EXCLUSIVELY in {human_language}. "
        f"If {human_language} uses non-Latin script, write in native script. "
        f"Never switch language unless the caller does first.\n"
        f"OUTPUT FORMAT: Spoken text only. No brackets. No emojis. No stage directions."
    )


async def entrypoint(ctx: JobContext):
    logger.info(f"New call: room={ctx.room.name}")

    # ── Extract metadata ───────────────────────────────────────────────────────
    language_code = "en-IN"
    caller_name = "there"
    industry = "general"
    customer_context = None

    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            language_code = meta.get("language", "en-IN")
            caller_name = meta.get("name", "there")
            industry = meta.get("industry", "general")
            customer_context = meta.get("customer_context", None)
        except (json.JSONDecodeError, AttributeError):
            pass

    logger.info(f"Call config: language={language_code}, name={caller_name}, industry={industry}")
    human_language = LANGUAGE_MAP.get(language_code, "English")
    speaker = LANGUAGE_SPEAKER_MAP.get(language_code, "ritu")

    # ── Build system prompt ────────────────────────────────────────────────────
    system_prompt_base = load_system_prompt()
    full_prompt = build_full_prompt(
        system_prompt=system_prompt_base,
        language_code=language_code,
        human_language=human_language,
        caller_name=caller_name,
        industry=industry,
        customer_context=customer_context,
    )

    # ── Connect ────────────────────────────────────────────────────────────────
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # ── Call logging ───────────────────────────────────────────────────────────
    call_log = CallLogger(room_name=ctx.room.name)
    call_log.start(caller_number=participant.identity, language=language_code)

    # ── Build TTS instance ─────────────────────────────────────────────────────
    tts_instance = CustomSarvamTTS(
        model=os.getenv("SARVAM_TTS_MODEL", "bulbul:v3"),
        target_language_code=language_code,
        speaker=speaker,
        pace=float(os.getenv("SARVAM_TTS_PACE", "0.95")),
        temperature=float(os.getenv("SARVAM_TTS_TEMP", "0.5")),
    )

    # ── Prewarm audio cache ────────────────────────────────────────────────────
    cache = get_cache()
    if not cache.is_ready:
        asyncio.create_task(cache.prewarm(tts_instance, language_code))
        logger.info("Audio cache prewarm started (background).")

    # ── Build agent and session ────────────────────────────────────────────────
    logger.info("Initializing AgentSession...")

    tools = create_tools() if TOOLS_AVAILABLE else []
    agent = Agent(instructions=full_prompt, tools=tools)

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=sarvam_plugin.STT(
            model=os.getenv("SARVAM_STT_MODEL", "saaras:v3"),
            language=language_code,
        ),
        llm=openai_plugin.LLM(
            model="sarvam-30b",
            base_url="https://api.sarvam.ai/v1",
            api_key=os.getenv("SARVAM_API_KEY"),
        ),
        tts=tts_instance,
        min_endpointing_delay=0.5,
        max_endpointing_delay=6.0,
    )

    await session.start(room=ctx.room, agent=agent)
    logger.info("AgentSession started.")

    # ── Greeting — industry-specific, personalised ─────────────────────────────
    await asyncio.sleep(1.2)
    logger.info("Generating greeting...")

    # Try industry-specific greeting first
    industry_greeting = get_industry_phrase(industry, language_code, "greeting")

    if caller_name and caller_name != "there" and customer_context:
        # Returning customer — personalised greeting
        greeting_instruction = (
            f"Greet {caller_name} warmly by name. "
            f"Reference that they've contacted us before. "
            f"Use the context: {customer_context[:100]}. "
            f"Then ask a relevant follow-up question. "
            f"Respond ONLY in {human_language}. Max 2 sentences."
        )
    elif industry_greeting:
        greeting_instruction = (
            f"Use this as your opening: '{industry_greeting}'. "
            f"Then ask: what brings them to Trivern today. "
            f"Respond ONLY in {human_language}."
        )
    else:
        greeting_instruction = (
            f"Greet warmly. Say you are Zara from Trivern Solutions. "
            f"Mention call may be recorded. "
            f"Ask: what kind of business do you run. "
            f"Respond ONLY in {human_language}. Max 2 sentences."
        )

    try:
        await session.generate_reply(instructions=greeting_instruction)
        logger.info("Greeting sent successfully.")
    except Exception as e:
        logger.error(f"Greeting failed: {e}", exc_info=True)

    logger.info("Pipeline active — awaiting conversation.")


def prewarm(proc: JobProcess):
    """Pre-warm VAD and system prompt at process startup."""
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["system_prompt"] = load_system_prompt()
    logger.info("Prewarm complete.")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            max_concurrent_jobs=5,
        ),
    )

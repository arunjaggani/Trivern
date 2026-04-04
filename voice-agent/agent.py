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
import uuid
import pytz
from datetime import datetime
from pathlib import Path


import aiohttp

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
from livekit.agents import tts
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


def detect_language_from_city(city_name: str, default_lang: str = "en-IN") -> str:
    """
    Enterprise routing: Maps user-provided city to native language.
    Forces te-IN for AP/Telangana to ensure perfect Bulbul TTS accent.
    """
    if not city_name:
        return default_lang

    city_lower = city_name.lower().strip()

    telugu_cities = {
        "hyderabad", "secunderabad", "vizag", "visakhapatnam", "vijayawada",
        "guntur", "warangal", "karimnagar", "khammam", "nizamabad",
        "tirupati", "nellore", "kurnool", "rajahmundry", "kakinada",
        "anantapur", "kadapa", "eluru", "ongole", "nandyal",
    }

    hindi_cities = {
        "delhi", "mumbai", "pune", "lucknow", "patna", "jaipur",
        "bhopal", "indore", "kanpur", "agra", "varanasi", "noida", "gurugram",
    }

    if any(tc in city_lower for tc in telugu_cities):
        return "te-IN"
    if any(hc in city_lower for hc in hindi_cities):
        return "hi-IN"

    return default_lang


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

    if language_code == "en-IN":
        script_instruction = "Respond EXCLUSIVELY in English using ONLY Latin script (A-Z). Do NOT use any Telugu or Hindi characters."
    elif language_code == "te-IN":
        script_instruction = "Respond EXCLUSIVELY in Telugu using ONLY native Telugu script (నమస్కారం). Do NOT use English/Latin letters for Telugu words."
    else:
        script_instruction = f"Respond EXCLUSIVELY in {human_language}. If {human_language} uses non-Latin script, write in native script."

    return (
        f"{system_prompt}\n\n"
        f"--- SESSION CONFIGURATION ---\n"
        f"Caller language: {human_language} ({language_code})\n"
        f"Caller name: {caller_name}\n"
        f"Industry: {industry}\n"
        f"Industry mode: {industry_instruction}\n"
        f"{memory_section}"
        f"\n{script_instruction}\n"
        f"Never switch language unless the caller does first.\n"
        f"OUTPUT FORMAT: Spoken text only. No brackets. No emojis. No stage directions."
    )


async def entrypoint(ctx: JobContext):
    logger.info(f"New call: room={ctx.room.name}")

    # ── 1. Connect FIRST — needed before we can read participant.identity ──────
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # ── 2. Extract metadata ───────────────────────────────────────────────────
    language_code = ""
    caller_name = "Sir/Madam"
    industry = "general"
    customer_context = None
    city = ""
    business_name = "your business"
    pronoun = ""
    primary_goal = ""
    situation = ""
    whatsapp_number = ""

    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            language_code = str(meta.get("language") or "")
            
            caller_name = str(meta.get("name") or "Sir/Madam").strip()
            if not caller_name:
                caller_name = "Sir/Madam"
                
            industry = str(meta.get("industry") or "general")
            customer_context = meta.get("customer_context")
            city = str(meta.get("city") or "").strip()
            business_name = str(meta.get("business") or "your business").strip()
            pronoun = str(meta.get("pronoun") or "").strip()
            primary_goal = str(meta.get("primary_goal") or "").strip()
            situation = str(meta.get("situation") or "").strip()
            whatsapp_number = str(meta.get("whatsapp_number") or "").strip()
        except (json.JSONDecodeError, AttributeError):
            pass

    city_name = city if city else "your location"

    # ── 3. City-based routing if n8n didn't pass a language code ───────────────
    if not language_code:
        language_code = detect_language_from_city(city, default_lang="")

    # ── 4. Phone-based routing (ultimate failsafe) ─────────────────────────────
    if not language_code:
        phone = participant.identity.replace("+91", "").replace(" ", "")
        if phone.startswith(("40", "891", "866", "863", "878", "884")):
            language_code = "te-IN"
        else:
            language_code = "en-IN"

    logger.info(f"Routed Call: {caller_name} from {city} -> Language: {language_code}")
    human_language = LANGUAGE_MAP.get(language_code, "English")
    speaker = LANGUAGE_SPEAKER_MAP.get(language_code, "ritu")

    # ── 5. Build system prompt ────────────────────────────────────────────────
    system_prompt_base = load_system_prompt()

    # INJECT REAL DATA TO PREVENT HALLUCINATIONS
    system_prompt_base = system_prompt_base.replace("{caller_name}", caller_name)
    system_prompt_base = system_prompt_base.replace("{business_name}", business_name)
    system_prompt_base = system_prompt_base.replace("{city}", city_name)
    system_prompt_base = system_prompt_base.replace("{pronoun}", pronoun)
    system_prompt_base = system_prompt_base.replace("{primary_goal}", primary_goal)
    system_prompt_base = system_prompt_base.replace("{situation}", situation)
    system_prompt_base = system_prompt_base.replace("{whatsapp_number}", whatsapp_number)
    
    # INJECT TIME AWARENESS
    ist_timezone = pytz.timezone('Asia/Kolkata')
    current_time_ist = datetime.now(ist_timezone).strftime("%A, %B %d, %Y at %I:%M %p IST")
    system_prompt_base = system_prompt_base.replace("{current_time_ist}", current_time_ist)
    full_prompt = build_full_prompt(
        system_prompt=system_prompt_base,
        language_code=language_code,
        human_language=human_language,
        caller_name=caller_name,
        industry=industry,
        customer_context=customer_context,
    )

    # ── 6. Call logging ───────────────────────────────────────────────────────
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



    # ── Build agent and session ────────────────────────────────────────────────
    logger.info("Initializing AgentSession...")

    tools = create_tools() if TOOLS_AVAILABLE else []
    agent = Agent(instructions=full_prompt, tools=tools)

    session = AgentSession(
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
    )

    await session.start(room=ctx.room, agent=agent)
    logger.info("AgentSession started.")



    # ── On-disconnect: post transcript to n8n ──────────────────────────────────
    async def _on_disconnect():
        """Called when participant leaves — sends transcript to n8n."""
        try:
            transcript_lines = []
            if hasattr(session, 'chat_ctx') and session.chat_ctx:
                for msg in session.chat_ctx.messages:
                    role = getattr(msg, 'role', 'unknown')
                    content = getattr(msg, 'content', '')
                    if content:
                        transcript_lines.append(f"{role}: {content}")

            transcript = "\n".join(transcript_lines)
            webhook_url = os.getenv("N8N_WEBHOOK_CALL_COMPLETE", "")
            if webhook_url and transcript:
                n8n_base = os.getenv("N8N_BASE_URL", "http://172.17.0.1:5678")
                full_url = f"{n8n_base}{webhook_url}"
                payload = {
                    "phone": participant.identity,
                    "room": ctx.room.name,
                    "language": language_code,
                    "industry": industry,
                    "transcript": transcript,
                    "source": "voice",
                }
                async with aiohttp.ClientSession() as http:
                    async with http.post(
                        full_url, json=payload,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        logger.info(f"Transcript posted to n8n: {resp.status}")
        except Exception as e:
            logger.error(f"Disconnect hook failed: {e}", exc_info=True)

    ctx.add_shutdown_callback(_on_disconnect)

    if caller_name and caller_name != "there" and customer_context:
        # Returning customer — personalised greeting
        greeting_instruction = (
            f"Greet {caller_name} warmly by name. "
            f"Reference that they've contacted us before. "
            f"Use the context: {customer_context[:100]}. "
            f"Then ask a relevant follow-up question. "
            f"Respond ONLY in {human_language}. Max 2 sentences."
        )
    else:
        greeting_instruction = (
            f"Greet warmly. Say you are Zara from Trivern Solutions. "
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
    """Pre-warm system prompt at process startup."""
    proc.userdata["system_prompt"] = load_system_prompt()
    logger.info("Prewarm complete.")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )

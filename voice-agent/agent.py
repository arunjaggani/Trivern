"""
Trivern Voice Agent — Main LiveKit Agent (v1.5+ API)
====================================================
Listens for incoming SIP participants (inbound calls) and runs
the STT → LLM → TTS pipeline using Sarvam AI + GPT-4o Mini.

For outbound calls, see outbound.py which triggers calls via
LiveKit's SIP API, which then route back here.
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

from tools import create_tools
from call_logger import CallLogger

load_dotenv()

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)


def load_system_prompt() -> str:
    """Load the system prompt from system_prompt.md"""
    prompt_path = Path(__file__).parent / "system_prompt.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    logger.warning("system_prompt.md not found — using fallback prompt")
    return (
        "You are Zara, a warm and professional AI growth consultant at Trivern Solutions. "
        "You are on a live phone call. Keep responses short and natural."
    )


def create_stt(language: str = "en-IN"):
    """
    Create Sarvam AI STT (saaras:v3) instance.
    Language is passed dynamically per call — detected by N8N from form city field.
    
    Supported languages: en-IN, hi-IN, te-IN, ta-IN, kn-IN, ml-IN, bn-IN,
    gu-IN, mr-IN, pa-IN, or-IN, as-IN, and more.
    """
    return sarvam_plugin.STT(
        model="saaras:v3",
        language=language,
    )


def create_tts(language: str = "en-IN"):
    """
    Create Sarvam AI TTS (bulbul:v3) instance.
    Voice ID comes from SARVAM_VOICE env var.
    Language is set dynamically to match the local language.
    """
    voice = os.getenv("SARVAM_VOICE", "ritu")
    return sarvam_plugin.TTS(
        model="bulbul:v3",
        target_language_code=language,
        speaker=voice,
    )


def create_llm():
    """Create the OpenAI LLM (GPT-4o Mini)."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return openai_plugin.LLM(model=model)


# Map of SARVAM language codes to human-readable languages
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

class ZaraAssistant(Agent):
    """The v1.5 API Wrapper for the Voice Agent"""
    def __init__(self, language: str, system_prompt: str, tools):
        stt = create_stt(language)
        tts = create_tts(language)
        llm_instance = create_llm()

        human_language = LANGUAGE_MAP.get(language, "English")
        
        # Inject strict language instructions so the LLM outputs text that TTS can synthesize
        bilingual_prompt = (
            f"{system_prompt}\n\n"
            "--- IMPORTANT LANGUAGE INSTRUCTIONS ---\n"
            f"The caller speaks: {human_language}.\n"
            f"You MUST generate ALL your responses EXCLUSIVELY in {human_language}. "
            "Do NOT output English unless asked to translate or the user explicitly switches entirely to English. "
            "Your text will be sent to a speech synthesizer that ONLY understands the local language. "
            "If you output English text while the user is expecting a local language, the voice engine will crash. "
            f"If {human_language} does not use the Latin alphabet, output the text in the native script (e.g. Devanagari for Hindi, Telugu script for Telugu)."
        )

        super().__init__(
            instructions=bilingual_prompt,
            stt=stt,
            llm=llm_instance,
            tts=tts,
            tools=tools,
        )

    async def on_enter(self):
        """Called when agent enters the session — deliver compliance greeting."""
        logger.info("on_enter triggered — generating compliance greeting")
        reply = self.session.generate_reply(
            instructions="Introduce yourself briefly and say that this call may be recorded for quality purposes. Say this in the EXACT language instructed in your system prompt.",
            allow_interruptions=False,
        )
        if hasattr(reply, '__await__'):
            await reply


async def entrypoint(ctx: JobContext):
    """
    Called when a new participant joins a LiveKit room
    (either inbound SIP call or outbound SIP call connecting).
    """
    logger.info(f"New call session: room={ctx.room.name}")

    # ─── Extract language from room metadata ─────────
    language = "en-IN"
    caller_name = "there"

    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            language = meta.get("language", "en-IN")
            caller_name = meta.get("name", "there")
        except json.JSONDecodeError:
            pass

    logger.info(f"Call config: language={language}, caller={caller_name}")

    # ─── Load components ──────────────────────────────
    system_prompt = load_system_prompt()
    tools = create_tools()
    call_log = CallLogger(room_name=ctx.room.name)

    # ─── Connect and wait for caller ──────────────────
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # ─── Log call start ───────────────────────────────
    call_log.start(
        caller_number=participant.identity,
        language=language,
    )

    # ─── Create and start the voice session ───────────
    assistant = ZaraAssistant(language, system_prompt, tools)
    session = AgentSession(
        vad=silero.VAD.load(),
    )

    logger.info("Starting AgentSession — Zara voice pipeline active")

    await session.start(
        room=ctx.room,
        agent=assistant,
    )

    logger.info("AgentSession started — awaiting call end")


def prewarm(proc: JobProcess):
    """Pre-warm step — load system prompt into memory."""
    proc.userdata["system_prompt"] = load_system_prompt()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )


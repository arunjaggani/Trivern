"""
Trivern Voice Agent — Main LiveKit Agent (v1.5+ API)
====================================================
Uses modern AgentSession API for STT → LLM → TTS routing.
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
from livekit.agents.llm import ChatContext
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


async def entrypoint(ctx: JobContext):
    """
    Called when a new participant joins a LiveKit room
    (either inbound SIP call or outbound SIP call connecting).
    """
    logger.info(f"New call session: room={ctx.room.name}")

    # ─── Extract language from room metadata ─────────
    language_code = "en-IN"
    caller_name = "there"

    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            language_code = meta.get("language", "en-IN")
            caller_name = meta.get("name", "there")
        except json.JSONDecodeError:
            pass

    logger.info(f"Call config: language={language_code}, caller={caller_name}")
    human_language = LANGUAGE_MAP.get(language_code, "English")

    # ─── Load components ──────────────────────────────
    system_prompt_base = load_system_prompt()
    tools = create_tools()
    call_log = CallLogger(room_name=ctx.room.name)

    # Inject strict language instructions
    bilingual_prompt = (
        f"{system_prompt_base}\n\n"
        "--- IMPORTANT LANGUAGE INSTRUCTIONS ---\n"
        f"The caller speaks: {human_language}.\n"
        f"You MUST generate ALL your responses EXCLUSIVELY in {human_language}. "
        "Do NOT output English unless asked to translate. "
        "Your text will be sent to a speech synthesizer that ONLY understands the local language. "
        f"If {human_language} does not use the Latin alphabet, output the text in the native script (e.g. Devanagari for Hindi, Telugu script for Telugu)."
    )

    # ─── Connect and wait for caller ──────────────────
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    call_log.start(
        caller_number=participant.identity,
        language=language_code,
    )

    # ─── Create the Agent ──────────────────────────────
    logger.info("Initializing AgentSession...")
    voice = os.getenv("SARVAM_VOICE", "ritu")

    agent = Agent(
        instructions=bilingual_prompt,
        tools=tools,
    )
    
    from livekit.agents.voice.room_io import RoomInputOptions
    
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=sarvam_plugin.STT(model="saaras:v3", language=language_code),
        llm=openai_plugin.LLM(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
        tts=sarvam_plugin.TTS(model="bulbul:v3", target_language_code=language_code, speaker=voice),
    )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            close_on_disconnect=True,
        ),
    )
    
    logger.info("AgentSession started.")

    # ─── Initial Greeting ─────────────────────────────
    # Wait briefly to ensure audio streams are fully connected
    await asyncio.sleep(1.0)
    logger.info("Triggering initial greeting logic...")
    
    # Generate the reply using the LLM directly so it strictly outputs in the user's native language.
    try:
        await session.generate_reply(
            instructions="Introduce yourself briefly and say that this call may be recorded for quality purposes. Say this in the EXACT language instructed in your system prompt.",
        )
    except Exception as e:
        logger.error(f"Failed to generate greeting: {e}")

    logger.info("Pipeline active — awaiting call end")


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


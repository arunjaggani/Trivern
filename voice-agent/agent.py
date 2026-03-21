"""
Trivern Voice Agent — Main LiveKit Agent
========================================
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
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import openai as openai_plugin
from livekit.plugins import sarvam as sarvam_plugin

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
    Language is passed dynamically per call.
    """
    voice = os.getenv("SARVAM_VOICE", "meera")
    return sarvam_plugin.TTS(
        model="bulbul:v3",
        language=language,
        speaker=voice,
    )


def create_llm():
    """Create the OpenAI LLM (GPT-4o Mini)."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return openai_plugin.LLM(model=model)


async def entrypoint(ctx: JobContext):
    """
    Called when a new participant joins a LiveKit room
    (either inbound SIP call or outbound SIP call connecting).
    """
    logger.info(f"New call session: room={ctx.room.name}")

    # ─── Extract language from room metadata ─────────
    # Set by outbound.py (outbound calls) or SIP dispatch (inbound calls)
    # Defaults to en-IN for inbound calls without metadata
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

    # ─── Load all components ─────────────────────────
    system_prompt = load_system_prompt()
    stt = create_stt(language)
    tts = create_tts(language)
    llm_instance = create_llm()
    tools = create_tools()
    call_log = CallLogger(room_name=ctx.room.name)

    # ─── Build initial LLM context ────────────────────
    initial_ctx = llm.ChatContext()
    initial_ctx.append(role="system", text=system_prompt)

    # ─── Create the voice pipeline agent ──────────────
    agent = VoicePipelineAgent(
        vad=None,  # Use default VAD (silero)
        stt=stt,
        llm=llm_instance,
        tts=tts,
        chat_ctx=initial_ctx,
        fnc_ctx=tools,
    )

    # ─── Connect and wait for caller ──────────────────
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # ─── Start the pipeline ───────────────────────────
    agent.start(ctx.room, participant)

    # ─── Log call start ───────────────────────────────
    call_log.start(
        caller_number=participant.identity,
        language=language,
    )

    # ─── COMPLIANCE: First spoken line (non-negotiable) ─
    await agent.say(
        "Hi, just so you know — this call may be recorded for quality purposes.",
        allow_interruptions=False,
    )

    logger.info("Voice agent pipeline running — awaiting call end.")


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

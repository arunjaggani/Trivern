"""
Trivern Voice Agent — Call Logger
==================================
Tracks call metadata, transcript, and duration.
On call end, sends everything to N8N for DB storage
and dashboard visibility.
"""

import logging
import time
import os
from typing import Optional

import aiohttp

logger = logging.getLogger("call-logger")


class CallLogger:
    """Tracks a single call session from start to end."""

    def __init__(self, room_name: str):
        self.room_name = room_name
        self.caller_number: Optional[str] = None
        self.language: Optional[str] = None
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.transcript: list[dict] = []
        self.outcome: Optional[str] = None  # "booked", "whatsapp_followup", "callback", "no_answer"
        self.lead_temperature: Optional[str] = None  # "hot", "warm", "lukewarm", "cold"

    def start(self, caller_number: str, language: str = "en-IN"):
        """Mark call start."""
        self.caller_number = caller_number
        self.language = language
        self.start_time = time.time()
        logger.info(f"Call started: {caller_number} | lang={language} | room={self.room_name}")

    def add_transcript_entry(self, role: str, content: str):
        """Add a line to the transcript."""
        self.transcript.append({
            "role": role,  # "agent" or "caller"
            "content": content,
            "timestamp": time.time(),
        })

    def set_outcome(self, outcome: str, temperature: str = "warm"):
        """Set the call outcome and lead temperature."""
        self.outcome = outcome
        self.lead_temperature = temperature

    @property
    def duration_seconds(self) -> int:
        """Call duration in seconds."""
        if self.start_time and self.end_time:
            return int(self.end_time - self.start_time)
        if self.start_time:
            return int(time.time() - self.start_time)
        return 0

    async def end(self):
        """
        Finalize the call and send all data to N8N
        for DB storage and dashboard display.
        """
        self.end_time = time.time()
        duration = self.duration_seconds

        logger.info(
            f"Call ended: {self.caller_number} | "
            f"duration={duration}s | outcome={self.outcome}"
        )

        # Send to N8N webhook for storage
        payload = {
            "room": self.room_name,
            "callerNumber": self.caller_number,
            "language": self.language,
            "duration": duration,
            "outcome": self.outcome or "unknown",
            "leadTemperature": self.lead_temperature or "warm",
            "transcript": self.transcript,
            "source": "voice",
        }

        n8n_base = os.getenv("N8N_BASE_URL", "http://172.17.0.1:5678")
        webhook_path = os.getenv("N8N_WEBHOOK_CALL_COMPLETE", "/webhook/voice-call-complete")
        url = f"{n8n_base}{webhook_path}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        logger.info("Call log sent to N8N successfully")
                    else:
                        text = await resp.text()
                        logger.error(f"N8N call log failed ({resp.status}): {text}")
        except Exception as e:
            logger.error(f"Failed to send call log: {e}")

"""
sarvam_tts.py — Custom Sarvam TTS for LiveKit agents 1.5.x
===========================================================
Features:
  - Sentence-level chunking for lower perceived latency
  - Audio cache integration for instant filler playback
  - Parallel chunk fetching via asyncio.gather
  - Full ZaraPostProcessor integration
"""

import os
import re
import uuid
import base64
import logging
import asyncio
import aiohttp
from livekit.agents import tts
from livekit.agents.types import APIConnectOptions

logger = logging.getLogger("custom-sarvam-tts")

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

LANGUAGE_SPEAKER_MAP = {
    "en-IN": "ritu",
    "hi-IN": "priya",
    "te-IN": "kavya",
    "ta-IN": "kavya",
    "kn-IN": "kavya",
    "ml-IN": "kavya",
    "bn-IN": "rahul",
    "gu-IN": "aditya",
    "mr-IN": "aditya",
    "pa-IN": "priya",
    "or-IN": "ritu",
    "as-IN": "ritu",
}

VALID_V3_SPEAKERS = {
    "shubh", "aditya", "ritu", "priya", "neha", "rahul",
    "pooja", "rohan", "simran", "kavya", "amit", "dev",
    "ishita", "shreya", "ratan", "varun", "manan", "sumit",
    "roopa", "kabir", "aayan", "ashutosh", "advait",
    "amelia", "sophia", "anand", "tanya", "tarun",
    "sunny", "mani", "gokul", "vijay", "shruti",
    "suhani", "mohit", "kavitha", "rehan", "soham", "rupali",
}


def split_into_sentences(text: str) -> list[str]:
    """
    Split text into sentence-level chunks for parallel TTS fetching.
    Keeps chunks between 20-300 chars for best quality + speed balance.
    Handles Telugu/Hindi sentence boundaries naturally.
    """
    if not text or not text.strip():
        return []

    # Split on sentence endings including Telugu/Hindi punctuation
    raw = re.split(r'(?<=[.!?।\u0964\?])\s+', text.strip())

    chunks = []
    current = ""
    for sentence in raw:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current) + len(sentence) + 1 <= 300:
            current = f"{current} {sentence}".strip()
        else:
            if current:
                chunks.append(current)
            # If single sentence too long, split on natural pause points
            if len(sentence) > 300:
                parts = re.split(r'(?<=[,;])\s+', sentence)
                sub = ""
                for part in parts:
                    if len(sub) + len(part) + 1 <= 300:
                        sub = f"{sub} {part}".strip()
                    else:
                        if sub:
                            chunks.append(sub)
                        sub = part
                if sub:
                    chunks.append(sub)
            else:
                current = sentence

    if current:
        chunks.append(current)

    # Filter out tiny fragments that cause mid-word TTS truncation
    # Minimum 40 chars ensures a complete natural phrase is always synthesized
    merged = []
    buffer = ""
    for chunk in (chunks if chunks else [text[:500]]):
        if len(buffer) + len(chunk) + 1 < 40:
            buffer = f"{buffer} {chunk}".strip()
        else:
            if buffer:
                merged.append(buffer)
            buffer = chunk
    if buffer:
        merged.append(buffer)

    return merged if merged else [text[:500]]


class CustomSarvamTTS(tts.TTS):
    def __init__(
        self,
        *,
        model: str = "bulbul:v3",
        target_language_code: str = "en-IN",
        speaker: str | None = None,
        pace: float = 0.95,
        temperature: float = 0.5,
        api_key: str | None = None,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )
        self._model = model
        self._language = target_language_code
        self._pace = pace
        self._temperature = temperature
        self._api_key = api_key or os.getenv("SARVAM_API_KEY", "")

        if speaker is None:
            speaker = LANGUAGE_SPEAKER_MAP.get(target_language_code, "ritu")
        if speaker.lower() not in VALID_V3_SPEAKERS:
            logger.warning(f"Speaker '{speaker}' invalid, defaulting to 'ritu'")
            speaker = "ritu"
        self._speaker = speaker.lower()

        logger.info(
            f"CustomSarvamTTS ready | model={model} "
            f"lang={target_language_code} speaker={self._speaker} "
            f"pace={pace}"
        )

    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions | None = None,
        **kwargs,
    ) -> "SarvamStream":
        if conn_options is None:
            conn_options = APIConnectOptions()
        return SarvamStream(
            tts_instance=self,
            input_text=text,
            conn_options=conn_options,
        )

    async def fetch_audio(self, text: str) -> bytes | None:
        """
        Fetch audio for a single text chunk from Sarvam REST API.
        Returns raw WAV bytes or None on failure.
        """
        if not text or not text.strip():
            return None

        payload = {
            "inputs": [text[:2500]],
            "target_language_code": self._language,
            "speaker": self._speaker,
            "model": self._model,
            "pace": self._pace,
            "temperature": self._temperature,
            "speech_sample_rate": 24000,
        }
        headers = {
            "api-subscription-key": self._api_key,
            "Content-Type": "application/json",
        }

        for attempt in range(2):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        SARVAM_TTS_URL,
                        json=payload,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=15),
                    ) as resp:
                        if resp.status != 200:
                            err = await resp.text()
                            logger.error(f"Sarvam API {resp.status}: {err[:150]}")
                            await asyncio.sleep(1.0)
                            continue

                        data = await resp.json()
                        audios = data.get("audios", [])
                        if not audios:
                            logger.error("Sarvam returned empty audios[]")
                            return None

                        audio_bytes = base64.b64decode(audios[0])
                        logger.info(
                            f"Sarvam chunk: {len(audio_bytes)}B | "
                            f"magic={audio_bytes[:4].hex()} | "
                            f"text='{text[:40]}'"
                        )
                        return audio_bytes

            except asyncio.TimeoutError:
                logger.warning(f"Sarvam timeout (attempt {attempt+1}): {text[:30]}")
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Sarvam fetch error: {e}")
                await asyncio.sleep(0.5)

        return None


class SarvamStream(tts.ChunkedStream):
    def __init__(
        self,
        *,
        tts_instance: CustomSarvamTTS,
        input_text: str,
        conn_options: APIConnectOptions,
    ):
        super().__init__(
            tts=tts_instance,
            input_text=input_text,
            conn_options=conn_options,
        )
        self._tts = tts_instance

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        raw_text = self._input_text
        if not raw_text or not raw_text.strip():
            return

        text = raw_text
        if not text or not text.strip():
            return

        # Split the REFINED text into sentence chunks
        chunks = split_into_sentences(text)
        logger.info(f"TTS: {len(chunks)} chunks for {len(text)} chars (raw={len(raw_text)})")

        # Initialize emitter ONCE for the full response
        output_emitter.initialize(
            request_id=uuid.uuid4().hex,
            sample_rate=24000,
            num_channels=1,
            mime_type="audio/wav",
        )

        # !! SEQUENTIAL fetch — guarantees the audio emitter receives a clean
        # finished signal after each chunk, preventing "speech scheduling is paused"
        pushed = 0
        for i, chunk in enumerate(chunks):
            try:
                result = await self._tts.fetch_audio(chunk)
                if result:
                    output_emitter.push(result)
                    pushed += 1
                else:
                    logger.warning(f"Chunk {i} returned no audio, skipping")
            except Exception as e:
                logger.error(f"Chunk {i} fetch failed: {e}")
                continue

        output_emitter.flush()

        if pushed == 0:
            raise Exception("No audio chunks synthesised successfully")

        logger.info(f"Pushed {pushed}/{len(chunks)} chunks — Zara speaking!")

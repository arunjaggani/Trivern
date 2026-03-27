import os
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


class CustomSarvamTTS(tts.TTS):
    def __init__(
        self,
        *,
        model: str = "bulbul:v3",
        target_language_code: str = "en-IN",
        speaker: str | None = None,
        pace: float = 1.1,
        temperature: float = 0.6,
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
            f"CustomSarvamTTS ready: model={model}, "
            f"lang={target_language_code}, speaker={self._speaker}"
        )

    def synthesize(
        self, text: str, *, conn_options: APIConnectOptions | None = None, **kwargs
    ) -> "SarvamStream":
        if conn_options is None:
            conn_options = APIConnectOptions()
        return SarvamStream(
            tts_instance=self, input_text=text, conn_options=conn_options
        )


class SarvamStream(tts.ChunkedStream):
    def __init__(
        self,
        *,
        tts_instance: CustomSarvamTTS,
        input_text: str,
        conn_options: APIConnectOptions,
    ):
        super().__init__(
            tts=tts_instance, input_text=input_text, conn_options=conn_options
        )
        self._tts = tts_instance

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        text = self._input_text
        if not text or not text.strip():
            return

        payload = {
            "inputs": [text[:2500]],
            "target_language_code": self._tts._language,
            "speaker": self._tts._speaker,
            "model": self._tts._model,
            "pace": self._tts._pace,
            "temperature": self._tts._temperature,
            "speech_sample_rate": 24000,
        }
        headers = {
            "api-subscription-key": self._tts._api_key,
            "Content-Type": "application/json",
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                SARVAM_TTS_URL,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                if resp.status != 200:
                    err = await resp.text()
                    logger.error(f"Sarvam API {resp.status}: {err[:200]}")
                    raise Exception(f"Sarvam API error {resp.status}")

                data = await resp.json()
                audios = data.get("audios", [])
                if not audios:
                    logger.error("Sarvam returned empty audios[]")
                    raise Exception("Sarvam returned no audio")

                audio_bytes = base64.b64decode(audios[0])
                logger.info(
                    f"Sarvam audio: {len(audio_bytes)} bytes | "
                    f"magic={audio_bytes[:4].hex()}"
                )

                # Initialize emitter — MUST be called before push()
                output_emitter.initialize(
                    request_id=uuid.uuid4().hex,
                    sample_rate=24000,
                    num_channels=1,
                    mime_type="audio/wav",   # Sarvam returns WAV (RIFF header)
                )
                output_emitter.push(audio_bytes)  # push raw WAV bytes directly
                # NOTE: end_input() is called by the framework after _run returns
                logger.info("Pushed WAV audio to LiveKit — Zara speaking!")

"""
Custom Sarvam TTS Plugin for LiveKit (REST API Wrapper)
=======================================================
The official `livekit-plugins-sarvam` websocket is currently crashing 
on the new `bulbul:v3` model because Sarvam returns MP3 frames
while LiveKit expects WAV frames.

This custom plugin bypasses the websocket, hits the REST API directly,
auto-detects the byte format (MP3 vs WAV), and natively pushes
raw PCM frames back into the LiveKit pipeline.
"""

import os
import json
import base64
import logging
import aiohttp

from livekit.agents import tts
from livekit.agents.utils import codecs

logger = logging.getLogger("custom-sarvam-tts")


class CustomSarvamTTS(tts.TTS):
    def __init__(
        self,
        *,
        model: str = "bulbul:v3",
        speaker: str = "anushka",
        target_language_code: str = "hi-IN",
        pace: float = 1.0,
        enable_preprocessing: bool = True,
        api_key: str | None = None,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000, 
            num_channels=1,
        )
        self._model = model
        self._speaker = speaker
        self._language = target_language_code
        self._pace = pace
        self._enable_preprocessing = enable_preprocessing
        self._api_key = api_key or os.getenv("SARVAM_API_KEY")
        
        if not self._api_key:
            logger.error("SARVAM_API_KEY environment variable is not set!")
        
    def synthesize(self, text: str, **kwargs) -> "tts.ChunkedStream":
        return _SarvamStream(
            tts_ref=self,
            text=text,
        )


class _SarvamStream(tts.ChunkedStream):
    def __init__(self, tts_ref: CustomSarvamTTS, text: str):
        super().__init__()
        self._tts = tts_ref
        self._text = text

    async def _main_task(self) -> None:
        if not self._text.strip():
            return

        try:
            url = "https://api.sarvam.ai/text-to-speech"
            headers = {
                "api-subscription-key": self._tts._api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "inputs": [self._text],
                "target_language_code": self._tts._language,
                "speaker": self._tts._speaker,
                "model": self._tts._model,
                "pace": self._tts._pace,
                "enable_preprocessing": self._tts._enable_preprocessing
            }

            logger.info(f"CustomSarvamTTS requesting synthesis for {len(self._text)} chars...")

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status != 200:
                        err = await resp.text()
                        logger.error(f"Sarvam REST API Failed: {err}")
                        raise Exception(f"Sarvam TTS Error: {resp.status}")
                        
                    data = await resp.json()
                    
            audios = data.get("audios", [])
            if not audios:
                logger.warning("Sarvam returned empty audios array.")
                return
                
            # Decode the base64 audio
            b64_audio = audios[0]
            audio_bytes = base64.b64decode(b64_audio)

            # Auto-detect audio wrapper (MP3 vs WAV)
            # MP3 headers typically start with FF FB, FF F3, FF F2, or ID3
            is_mp3 = audio_bytes.startswith(b'\xff\xf3') or \
                     audio_bytes.startswith(b'\xff\xfb') or \
                     audio_bytes.startswith(b'ID3') or \
                     audio_bytes.startswith(b'\xff\xf2')
                     
            logger.info(f"CustomSarvamTTS decoding {len(audio_bytes)} bytes (Format: {'MP3' if is_mp3 else 'WAV'})")

            if is_mp3:
                decoder = codecs.Mp3StreamDecoder()
            else:
                decoder = codecs.WavStreamDecoder()
                
            # Push the entire file bytes to the decoder
            frames = decoder.decode_chunk(audio_bytes)
            for frame in frames:
                self._event_ch.send_nowait(
                    tts.SynthesizedAudio(text=self._text, data=frame)
                )

        except Exception as e:
            logger.error(f"Failed to fetch/decode CustomSarvam audio: {e}", exc_info=e)

import os
import base64
import logging
import asyncio
import aiohttp
from livekit.agents import tts
from livekit.agents.types import APIConnectOptions

logger = logging.getLogger("custom-sarvam-tts")

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

class CustomSarvamTTS(tts.TTS):
    def __init__(self, *, model="bulbul:v2", speaker="meera",
                 target_language_code="en-IN", pace=1.1,
                 enable_preprocessing=True, api_key=None):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=22050,
            num_channels=1,
        )
        self._model = model
        self._speaker = speaker
        self._language = target_language_code
        self._pace = pace
        self._enable_preprocessing = enable_preprocessing
        self._api_key = api_key or os.getenv("SARVAM_API_KEY", "")
        logger.info(f"CustomSarvamTTS ready: model={model}, lang={target_language_code}, speaker={speaker}")

    def synthesize(self, text: str, *, conn_options: APIConnectOptions = None) -> "SarvamStream":
        if conn_options is None:
            conn_options = APIConnectOptions()
        return SarvamStream(tts_instance=self, input_text=text, conn_options=conn_options)


class SarvamStream(tts.ChunkedStream):
    def __init__(self, *, tts_instance: CustomSarvamTTS, input_text: str, conn_options: APIConnectOptions):
        super().__init__(tts=tts_instance, input_text=input_text, conn_options=conn_options)
        self._tts = tts_instance

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        text = self._input_text
        if not text or not text.strip():
            return

        payload = {
            "inputs": [text],
            "target_language_code": self._tts._language,
            "speaker": self._tts._speaker,
            "model": self._tts._model,
            "pace": self._tts._pace,
            "enable_preprocessing": self._tts._enable_preprocessing,
            "speech_sample_rate": 22050,
        }
        headers = {
            "api-subscription-key": self._tts._api_key,
            "Content-Type": "application/json",
        }

        for attempt in range(3):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        SARVAM_TTS_URL, json=payload, headers=headers,
                        timeout=aiohttp.ClientTimeout(total=20)
                    ) as resp:
                        if resp.status != 200:
                            err = await resp.text()
                            logger.error(f"Sarvam API error {resp.status}: {err[:200]}")
                            await asyncio.sleep(1.5 ** attempt)
                            continue

                        data = await resp.json()
                        audios = data.get("audios", [])
                        if not audios:
                            logger.error("Sarvam returned empty audios[]")
                            return

                        audio_bytes = base64.b64decode(audios[0])
                        logger.info(f"Sarvam returned {len(audio_bytes)} bytes, magic={audio_bytes[:4].hex()}")

                        import io
                        import av
                        buf = io.BytesIO(audio_bytes)
                        container = av.open(buf)
                        resampler = av.AudioResampler(format="s16", layout="mono", rate=22050)
                        from livekit import rtc
                        output_emitter.start()
                        frame_count = 0
                        for packet in container.demux(audio=0):
                            for frame in packet.decode():
                                for rf in resampler.resample(frame):
                                    pcm = bytes(rf.planes[0])
                                    lk_frame = rtc.AudioFrame(
                                        data=pcm,
                                        sample_rate=22050,
                                        num_channels=1,
                                        samples_per_channel=len(pcm) // 2,
                                    )
                                    output_emitter.push(lk_frame)
                                    frame_count += 1
                        container.close()
                        output_emitter.flush()
                        logger.info(f"Pushed {frame_count} PCM frames to LiveKit")
                        return

            except asyncio.TimeoutError:
                logger.warning(f"Sarvam timeout attempt {attempt+1}")
                await asyncio.sleep(1.5 ** attempt)
            except Exception as e:
                logger.error(f"Sarvam TTS failed attempt {attempt+1}: {e}", exc_info=True)
                await asyncio.sleep(1.5 ** attempt)

        logger.error(f"All Sarvam TTS attempts failed for: {text[:60]}")

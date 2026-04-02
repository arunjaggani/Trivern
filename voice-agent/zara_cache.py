"""
zara_cache.py — Pre-warmed Audio Cache for Instant Fillers
Pre-synthesises common, highly respectful phrases at agent startup.
"""

import asyncio
import logging
import random
from typing import Optional

logger = logging.getLogger("zara-cache")

# NATIVE SCRIPT PHRASES (Strictly respectful, no slang)
CACHE_PHRASES = {
    "te-IN": {
        "compliance":  "నమస్కారం అండీ... ఈ కాల్ క్వాలిటీ కోసం రికార్డ్ చేయబడుతుంది.",
        "thinking":    "అంటే...",
        "thinking2":   "సరే అండీ...",
        "checking":    "ఒక్క నిమిషం అండీ... సిస్టమ్ చెక్ చేస్తున్నాను.",
        "acknowledge": "అర్థమైంది అండీ...",
        "agree":       "ఖచ్చితంగా అండీ...",
        "hold":        "దయచేసి లైన్ లో ఉండండి... నేను ఇప్పుడే చెక్ చేస్తాను.",
        "wait_thanks": "వెయిట్ చేసినందుకు థాంక్స్ అండీ!",
        "no_worry":    "చింతించకండి అండీ... దానికి మా దగ్గర solution ఉంది.",
    },
    "hi-IN": {
        "compliance":  "नमस्ते जी... यह कॉल क्वालिटी के लिए रिकॉर्ड की जा रही है।",
        "thinking":    "जी...",
        "thinking2":   "समझ गई...",
        "checking":    "जी... मैं एक मिनट सिस्टम चेक कर रही हूँ...",
        "acknowledge": "जी, बिल्कुल समझ गई...",
        "agree":       "जी बिल्कुल।",
        "hold":        "कृपया एक मिनट होल्ड कीजिए... मैं चेक करती हूँ।",
        "wait_thanks": "इंतज़ार करने के लिए शुक्रिया जी!",
        "no_worry":    "आप परेशान मत होइए जी... इसका solution है हमारे पास।",
    },
    "en-IN": {
        "compliance":  "Hello, just so you know — this call may be recorded for quality purposes.",
        "thinking":    "Right...",
        "thinking2":   "I see...",
        "checking":    "One moment, let me check the system...",
        "acknowledge": "Understood completely.",
        "agree":       "Absolutely.",
        "hold":        "Could you hold briefly? I'll check right away.",
        "wait_thanks": "Thank you for waiting!",
        "no_worry":    "Don't worry at all, we can solve that.",
    }
}

class ZaraAudioCache:
    def __init__(self):
        self._cache: dict[str, bytes] = {}
        self._ready = False

    async def prewarm(self, tts_instance, language_code: str) -> None:
        phrases = CACHE_PHRASES.get(language_code, CACHE_PHRASES["en-IN"])
        logger.info(f"Prewarming {len(phrases)} respectful phrases for {language_code}...")

        tasks = []
        for key, text in phrases.items():
            cache_key = f"{language_code}_{key}"
            tasks.append(self._fetch_and_cache(tts_instance, cache_key, text))

        await asyncio.gather(*tasks, return_exceptions=True)
        self._ready = True

    async def _fetch_and_cache(self, tts_instance, cache_key: str, text: str) -> None:
        try:
            audio_bytes = await tts_instance.fetch_audio(text)
            if audio_bytes:
                self._cache[cache_key] = audio_bytes
        except Exception as e:
            logger.warning(f"Cache miss for {cache_key}: {e}")

    def get(self, key: str, language_code: str) -> Optional[bytes]:
        return self._cache.get(f"{language_code}_{key}")

    def get_thinking_filler(self, language_code: str) -> Optional[bytes]:
        return self.get(random.choice(["thinking", "thinking2"]), language_code)

    def get_checking_phrase(self, language_code: str) -> Optional[bytes]:
        return self.get("checking", language_code)

    def get_compliance_greeting(self, language_code: str) -> Optional[bytes]:
        return self.get("compliance", language_code)

    @property
    def is_ready(self) -> bool:
        return self._ready and len(self._cache) > 0

_global_cache = ZaraAudioCache()
def get_cache() -> ZaraAudioCache:
    return _global_cache

"""
zara_cache.py — Pre-warmed Audio Cache for Instant Fillers
===========================================================
Pre-synthesises the 20 most common short phrases at agent startup.
These play from RAM in <100ms, masking LLM latency completely.

Usage:
    cache = ZaraAudioCache()
    await cache.prewarm(tts_instance, language_code)
    audio = cache.get("thinking", language_code)  # instant
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("zara-cache")

# Phrases to pre-synthesise per language
CACHE_PHRASES = {
    "te-IN": {
        "compliance":  "హాయ్... ఈ call quality కోసం record అవుతుందని చెప్పాలనుకున్నాను.",
        "thinking":    "Antey...",
        "thinking2":   "Okka nimishamanandi...",
        "checking":    "Okka nimishamanandi... system check chestunnanu andi.",
        "acknowledge": "Ardham aiindi andi...",
        "agree":       "Sarey andi...",
        "hold":        "Kasta hold lo untara andi... nenu ippude confirm chestanu.",
        "wait_thanks": "Wait chesanduku thanks andi!",
        "no_worry":    "Chintha cheyakandi andi... nenu unnanu.",
    },
    "hi-IN": {
        "compliance":  "Hi, just so you know — this call may be recorded for quality purposes.",
        "thinking":    "Ji... ek minute...",
        "thinking2":   "Dekhiye...",
        "checking":    "Ji... main abhi system mein dekh rahi hoon...",
        "acknowledge": "Ji, samajh gaya...",
        "agree":       "Ji bilkul.",
        "hold":        "Ji... ek minute hold kijiye... main check kar leti hoon.",
        "wait_thanks": "Wait karne ke liye shukriya ji!",
        "no_worry":    "Aap pareshan mat hoiye ji...",
    },
    "en-IN": {
        "compliance":  "Hi, just so you know — this call may be recorded for quality purposes.",
        "thinking":    "Right...",
        "thinking2":   "So...",
        "checking":    "One moment, checking now...",
        "acknowledge": "I see...",
        "agree":       "Absolutely.",
        "hold":        "Could you hold briefly? I'll check right away.",
        "wait_thanks": "Thank you for waiting!",
        "no_worry":    "Please don't worry...",
    }
}


class ZaraAudioCache:
    """
    Pre-warms short TTS phrases at startup so they play instantly
    without any API call during live conversations.
    """

    def __init__(self):
        self._cache: dict[str, bytes] = {}
        self._ready = False

    async def prewarm(self, tts_instance, language_code: str) -> None:
        """
        Pre-synthesise all cache phrases for the given language.
        Called during agent prewarm phase.
        """
        phrases = CACHE_PHRASES.get(language_code, CACHE_PHRASES["en-IN"])
        logger.info(f"Prewarming {len(phrases)} audio phrases for {language_code}...")

        tasks = []
        keys = []
        for key, text in phrases.items():
            cache_key = f"{language_code}_{key}"
            keys.append(cache_key)
            tasks.append(self._fetch_and_cache(tts_instance, cache_key, text))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        success = sum(1 for r in results if not isinstance(r, Exception))
        logger.info(f"Cache prewarm: {success}/{len(tasks)} phrases ready for {language_code}")
        self._ready = True

    async def _fetch_and_cache(
        self,
        tts_instance,
        cache_key: str,
        text: str
    ) -> None:
        """Fetch audio for a single phrase and store in cache."""
        try:
            audio_bytes = await tts_instance.fetch_audio(text)
            if audio_bytes:
                self._cache[cache_key] = audio_bytes
                logger.debug(f"Cached: {cache_key} ({len(audio_bytes)} bytes)")
        except Exception as e:
            logger.warning(f"Cache miss for {cache_key}: {e}")

    def get(self, key: str, language_code: str) -> Optional[bytes]:
        """
        Returns cached audio bytes for a phrase.
        Returns None if not in cache (caller should fall back to live TTS).
        """
        cache_key = f"{language_code}_{key}"
        audio = self._cache.get(cache_key)
        if audio:
            logger.debug(f"Cache HIT: {cache_key}")
        else:
            logger.debug(f"Cache MISS: {cache_key}")
        return audio

    def get_thinking_filler(self, language_code: str) -> Optional[bytes]:
        """Returns a random thinking filler from cache."""
        import random
        options = ["thinking", "thinking2"]
        key = random.choice(options)
        return self.get(key, language_code)

    def get_checking_phrase(self, language_code: str) -> Optional[bytes]:
        return self.get("checking", language_code)

    def get_hold_phrase(self, language_code: str) -> Optional[bytes]:
        return self.get("hold", language_code)

    def get_compliance_greeting(self, language_code: str) -> Optional[bytes]:
        """Returns pre-warmed compliance greeting for instant playback."""
        return self.get("compliance", language_code)

    @property
    def is_ready(self) -> bool:
        return self._ready and len(self._cache) > 0


# Global singleton — shared across all calls in the same process
_global_cache = ZaraAudioCache()

def get_cache() -> ZaraAudioCache:
    return _global_cache

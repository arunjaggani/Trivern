"""
zara_processor.py — Zara Response Refiner & Post-Processor v2.0
===============================================================
All fixes applied per Gemini code review:
  1. Variations moved to zara_phrases.json (stateless processor)
  2. Pause insertion fixed — dots appended to preceding word, no leading space
  3. apply_length_truncation() added — cost guardrail (MAX 250 chars)
  4. Native Telugu script support added
  5. Pipeline sequence preserved
"""

import json
import random
import re
import logging
from pathlib import Path

logger = logging.getLogger("zara-processor")

# ── Load phrase library ────────────────────────────────────────────────────────
_PHRASES_PATH = Path(__file__).parent / "zara_phrases.json"
_PHRASE_LIB: dict = {}

def _load_phrases():
    global _PHRASE_LIB
    if _PHRASES_PATH.exists():
        with open(_PHRASES_PATH, "r", encoding="utf-8") as f:
            _PHRASE_LIB = json.load(f)
        logger.info("ZaraProcessor: phrase library loaded.")
    else:
        logger.warning("ZaraProcessor: zara_phrases.json not found — using fallbacks.")

_load_phrases()


# ── Probability Engine ─────────────────────────────────────────────────────────

def pick_phrase(intent: str, language: str) -> str | None:
    """Weighted random phrase selection from JSON library."""
    try:
        options = _PHRASE_LIB["intents"][intent][language]
        texts = [o["text"] for o in options]
        weights = [o["weight"] for o in options]
        return random.choices(texts, weights=weights, k=1)[0]
    except (KeyError, IndexError):
        return None


def pick_thinking_filler(language: str) -> str:
    result = pick_phrase("latency_filler", language)
    fallbacks = {
        "te-IN": "అంటే...",
        "hi-IN": "Ji... ek minute...",
        "en-IN": "Right..."
    }
    return result or fallbacks.get(language, "One moment...")


def pick_tool_filler(language: str) -> str:
    result = pick_phrase("tool_call_start", language)
    fallbacks = {
        "te-IN": "ఒక్క నిమిషం andi... system check చేస్తున్నాను.",
        "hi-IN": "Ji... main abhi system mein dekh rahi hoon...",
        "en-IN": "One moment, checking the system..."
    }
    return result or fallbacks.get(language, "Checking now...")


def pick_agreement(language: str) -> str:
    result = pick_phrase("agreement_soft", language)
    fallbacks = {
        "te-IN": "సరే andi...",
        "hi-IN": "Ji bilkul.",
        "en-IN": "Absolutely."
    }
    return result or fallbacks.get(language, "Sure.")


# ── Cost Guardrail — Length Truncation ────────────────────────────────────────

def apply_length_truncation(text: str, max_chars: int = 250) -> str:
    """Limits output length but ensures no words are cut in half."""
    if not text or len(text) <= max_chars:
        return text

    truncated = text[:max_chars]
    # Try to find the last sentence boundary
    last_punct = max(
        truncated.rfind('.'),
        truncated.rfind('?'),
        truncated.rfind('!'),
        truncated.rfind('।'),   # Hindi/Telugu purna viram
    )

    if last_punct > 0:
        result = text[:last_punct + 1]
    else:
        # If no punctuation, cut at the last space to avoid cutting words
        last_space = truncated.rfind(' ')
        if last_space > 0:
            result = truncated[:last_space] + "..."
        else:
            result = truncated + "..."

    logger.warning(
        f"Cost Guardrail: truncated {len(text)} → {len(result)} chars"
    )
    return result


# ── Zero-Mix Policy Enforcement ───────────────────────────────────────────────

def enforce_zero_mix(text: str, language: str) -> str:
    """
    Removes cross-language contamination.
    Telugu output must not contain Hindi words.
    Hindi output must not contain Telugu words.
    """
    try:
        blacklist = _PHRASE_LIB.get("blacklist", {}).get(language, [])
    except Exception:
        blacklist = []

    if not blacklist:
        return text

    for word in blacklist:
        pattern = rf'\b{re.escape(word)}\b'
        if re.search(pattern, text, re.IGNORECASE):
            logger.warning(f"ZeroMix: removed '{word}' from {language} output")
            text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()

    # Clean up double spaces left by deletion
    text = re.sub(r' +', ' ', text).strip()
    return text


# ── Phonetic Elongation (Andhra Flow Hack) ────────────────────────────────────

def apply_phonetic_elongation(text: str, language: str) -> str:
    """
    NOTE: Only needed when text is in Latin transliteration.
    If LLM correctly outputs native Telugu script, this function
    is a no-op — native script carries correct vowel length naturally.
    Kept for fallback cases where LLM ignores script instruction.
    """
    if language not in ("te-IN",):
        return text

    # Only apply if text appears to be Latin transliteration (not native script)
    # Check if text contains Telugu Unicode characters
    has_native_script = any('\u0C00' <= c <= '\u0C7F' for c in text)
    if has_native_script:
        # Native script detected — no phonetic hacks needed
        return text

    # Fallback: Latin transliteration phonetic map
    try:
        phonetic_map = _PHRASE_LIB.get("phonetic_map", {})
    except Exception:
        phonetic_map = {}

    # Add hardcoded fallbacks
    fallback_map = {
        "Namaskaram": "Na-ma-skaa-raam",
        "Vastara": "Vas-thaa-raaa andi??",
        "Vastaru": "Vas-thaa-ru andi??",
    }
    phonetic_map = {**fallback_map, **phonetic_map}

    for word, replacement in phonetic_map.items():
        text = text.replace(word, replacement)

    return text


# ── Punctuation as Prosody ─────────────────────────────────────────────────────

def apply_prosody(text: str) -> str:
    """
    Converts punctuation to prosody markers Bulbul TTS responds to.
    - Single ? → ?? (rising pitch for questions)
    - Commas → ... (breathing pause)
    - Adds pause after acknowledgment phrases
    """
    # Single ? → ?? for rising intonation (Indian language questions)
    text = re.sub(r'\?(?!\?)', '??', text)

    # Comma → breathing pause
    text = re.sub(r',\s+', '... ', text)

    # Add natural pause after acknowledgment phrases
    ack_phrases = [
        "సరే andi", "అర్థమైంది", "Correct andi",
        "Ji bilkul", "Ji main samajh", "Samajh gaya",
        "Got it", "Right", "Okay"
    ]
    for phrase in ack_phrases:
        if phrase in text and f"{phrase}..." not in text:
            text = text.replace(phrase, f"{phrase}...", 1)

    return text


# ── Pronunciation Guardrails ───────────────────────────────────────────────────

def apply_pronunciation_guardrails(text: str) -> str:
    """
    Fixes English words that TTS mispronounces.
    Applied last, just before TTS.
    Only affects Latin-script English words.
    """
    guardrails = {
        "Schedule": "Shed-yool",
        "Brochure": "Bro-shur",
        "Strategy": "Strat-e-jee",
        "Appointment": "Up-point-ment",
    }
    for word, phonetic in guardrails.items():
        text = text.replace(word, phonetic)
    return text


# ── Phonetic Randomizer ────────────────────────────────────────────────────────

def apply_phonetic_randomizer(text: str, language: str) -> str:
    """
    Introduces micro-variations so Zara never sounds identical.

    FIX (per code review):
    - Variations loaded from zara_phrases.json (stateless, not hardcoded)
    - Pause insertion fixed: dots appended to word[insert_pos-1] directly
      so output is "word... word" not "word ... word"
    """
    # Load variations from JSON — stateless, editable without code changes
    try:
        variations = _PHRASE_LIB.get("randomizer_variations", {}).get(language, {})
    except Exception:
        variations = {}

    # Apply phrase variations (60% chance per match)
    for phrase, options in variations.items():
        if phrase in text and random.random() < 0.60:
            replacement = random.choice(options)
            text = text.replace(phrase, replacement, 1)

    # 10% chance to add micro-hesitation pause
    if random.random() < 0.10:
        words = text.split()
        if len(words) > 5:
            insert_pos = random.randint(2, min(4, len(words) - 1))
            # FIX: append dots to preceding word, not as separate item
            # Result: "word..." not "word ..."
            words[insert_pos - 1] = words[insert_pos - 1] + "..."
            text = " ".join(words)

    return text


# ── Sentiment Detection ────────────────────────────────────────────────────────

def detect_sentiment(text: str) -> str:
    """Returns: ANGER, RUSHED, JOY, NEUTRAL"""
    text_lower = text.lower()

    anger_keywords = [
        "worst", "terrible", "useless", "pathetic", "cheated", "fraud",
        "disgusting", "awful", "horrible", "nonsense", "bakwaas", "bekar"
    ]
    rushed_keywords = [
        "busy", "hurry", "quick", "fast", "later", "call back",
        "urgent", "emergency", "no time", "short", "brief"
    ]
    joy_keywords = [
        "great", "excellent", "perfect", "amazing", "wonderful",
        "happy", "love", "best", "fantastic", "awesome", "brilliant"
    ]

    for word in anger_keywords:
        if word in text_lower:
            return "ANGER"
    for word in rushed_keywords:
        if word in text_lower:
            return "RUSHED"
    for word in joy_keywords:
        if word in text_lower:
            return "JOY"
    return "NEUTRAL"


# ── Emergency Triage Detection ─────────────────────────────────────────────────

EMERGENCY_KEYWORDS = [
    "emergency", "heart attack", "accident", "unconscious", "bleeding",
    "stroke", "urgent", "critical", "ambulance", "breathing", "chest pain",
    "collapsed", "overdose"
]

def detect_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in EMERGENCY_KEYWORDS)


def get_emergency_response(language: str) -> str:
    responses = {
        "te-IN": "కంగారు పడకండి andi... నేను ఇప్పుడే emergency line కి connect చేస్తున్నాను. Please line లో ఉండండి!",
        "hi-IN": "Aap pareshan mat hoiye ji... main abhi emergency line se connect kar rahi hoon. Please line par rahiye!",
        "en-IN": "Please don't worry... I'm connecting you to the emergency line right now. Please stay on the line!"
    }
    return responses.get(language, responses["en-IN"])


# ── Industry Phrase Lookup ─────────────────────────────────────────────────────

def get_industry_phrase(industry: str, language: str, phase: str) -> str | None:
    try:
        return _PHRASE_LIB["industry_phrases"][industry][language][phase]
    except KeyError:
        return None


# ── Main Process Function ──────────────────────────────────────────────────────

def process_llm_output(
    text: str,
    language: str,
    caller_sentiment: str = "NEUTRAL",
    industry: str = "general",
) -> str:
    """
    Main entry point. Takes raw LLM output and returns
    refined, phonetically optimised text ready for TTS.

    Pipeline (order matters):
    1. Length truncation (cost guardrail — must be first)
    2. Zero-Mix enforcement (language purity)
    3. Phonetic elongation (Andhra flow — only for Latin fallback)
    4. Phonetic randomizer (variation — loaded from JSON)
    5. Prosody injection (pauses, pitch)
    6. Pronunciation guardrails (English words — must be last)
    """
    if not text or not text.strip():
        return text

    logger.debug(f"Processing: lang={language}, sentiment={caller_sentiment}, len={len(text)}")

    # Step 1: Cost guardrail — truncate before any processing
    text = apply_length_truncation(text)

    # Step 2: Zero-Mix Policy
    text = enforce_zero_mix(text, language)

    # Step 3: Phonetic elongation (Telugu only, Latin fallback)
    if language == "te-IN":
        text = apply_phonetic_elongation(text, language)

    # Step 4: Randomizer for variety (from JSON, stateless)
    text = apply_phonetic_randomizer(text, language)

    # Step 5: Prosody — pauses and pitch
    text = apply_prosody(text)

    # Step 6: Pronunciation guardrails (last — preserves English words)
    text = apply_pronunciation_guardrails(text)

    logger.debug(f"Processed: {text[:80]}...")
    return text

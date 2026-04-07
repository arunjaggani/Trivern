"""
Trivern Voice Agent — Tool Definitions
=======================================
Zara's tools call the Trivern Next.js API DIRECTLY (no n8n double-hop).
This eliminates latency and removes an extra failure point from every call.

API Base: TRIVERN_API_BASE env var (defaults to https://trivern.tech)
Auth:     x-agent-secret header using VOICE_AGENT_SECRET env var

Tools:
- get_available_slots: Fetch open calendar slots
- book_meeting:        Lock in a meeting slot
- save_lead:           Save/update lead in CRM
- save_conversation:   Store call transcript
"""

import os
import logging
from typing import Annotated

import aiohttp
from livekit.agents.llm import function_tool

logger = logging.getLogger("voice-tools")

# ── Config ────────────────────────────────────────────────────────────────────
API_BASE = os.getenv("TRIVERN_API_BASE", "https://trivern.tech").rstrip("/")
AGENT_SECRET = os.getenv("VOICE_AGENT_SECRET", "")

def _headers() -> dict:
    """Build auth headers for every API call."""
    h = {"Content-Type": "application/json"}
    if AGENT_SECRET:
        h["x-agent-secret"] = AGENT_SECRET
    return h


async def _post(path: str, payload: dict) -> dict:
    """Make an authenticated async POST to the Trivern API."""
    url = f"{API_BASE}{path}"
    logger.info(f"[TOOL POST] {url} | payload keys: {list(payload.keys())}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers=_headers(),
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                data = await resp.json()
                if resp.status != 200:
                    logger.error(f"[TOOL ERROR] {url} returned {resp.status}: {data}")
                    return {"success": False, "message": f"API error {resp.status}"}
                return data
    except asyncio.TimeoutError:
        logger.error(f"[TOOL TIMEOUT] {url}")
        return {"success": False, "message": "Request timed out"}
    except Exception as e:
        logger.error(f"[TOOL EXCEPTION] {url}: {e}")
        return {"success": False, "message": str(e)}


async def _get(path: str, params: dict | None = None) -> dict:
    """Make an authenticated async GET to the Trivern API."""
    url = f"{API_BASE}{path}"
    logger.info(f"[TOOL GET] {url} | params: {params}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                params=params or {},
                headers=_headers(),
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                data = await resp.json()
                if resp.status != 200:
                    logger.error(f"[TOOL ERROR] {url} returned {resp.status}: {data}")
                    return {"success": False, "message": f"API error {resp.status}"}
                return data
    except Exception as e:
        logger.error(f"[TOOL EXCEPTION] {url}: {e}")
        return {"success": False, "message": str(e)}


import asyncio  # noqa: E402 — needed above for TimeoutError reference


# ── Tool Definitions ──────────────────────────────────────────────────────────

@function_tool(description="Get available meeting slots for booking. Call this when the client agrees to schedule a Google Meet with Arun.")
async def get_available_slots(
    phone: Annotated[str, "Client WhatsApp phone number (with country code, no +)"],
) -> str:
    result = await _get("/api/n8n/available-slots", {"phone": phone, "priority": "auto"})
    if result.get("success") and result.get("slots"):
        slots = result["slots"][:2]  # Always offer exactly 2
        slot_text = " or ".join([s.get("formatted", s.get("start", "")) for s in slots])
        logger.info(f"[SLOTS] Returning 2 slots for {phone}: {slot_text}")
        return f"Available slots: {slot_text}"
    logger.warning(f"[SLOTS] No slots available for {phone}")
    return "No slots available right now. Suggest WhatsApp follow-up on their number."


@function_tool(description="Book a confirmed meeting after the client explicitly selects a slot. Creates a Google Calendar event with Meet link.")
async def book_meeting(
    phone: Annotated[str, "Client WhatsApp phone number"],
    slot_start: Annotated[str, "Selected slot as ISO 8601 datetime string (e.g. 2026-04-06T10:00:00+05:30)"],
    notes: Annotated[str, "One-line summary of their pain point and what they need (for Arun's prep)"],
) -> str:
    result = await _post("/api/n8n/book-meeting", {
        "phone": phone,
        "slotStart": slot_start,
        "duration": 20,
        "notes": notes,
    })
    if result.get("success"):
        logger.info(f"[BOOKING] Meeting booked for {phone}")
        return result.get("confirmationText", "Meeting booked successfully.")
    logger.error(f"[BOOKING] Failed for {phone}: {result}")
    return "Booking failed. Our team will connect with you directly on WhatsApp to finalize a time."


@function_tool(description="Save or update lead information in the CRM. Call silently whenever you have collected name, phone, business, and their pain point.")
async def save_lead(
    name: Annotated[str, "Client's full name"],
    phone: Annotated[str, "Client's WhatsApp phone number"],
    company: Annotated[str, "Business or company name"],
    service: Annotated[str, "Service they are looking for"],
    context: Annotated[str, "Their pain point, situation, or key challenge in 1-2 sentences"],
    urgency: Annotated[str, "Lead urgency level: LOW, MEDIUM, HIGH, or CRITICAL"],
    business_type: Annotated[str, "Type of business: clinic, coach, consultant, restaurant, real estate, etc."],
    decision_role: Annotated[str, "Their role in the company: founder, owner, employee, or assistant"],
) -> str:
    result = await _post("/api/n8n/save-lead", {
        "name": name,
        "phone": phone,
        "company": company,
        "service": service,
        "context": context,
        "urgency": urgency,
        "businessType": business_type,
        "decisionRole": decision_role,
        "source": "Voice",
        "channel": "VOICE",
    })
    if result.get("success"):
        tier = result.get("tier", "")
        score = result.get("score", 0)
        logger.info(f"[LEAD] Saved {name} ({phone}) | Score: {score} | Tier: {tier}")
        return f"Lead saved. Score: {score}/100, Tier: {tier}."
    logger.error(f"[LEAD] Save failed: {result}")
    return "Lead saved in local session."


@function_tool(description="Save the voice call conversation transcript to the CRM. Call at the end of the call or every 5 exchanges.")
async def save_conversation(
    phone: Annotated[str, "Client's WhatsApp phone number"],
    summary: Annotated[str, "Brief summary of the full conversation — what was discussed and what was agreed"],
) -> str:
    result = await _post("/api/n8n/save-conversation", {
        "phone": phone,
        "messages": [],  # Transcript is saved by agent.py separately
        "summary": summary,
        "source": "voice",
    })
    if result.get("success"):
        logger.info(f"[CONVERSATION] Saved for {phone}")
        return "Conversation saved."
    logger.warning(f"[CONVERSATION] Save failed: {result}")
    return "Conversation save failed silently."


def create_tools() -> list:
    """Register all voice agent tools."""
    return [
        get_available_slots,
        book_meeting,
        save_lead,
        save_conversation,
    ]

"""
Trivern Voice Agent — Tool Definitions
=======================================
GPT-4o Mini function-calling tools that the voice agent uses
during conversation. Each tool calls an N8N webhook, which
then hits the client's Next.js API.

Tools:
- get_available_slots: Fetch open calendar slots
- book_meeting: Lock in a meeting slot
- save_lead: Save/update lead in CRM
- save_conversation: Store call transcript
"""

import os
import logging
from typing import Annotated

import aiohttp
from livekit.agents.llm import function_tool, ToolContext

logger = logging.getLogger("voice-tools")


def _n8n_url(webhook_path: str) -> str:
    """Build full N8N webhook URL from base + path."""
    base = os.getenv("N8N_BASE_URL", "http://172.17.0.1:5678")
    path = os.getenv(webhook_path, "")
    return f"{base}{path}"


async def _call_n8n(webhook_env_key: str, payload: dict) -> dict:
    """Make an async POST to an N8N webhook and return the JSON response."""
    url = _n8n_url(webhook_env_key)
    logger.info(f"Calling N8N: {url}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    text = await resp.text()
                    logger.error(f"N8N returned {resp.status}: {text}")
                    return {"success": False, "message": f"N8N error: {resp.status}"}
    except Exception as e:
        logger.error(f"N8N call failed: {e}")
        return {"success": False, "message": str(e)}


@function_tool(description="Get available meeting slots for booking. Call this when the client agrees to schedule a meeting.")
async def get_available_slots(
    phone: Annotated[str, "Client phone number"],
) -> str:
    result = await _call_n8n("N8N_WEBHOOK_GET_SLOTS", {"phone": phone})
    if result.get("success") and result.get("slots"):
        slots = result["slots"][:2]  # Always offer exactly 2
        slot_text = " or ".join([s.get("formatted", s.get("start", "")) for s in slots])
        return f"Available slots: {slot_text}"
    return "No slots available right now. Suggest WhatsApp follow-up."


@function_tool(description="Book a meeting after the client selects a slot. Returns confirmation with meet link.")
async def book_meeting(
    phone: Annotated[str, "Client phone number"],
    slot_start: Annotated[str, "Selected slot ISO datetime"],
    notes: Annotated[str, "One-line summary of their situation"],
) -> str:
    result = await _call_n8n("N8N_WEBHOOK_BOOK_MEETING", {
        "phone": phone,
        "slotStart": slot_start,
        "duration": 20,
        "notes": notes,
    })
    if result.get("success"):
        return result.get("confirmationText", "Meeting booked successfully.")
    return "Booking failed. Suggest trying again or WhatsApp follow-up."


@function_tool(description="Save or update lead information in CRM. Call silently when you have name, phone, business, and pain point.")
async def save_lead(
    name: Annotated[str, "Client name"],
    phone: Annotated[str, "Client phone number"],
    company: Annotated[str, "Business/company name"],
    service: Annotated[str, "Service they need"],
    context: Annotated[str, "Their pain point or situation"],
    urgency: Annotated[str, "LOW, MEDIUM, HIGH, or CRITICAL"],
    business_type: Annotated[str, "Type: clinic, coach, consultant, etc."],
    decision_role: Annotated[str, "Role: founder, owner, employee, assistant"],
) -> str:
    result = await _call_n8n("N8N_WEBHOOK_SAVE_LEAD", {
        "name": name,
        "phone": phone,
        "company": company,
        "service": service,
        "context": context,
        "urgency": urgency,
        "businessType": business_type,
        "decisionRole": decision_role,
    })
    return "Lead saved." if result.get("success") else "Lead save failed."


@function_tool(description="Save the conversation transcript. Call every 5 exchanges or at the end of the call.")
async def save_conversation(
    phone: Annotated[str, "Client phone number"],
    summary: Annotated[str, "Brief summary of the conversation"],
) -> str:
    result = await _call_n8n("N8N_WEBHOOK_CALL_COMPLETE", {
        "phone": phone,
        "summary": summary,
        "source": "voice",
    })
    return "Conversation saved." if result.get("success") else "Save failed."


def create_tools() -> list:
    """Register all voice agent tools for GPT-4o Mini function calling."""
    return [
        get_available_slots,
        book_meeting,
        save_lead,
        save_conversation
    ]

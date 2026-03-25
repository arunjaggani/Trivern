"""
Trivern Voice Agent — Outbound Call Trigger (Production)
=========================================================
FastAPI server that receives POST /api/call from N8N
and creates an outbound SIP call via LiveKit.

N8N sends: { phone, name, language }
This service: creates a LiveKit room → dials out via SIP → agent connects.

Key feature: Self-healing SIP trunk management — auto-registers the
Vobiz outbound trunk if it doesn't exist (e.g. after Redis wipe).
"""

import logging
import os
import json
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from livekit import api as livekit_api
from livekit.protocol.sip import (
    CreateSIPOutboundTrunkRequest,
    CreateSIPParticipantRequest,
    ListSIPOutboundTrunkRequest,
    SIPOutboundTrunkInfo,
)
import uvicorn

load_dotenv()

# ─── Logging ──────────────────────────────────────────────
logger = logging.getLogger("outbound")
logger.setLevel(logging.INFO)
_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter(
    "%(asctime)s %(levelname)s %(name)s %(message)s"
))
logger.addHandler(_handler)

app = FastAPI(title="Voice Agent — Outbound Trigger")

# ─── Module-level SIP trunk cache ────────────────────────
# Persists for the container's lifetime. Reset on error so
# the next call attempt retries fresh.
_cached_trunk_id: str | None = None


class CallRequest(BaseModel):
    phone: str        # e.g. "+919876543210" or "919876543210"
    name: str         # Caller's name from form
    language: str = "en-IN"  # Detected by N8N from city field


def normalize_phone(phone: str) -> str:
    """Normalize to +91XXXXXXXXXX (E.164 with plus sign, required by Vobiz)."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        if phone.startswith("91") and len(phone) >= 12:
            phone = "+" + phone
        else:
            phone = "+91" + phone.lstrip("0")
    return phone


async def _ensure_trunk(lk) -> str:
    """
    Ensure a Vobiz outbound SIP trunk exists on the LiveKit server.

    - Returns cached trunk ID if available (fast path)
    - Lists existing trunks and picks the first one if any exist
    - If none exist (e.g. Redis was wiped), auto-creates one from .env
    - Caches the result for the container's lifetime
    """
    global _cached_trunk_id

    if _cached_trunk_id:
        logger.info(f"Using cached trunk: {_cached_trunk_id}")
        return _cached_trunk_id

    # Try listing existing outbound trunks
    logger.info("Searching for existing outbound SIP trunk...")
    trunks = await lk.sip.list_sip_outbound_trunk(
        ListSIPOutboundTrunkRequest()
    )

    if trunks.items:
        _cached_trunk_id = trunks.items[0].sip_trunk_id
        logger.info(
            f"Found trunk: {_cached_trunk_id} "
            f"(name={trunks.items[0].name})"
        )
        return _cached_trunk_id

    # No trunk exists — auto-register from .env credentials
    logger.info("No trunk found. Auto-registering from .env...")

    vobiz_host = os.getenv("VOBIZ_SIP_HOST", "sip.vobiz.ai")
    vobiz_user = os.getenv("VOBIZ_SIP_USERNAME", "")
    vobiz_pass = os.getenv("VOBIZ_SIP_PASSWORD", "")
    vobiz_did = os.getenv("VOBIZ_DID_NUMBER", "")

    if not all([vobiz_user, vobiz_pass, vobiz_did]):
        raise ValueError(
            "Cannot auto-register trunk: VOBIZ_SIP_USERNAME, "
            "VOBIZ_SIP_PASSWORD, and VOBIZ_DID_NUMBER must be in .env"
        )

    result = await lk.sip.create_sip_outbound_trunk(
        CreateSIPOutboundTrunkRequest(
            trunk=SIPOutboundTrunkInfo(
                name="Vobiz Outbound",
                address=vobiz_host,
                numbers=[vobiz_did],
                auth_username=vobiz_user,
                auth_password=vobiz_pass,
            )
        )
    )

    _cached_trunk_id = result.sip_trunk_id
    logger.info(f"Registered new trunk: {_cached_trunk_id}")
    return _cached_trunk_id


@app.post("/api/call")
async def trigger_outbound_call(req: CallRequest):
    """
    Trigger an outbound SIP call via Vobiz.

    1. Normalize phone to +91XXXXXXXXXX
    2. Create a LiveKit room with metadata
    3. Ensure Vobiz SIP trunk exists (auto-register if needed)
    4. Create SIP participant (dials the phone)
    5. agent.py auto-connects to handle the call
    """
    global _cached_trunk_id

    try:
        phone = normalize_phone(req.phone)
        room_name = (
            f"outbound-{phone.replace('+', '')}-{int(time.time())}"
        )

        logger.info(
            f"Call request: {phone} ({req.name}), lang={req.language}"
        )

        lk = livekit_api.LiveKitAPI(
            url=os.getenv("LIVEKIT_URL", "ws://livekit:7880"),
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
        )

        try:
            # Step 1: Create room with metadata for the agent
            await lk.room.create_room(
                livekit_api.CreateRoomRequest(
                    name=room_name,
                    metadata=json.dumps({
                        "name": req.name,
                        "language": req.language,
                        "phone": phone,
                        "type": "outbound",
                    }),
                )
            )
            logger.info(f"Room created: {room_name}")

            # Step 2: Get or create the Vobiz SIP trunk
            sip_trunk_id = await _ensure_trunk(lk)

            # Step 3: Dial the phone via Vobiz
            logger.info(f"Dialing {phone} via trunk {sip_trunk_id}")
            await lk.sip.create_sip_participant(
                CreateSIPParticipantRequest(
                    sip_trunk_id=sip_trunk_id,
                    sip_call_to=phone,
                    room_name=room_name,
                    participant_identity=f"caller-{phone}",
                    participant_name=req.name,
                    krisp_enabled=True,
                )
            )
            logger.info(f"Call initiated to {phone}")

            return {
                "success": True,
                "message": f"Outbound call triggered to {phone}",
                "room": room_name,
                "trunk_id": sip_trunk_id,
            }

        finally:
            await lk.aclose()

    except Exception as e:
        logger.error(f"Outbound call failed: {e}")
        _cached_trunk_id = None  # Reset cache so next attempt retries
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voice-agent-outbound"}


if __name__ == "__main__":
    port = int(os.getenv("OUTBOUND_PORT", "8089"))
    uvicorn.run(app, host="0.0.0.0", port=port)

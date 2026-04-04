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
    CreateSIPParticipantRequest,
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


class CallRequest(BaseModel):
    phone: str
    name: str
    language: str = "en-IN"
    pronoun: str = ""
    city: str = ""
    business: str = ""
    primary_goal: str = ""
    situation: str = ""
    whatsapp_number: str = ""


def normalize_phone(phone: str) -> str:
    """Normalize to +91XXXXXXXXXX (E.164 with plus sign, required by Vobiz)."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        if phone.startswith("91") and len(phone) >= 12:
            phone = "+" + phone
        else:
            phone = "+91" + phone.lstrip("0")
    return phone




@app.post("/api/call")
async def trigger_outbound_call(req: CallRequest):
    """
    Trigger an outbound SIP call via Vobiz.

    1. Normalize phone to +91XXXXXXXXXX
    2. Create a LiveKit room with metadata
    3. Read LIVEKIT_SIP_TRUNK_ID from environment
    4. Create SIP participant (dials the phone)
    5. agent.py auto-connects to handle the call
    """

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
                        "pronoun": req.pronoun,
                        "city": req.city,
                        "business": req.business,
                        "primary_goal": req.primary_goal,
                        "situation": req.situation,
                        "whatsapp_number": req.whatsapp_number,
                    }),
                )
            )
            logger.info(f"Room created: {room_name}")

            # Step 2: Ensure we have the Trunk ID from env
            sip_trunk_id = os.getenv("LIVEKIT_SIP_TRUNK_ID")
            if not sip_trunk_id:
                raise ValueError("LIVEKIT_SIP_TRUNK_ID is missing from the environment variables.")

            # Step 3: Dial the phone via Vobiz
            logger.info(f"Dialing {phone} via trunk {sip_trunk_id}")
            
            # Use dictionary unpacking to safely inject `wait_until_answered`
            # if supported by the installed livekit-api protobuf schema.
            # This prevents the AI agent from speaking while the phone is ringing.
            request_args = {
                "sip_trunk_id": sip_trunk_id,
                "sip_call_to": phone,
                "room_name": room_name,
                "participant_identity": f"caller-{phone}",
                "participant_name": req.name,
                "krisp_enabled": True,
            }
            
            import inspect
            if "wait_until_answered" in inspect.signature(CreateSIPParticipantRequest).parameters:
                request_args["wait_until_answered"] = True

            await lk.sip.create_sip_participant(
                CreateSIPParticipantRequest(**request_args)
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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voice-agent-outbound"}


if __name__ == "__main__":
    port = int(os.getenv("OUTBOUND_PORT", "8089"))
    uvicorn.run(app, host="0.0.0.0", port=port)

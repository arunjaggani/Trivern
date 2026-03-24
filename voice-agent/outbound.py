"""
Trivern Voice Agent — Outbound Call Trigger
============================================
FastAPI server that receives POST /api/call from N8N
and creates an outbound SIP call via LiveKit.

N8N sends: { phone, name, language }
This service: creates a LiveKit room → dials out via SIP → agent connects.
"""

import logging
import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from livekit import api as livekit_api
import uvicorn

load_dotenv()

logger = logging.getLogger("outbound")
logger.setLevel(logging.INFO)

app = FastAPI(title="Voice Agent — Outbound Trigger")


class CallRequest(BaseModel):
    phone: str        # e.g. "+919876543210" or "919876543210"
    name: str         # Caller's name from the form
    language: str = "en-IN"  # Detected by N8N from city field


def normalize_phone(phone: str) -> str:
    """Ensure phone is in +91XXXXXXXXXX format for SIP dialing."""
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
    Trigger an outbound SIP call to the given phone number.
    
    Flow:
    1. Create a new LiveKit room with metadata (name, language)
    2. Create a SIP participant in that room (dials the phone via Vobiz)
    3. The agent.py entrypoint auto-connects to handle the call
    """
    try:
        phone = normalize_phone(req.phone).replace('+', '')
        room_name = f"outbound-{phone}-{int(__import__('time').time())}"

        logger.info(f"Triggering outbound call: {phone} ({req.name}), lang={req.language}")

        # LiveKit API client
        lk = livekit_api.LiveKitAPI(
            url=os.getenv("LIVEKIT_URL", "ws://livekit:7880"),
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
        )

        # Step 1: Create room with metadata
        room_metadata = json.dumps({
            "name": req.name,
            "language": req.language,
            "phone": phone,
            "type": "outbound",
        })

        await lk.room.create_room(
            livekit_api.CreateRoomRequest(
                name=room_name,
                metadata=room_metadata,
            )
        )
        logger.info(f"Room created: {room_name}")

        # Step 2: Create outbound SIP participant (dials the phone)
        sip_trunk_id = os.getenv("SIP_TRUNK_ID", "")

        await lk.sip.create_sip_participant(
            livekit_api.CreateSIPParticipantRequest(
                sip_trunk_id=sip_trunk_id,
                sip_call_to=phone,
                room_name=room_name,
                participant_identity=f"caller-{phone}",
                participant_name=req.name,
            )
        )
        logger.info(f"SIP outbound call initiated to {phone}")

        return {
            "success": True,
            "message": f"Outbound call triggered to {phone}",
            "room": room_name,
        }

    except Exception as e:
        logger.error(f"Outbound call failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voice-agent-outbound"}


if __name__ == "__main__":
    port = int(os.getenv("OUTBOUND_PORT", "8089"))
    uvicorn.run(app, host="0.0.0.0", port=port)

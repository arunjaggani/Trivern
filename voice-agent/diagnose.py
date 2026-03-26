#!/usr/bin/env python3
"""
Trivern Voice Agent — SIP Trunk Diagnostic & Reset
====================================================
Run INSIDE the outbound-api container to inspect and fix SIP trunks.

Usage (from VPS):
  docker compose exec outbound-api python diagnose.py
"""
import asyncio
import os
import subprocess

from dotenv import load_dotenv
from livekit import api
from livekit.protocol.sip import (
    CreateSIPOutboundTrunkRequest,
    DeleteSIPTrunkRequest,
    ListSIPOutboundTrunkRequest,
    SIPOutboundTrunkInfo,
)

load_dotenv()

SEP = "=" * 55


async def main():
    lk = api.LiveKitAPI(
        url=os.getenv("LIVEKIT_URL", "ws://livekit:7880"),
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
    )

    # ─── Step 1: Show .env values ──────────────────────────
    vobiz_host = os.getenv("VOBIZ_SIP_HOST", "sip.vobiz.ai")
    vobiz_user = os.getenv("VOBIZ_SIP_USERNAME", "")
    vobiz_pass = os.getenv("VOBIZ_SIP_PASSWORD", "")
    vobiz_did  = os.getenv("VOBIZ_DID_NUMBER", "")
    env_trunk  = os.getenv("VOBIZ_SIP_TRUNK_ID", "").strip('"')

    print(f"\n{SEP}")
    print("  .env Vobiz credentials")
    print(SEP)
    print(f"  Host:       {vobiz_host}")
    print(f"  Username:   {vobiz_user}")
    print(f"  Password:   {vobiz_pass[:3]}{'*' * (len(vobiz_pass)-3) if len(vobiz_pass) > 3 else ''}")
    print(f"  DID:        {vobiz_did}")
    print(f"  Trunk ID:   {env_trunk or '(not set)'}")

    # ─── Step 2: List all existing trunks ──────────────────
    trunks = await lk.sip.list_sip_outbound_trunk(
        ListSIPOutboundTrunkRequest()
    )

    print(f"\n{SEP}")
    print(f"  Found {len(trunks.items)} outbound trunk(s) in LiveKit DB")
    print(SEP)

    for t in trunks.items:
        print(f"\n  Trunk ID:   {t.sip_trunk_id}")
        print(f"  Name:       {t.name or '(empty)'}")
        print(f"  Address:    {t.address}")
        print(f"  Numbers:    {list(t.numbers)}")
        print(f"  Username:   {t.auth_username}")
        pw = t.auth_password
        print(f"  Password:   {pw[:3]}{'*'*(len(pw)-3) if len(pw)>3 else '' if pw else '(empty)'}")

        # Check if credentials match .env
        match = (
            t.address == vobiz_host
            and t.auth_username == vobiz_user
            and t.auth_password == vobiz_pass
        )
        print(f"  Matches .env: {'YES ✓' if match else 'NO ✗ ← MISMATCH!'}")

    # ─── Step 3: Delete all and recreate ───────────────────
    print(f"\n{SEP}")
    print("  Cleaning up: deleting ALL trunks...")
    print(SEP)

    for t in trunks.items:
        try:
            await lk.sip.delete_sip_trunk(
                DeleteSIPTrunkRequest(sip_trunk_id=t.sip_trunk_id)
            )
            print(f"  Deleted: {t.sip_trunk_id}")
        except Exception as e:
            print(f"  Failed to delete {t.sip_trunk_id}: {e}")

    print(f"\n{SEP}")
    print("  Creating fresh trunk from .env credentials...")
    print(SEP)

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

    new_id = result.sip_trunk_id
    print(f"  New trunk ID:  {new_id}")
    print(f"  Address:       {result.address}")
    print(f"  Username:      {result.auth_username}")
    print(f"  Numbers:       {list(result.numbers)}")

    print(f"\n{SEP}")
    print(f"  ACTION REQUIRED:")
    print(f"  Update .env → VOBIZ_SIP_TRUNK_ID=\"{new_id}\"")
    print(f"  Then restart: docker compose restart outbound-api")
    print(f"{SEP}\n")

    await lk.aclose()


asyncio.run(main())

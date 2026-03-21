# Trivern Voice Agent — Setup Guide

A standalone, reusable AI voice agent that handles both **inbound** and **outbound** phone calls. Qualifies leads, books meetings, and sends WhatsApp confirmations — fully autonomous.

## Quick Start (For Any Client)

1. Copy this entire `voice-agent/` folder into the client's project
2. `cp .env.example .env` and fill in all values
3. Replace `system_prompt.md` with the client's AI personality
4. Import `n8n-workflow-template.json` into their N8N instance
5. Run `docker-compose up -d`

## Prerequisites

- **Docker** & **Docker Compose** installed
- **Vobiz account** with an active DID number
- **Sarvam AI** API key (from [sarvam.ai](https://sarvam.ai))
- **OpenAI** API key
- **N8N** running (locally or on VPS)
- **LiveKit API keys** (generate with `docker run --rm livekit/generate`)

## Setup Steps

### 1. Generate LiveKit API Keys

```bash
docker run --rm livekit/generate
```

Copy the key pair into:
- `.env` → `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- `livekit.yaml` → replace the placeholder under `keys:`

### 2. Configure Vobiz SIP Trunk

1. Log into [vobiz.ai](https://vobiz.ai)
2. Purchase a DID number for your region
3. Create a SIP trunk pointing to your VPS IP on port 5060
4. Note your SIP credentials → add to `.env`

### 3. Configure LiveKit SIP Trunk

After LiveKit is running, create the SIP trunk via API:

```bash
# Create inbound trunk (Vobiz → LiveKit)
curl -X POST http://localhost:7880/twirp/livekit.SIP/CreateSIPInboundTrunk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trunk": {
      "name": "Vobiz Inbound",
      "numbers": ["+91YOUR_DID_NUMBER"],
      "allowed_addresses": ["sip.vobiz.ai"]
    }
  }'

# Create outbound trunk (LiveKit → Vobiz)
curl -X POST http://localhost:7880/twirp/livekit.SIP/CreateSIPOutboundTrunk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trunk": {
      "name": "Vobiz Outbound",
      "address": "sip.vobiz.ai",
      "numbers": ["+91YOUR_DID_NUMBER"],
      "auth_username": "YOUR_VOBIZ_USERNAME",
      "auth_password": "YOUR_VOBIZ_PASSWORD"
    }
  }'

# Create dispatch rule (route calls to agent)
curl -X POST http://localhost:7880/twirp/livekit.SIP/CreateSIPDispatchRule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule": {
      "dispatch_rule_individual": {
        "room_prefix": "inbound-"
      }
    }
  }'
```

### 4. Start Everything

```bash
docker-compose up -d
```

### 5. Test

- **Inbound:** Call your Vobiz DID number → agent should answer
- **Outbound:** `curl -X POST http://localhost:8089/api/call -H "Content-Type: application/json" -d '{"phone":"919876543210","name":"Test","language":"en-IN"}'`

## Architecture

```
Phone (Vobiz) ↔ SIP ↔ LiveKit ↔ Voice Agent (Python)
                                    ↕
                              N8N Webhooks
                                    ↕
                        Client's Next.js Backend
```

## Files

| File | Purpose |
|------|---------|
| `agent.py` | Main LiveKit agent — STT→LLM→TTS pipeline |
| `outbound.py` | FastAPI endpoint for outbound call triggering |
| `tools.py` | GPT-4o Mini function-calling tools (via N8N) |
| `call_logger.py` | Transcript + metadata logger |
| `system_prompt.md` | AI personality (swap per client) |
| `docker-compose.yml` | LiveKit + SIP + Redis + Agent |
| `livekit.yaml` | LiveKit server configuration |

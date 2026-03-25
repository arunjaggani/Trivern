#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# Trivern Voice Agent — Production Deployment Script
# ══════════════════════════════════════════════════════════
# Run this on the VPS after pushing code changes.
# It safely rebuilds only the agent + outbound containers
# without touching LiveKit, Redis, or SIP bridge state.
# ══════════════════════════════════════════════════════════
set -e

cd /var/www/trivern/voice-agent

echo ""
echo "══════════════════════════════════════════════════"
echo " Trivern Voice Agent — Deploying..."
echo "══════════════════════════════════════════════════"
echo ""

echo "→ Step 1/4: Pulling latest code from GitHub..."
git pull

echo ""
echo "→ Step 2/4: Rebuilding agent + outbound-api containers..."
docker compose build --no-cache agent outbound-api

echo ""
echo "→ Step 3/4: Restarting agent + outbound-api..."
docker compose up -d --force-recreate agent outbound-api

echo ""
echo "→ Step 4/4: Verifying all containers are running..."
sleep 3
docker compose ps

echo ""
echo "══════════════════════════════════════════════════"
echo " Deployment complete!"
echo ""
echo " Next: Trigger the N8N webhook to test."
echo " Logs: docker compose logs -f agent outbound-api"
echo "══════════════════════════════════════════════════"

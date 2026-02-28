#!/bin/bash
# ═══════════════════════════════════════════════════════
# Trivern Deploy Script — Run after git push to update
# Usage: bash deploy/deploy.sh
# ═══════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/trivern"

echo "▸ Deploying Trivern..."

cd ${APP_DIR}

# Pull latest code
echo "  → Pulling latest code..."
git pull origin main

# Install dependencies
echo "  → Installing dependencies..."
npm install --production=false

# Generate Prisma client
echo "  → Generating Prisma client..."
npx prisma generate

# Run migrations
echo "  → Pushing schema changes..."
npx prisma db push --accept-data-loss

# Build Next.js
echo "  → Building app..."
npm run build

# Restart PM2
echo "  → Restarting app..."
pm2 restart trivern

echo ""
echo "✅ Deploy complete!"
echo "   App: https://$(grep NEXTAUTH_URL .env | cut -d'"' -f2 | sed 's|https://||')"
echo ""

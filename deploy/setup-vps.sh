#!/bin/bash
# ═══════════════════════════════════════════════════════
# Trivern VPS Setup — Hostinger Ubuntu VPS
# Run this ONCE on a fresh VPS to install everything
# Usage: sudo bash setup-vps.sh trivern.com
# ═══════════════════════════════════════════════════════

set -e

DOMAIN=${1:-"trivern.com"}
N8N_DOMAIN="n8n.${DOMAIN}"
APP_DIR="/var/www/trivern"
N8N_DIR="/var/lib/n8n"
LOG_DIR="/var/log/trivern"
N8N_LOG_DIR="/var/log/n8n"

echo "═══════════════════════════════════════════════════"
echo "  Trivern VPS Setup — ${DOMAIN}"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── Step 1: System Update ───────────────────────────
echo "▸ [1/8] Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# ─── Step 2: Node.js 20 LTS ─────────────────────────
echo "▸ [2/8] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "  Node.js $(node -v) installed"

# ─── Step 3: PM2 (Process Manager) ──────────────────
echo "▸ [3/8] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo "  PM2 installed"

# ─── Step 4: MySQL ──────────────────────────────────
echo "▸ [4/8] Installing MySQL..."
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl enable mysql
    systemctl start mysql
fi

# Create database and user
echo "  Creating database..."
mysql -e "CREATE DATABASE IF NOT EXISTS trivern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
MYSQL_PASSWORD=$(openssl rand -base64 24)
mysql -e "CREATE USER IF NOT EXISTS 'trivern_user'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON trivern_db.* TO 'trivern_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo ""
echo "  ┌──────────────────────────────────────────────┐"
echo "  │ MySQL credentials (SAVE THESE!):             │"
echo "  │ User:     trivern_user                       │"
echo "  │ Password: ${MYSQL_PASSWORD}                  │"
echo "  │ Database: trivern_db                         │"
echo "  └──────────────────────────────────────────────┘"
echo ""

# ─── Step 5: n8n (Workflow Engine) ──────────────────
echo "▸ [5/8] Installing n8n..."
npm install -g n8n

# Create n8n directories
mkdir -p ${N8N_DIR} ${N8N_LOG_DIR}
chown -R www-data:www-data ${N8N_DIR} ${N8N_LOG_DIR}

# Install n8n systemd service
cp ${APP_DIR}/deploy/n8n.service /etc/systemd/system/n8n.service
systemctl daemon-reload
systemctl enable n8n
echo "  n8n installed (start after config)"

# ─── Step 6: App Directory ──────────────────────────
echo "▸ [6/8] Setting up app directory..."
mkdir -p ${APP_DIR} ${LOG_DIR}

echo ""
echo "  Clone your repo into ${APP_DIR}:"
echo "  git clone https://github.com/YOUR_USERNAME/Trivern.git ${APP_DIR}"
echo ""

# ─── Step 7: Nginx ──────────────────────────────────
echo "▸ [7/8] Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Copy Trivern nginx config
cp ${APP_DIR}/deploy/nginx/trivern.conf /etc/nginx/sites-available/trivern.conf
cp ${APP_DIR}/deploy/nginx/n8n.conf /etc/nginx/sites-available/n8n.conf

# Replace domain placeholders
sed -i "s/trivern.com/${DOMAIN}/g" /etc/nginx/sites-available/trivern.conf
sed -i "s/n8n.trivern.com/${N8N_DOMAIN}/g" /etc/nginx/sites-available/n8n.conf

# Enable sites
ln -sf /etc/nginx/sites-available/trivern.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/n8n.conf /etc/nginx/sites-enabled/

# Comment out SSL lines for initial HTTP-only start (Certbot adds them)
sed -i 's/^\(\s*listen 443\)/#\1/' /etc/nginx/sites-available/trivern.conf
sed -i 's/^\(\s*listen 443\)/#\1/' /etc/nginx/sites-available/n8n.conf

# Test and reload
nginx -t && systemctl reload nginx
echo "  Nginx configured"

# ─── Step 8: Firewall ──────────────────────────────
echo "▸ [8/8] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "  Firewall enabled (SSH + HTTP/HTTPS only)"

# ─── Done! ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ VPS Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Clone your repo:"
echo "     git clone https://github.com/YOUR_USERNAME/Trivern.git ${APP_DIR}"
echo ""
echo "  2. Copy and edit the .env file:"
echo "     cp ${APP_DIR}/deploy/.env.production ${APP_DIR}/.env"
echo "     nano ${APP_DIR}/.env"
echo "     → Set DATABASE_URL with the MySQL password above"
echo "     → Set NEXTAUTH_SECRET (run: openssl rand -base64 32)"
echo "     → Set Google Calendar/Sheets credentials"
echo ""
echo "  3. Install, build, and start the app:"
echo "     cd ${APP_DIR}"
echo "     npm install"
echo "     npx prisma generate"
echo "     npx prisma db push"
echo "     npm run build"
echo "     pm2 start deploy/ecosystem.config.js"
echo "     pm2 save"
echo ""
echo "  4. Start n8n:"
echo "     → First edit /etc/systemd/system/n8n.service"
echo "     → Change N8N_BASIC_AUTH_PASSWORD"
echo "     sudo systemctl start n8n"
echo ""
echo "  5. Get SSL certificates:"
echo "     sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "     sudo certbot --nginx -d ${N8N_DOMAIN}"
echo ""
echo "  6. Import n8n workflow:"
echo "     → Open https://${N8N_DOMAIN}"
echo "     → Import ${APP_DIR}/n8n/trivern-workflow-v3.json"
echo "     → Verify credentials"
echo "     → Activate"
echo ""
echo "  MySQL password: ${MYSQL_PASSWORD}"
echo ""
echo "═══════════════════════════════════════════════════"

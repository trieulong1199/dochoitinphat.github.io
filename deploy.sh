#!/bin/bash
# ================================================================
# deploy.sh — Cài đặt Wholesale Portal trên VPS lần đầu
# Chạy: bash deploy.sh
# ================================================================
set -e

APP_DIR="/var/www/wholesale"
APP_PORT=3001
DOMAIN="daily.dochoitinphat.com"
NODE_VERSION="20"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[X]${NC} $1"; exit 1; }

echo ""
echo "=================================================="
echo "  Wholesale Portal — Deploy Script"
echo "  Domain: $DOMAIN  |  Port: $APP_PORT"
echo "=================================================="
echo ""

# ── 1. Cập nhật hệ thống ──────────────────────────────────────
log "Cập nhật package list..."
apt-get update -qq

# ── 2. Cài Node.js ────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  log "Cài Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
else
  log "Node.js $(node -v) đã có sẵn"
fi

# ── 3. Cài PM2 ────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Cài PM2..."
  npm install -g pm2 -q
else
  log "PM2 $(pm2 -v) đã có sẵn"
fi

# ── 4. Clone repo ─────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Cập nhật code..."
  cd "$APP_DIR"
  git fetch origin && git reset --hard origin/main
else
  log "Clone repository..."
  mkdir -p "$(dirname $APP_DIR)"
  git clone https://github.com/trieulong1199/dochoitinphat.github.io.git "$APP_DIR"
  cd "$APP_DIR"
fi
cd "$APP_DIR"

# ── 5. Kiểm tra .env.local ────────────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  warn ".env.local chưa có! Tạo từ template..."
  cat > "$APP_DIR/.env.local" << 'ENVTEMPLATE'
NEXTAUTH_SECRET=change_me_to_a_random_32_char_string
NEXTAUTH_URL=https://daily.dochoitinphat.com
LARK_APP_ID=
LARK_APP_SECRET=
LARK_APP_TOKEN=
LARK_BASE_URL=https://open.larksuite.com
LARK_TABLE_PRODUCTS=
LARK_TABLE_USERS=
LARK_TABLE_ORDERS=
LARK_TABLE_ORDER_ITEMS=
ADMIN_SECRET=TinPhat@Admin2024
ENVTEMPLATE
  echo ""
  echo -e "${YELLOW}=================================================="
  echo "  CẦN ĐIỀN THÔNG TIN VÀO .env.local TRƯỚC KHI TIẾP TỤC"
  echo "  Chạy: nano $APP_DIR/.env.local"
  echo "==================================================${NC}"
  echo ""
  exit 0
fi

log ".env.local đã có"

# ── 6. Cài dependencies ───────────────────────────────────────
log "Cài npm dependencies..."
npm ci --prefer-offline 2>&1 | tail -3

# ── 7. Build ──────────────────────────────────────────────────
log "Build Next.js app..."
npm run build 2>&1 | tail -5

# Copy static files cho standalone mode
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# ── 8. Khởi động với PM2 ──────────────────────────────────────
log "Khởi động app với PM2 trên port $APP_PORT..."
pm2 delete wholesale-portal 2>/dev/null || true
PORT=$APP_PORT pm2 start "$APP_DIR/.next/standalone/server.js" \
  --name "wholesale-portal" \
  --cwd "$APP_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | tail -2

# ── 9. Cấu hình Caddy ─────────────────────────────────────────
if command -v caddy &>/dev/null; then
  log "Cấu hình Caddy..."
  if ! grep -q "$DOMAIN" /etc/caddy/Caddyfile 2>/dev/null; then
    tee -a /etc/caddy/Caddyfile > /dev/null << CADDYEOF

$DOMAIN {
    reverse_proxy localhost:$APP_PORT
}
CADDYEOF
  fi
  caddy fmt --overwrite /etc/caddy/Caddyfile
  systemctl reload caddy
  log "Caddy đã cấu hình"
else
  warn "Caddy không tìm thấy. Hãy cấu hình reverse proxy thủ công cho port $APP_PORT"
fi

# ── 10. Xong ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=================================================="
echo "  DEPLOY THÀNH CÔNG!"
echo "=================================================="
echo -e "  URL: https://$DOMAIN${NC}"
echo ""
echo "Bước tiếp theo:"
echo "  1. Tạo cột Lark (chạy 1 lần):"
echo "     curl -X POST https://$DOMAIN/api/admin/setup \\"
echo "       -H 'x-admin-secret: \$(grep ADMIN_SECRET $APP_DIR/.env.local | cut -d= -f2)'"
echo ""
echo "  2. Tạo tài khoản đại lý đầu tiên:"
echo "     curl -X POST https://$DOMAIN/api/admin/users \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'x-admin-secret: \$(grep ADMIN_SECRET $APP_DIR/.env.local | cut -d= -f2)' \\"
echo "       -d '{\"username\":\"daily01\",\"password\":\"matkhau123\",\"companyName\":\"Dai ly ABC\"}'"
echo ""
echo "  Logs: pm2 logs wholesale-portal"
echo "  Restart: pm2 restart wholesale-portal"
echo ""

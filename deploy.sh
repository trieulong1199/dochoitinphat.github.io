#!/bin/bash
# ================================================================
# deploy.sh — Cài đặt Wholesale Portal trên VPS
# Chạy: bash deploy.sh
# ================================================================
set -e

APP_DIR="/var/www/wholesale"
APP_PORT=3000
DOMAIN="daily.dochoitinphat.com"
NODE_VERSION="20"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "=================================================="
echo "  Wholesale Portal — Deploy Script"
echo "  Domain: $DOMAIN"
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

# ── 3. Cài nginx ──────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  log "Cài nginx..."
  apt-get install -y nginx -qq
else
  log "nginx $(nginx -v 2>&1 | awk '{print $3}') đã có sẵn"
fi

# ── 4. Cài PM2 ────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Cài PM2..."
  npm install -g pm2 -q
else
  log "PM2 $(pm2 -v) đã có sẵn"
fi

# ── 5. Clone / update repo ────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Cập nhật code..."
  cd "$APP_DIR"
  git pull origin main
else
  log "Clone repository..."
  mkdir -p "$(dirname $APP_DIR)"
  git clone https://github.com/trieulong1199/dochoitinphat.github.io.git "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 6. Kiểm tra .env.local ────────────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  warn ".env.local chưa có! Tạo từ template..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env.local"
  echo ""
  echo -e "${YELLOW}=================================================="
  echo "  CẦN ĐIỀN THÔNG TIN VÀO .env.local TRƯỚC KHI TIẾP TỤC"
  echo "  Chạy: nano $APP_DIR/.env.local"
  echo "==================================================${NC}"
  echo ""
  exit 0
fi

log ".env.local đã có"

# ── 7. Cài dependencies ───────────────────────────────────────
log "Cài npm dependencies..."
cd "$APP_DIR"
npm ci --prefer-offline 2>&1 | tail -3

# ── 8. Build ──────────────────────────────────────────────────
log "Build Next.js app..."
npm run build 2>&1 | tail -5

# ── 9. Khởi động với PM2 ──────────────────────────────────────
log "Khởi động app với PM2..."
pm2 delete wholesale-portal 2>/dev/null || true
pm2 start "$APP_DIR/.next/standalone/server.js" \
  --name "wholesale-portal" \
  --cwd "$APP_DIR" \
  -i 1 \
  --env production \
  -- --port $APP_PORT
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | tail -2

# ── 10. Cấu hình nginx ────────────────────────────────────────
log "Cấu hình nginx..."
cat > /etc/nginx/sites-available/wholesale << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect www
    if (\$host = www.$DOMAIN) {
        return 301 http://$DOMAIN\$request_uri;
    }

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Cache static files
    location /_next/static {
        proxy_pass http://127.0.0.1:$APP_PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/wholesale /etc/nginx/sites-enabled/wholesale
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 11. SSL với Certbot ───────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  log "Cài Certbot..."
  apt-get install -y certbot python3-certbot-nginx -qq
fi

warn "Đang lấy SSL certificate cho $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
  --email admin@dochoitinphat.com --redirect 2>&1 | tail -5 || \
  warn "SSL thất bại (DNS chưa trỏ về server?). App vẫn chạy ở HTTP."

# ── 12. Xong ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=================================================="
echo "  DEPLOY THÀNH CÔNG!"
echo "=================================================="
echo -e "  URL: https://$DOMAIN${NC}"
echo ""
echo "Bước tiếp theo:"
echo "  1. Tạo cột Lark:"
echo "     curl -X POST https://$DOMAIN/api/admin/setup \\"
echo "       -H 'x-admin-secret: \$(grep ADMIN_SECRET $APP_DIR/.env.local | cut -d= -f2)'"
echo ""
echo "  2. Tạo tài khoản đại lý đầu tiên:"
echo "     curl -X POST https://$DOMAIN/api/admin/users \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'x-admin-secret: \$(grep ADMIN_SECRET $APP_DIR/.env.local | cut -d= -f2)' \\"
echo "       -d '{\"username\":\"daily01\",\"password\":\"matkhau123\",\"companyName\":\"Đại lý ABC\"}'"
echo ""
echo "  Logs: pm2 logs wholesale-portal"
echo "  Restart: pm2 restart wholesale-portal"
echo ""

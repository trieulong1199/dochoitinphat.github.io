#!/bin/bash
set -e

DOMAIN="n8n.dochoitinphat.vn"
N8N_PORT="5678"
N8N_DIR="/opt/n8n"
EMAIL="admin@dochoitinphat.vn"

echo "============================================"
echo " Cài đặt n8n Docker - $DOMAIN"
echo "============================================"

# ---- 1. Phát hiện loại reverse proxy đang dùng ----
echo ""
echo "[1/6] Phát hiện môi trường..."

HAS_NPM=false
HAS_TRAEFIK=false
HAS_NGINX=false

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qi "nginx-proxy-manager\|npm"; then
    HAS_NPM=true
    echo "  -> Phát hiện: Nginx Proxy Manager"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -qi "traefik"; then
    HAS_TRAEFIK=true
    echo "  -> Phát hiện: Traefik"
elif systemctl is-active --quiet nginx 2>/dev/null; then
    HAS_NGINX=true
    echo "  -> Phát hiện: Nginx (system)"
else
    echo "  -> Không phát hiện reverse proxy, sẽ dùng Nginx"
fi

# Tìm docker network chung nếu có NPM/Traefik
COMMON_NETWORK=""
if $HAS_NPM; then
    COMMON_NETWORK=$(docker inspect $(docker ps --format '{{.Names}}' | grep -i "nginx-proxy-manager\|npm" | head -1) \
        --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' 2>/dev/null | \
        awk '{print $1}' | grep -v "^bridge$\|^host$\|^none$" | head -1)
    if [ -z "$COMMON_NETWORK" ]; then
        COMMON_NETWORK="npm_network"
    fi
    echo "  -> NPM network: $COMMON_NETWORK"
fi

# ---- 2. Tạo thư mục ----
echo ""
echo "[2/6] Tạo thư mục $N8N_DIR..."
mkdir -p "$N8N_DIR"

# ---- 3. Tạo docker-compose.yml ----
echo ""
echo "[3/6] Tạo docker-compose.yml..."

if $HAS_NPM; then
    cat > "$N8N_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=${DOMAIN}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${DOMAIN}/
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
      - TZ=Asia/Ho_Chi_Minh
      - N8N_SECURE_COOKIE=false
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - proxy

volumes:
  n8n_data:
    driver: local

networks:
  proxy:
    external: true
    name: ${COMMON_NETWORK}
EOF

elif $HAS_TRAEFIK; then
    cat > "$N8N_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=${DOMAIN}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${DOMAIN}/
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
      - TZ=Asia/Ho_Chi_Minh
      - N8N_SECURE_COOKIE=false
    volumes:
      - n8n_data:/home/node/.n8n
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.n8n.entrypoints=websecure"
      - "traefik.http.routers.n8n.tls.certresolver=letsencrypt"
      - "traefik.http.services.n8n.loadbalancer.server.port=${N8N_PORT}"
    networks:
      - traefik

volumes:
  n8n_data:
    driver: local

networks:
  traefik:
    external: true
EOF

else
    cat > "$N8N_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=${DOMAIN}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${DOMAIN}/
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
      - TZ=Asia/Ho_Chi_Minh
      - N8N_SECURE_COOKIE=false
    volumes:
      - n8n_data:/home/node/.n8n
    ports:
      - "127.0.0.1:${N8N_PORT}:${N8N_PORT}"

volumes:
  n8n_data:
    driver: local
EOF
fi

echo "  -> docker-compose.yml đã tạo tại $N8N_DIR"

# ---- 4. Khởi động n8n ----
echo ""
echo "[4/6] Khởi động n8n container..."
cd "$N8N_DIR"

docker pull n8nio/n8n:latest
docker rm -f n8n 2>/dev/null || true
docker compose up -d

echo "  -> Đang chờ n8n khởi động..."
for i in $(seq 1 30); do
    if docker exec n8n wget -q -O /dev/null http://localhost:5678/healthz 2>/dev/null; then
        echo "  -> n8n đã sẵn sàng!"
        break
    fi
    sleep 2
done

# ---- 5. Cấu hình Nginx (nếu dùng Nginx system) ----
if ! $HAS_NPM && ! $HAS_TRAEFIK; then
    echo ""
    echo "[5/6] Cấu hình Nginx reverse proxy..."

    if ! command -v nginx &>/dev/null; then
        apt-get update -q && apt-get install -y nginx
    fi

    if ! command -v certbot &>/dev/null; then
        apt-get install -y certbot python3-certbot-nginx
    fi

    cat > "/etc/nginx/conf.d/${DOMAIN}.conf" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:${N8N_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

    nginx -t && systemctl enable nginx && systemctl reload nginx

    echo "  -> Đang xin SSL cho $DOMAIN..."
    certbot --nginx -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --redirect 2>&1 || echo "  [!] SSL thất bại - kiểm tra DNS đã trỏ về server chưa"

    nginx -t && systemctl reload nginx

else
    echo ""
    echo "[5/6] Bỏ qua cấu hình Nginx (đang dùng $( $HAS_NPM && echo 'Nginx Proxy Manager' || echo 'Traefik' ))"
    if $HAS_NPM; then
        echo ""
        echo "  *** HƯỚNG DẪN NGINX PROXY MANAGER ***"
        echo "  Vào NPM Dashboard -> Proxy Hosts -> Add Proxy Host:"
        echo "    Domain Names : ${DOMAIN}"
        echo "    Scheme       : http"
        echo "    Forward Host : n8n"
        echo "    Forward Port : ${N8N_PORT}"
        echo "    Bật: Websockets Support"
        echo "    SSL: Request a new SSL Certificate + Force SSL + HTTP/2"
        echo "  **************************************"
    fi
fi

# ---- 6. Kiểm tra kết quả ----
echo ""
echo "[6/6] Kiểm tra trạng thái..."
echo ""
docker ps --filter "name=n8n" --format "  Container: {{.Names}} | {{.Image}} | {{.Status}} | {{.Ports}}"

echo ""
echo "============================================"
echo " HOÀN TẤT!"
echo "============================================"
if $HAS_NPM; then
    echo " n8n đang chạy trong network: $COMMON_NETWORK"
    echo " Vui lòng cấu hình thủ công trên NPM Dashboard"
    echo " (xem hướng dẫn ở trên)"
else
    echo " n8n URL: https://$DOMAIN"
    echo " Truy cập và tạo tài khoản admin lần đầu đăng nhập"
fi
echo ""
echo " Logs: docker logs -f n8n"
echo " Stop: cd $N8N_DIR && docker compose down"
echo "============================================"

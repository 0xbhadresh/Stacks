#!/usr/bin/env bash
set -euo pipefail

FRONT_PORT=${FRONT_PORT:-3000}
BACK_PORT=${BACK_PORT:-3001}

FRONT_LOG=${FRONT_LOG:-.cloudflared-front.log}
BACK_LOG=${BACK_LOG:-.cloudflared-back.log}

# Clean old logs
: > "$FRONT_LOG"
: > "$BACK_LOG"

# Start tunnels in background
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found. Please install it: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" >&2
  exit 1
fi

cloudflared tunnel --no-autoupdate --url "http://localhost:${FRONT_PORT}" > "$FRONT_LOG" 2>&1 &
FRONT_TUN_PID=$!
cloudflared tunnel --no-autoupdate --url "http://localhost:${BACK_PORT}" > "$BACK_LOG" 2>&1 &
BACK_TUN_PID=$!

cleanup() {
  kill -9 "$FRONT_TUN_PID" "$BACK_TUN_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Wait for URLs to appear in logs
extract_url() {
  local log_file=$1
  local url=""
  for i in {1..60}; do
    if grep -Eo "https://[a-zA-Z0-9.-]*trycloudflare\.com" "$log_file" >/dev/null 2>&1; then
      url=$(grep -Eo "https://[a-zA-Z0-9.-]*trycloudflare\.com" "$log_file" | head -n1)
      echo "$url"
      return 0
    fi
    sleep 0.5
  done
  return 1
}

FRONT_URL=$(extract_url "$FRONT_LOG") || { echo "Failed to get Cloudflare URL for frontend" >&2; exit 1; }
BACK_URL=$(extract_url "$BACK_LOG") || { echo "Failed to get Cloudflare URL for backend" >&2; exit 1; }

# Derive websocket URL (wss) from https
BACK_WSS_URL=${BACK_URL/https:\/\//wss://}

export NEXT_PUBLIC_APP_URL="$FRONT_URL"
export NEXT_PUBLIC_SOCKET_URL="$BACK_WSS_URL"

echo "Frontend exposed at: $FRONT_URL"
echo "Backend (WebSocket) exposed at: $BACK_WSS_URL"

echo "Starting dev servers with Cloudflare tunnels..."
# Force Next to use front port to match tunnel
PORT=${FRONT_PORT} npm run dev:all 
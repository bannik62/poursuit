#!/usr/bin/env bash
# Vérifie rapidement la prod (depuis ta machine ou le VPS).
# Usage : ./scripts/check-prod.sh [base_url]
set -euo pipefail

BASE="${1:-https://game.vitalinfo.site}"

echo "=== $BASE ==="

code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
server() { curl -sI "$@" | awk -F': ' '/^Server:/ {print $2; exit}'; }

API=$(code "$BASE/api/health")
API_SRV=$(server "$BASE/api/health")
echo "GET /api/health        → HTTP $API (Server: $API_SRV)"

ADMIN=$(code "$BASE/admin/")
echo "GET /admin/            → HTTP $ADMIN"

ORIGIN="$BASE"
HS=$(curl -s -H "Origin: $ORIGIN" "$BASE/socket.io/?EIO=4&transport=polling" || true)
if echo "$HS" | grep -q '"sid"'; then
  SID=$(echo "$HS" | sed 's/^[0-9]*//' | python3 -c "import sys,json; print(json.load(sys.stdin)['sid'])" 2>/dev/null || echo "")
  echo "GET /socket.io (handshake) → OK sid=${SID:0:12}…"
  if [[ -n "$SID" ]]; then
    POLL=$(code -m 3 -H "Origin: $ORIGIN" "$BASE/socket.io/?EIO=4&transport=polling&sid=$SID")
    POLL_SRV=$(server -H "Origin: $ORIGIN" "$BASE/socket.io/?EIO=4&transport=polling&sid=$SID")
    echo "GET /socket.io (poll+sid)  → HTTP $POLL (Server: $POLL_SRV)"
    if [[ "$POLL" == "403" && "$POLL_SRV" == *Apache* ]]; then
      echo "  ⚠ 403 Apache : vhost sans ProxyPass ou ModSecurity — voir deploy/apache-game-vitalinfo.conf.example"
    fi
  fi
else
  SOCK=$(code -H "Origin: $ORIGIN" "$BASE/socket.io/?EIO=4&transport=polling")
  SOCK_SRV=$(server -H "Origin: $ORIGIN" "$BASE/socket.io/?EIO=4&transport=polling")
  echo "GET /socket.io (handshake) → HTTP $SOCK (Server: $SOCK_SRV)"
  if [[ "$SOCK" == "403" ]]; then
    echo "  ⚠ 403 Apache : ProxyPass manquant dans le vhost 443 (certbot ?)"
  fi
fi

echo
echo "Sur le VPS : curl -s http://127.0.0.1:3333/api/health"

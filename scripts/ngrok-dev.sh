#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "❌ NGROK_AUTHTOKEN manquant dans .env"
  echo "   → https://dashboard.ngrok.com/get-started/your-authtoken"
  exit 1
fi

echo "🚀 Démarrage Docker + ngrok..."
docker compose --profile ngrok up -d --build

echo "⏳ Attente du tunnel ngrok..."
URL=""
for _ in $(seq 1 40); do
  URL=$(curl -sf http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for t in data.get('tunnels', []):
        u = t.get('public_url', '')
        if u.startswith('https://'):
            print(u)
            break
except Exception:
    pass
" 2>/dev/null || true)
  if [ -n "$URL" ]; then break; fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "❌ Tunnel ngrok introuvable. Ouvre http://localhost:4040"
  exit 1
fi

# Met à jour .env
if grep -q '^PUBLIC_URL=' .env; then
  sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=$URL|" .env
else
  echo "PUBLIC_URL=$URL" >> .env
fi
if grep -q '^FRONTEND_URL=' .env; then
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$URL|" .env
else
  echo "FRONTEND_URL=$URL" >> .env
fi

echo "🔄 Redémarrage backend avec la nouvelle URL..."
docker compose up -d --build backend

echo ""
echo "✅ Prêt pour le téléphone !"
echo ""
echo "  URL publique : $URL"
echo "  Admin        : $URL/admin/"
echo "  Plateau      : $URL/plateau/"
echo "  Dashboard ngrok: http://localhost:4040"
echo ""
echo "  → Recrée une session admin (nouveaux QR codes)"
echo ""

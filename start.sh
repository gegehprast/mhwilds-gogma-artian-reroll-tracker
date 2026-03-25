#!/bin/sh
set -e

# ── Check Bun ────────────────────────────────────────────────────────────────
if ! command -v bun >/dev/null 2>&1; then
    echo ""
    echo "  Bun is not installed."
    echo "  Install it from: https://bun.sh"
    echo ""
    exit 1
fi

echo ""
echo "  MHWilds Gogma Reroll Tracker"
echo "────────────────────────────────"
echo ""

# ── Install dependencies ──────────────────────────────────────────────────────
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# ── Build frontend ────────────────────────────────────────────────────────────
echo "🔨 Building frontend..."
VITE_API_URL=http://localhost:3001 bun run frontend:build

# ── Ensure backend .env exists (Bun requires it for --env-file) ───────────────
if [ ! -f apps/backend/.env ]; then
    cp apps/backend/.env.example apps/backend/.env
fi

# ── Ensure frontend .env exists ───────────────────────────────────────────────
if [ ! -f apps/frontend/.env ]; then
    cp apps/frontend/.env.example apps/frontend/.env
fi

# ── Apply database migrations ─────────────────────────────────────────────────
echo "🗄️  Applying database migrations..."
bun run backend:db:migrate

# ── Start ─────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Ready!"
echo ""
echo "   Open http://localhost:5173 in your browser"
echo "   Press Ctrl+C to stop"
echo ""

bunx concurrently \
    --names "backend,frontend" \
    --prefix-colors "cyan,magenta" \
    --kill-others \
    "bun run backend:start" \
    "bun run frontend:preview"

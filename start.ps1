# MHWilds Gogma Reroll Tracker — Windows Starter
# Run this script in PowerShell from the project root folder.
# If you get an error about "execution policy", run this first (once):
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
param(
    [switch]$Rebuild
)

# ── Check Bun ────────────────────────────────────────────────────────────────
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "  Bun is not installed." -ForegroundColor Red
    Write-Host "  Install it from: https://bun.sh" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "  MHWilds Gogma Reroll Tracker" -ForegroundColor Cyan
Write-Host "────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Install dependencies ──────────────────────────────────────────────────────
Write-Host "📦 Installing dependencies..."
bun install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# ── Build frontend ────────────────────────────────────────────────────────────
if ($Rebuild -or -not (Test-Path "apps\frontend\dist")) {
    Write-Host "🔨 Building frontend..."
    $env:VITE_API_URL = "http://localhost:3001"
    bun run frontend:build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "⚡ Skipping frontend build (dist already exists). Use -Rebuild to force."
}

# ── Ensure backend .env exists (Bun requires it for --env-file) ───────────────
if (-not (Test-Path "apps\backend\.env")) {
    Copy-Item "apps\backend\.env.example" "apps\backend\.env"
}

# ── Ensure frontend .env exists ───────────────────────────────────────────────
if (-not (Test-Path "apps\frontend\.env")) {
    Copy-Item "apps\frontend\.env.example" "apps\frontend\.env"
}

# ── Apply database migrations ─────────────────────────────────────────────────
Write-Host "🗄️  Applying database migrations..."
bun run backend:db:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# ── Start ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✅ Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "   Open http://localhost:5173 in your browser" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop"
Write-Host ""

bunx concurrently `
    --names "backend,frontend" `
    --prefix-colors "cyan,magenta" `
    --kill-others `
    "bun run backend:start" `
    "bun run frontend:preview"

#!/bin/sh
set -e

echo "Starting tracker..."

# Run SQLite migrations (no external DB to wait for)
cd /app/apps/backend
echo "Running migrations..."
bun run db:migrate
echo "Migrations complete"

# Start Bun backend in the background
echo "Starting backend..."
bun run start &
BUN_PID=$!

# Wait for backend to be ready (up to 30s)
RETRIES=0
until bun -e 'fetch("http://localhost:3001/api/health").then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))' 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -ge 30 ]; then
        echo "Backend failed to start after 30s"
        kill $BUN_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done
echo "Backend ready"

# Graceful shutdown: stop Bun when nginx exits or signals arrive
cleanup() {
    echo "Shutting down..."
    kill $BUN_PID 2>/dev/null
    wait $BUN_PID 2>/dev/null
    exit 0
}
trap cleanup TERM INT

# Start nginx in the foreground (shell stays as PID 1, handles signals)
echo "Starting nginx..."
nginx -g 'daemon off;'

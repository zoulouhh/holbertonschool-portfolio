#!/bin/bash
set -euo pipefail

ROOT_DIR="/workspaces/holbertonschool-portfolio"
BACKEND_DIR="${ROOT_DIR}/backend"
LOG_FILE="/tmp/backend-dev.log"

echo "[backend] Starting PostgreSQL container..."
cd "$ROOT_DIR"
docker compose up -d db

echo "[backend] Waiting for PostgreSQL on localhost:5432..."
for _ in $(seq 1 30); do
	if ss -ltn | grep -q ':5432'; then
		break
	fi
	sleep 1
done

if ! ss -ltn | grep -q ':5432'; then
	echo "[backend] PostgreSQL did not start on port 5432."
	exit 1
fi

echo "[backend] Applying Prisma migrations..."
cd "$BACKEND_DIR"
npx prisma migrate deploy

echo "[backend] Seeding local database..."
node prisma/seed.js

echo "[backend] Stopping existing API process on port 3001..."
EXISTING_PID="$(ss -ltnp | grep ':3001' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1)"
if [ -n "$EXISTING_PID" ]; then
	kill "$EXISTING_PID" 2>/dev/null || true
	sleep 1
fi

echo "[backend] Starting API on port 3001..."
nohup npm start > "$LOG_FILE" 2>&1 &

sleep 2
if ss -ltnp | grep -q ':3001'; then
	echo "[backend] Running on http://localhost:3001"
	echo "[backend] Logs: ${LOG_FILE}"
else
	echo "[backend] Failed to start. Last logs:"
	tail -n 40 "$LOG_FILE" || true
	exit 1
fi
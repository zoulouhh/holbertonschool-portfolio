#!/bin/bash
set -euo pipefail

FRONTEND_DIR="/workspaces/holbertonschool-portfolio/frontend"
PORT="5174"
LOG_FILE="/tmp/frontend-dev.log"

echo "[frontend] Stopping existing Vite processes..."
pkill -f "frontend/node_modules/.bin/vite --host" 2>/dev/null || true

echo "[frontend] Starting Vite on port ${PORT}..."
cd "$FRONTEND_DIR"
nohup npm run dev -- --host 0.0.0.0 --port "$PORT" --strictPort > "$LOG_FILE" 2>&1 &

sleep 1
if ss -ltnp | grep -q ":${PORT}"; then
	echo "[frontend] Running on http://localhost:${PORT}"
	echo "[frontend] Logs: ${LOG_FILE}"
else
	echo "[frontend] Failed to start. Last logs:"
	tail -n 40 "$LOG_FILE" || true
	exit 1
fi
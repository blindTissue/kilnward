#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-8080}"
echo "============================================"
echo "  KILNWARD: Elegy of the Porcelain Saint"
echo "  Serving at http://localhost:${PORT}"
echo "  Press Ctrl+C to stop."
echo "============================================"
exec python3 -m http.server "${PORT}" --bind 127.0.0.1

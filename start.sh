#!/usr/bin/env bash
# Start Next.js production server.
# With output: 'standalone', use the standalone server; otherwise use "next start".
# Used by PM2 via ecosystem.config.js. Run "npm run build" before first start.

set -e
cd "$(dirname "$0")"
PORT="${PORT:-3000}"

if [ -f .next/standalone/server.js ]; then
  # Standalone build: copy static assets if not already present
  [ -d .next/standalone/.next/static ] || cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  [ -d .next/standalone/public ] || cp -r public .next/standalone/ 2>/dev/null || true
  export PORT
  cd .next/standalone && exec node server.js
else
  exec node_modules/.bin/next start -p "$PORT"
fi

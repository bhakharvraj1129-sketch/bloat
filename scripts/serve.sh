#!/usr/bin/env bash
# Rebuild and restart the local app on port 3100 for API and browser tests.
set -e
cd "$(dirname "$0")/.."
pkill -f "next start -p 3100" 2>/dev/null || true
pnpm exec next build > /tmp/next-build.log 2>&1 || { tail -30 /tmp/next-build.log; exit 1; }
(nohup pnpm exec next start -p 3100 > /tmp/next.log 2>&1 &)
for i in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:3100/ && exit 0; sleep 1; done
echo "server did not start"; exit 1

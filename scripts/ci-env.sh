#!/usr/bin/env bash
# Writes .env.local for the LOCAL test stack (the Supabase in Docker that `pnpm db:start` runs).
# Used by the CI checks. Every value here is a local-only test value that is already public in this
# repository (supabase/seed.sql, tests/api/helpers.ts) and works only against a throwaway local
# database. No hosted key or secret is ever written by this script.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -e .env.local ] && [ -z "${CI:-}" ]; then
  echo ".env.local already exists; not overwriting it outside CI." >&2
  exit 1
fi
anon=$(pnpm exec supabase status -o env | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
[ -n "$anon" ] || { echo "local Supabase is not running (pnpm db:start)" >&2; exit 1; }
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$anon
BLOAT_SERVER_SECRET=local-dev-server-secret-not-for-hosted-use
BLOAT_AI_PROVIDER=mock
BLOAT_AI_MODEL=claude-haiku-5-5
BLOAT_BILLING_PROVIDER=mock
BLOAT_BILLING_WEBHOOK_SECRET=local-billing-secret
BLOAT_STAFF_EMAILS=staff@bloat.test
BLOAT_TEST_LOGIN=1
BLOAT_PRO_TEST_EMAILS=pro-tester@bloat.test
EOF
echo "wrote .env.local for the local test stack"

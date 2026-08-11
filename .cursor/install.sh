#!/usr/bin/env bash
#
# Idempotent Cloud Agent install script for the M.P.A. monorepo.
# Refreshes workspace dependencies and provisions local dev env files.
# Safe to run repeatedly; never overwrites existing .env files or secrets.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Enabling corepack / pnpm"
corepack enable >/dev/null 2>&1 || true

echo "==> Installing workspace dependencies (pnpm, frozen lockfile)"
pnpm install --frozen-lockfile

# Provide a working local dev env for the web app when one is not already
# present. These are non-secret placeholder values (same shape CI uses) so the
# app builds and boots out of the box. Real Supabase/Stripe/Resend values can be
# supplied via Cloud Agent secrets (injected as env vars, which take precedence)
# or by editing apps/web/.env.
WEB_ENV="apps/web/.env"
if [ ! -f "$WEB_ENV" ]; then
  echo "==> Writing placeholder dev env: $WEB_ENV"
  cat > "$WEB_ENV" <<'EOF'
NEXT_PUBLIC_APP_NAME=MPA
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-dev-service-role
SESSION_COOKIE_NAME=mpa_session
EOF
else
  echo "==> $WEB_ENV already exists; leaving it untouched"
fi

echo "==> Install complete"

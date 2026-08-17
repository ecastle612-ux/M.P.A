#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="${SCRATCH_DB:-mpa_scratch_docs180}"
MIG="$ROOT/supabase/migrations/20260817120000_docs_180_maintenance_notifications.sql"
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRATCH_LOG_DIR:-/tmp/docs180-scratch}"
mkdir -p "$LOG_DIR"

CONTAINER=""
cleanup() {
  if [[ -n "$CONTAINER" ]]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 -c "select 1" >/dev/null 2>&1; then
  PSQL() { sudo -u postgres psql "$@"; }
elif command -v docker >/dev/null 2>&1; then
  CONTAINER="mpa-scratch-docs180-$$"
  docker run -d --name "$CONTAINER" -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=postgres postgres:16-alpine >/dev/null
  for _ in $(seq 1 30); do
    if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  PSQL() { docker exec -i "$CONTAINER" psql -U postgres "$@"; }
else
  echo "No local Postgres or Docker available for scratch apply"
  exit 1
fi

PSQL -d postgres -v ON_ERROR_STOP=1 -c "drop database if exists ${DB};"
PSQL -d postgres -v ON_ERROR_STOP=1 -c "create database ${DB};"
PSQL -d "$DB" -v ON_ERROR_STOP=1 -f - <"$DIR/00-bootstrap.sql"
PSQL -d "$DB" -v ON_ERROR_STOP=1 -f - <"$DIR/01-seed.sql"

echo "=== CERTIFIED FILE TRANSACTIONAL APPLY ==="
{
  echo "BEGIN;"
  cat "$MIG"
  echo "COMMIT;"
} | PSQL -d "$DB" -v ON_ERROR_STOP=1 >"$LOG_DIR/certified-apply.log" 2>&1
cat "$LOG_DIR/certified-apply.log"
if grep -qE '^ERROR:|psql:.*ERROR:' "$LOG_DIR/certified-apply.log"; then
  echo "CERTIFIED_APPLY_FAILED"
  exit 1
fi
echo "CERTIFIED_APPLY_COMMITTED"

echo "=== IDEMPOTENT RE-APPLY ==="
PSQL -d "$DB" -v ON_ERROR_STOP=1 -f - <"$MIG" >"$LOG_DIR/idempotent-apply.log" 2>&1
cat "$LOG_DIR/idempotent-apply.log"
if grep -qE '^ERROR:|psql:.*ERROR:' "$LOG_DIR/idempotent-apply.log"; then
  echo "IDEMPOTENT_APPLY_FAILED"
  exit 1
fi

PSQL -d "$DB" -v ON_ERROR_STOP=1 -f - <"$DIR/02-verify.sql"
echo "SCRATCH_DOCS_180_CERTIFIED_APPLY_PASS"

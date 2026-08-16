#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="${SCRATCH_DB:-mpa_scratch_docs173}"
MIG="$ROOT/supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql"
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRATCH_LOG_DIR:-/tmp/docs173-scratch}"
mkdir -p "$LOG_DIR"

sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 -c "drop database if exists ${DB};"
sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 -c "create database ${DB};"

sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/00-bootstrap-production-shape.sql"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/01-seed.sql"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -c "select count(*) as lease_residents_before from public.lease_residents;"

echo "=== CERTIFIED FILE TRANSACTIONAL APPLY ==="
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 <<SQL >"$LOG_DIR/certified-apply.log" 2>&1
BEGIN;
\i $MIG
COMMIT;
SQL
cat "$LOG_DIR/certified-apply.log"
if grep -qE '^ERROR:|psql:.*ERROR:' "$LOG_DIR/certified-apply.log"; then
  echo "CERTIFIED_APPLY_FAILED"
  exit 1
fi
echo "CERTIFIED_APPLY_COMMITTED"

echo "=== IDEMPOTENT RE-APPLY ==="
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" >"$LOG_DIR/idempotent-apply.log" 2>&1
cat "$LOG_DIR/idempotent-apply.log"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/02-verify.sql"
echo "SCRATCH_DOCS_173_CERTIFIED_APPLY_PASS"

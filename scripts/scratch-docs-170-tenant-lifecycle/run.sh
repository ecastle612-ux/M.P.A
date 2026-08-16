#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="${SCRATCH_DB:-mpa_scratch_docs170}"
MIG="$ROOT/supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql"
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRATCH_LOG_DIR:-/tmp/docs170-scratch}"
mkdir -p "$LOG_DIR"

sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 -c "drop database if exists ${DB};"
sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 -c "create database ${DB};"

sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/00-bootstrap-production-shape.sql"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/01-seed.sql"
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -c "select count(*) as lease_residents_before from public.lease_residents;"

echo "=== CERTIFIED FILE TRANSACTIONAL APPLY (Production-shaped) ==="
set +e
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 <<SQL >"$LOG_DIR/certified-apply.log" 2>&1
BEGIN;
\i $MIG
COMMIT;
SQL
CERT_RC=$?
set -e
cat "$LOG_DIR/certified-apply.log"
if [ "$CERT_RC" -eq 0 ]; then
  echo "UNEXPECTED: certified file applied as a whole"
  exit 1
fi
if ! grep -q 'column reference "organization_id" is ambiguous' "$LOG_DIR/certified-apply.log"; then
  echo "UNEXPECTED certified failure (wanted maintenance organization_id ambiguity):"
  exit 1
fi
echo "CERTIFIED_APPLY_BLOCKED: maintenance_work_orders_insert_resident organization_id ambiguous"

# Scratch-only qualify so receipt/occupancy proof can finish. Not written to the certified file.
export MIG
python3 - <<'PY'
from pathlib import Path
import os
src = Path(os.environ["MIG"])
text = src.read_text()
text = text.replace(
    "and residents.organization_id = organization_id",
    "and residents.organization_id = maintenance_work_orders.organization_id",
)
text = text.replace(
    "where leases.organization_id = organization_id",
    "where leases.organization_id = maintenance_work_orders.organization_id",
)
Path("/tmp/docs170_scratch_qualified.sql").write_text(text)
print("wrote scratch-only qualified copy")
PY

echo "=== SCRATCH-ONLY QUALIFIED APPLY (receipt/occupancy proof) ==="
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f /tmp/docs170_scratch_qualified.sql
echo "=== IDEMPOTENT RE-APPLY ==="
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f /tmp/docs170_scratch_qualified.sql
sudo -u postgres psql -d "$DB" -v ON_ERROR_STOP=1 -f "$DIR/02-verify.sql"
echo "scratch receipt/occupancy proof complete"

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SUCC="$ROOT/supabase/migrations/20260814180000_plat_002_production_compat.sql"
FIXTURE="$ROOT/supabase/tests/plat-002-production-compat/fixture.sql"
ASSERT="$ROOT/supabase/tests/plat-002-production-compat/assert.sql"
NOTIFY="$ROOT/supabase/tests/plat-002-production-compat/notifications_present.sql"
NAME="plat002-compat-pg"
IMAGE="${PLAT002_PG_IMAGE:-postgres:16-alpine}"
PASSWORD="postgres"

run_psql() {
  local db="$1"
  shift
  if [[ "${PLAT002_PG_MODE}" == "docker" ]]; then
    docker exec -i -e PGPASSWORD="$PASSWORD" "$NAME" \
      psql -U postgres -d "$db" -v ON_ERROR_STOP=1 "$@"
  else
    sudo -u postgres psql -d "$db" -v ON_ERROR_STOP=1 "$@"
  fi
}

apply_file() {
  local db="$1"
  local file="$2"
  run_psql "$db" -f - < "$file"
}

if docker info >/dev/null 2>&1; then
  PLAT002_PG_MODE=docker
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" -e POSTGRES_PASSWORD="$PASSWORD" "$IMAGE" >/dev/null
  for _ in $(seq 1 30); do
    if docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
  trap cleanup EXIT
  run_psql postgres -c "select 1;" >/dev/null
else
  PLAT002_PG_MODE=local
  sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
  run_psql postgres -c "select 1;" >/dev/null
fi

echo "== absent maintenance_notifications (Production-shaped) =="
run_psql postgres -c "drop database if exists plat002_absent;"
run_psql postgres -c "create database plat002_absent;"
apply_file plat002_absent "$FIXTURE"
apply_file plat002_absent "$SUCC"
apply_file plat002_absent "$SUCC"
run_psql plat002_absent -c "do \$\$ begin if to_regclass('public.maintenance_notifications') is not null then raise exception 'successor created maintenance_notifications'; end if; end \$\$;"
apply_file plat002_absent "$ASSERT"
echo "PASS absent-table apply + matrix + RLS"

echo "== present maintenance_notifications (local/J6-shaped) =="
run_psql postgres -c "drop database if exists plat002_present;"
run_psql postgres -c "create database plat002_present;"
apply_file plat002_present "$FIXTURE"
apply_file plat002_present "$NOTIFY"
apply_file plat002_present "$SUCC"
run_psql plat002_present -c "do \$\$ begin if to_regclass('public.maintenance_notifications') is null then raise exception 'expected maintenance_notifications to remain'; end if; if not exists (select 1 from pg_policy where polrelid = 'public.maintenance_notifications'::regclass and polname = 'maintenance_notifications_insert') then raise exception 'notifications insert policy not applied'; end if; end \$\$;"
apply_file plat002_present "$ASSERT"
echo "PASS present-table apply + policy tighten"

echo "ALL PLAT-002 production-compat validation passed"

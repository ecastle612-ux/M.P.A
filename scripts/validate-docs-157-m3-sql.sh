#!/usr/bin/env bash
# Apply docs/157 M3A+M3B against scratch Postgres. Does not touch mpa-prod.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
M1="$ROOT/supabase/migrations/20260816003005_docs_140_fin_ops_reconciliation_m1.sql"
M3B="$ROOT/supabase/migrations/20260816070000_docs_157_fin_ops_reconciliation_m3b.sql"
M3A="$ROOT/supabase/migrations/20260816070100_docs_157_fin_ops_reconciliation_m3a.sql"
BOOT="$ROOT/scripts/fixtures/docs-157-m3-scratch.sql"
SEED="$ROOT/scripts/fixtures/docs-157-m3-finance-seed.sql"
PROOFS="$ROOT/scripts/fixtures/docs-157-m3-proofs.sql"
DB="docs157_m3_scratch"
PSQL=(sudo -n -u postgres psql -v ON_ERROR_STOP=1)

for f in "$M1" "$M3B" "$M3A" "$BOOT" "$SEED" "$PROOFS"; do
  if [[ ! -f "$f" ]]; then
    echo "missing $f" >&2
    exit 1
  fi
done

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"

"${PSQL[@]}" -d "$DB" <<'SQL'
do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$roles$;
grant usage on schema public to anon, authenticated, service_role;
SQL

"${PSQL[@]}" -d "$DB" -f "$BOOT"
"${PSQL[@]}" -d "$DB" -f "$M1"
"${PSQL[@]}" -d "$DB" -f "$SEED"

"${PSQL[@]}" -d "$DB" <<'SQL'
grant select, insert, update, delete on
  public.rent_charges, public.payments, public.payment_receipts, public.payment_customers,
  public.payment_attempts, public.payment_methods, public.billing_ledger_entries,
  public.financial_activity, public.expenses, public.owner_statements,
  public.vendor_invoices, public.vendor_payments, public.late_fees,
  public.billing_schedules, public.billing_invoices, public.billing_adjustments,
  public.autopay_enrollments
to authenticated;
SQL

"${PSQL[@]}" -d "$DB" -f "$M3B"
"${PSQL[@]}" -d "$DB" -f "$M3A"

# Production service_role keeps table DML; scratch must grant it so the
# write-guard / July-freeze triggers are the proven barrier.
"${PSQL[@]}" -d "$DB" <<'SQL'
grant select, insert, update, delete on
  public.rent_charges, public.payments, public.payment_receipts, public.payment_customers,
  public.payment_attempts, public.payment_methods, public.billing_ledger_entries,
  public.financial_activity, public.expenses, public.owner_statements,
  public.vendor_invoices, public.vendor_payments, public.late_fees,
  public.billing_schedules, public.billing_invoices, public.billing_adjustments,
  public.autopay_enrollments
to service_role;
SQL

"${PSQL[@]}" -d "$DB" -f "$PROOFS"

q() {
  "${PSQL[@]}" -d "$DB" -At -c "$1"
}

expect_eq() {
  local got="$1" want="$2" label="$3"
  if [[ "$got" != "$want" ]]; then
    echo "FAIL $label: got [$got] want [$want]" >&2
    exit 1
  fi
}

expect_fail() {
  local sql="$1" needle="$2" label="$3"
  local out
  if out=$("${PSQL[@]}" -d "$DB" -At -c "$sql" 2>&1); then
    echo "FAIL $label: expected error, got success: $out" >&2
    exit 1
  fi
  if [[ "$out" != *"$needle"* ]]; then
    echo "FAIL $label: expected [$needle] in [$out]" >&2
    exit 1
  fi
}

COMPLETE="c0c0c0c0-0000-4000-8000-000000000001"
PM="c0c0c0c0-0000-4000-8000-000000000002"
FO="c0c0c0c0-0000-4000-8000-000000000003"
ERICK="11111111-1111-1111-1111-111111111111"
SARAH="22222222-2222-2222-2222-222222222222"
MIKE="33333333-3333-3333-3333-333333333333"
PM_MGR="44444444-4444-4444-4444-444444444444"
FO_MGR="55555555-5555-5555-5555-555555555555"
TENANT="66666666-6666-6666-6666-666666666666"
VENDOR="77777777-7777-7777-7777-777777777777"
RES_A="88888888-8888-8888-8888-888888888888"
RES_B="99999999-9999-9999-9999-999999999999"
NONMEMBER="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
CHARGE_A="c1000000-0000-4000-8000-0000000000a1"
CHARGE_B="c1000000-0000-4000-8000-0000000000b1"

as_auth() {
  local user="$1"
  shift
  q "select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated; $*" | tail -n 1
}

expect_eq "$(as_auth "$ERICK" "select count(*) from public.financial_charges where organization_id = '${COMPLETE}';")" "2" "erick sees complete charges"
expect_eq "$(as_auth "$SARAH" "select count(*) from public.financial_charges where organization_id = '${COMPLETE}';")" "2" "sarah sees complete charges"
expect_eq "$(as_auth "$MIKE" "select count(*) from public.financial_charges where organization_id = '${COMPLETE}';")" "0" "mike denied known rows"
expect_eq "$(as_auth "$PM_MGR" "select count(*) from public.financial_charges where organization_id = '${PM}';")" "1" "pm manager sees pm charge"
expect_eq "$(as_auth "$FO_MGR" "select count(*) from public.financial_charges where organization_id = '${FO}';")" "0" "fo manager denied known fo row"
expect_eq "$(as_auth "$TENANT" "select count(*) from public.financial_charges where organization_id = '${COMPLETE}';")" "0" "tenant no staff finance"
expect_eq "$(as_auth "$VENDOR" "select count(*) from public.financial_charges where organization_id = '${COMPLETE}';")" "0" "vendor no staff finance"
expect_eq "$(as_auth "$VENDOR" "select count(*) from public.financial_vendor_invoices where organization_id = '${COMPLETE}';")" "0" "vendor denied vendor AP"
expect_eq "$(as_auth "$SARAH" "select count(*) from public.financial_vendor_invoices where organization_id = '${COMPLETE}';")" "1" "sarah staff vendor AP"
expect_eq "$(as_auth "$NONMEMBER" "select count(*) from public.financial_charges;")" "0" "non-member denied"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_charges where id = '${CHARGE_A}';")" "1" "resident A own charge"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_charges where id = '${CHARGE_B}';")" "0" "resident A cannot see B"
expect_eq "$(as_auth "$RES_B" "select count(*) from public.financial_charges where id = '${CHARGE_A}';")" "0" "resident B cannot see A"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_payments;")" "1" "resident A own payment"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_payment_allocations;")" "1" "resident A own allocation"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_receipts;")" "1" "resident A own receipt"
expect_eq "$(as_auth "$RES_B" "select count(*) from public.financial_receipts;")" "0" "resident B no A receipt"
expect_eq "$(as_auth "$SARAH" "select count(*) from public.financial_connect_accounts where organization_id = '${COMPLETE}';")" "1" "settings.manage connect select"
expect_eq "$(as_auth "$RES_A" "select count(*) from public.financial_connect_accounts;")" "0" "resident denied connect"

expect_fail "set role anon; select count(*) from public.financial_charges;" "permission denied" "anon privilege deny"

expect_fail "set role authenticated; insert into public.financial_charges (organization_id, property_id, lease_id, charge_type, label, amount, currency, due_at) values ('${COMPLETE}', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 'rent', 'nope', 1, 'USD', current_date);" "permission denied" "authenticated insert revoked"

expect_fail "set role service_role; insert into public.financial_charges (organization_id, property_id, lease_id, charge_type, label, amount, currency, due_at) values ('${COMPLETE}', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 'rent', 'checkout', 1, 'USD', current_date);" "finance_ops_writes_frozen" "service_role charge create guarded"

expect_fail "set role service_role; insert into public.financial_payments (organization_id, property_id, lease_id, amount, currency, method) values ('${COMPLETE}', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 1, 'USD', 'online_stripe');" "finance_ops_writes_frozen" "service_role payment create guarded"

expect_fail "set role service_role; insert into public.financial_stripe_webhook_events (stripe_event_id, event_type) values ('evt_test', 'checkout.session.completed');" "finance_ops_writes_frozen" "webhook insert guarded"

expect_fail "set role service_role; insert into public.financial_vendor_payments (organization_id, vendor_id, invoice_id, amount) select organization_id, vendor_id, id, 1 from public.financial_vendor_invoices where invoice_number = 'staff-only';" "finance_ops_writes_frozen" "vendor payment release guarded"

expect_fail "set role authenticated; insert into public.rent_charges (organization_id, amount, amount_paid) values ('${COMPLETE}', 1, 0);" "permission denied" "authenticated july insert privilege revoked"
expect_fail "grant insert on public.rent_charges to authenticated; select set_config('request.jwt.claim.sub', '${ERICK}', false); set role authenticated; insert into public.rent_charges (organization_id, amount, amount_paid) values ('${COMPLETE}', 1, 0);" "finance_july_frozen" "authenticated july insert trigger after leftover grant"
q "revoke insert on public.rent_charges from authenticated;" >/dev/null
expect_fail "set role service_role; insert into public.rent_charges (organization_id, amount, amount_paid) values ('${COMPLETE}', 1, 0);" "finance_july_frozen" "service_role july insert frozen"
expect_fail "set role service_role; update public.payments set amount = amount where true;" "finance_july_frozen" "service_role july update frozen"
expect_fail "set role service_role; delete from public.vendor_invoices;" "finance_july_frozen" "service_role july delete frozen"
expect_fail "set role service_role; insert into public.payment_receipts (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july payment_receipts frozen"
expect_fail "set role service_role; insert into public.payment_customers (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july payment_customers frozen"
expect_fail "set role service_role; insert into public.payment_attempts (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july payment_attempts frozen"
expect_fail "set role service_role; insert into public.payment_methods (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july payment_methods frozen"
expect_fail "set role service_role; insert into public.billing_ledger_entries (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july billing_ledger_entries frozen"
expect_fail "set role service_role; insert into public.financial_activity (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july financial_activity frozen"
expect_fail "set role service_role; insert into public.expenses (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july expenses frozen"
expect_fail "set role service_role; insert into public.owner_statements (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july owner_statements frozen"
expect_fail "set role service_role; insert into public.vendor_payments (organization_id, amount) values ('${COMPLETE}', 1);" "finance_july_frozen" "july vendor_payments frozen"
expect_fail "set role service_role; insert into public.late_fees (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july late_fees frozen"
expect_fail "set role service_role; insert into public.billing_schedules (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july billing_schedules frozen"
expect_fail "set role service_role; insert into public.billing_invoices (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july billing_invoices frozen"
expect_fail "set role service_role; insert into public.billing_adjustments (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july billing_adjustments frozen"
expect_fail "set role service_role; insert into public.autopay_enrollments (organization_id) values ('${COMPLETE}');" "finance_july_frozen" "july autopay_enrollments frozen"

expect_fail "set role authenticated; select public.finance_ops_writes_set(true);" "permission denied" "authenticated cannot lift write-guard"
expect_fail "set role authenticated; select public.finance_july_freeze_set(false);" "permission denied" "authenticated cannot unfreeze july"

# Historical July SELECT remains after freeze (privilege kept).
expect_eq "$(q "select count(*) from public.rent_charges;")" "17" "july history preserved"

# Guard TRUE allows trusted FIN-OPS write; then restore FALSE.
q "select public.finance_ops_writes_set(true);" >/dev/null
expect_eq "$(q "select public.finance_ops_writes_enabled();")" "t" "guard true in test only"
q "set role service_role; insert into public.financial_charges (id, organization_id, property_id, lease_id, charge_type, label, amount, currency, due_at) values ('c1000000-0000-4000-8000-00000000ff01', '${COMPLETE}', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 'rent', 'm4-path', 3, 'USD', current_date);" >/dev/null
q "select public.finance_ops_writes_set(false);" >/dev/null
expect_eq "$(q "select public.finance_ops_writes_enabled();")" "f" "guard restored false"
expect_fail "set role service_role; insert into public.financial_charges (organization_id, property_id, lease_id, charge_type, label, amount, currency, due_at) values ('${COMPLETE}', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 'rent', 'again', 1, 'USD', current_date);" "finance_ops_writes_frozen" "guard false again"

# Webhook/lineage remain unggranted
expect_fail "select set_config('request.jwt.claim.sub', '${SARAH}', false); set role authenticated; select count(*) from public.financial_stripe_webhook_events;" "permission denied" "webhook table no client select"
expect_fail "select set_config('request.jwt.claim.sub', '${SARAH}', false); set role authenticated; select count(*) from public.finance_lineage_map;" "permission denied" "lineage no client select"

# Write policies removed from July
expect_eq "$(q "select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname='rent_charges' and p.polcmd <> 'r';")" "0" "july write policies dropped"
expect_eq "$(q "select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname='vendor_invoices' and p.polcmd = '*';")" "0" "vendor FOR ALL dropped"
expect_eq "$(q "select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname='financial_charges' and p.polcmd <> 'r';")" "0" "no finops write policies"

echo "docs/157 M3 scratch apply: PASS"

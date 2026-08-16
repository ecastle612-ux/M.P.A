-- docs/161 FIN-OPS Production Reconciliation — Slice M4-RLS
-- Successor after live Production M3A stamp 20260816064707.
-- Do not replay 20260816070000 / 20260816070100 or S0/S1/S2.
--
-- Installs authenticated INSERT/UPDATE policies and grants for operational
-- FIN-OPS staff writes. Uses the existing member-effective helper:
--   member_has_finance_capability(organization_id, '<PLAT-006 key>')
--
-- Does NOT:
--   lift the FIN-OPS write-enable setter
--   weaken M3 SELECT policies
--   grant DELETE
--   grant webhook / lineage / cutover tables
--   grant late-fee / delinquency / arrangement / Connect / settings writes
--   create a client-callable privileged write RPC
--   mutate July or migrated FIN-OPS money
--   enable Stripe payment execution
--   implement M5
--   create manager-only, org-member, role-only, or SKU-only write fallbacks
--
-- Write-guard remains the cutover safety control. Authorized writes reach the
-- database and fail closed with finance_ops_writes_frozen while the guard is
-- false. Unauthorized callers must fail application authorization first.

-- ---------------------------------------------------------------------------
-- Authenticated INSERT/UPDATE grants — A tables only
-- ---------------------------------------------------------------------------

do $$
declare
  write_both text;
  insert_only text;
begin
  foreach write_both in array array[
    'financial_charges',
    'financial_charge_schedules',
    'financial_payments',
    'financial_vendor_invoices',
    'financial_vendor_payments'
  ]
  loop
    if to_regclass('public.' || write_both) is null then
      continue;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant insert, update on table public.%I to authenticated', write_both);
      execute format('revoke delete on table public.%I from authenticated', write_both);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', write_both);
    end if;
  end loop;

  foreach insert_only in array array[
    'financial_payment_allocations',
    'financial_ledger_entries',
    'financial_receipts',
    'financial_notifications'
  ]
  loop
    if to_regclass('public.' || insert_only) is null then
      continue;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant insert on table public.%I to authenticated', insert_only);
      execute format('revoke update, delete on table public.%I from authenticated', insert_only);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', insert_only);
    end if;
  end loop;

  foreach write_both in array array[
    'financial_late_fee_policies',
    'financial_delinquency_cases',
    'financial_payment_arrangements',
    'financial_connect_accounts',
    'financial_module_settings',
    'financial_stripe_webhook_events',
    'finance_lineage_map',
    'finance_ops_cutover_state'
  ]
  loop
    if to_regclass('public.' || write_both) is null then
      continue;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke insert, update, delete on table public.%I from authenticated', write_both);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', write_both);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Staff write policies — member-effective PLAT-006 keys only
-- ---------------------------------------------------------------------------

drop policy if exists financial_charges_insert_staff on public.financial_charges;
create policy financial_charges_insert_staff
on public.financial_charges
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_charges_update_staff on public.financial_charges;
create policy financial_charges_update_staff
on public.financial_charges
for update
using (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'))
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_charge_schedules_insert_staff on public.financial_charge_schedules;
create policy financial_charge_schedules_insert_staff
on public.financial_charge_schedules
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_charge_schedules_update_staff on public.financial_charge_schedules;
create policy financial_charge_schedules_update_staff
on public.financial_charge_schedules
for update
using (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'))
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_payments_insert_staff on public.financial_payments;
create policy financial_payments_insert_staff
on public.financial_payments
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_payments_update_staff on public.financial_payments;
create policy financial_payments_update_staff
on public.financial_payments
for update
using (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'))
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_payment_allocations_insert_staff on public.financial_payment_allocations;
create policy financial_payment_allocations_insert_staff
on public.financial_payment_allocations
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_ledger_entries_insert_staff on public.financial_ledger_entries;
create policy financial_ledger_entries_insert_staff
on public.financial_ledger_entries
for insert
with check (
  public.member_has_finance_capability(organization_id, 'pm.finance:charge.write')
  or public.member_has_finance_capability(organization_id, 'pm.finance:vendor_payment.release')
);

drop policy if exists financial_receipts_insert_staff on public.financial_receipts;
create policy financial_receipts_insert_staff
on public.financial_receipts
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_notifications_insert_staff on public.financial_notifications;
create policy financial_notifications_insert_staff
on public.financial_notifications
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:charge.write'));

drop policy if exists financial_vendor_invoices_insert_staff on public.financial_vendor_invoices;
create policy financial_vendor_invoices_insert_staff
on public.financial_vendor_invoices
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_invoice.review'));

drop policy if exists financial_vendor_invoices_update_staff on public.financial_vendor_invoices;
create policy financial_vendor_invoices_update_staff
on public.financial_vendor_invoices
for update
using (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_invoice.review'))
with check (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_invoice.review'));

drop policy if exists financial_vendor_payments_insert_staff on public.financial_vendor_payments;
create policy financial_vendor_payments_insert_staff
on public.financial_vendor_payments
for insert
with check (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_payment.release'));

drop policy if exists financial_vendor_payments_update_staff on public.financial_vendor_payments;
create policy financial_vendor_payments_update_staff
on public.financial_vendor_payments
for update
using (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_payment.release'))
with check (public.member_has_finance_capability(organization_id, 'pm.finance:vendor_payment.release'));

-- M5 / Connect / settings / webhook / lineage: no INSERT/UPDATE/DELETE policies.
-- M3 SELECT policies are unchanged.

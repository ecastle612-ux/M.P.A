-- docs/157 FIN-OPS Production Reconciliation — Slice M3A
-- Successor after 20260816070000 / docs_157_fin_ops_reconciliation_m3b.
--
-- Installs FIN-OPS staff/resident SELECT helpers and policies.
-- Does NOT grant INSERT/UPDATE/DELETE to authenticated.
-- Does NOT create M4 write policies.
-- Does NOT apply itself to Production in this package.
--
-- Binding staff rule:
--   org_allows_work_surface(residential)
--   AND member_allows_work_surface(residential)
--   AND has_org_capability(pm.finance:*)
--
-- Do not use is_org_member / is_org_manager / SKU alone / role alone.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.member_has_finance_capability(
  target_org_id uuid,
  required_capability text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(public.org_allows_work_surface(target_org_id, 'residential'), false)
    and coalesce(public.member_allows_work_surface(target_org_id, 'residential'), false)
    and public.has_org_capability(target_org_id, required_capability);
$$;

create or replace function public.finance_resident_owns_lease(
  target_org_id uuid,
  target_lease_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_agreements leases
    where leases.id = target_lease_id
      and leases.organization_id = target_org_id
      and (
        exists (
          select 1
          from public.lease_residents residents
          where residents.lease_id = leases.id
            and residents.organization_id = leases.organization_id
            and residents.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.lease_residents residents
          join public.pm_residents profiles
            on profiles.organization_id = residents.organization_id
           and lower(coalesce(profiles.email, '')) = lower(coalesce(residents.email, ''))
           and coalesce(profiles.email, '') <> ''
          where residents.lease_id = leases.id
            and residents.organization_id = leases.organization_id
            and profiles.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.member_has_finance_capability(uuid, text) from public, anon;
revoke all on function public.finance_resident_owns_lease(uuid, uuid) from public, anon;

grant execute on function public.member_has_finance_capability(uuid, text) to authenticated;
grant execute on function public.finance_resident_owns_lease(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Authenticated SELECT grants — customer-visible tables only
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'financial_connect_accounts',
    'financial_module_settings',
    'financial_charge_schedules',
    'financial_charges',
    'financial_payments',
    'financial_payment_allocations',
    'financial_ledger_entries',
    'financial_receipts',
    'financial_notifications',
    'financial_late_fee_policies',
    'financial_delinquency_cases',
    'financial_payment_arrangements',
    'financial_vendor_invoices',
    'financial_vendor_payments'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant select on table public.%I to authenticated', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', t);
    end if;
  end loop;

  foreach t in array array['financial_stripe_webhook_events', 'finance_lineage_map']
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on table public.%I from authenticated', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- SELECT policies (no INSERT/UPDATE/DELETE policies)
-- ---------------------------------------------------------------------------

drop policy if exists financial_connect_accounts_select_staff on public.financial_connect_accounts;
create policy financial_connect_accounts_select_staff
on public.financial_connect_accounts
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:settings.manage'));

drop policy if exists financial_module_settings_select_staff on public.financial_module_settings;
create policy financial_module_settings_select_staff
on public.financial_module_settings
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:settings.manage'));

drop policy if exists financial_charge_schedules_select_staff on public.financial_charge_schedules;
create policy financial_charge_schedules_select_staff
on public.financial_charge_schedules
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_charge_schedules_select_resident on public.financial_charge_schedules;
create policy financial_charge_schedules_select_resident
on public.financial_charge_schedules
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

drop policy if exists financial_charges_select_staff on public.financial_charges;
create policy financial_charges_select_staff
on public.financial_charges
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_charges_select_resident on public.financial_charges;
create policy financial_charges_select_resident
on public.financial_charges
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

drop policy if exists financial_payments_select_staff on public.financial_payments;
create policy financial_payments_select_staff
on public.financial_payments
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_payments_select_resident on public.financial_payments;
create policy financial_payments_select_resident
on public.financial_payments
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

drop policy if exists financial_payment_allocations_select_staff on public.financial_payment_allocations;
create policy financial_payment_allocations_select_staff
on public.financial_payment_allocations
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_payment_allocations_select_resident on public.financial_payment_allocations;
create policy financial_payment_allocations_select_resident
on public.financial_payment_allocations
for select
using (
  exists (
    select 1
    from public.financial_payments payments
    where payments.id = financial_payment_allocations.payment_id
      and public.finance_resident_owns_lease(payments.organization_id, payments.lease_id)
  )
);

drop policy if exists financial_ledger_entries_select_staff on public.financial_ledger_entries;
create policy financial_ledger_entries_select_staff
on public.financial_ledger_entries
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_ledger_entries_select_resident on public.financial_ledger_entries;
create policy financial_ledger_entries_select_resident
on public.financial_ledger_entries
for select
using (
  lease_id is not null
  and public.finance_resident_owns_lease(organization_id, lease_id)
  and entry_type in ('charge', 'payment', 'allocation')
);

drop policy if exists financial_receipts_select_staff on public.financial_receipts;
create policy financial_receipts_select_staff
on public.financial_receipts
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_receipts_select_resident on public.financial_receipts;
create policy financial_receipts_select_resident
on public.financial_receipts
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

drop policy if exists financial_notifications_select_staff on public.financial_notifications;
create policy financial_notifications_select_staff
on public.financial_notifications
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_notifications_select_own on public.financial_notifications;
create policy financial_notifications_select_own
on public.financial_notifications
for select
using (user_id = auth.uid());

drop policy if exists financial_late_fee_policies_select_staff on public.financial_late_fee_policies;
create policy financial_late_fee_policies_select_staff
on public.financial_late_fee_policies
for select
using (
  public.member_has_finance_capability(organization_id, 'pm.finance:read')
  or public.member_has_finance_capability(organization_id, 'pm.finance:late_fee.manage')
);

drop policy if exists financial_delinquency_cases_select_staff on public.financial_delinquency_cases;
create policy financial_delinquency_cases_select_staff
on public.financial_delinquency_cases
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_payment_arrangements_select_staff on public.financial_payment_arrangements;
create policy financial_payment_arrangements_select_staff
on public.financial_payment_arrangements
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_vendor_invoices_select_staff on public.financial_vendor_invoices;
create policy financial_vendor_invoices_select_staff
on public.financial_vendor_invoices
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_vendor_payments_select_staff on public.financial_vendor_payments;
create policy financial_vendor_payments_select_staff
on public.financial_vendor_payments
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

-- financial_stripe_webhook_events and finance_lineage_map: no policies, no authenticated grants.

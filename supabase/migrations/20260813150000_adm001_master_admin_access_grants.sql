-- ADM-001: Master Admin complimentary access grants (ADR-022).
-- Does not create Stripe objects. Operator-managed; members may SELECT for entitlement evaluation.

create table if not exists public.master_admin_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  granted_by_user_id uuid not null references auth.users (id) on delete restrict,
  plan_granted text not null
    check (plan_granted in (
      'mpa_property_manager',
      'mpa_facility_operations',
      'mpa_complete_platform'
    )),
  grant_status text not null
    check (grant_status in ('active', 'revoked', 'expired')),
  start_date timestamptz not null default timezone('utc', now()),
  expiration_date timestamptz,
  reason text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users (id) on delete set null,
  constraint master_admin_access_grants_reason_nonempty check (char_length(btrim(reason)) > 0)
);

create index if not exists master_admin_access_grants_org_status_exp_idx
  on public.master_admin_access_grants (organization_id, grant_status, expiration_date);

create unique index if not exists master_admin_access_grants_one_active_per_org_idx
  on public.master_admin_access_grants (organization_id)
  where grant_status = 'active';

create index if not exists master_admin_access_grants_status_idx
  on public.master_admin_access_grants (grant_status, expiration_date);

alter table public.master_admin_access_grants enable row level security;

drop policy if exists master_admin_access_grants_operator on public.master_admin_access_grants;
create policy master_admin_access_grants_operator
on public.master_admin_access_grants
for all
to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());

-- Members may read grants for their orgs so entitlement resolution / middleware can evaluate
-- complimentary access without service role. Members cannot insert/update/delete.
drop policy if exists master_admin_access_grants_member_select on public.master_admin_access_grants;
create policy master_admin_access_grants_member_select
on public.master_admin_access_grants
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = master_admin_access_grants.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

comment on table public.master_admin_access_grants is
  'ADM-001 complimentary / tester entitlements. Not Stripe-backed. Excluded from paid MRR.';

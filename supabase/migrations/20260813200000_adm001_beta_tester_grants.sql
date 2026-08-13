-- ADM-001: Master Admin beta tester complimentary grants (invitation workflow).
-- Lifecycle: INVITED → ACTIVE → EXPIRED | REVOKED. No Stripe objects.

create table if not exists public.master_admin_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invited_email text not null,
  granted_by_user_id uuid not null references auth.users (id) on delete restrict,
  invitation_id uuid references public.organization_invitations (id) on delete set null,
  plan_granted text not null
    check (plan_granted in (
      'mpa_property_manager',
      'mpa_facility_operations',
      'mpa_complete_platform'
    )),
  status text not null
    check (status in ('INVITED', 'ACTIVE', 'EXPIRED', 'REVOKED')),
  start_date timestamptz not null default timezone('utc', now()),
  expiration_date timestamptz,
  reason text not null,
  notes text,
  activated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users (id) on delete set null,
  constraint master_admin_access_grants_reason_nonempty check (char_length(btrim(reason)) > 0),
  constraint master_admin_access_grants_email_nonempty check (char_length(btrim(invited_email)) > 0)
);

create index if not exists master_admin_access_grants_org_status_exp_idx
  on public.master_admin_access_grants (organization_id, status, expiration_date);

create index if not exists master_admin_access_grants_email_idx
  on public.master_admin_access_grants (lower(invited_email));

create unique index if not exists master_admin_access_grants_one_open_per_org_idx
  on public.master_admin_access_grants (organization_id)
  where status in ('INVITED', 'ACTIVE');

alter table public.master_admin_access_grants enable row level security;

drop policy if exists master_admin_access_grants_operator on public.master_admin_access_grants;
create policy master_admin_access_grants_operator
on public.master_admin_access_grants
for all
to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());

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
  'ADM-001 complimentary beta tester grants. Not Stripe-backed. Excluded from paid MRR.';

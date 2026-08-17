-- docs/185 — Complimentary Tester / Gift Access
-- Server-owned grants. Not a Stripe subscription. Not a public free plan.
-- Do not apply this file to Production from the implement package.

create table if not exists public.complimentary_access_grants (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  grant_type text not null check (grant_type in ('tester', 'gift')),
  product_sku text not null references public.product_skus (code),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'expired', 'revoked')),
  expires_at timestamptz,
  limit_mode text not null default 'product_normal'
    check (limit_mode in ('product_normal', 'custom', 'unlimited')),
  custom_unit_limit integer
    check (custom_unit_limit is null or custom_unit_limit >= 1),
  organization_id uuid references public.organizations (id) on delete set null,
  organization_name text,
  user_id uuid references auth.users (id) on delete set null,
  claim_token_hash text,
  claim_expires_at timestamptz,
  granted_by uuid references auth.users (id) on delete set null,
  converted_at timestamptz,
  expiry_notice_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint complimentary_access_grants_custom_limit_chk
    check (
      (limit_mode = 'custom' and custom_unit_limit is not null)
      or (limit_mode <> 'custom' and custom_unit_limit is null)
    )
);

create unique index if not exists complimentary_access_grants_open_email_uidx
  on public.complimentary_access_grants (recipient_email)
  where status in ('invited', 'active');

create index if not exists complimentary_access_grants_org_idx
  on public.complimentary_access_grants (organization_id);

create index if not exists complimentary_access_grants_status_expires_idx
  on public.complimentary_access_grants (status, expires_at);

create index if not exists complimentary_access_grants_claim_hash_idx
  on public.complimentary_access_grants (claim_token_hash);

create table if not exists public.complimentary_access_events (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.complimentary_access_grants (id) on delete cascade,
  action text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists complimentary_access_events_grant_idx
  on public.complimentary_access_events (grant_id, created_at desc);

drop trigger if exists trg_complimentary_access_grants_updated_at on public.complimentary_access_grants;
create trigger trg_complimentary_access_grants_updated_at
before update on public.complimentary_access_grants
for each row
execute function public.set_updated_at();

alter table public.complimentary_access_grants enable row level security;
alter table public.complimentary_access_events enable row level security;

drop policy if exists complimentary_access_grants_select_member_or_operator
  on public.complimentary_access_grants;
create policy complimentary_access_grants_select_member_or_operator
on public.complimentary_access_grants
for select
using (
  public.is_platform_operator()
  or (
    organization_id is not null
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = complimentary_access_grants.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists complimentary_access_grants_write_operator
  on public.complimentary_access_grants;
create policy complimentary_access_grants_write_operator
on public.complimentary_access_grants
for all
using (public.is_platform_operator())
with check (public.is_platform_operator());

drop policy if exists complimentary_access_events_select_operator
  on public.complimentary_access_events;
create policy complimentary_access_events_select_operator
on public.complimentary_access_events
for select
using (public.is_platform_operator());

drop policy if exists complimentary_access_events_insert_operator
  on public.complimentary_access_events;
create policy complimentary_access_events_insert_operator
on public.complimentary_access_events
for insert
with check (public.is_platform_operator());

revoke all on public.complimentary_access_grants from public, anon;
revoke all on public.complimentary_access_events from public, anon;
grant select, insert, update on public.complimentary_access_grants to authenticated;
grant select, insert on public.complimentary_access_events to authenticated;

comment on table public.complimentary_access_grants is
  'docs/185 server-owned complimentary tester/gift grants. Not a Stripe subscription.';
comment on table public.complimentary_access_events is
  'docs/185 complimentary grant audit history. Operator-readable.';

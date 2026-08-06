-- LAUNCH-001 Journey J4 — First Lease + SignWell lifecycle

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.leasing:read', 'pm.leasing', 'Read leases, signing status, and Leasing Command Center'),
  ('pm.leasing:write', 'pm.leasing', 'Create leases, send for signature, and activate the leasing lifecycle')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'pm.leasing:read'),
  ('organization_admin', 'pm.leasing:write'),
  ('property_manager', 'pm.leasing:read'),
  ('property_manager', 'pm.leasing:write'),
  ('leasing_agent', 'pm.leasing:read'),
  ('leasing_agent', 'pm.leasing:write'),
  ('property_owner', 'pm.leasing:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Extend lease_agreements for certified leasing lifecycle
-- ---------------------------------------------------------------------------

alter table public.lease_agreements
  drop constraint if exists lease_agreements_status_check;

alter table public.lease_agreements
  add constraint lease_agreements_status_check
  check (status in ('draft', 'pending_signature', 'signed', 'active', 'ended'));

alter table public.lease_agreements
  add column if not exists resident_id uuid references public.pm_residents (id) on delete set null;

alter table public.lease_agreements
  add column if not exists signing_channel text
    check (signing_channel is null or signing_channel in ('signwell', 'offline'));

alter table public.lease_agreements
  add column if not exists signwell_document_id text;

alter table public.lease_agreements
  add column if not exists signwell_status text;

alter table public.lease_agreements
  add column if not exists signwell_error text;

alter table public.lease_agreements
  add column if not exists document_name text;

alter table public.lease_agreements
  add column if not exists document_body text;

alter table public.lease_agreements
  add column if not exists manager_name text;

alter table public.lease_agreements
  add column if not exists manager_email text;

alter table public.lease_agreements
  add column if not exists require_manager_signature boolean not null default true;

alter table public.lease_agreements
  add column if not exists rent_day_of_month int not null default 1
    check (rent_day_of_month between 1 and 28);

alter table public.lease_agreements
  add column if not exists signed_at timestamptz;

alter table public.lease_agreements
  add column if not exists activated_at timestamptz;

alter table public.lease_agreements
  add column if not exists created_by uuid references auth.users (id) on delete set null;

create index if not exists lease_agreements_resident_idx
  on public.lease_agreements (organization_id, resident_id);

create index if not exists lease_agreements_signwell_idx
  on public.lease_agreements (signwell_document_id)
  where signwell_document_id is not null;

-- ---------------------------------------------------------------------------
-- SignWell webhook idempotency
-- ---------------------------------------------------------------------------

create table if not exists public.signwell_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  event_id text,
  event_type text not null,
  document_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default timezone('utc', now()),
  unique (event_type, document_id, event_id)
);

alter table public.signwell_webhook_events enable row level security;

drop policy if exists signwell_webhook_events_manage on public.signwell_webhook_events;
create policy signwell_webhook_events_manage on public.signwell_webhook_events
for all using (public.is_org_manager(organization_id) or organization_id is null)
with check (public.is_org_manager(organization_id) or organization_id is null);

-- ---------------------------------------------------------------------------
-- Leasing writers (org admin / PM / leasing agent)
-- ---------------------------------------------------------------------------

create or replace function public.is_leasing_writer(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and (
        'property_manager' = any(memberships.roles)
        or 'organization_admin' = any(memberships.roles)
        or 'leasing_agent' = any(memberships.roles)
      )
  );
$$;

drop policy if exists lease_agreements_manage_manager on public.lease_agreements;
create policy lease_agreements_manage_manager on public.lease_agreements
for all using (public.is_leasing_writer(organization_id))
with check (public.is_leasing_writer(organization_id));

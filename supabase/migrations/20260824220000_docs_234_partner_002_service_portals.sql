-- PARTNER-002 / docs/234 — Branded partner service-request portals
-- Additive. Preserves PARTNER-001, facility intake, MEDIA, and work orders.
-- Do not apply this file to Production from the implement package.

alter table public.platform_partners
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

alter table public.platform_partners
  add column if not exists public_portal_enabled boolean not null default false;

alter table public.platform_partners
  add column if not exists portal_description text;

create index if not exists platform_partners_organization_idx
  on public.platform_partners (organization_id)
  where organization_id is not null;

create table if not exists public.platform_partner_service_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  public_ref text not null,
  status_token_hash text,
  slug_snapshot text not null,
  property_slug text,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'converted', 'declined', 'cancelled')),
  requester_name text not null,
  requester_email text,
  requester_phone text,
  property_address text not null,
  unit_label text,
  category text not null,
  description text not null,
  urgency text not null default 'normal'
    check (urgency in ('normal', 'soon', 'urgent')),
  converted_work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  converted_work_surface text
    check (converted_work_surface is null or converted_work_surface in ('residential', 'facility')),
  converted_by uuid references auth.users (id) on delete set null,
  converted_at timestamptz,
  declined_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_partner_service_requests_ref_uidx unique (public_ref),
  constraint platform_partner_service_requests_status_token_uidx unique (status_token_hash)
);

create index if not exists platform_partner_service_requests_partner_idx
  on public.platform_partner_service_requests (partner_id, status, created_at desc);

create index if not exists platform_partner_service_requests_org_idx
  on public.platform_partner_service_requests (organization_id, status, created_at desc);

create table if not exists public.platform_partner_service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.platform_partner_service_requests (id) on delete cascade,
  partner_id uuid not null references public.platform_partners (id) on delete cascade,
  action text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_service_request_events_request_idx
  on public.platform_partner_service_request_events (request_id, created_at desc);

create table if not exists public.platform_partner_request_media_grants (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  media_id uuid not null references public.media_attachments (id) on delete cascade,
  request_id uuid references public.platform_partner_service_requests (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_request_media_grants_media_idx
  on public.platform_partner_request_media_grants (media_id);

create table if not exists public.platform_partner_request_ref_counters (
  year integer primary key,
  last_value integer not null default 0
);

drop trigger if exists trg_platform_partner_service_requests_updated_at
  on public.platform_partner_service_requests;
create trigger trg_platform_partner_service_requests_updated_at
before update on public.platform_partner_service_requests
for each row
execute function public.set_updated_at();

alter table public.platform_partner_service_requests enable row level security;
alter table public.platform_partner_service_request_events enable row level security;
alter table public.platform_partner_request_media_grants enable row level security;
alter table public.platform_partner_request_ref_counters enable row level security;

drop policy if exists partner_service_requests_select_operator
  on public.platform_partner_service_requests;
create policy partner_service_requests_select_operator
on public.platform_partner_service_requests
for select
using (
  public.is_platform_operator()
  or public.is_org_member(organization_id)
);

drop policy if exists partner_service_request_events_select_operator
  on public.platform_partner_service_request_events;
create policy partner_service_request_events_select_operator
on public.platform_partner_service_request_events
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.platform_partner_service_requests r
    where r.id = request_id
      and public.is_org_member(r.organization_id)
  )
);

revoke all on public.platform_partner_service_requests from public, anon;
revoke all on public.platform_partner_service_request_events from public, anon;
revoke all on public.platform_partner_request_media_grants from public, anon;
revoke all on public.platform_partner_request_ref_counters from public, anon;

grant select on public.platform_partner_service_requests to authenticated;
grant select on public.platform_partner_service_request_events to authenticated;

alter table public.media_attachments
  drop constraint if exists media_attachments_related_entity_type_check;

alter table public.media_attachments
  add constraint media_attachments_related_entity_type_check
  check (related_entity_type in (
    'maintenance',
    'vendor',
    'inspection',
    'incident',
    'organization',
    'conversation_message',
    'facility_asset',
    'facility_request_intake',
    'vendor_invoice',
    'partner_service_request'
  ));

comment on table public.platform_partner_service_requests is
  'PARTNER-002 untrusted public intake. Not a work order. Service-role writes.';
comment on column public.platform_partners.organization_id is
  'Receiving Partner Program organization. Required to enable the public portal.';
comment on column public.platform_partners.public_portal_enabled is
  'Master Admin Public Service Portal Enabled. Suspend/disable stops new intake.';

create or replace function public.increment_partner_request_ref(p_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val integer;
begin
  insert into public.platform_partner_request_ref_counters (year, last_value)
  values (p_year, 1)
  on conflict (year) do update
    set last_value = public.platform_partner_request_ref_counters.last_value + 1
  returning last_value into next_val;
  return next_val;
end;
$$;

revoke all on function public.increment_partner_request_ref(integer) from public, anon, authenticated;
grant execute on function public.increment_partner_request_ref(integer) to service_role;

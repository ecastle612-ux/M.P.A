-- PARTNER-006 / docs/246 — Partner lead and service opportunity routing.
-- Additive only. Do not reuse public partner service requests as the customer model.
-- Do not apply this file to Production from the implement package.

create table if not exists public.platform_partner_service_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  requested_by_user_id uuid not null references auth.users (id) on delete restrict,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  unit_label text,
  work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  property_type text not null default 'residential'
    check (property_type in ('residential', 'facility')),
  category text not null,
  description text not null,
  urgency text not null default 'normal'
    check (urgency in ('normal', 'soon', 'urgent')),
  preferred_timing text,
  city text,
  region text,
  postal_code text,
  status text not null default 'open'
    check (status in ('open', 'routed', 'partner_interested', 'partner_selected', 'closed', 'cancelled')),
  selected_partner_id uuid references public.platform_partners (id) on delete set null,
  selected_by uuid references auth.users (id) on delete set null,
  selected_at timestamptz,
  close_reason text
    check (close_reason is null or close_reason in ('manual', 'expired', 'no_response')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_service_opportunities_org_idx
  on public.platform_partner_service_opportunities (organization_id, status, created_at desc);

create unique index if not exists platform_partner_service_opportunities_open_wo_uidx
  on public.platform_partner_service_opportunities (work_order_id)
  where work_order_id is not null
    and status in ('open', 'routed', 'partner_interested');

create index if not exists platform_partner_service_opportunities_expires_idx
  on public.platform_partner_service_opportunities (expires_at)
  where status in ('open', 'routed', 'partner_interested');

drop trigger if exists trg_platform_partner_service_opportunities_updated_at
  on public.platform_partner_service_opportunities;
create trigger trg_platform_partner_service_opportunities_updated_at
before update on public.platform_partner_service_opportunities
for each row
execute function public.set_updated_at();

create table if not exists public.platform_partner_opportunity_routes (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.platform_partner_service_opportunities (id) on delete cascade,
  partner_id uuid not null references public.platform_partners (id) on delete restrict,
  routed_at timestamptz not null default timezone('utc', now()),
  viewed_at timestamptz,
  response text
    check (response is null or response in ('interested', 'declined', 'not_selected')),
  response_at timestamptz,
  decline_reason text
    check (decline_reason is null or decline_reason in (
      'outside_service_area',
      'schedule_unavailable',
      'service_not_offered',
      'capacity',
      'other'
    )),
  selected boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_partner_opportunity_routes_uidx unique (opportunity_id, partner_id)
);

create index if not exists platform_partner_opportunity_routes_partner_idx
  on public.platform_partner_opportunity_routes (partner_id, routed_at desc);

create index if not exists platform_partner_opportunity_routes_opportunity_idx
  on public.platform_partner_opportunity_routes (opportunity_id, routed_at desc);

drop trigger if exists trg_platform_partner_opportunity_routes_updated_at
  on public.platform_partner_opportunity_routes;
create trigger trg_platform_partner_opportunity_routes_updated_at
before update on public.platform_partner_opportunity_routes
for each row
execute function public.set_updated_at();

create table if not exists public.platform_partner_opportunity_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.platform_partner_service_opportunities (id) on delete cascade,
  partner_id uuid references public.platform_partners (id) on delete set null,
  action text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_opportunity_events_opportunity_idx
  on public.platform_partner_opportunity_events (opportunity_id, created_at desc);

create table if not exists public.platform_partner_unmet_demand (
  id uuid primary key default gen_random_uuid(),
  service_category text not null,
  city text,
  region text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_unmet_demand_geo_idx
  on public.platform_partner_unmet_demand (region, city, created_at desc);

create index if not exists platform_partner_unmet_demand_category_idx
  on public.platform_partner_unmet_demand (service_category, created_at desc);

alter table public.platform_partner_service_opportunities enable row level security;
alter table public.platform_partner_opportunity_routes enable row level security;
alter table public.platform_partner_opportunity_events enable row level security;
alter table public.platform_partner_unmet_demand enable row level security;

drop policy if exists platform_partner_service_opportunities_select_member
  on public.platform_partner_service_opportunities;
create policy platform_partner_service_opportunities_select_member
on public.platform_partner_service_opportunities
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = platform_partner_service_opportunities.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists platform_partner_opportunity_routes_select_scoped
  on public.platform_partner_opportunity_routes;
create policy platform_partner_opportunity_routes_select_scoped
on public.platform_partner_opportunity_routes
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.platform_partner_service_opportunities opportunities
    join public.organization_memberships memberships
      on memberships.organization_id = opportunities.organization_id
    where opportunities.id = platform_partner_opportunity_routes.opportunity_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
  or exists (
    select 1
    from public.platform_partners partners
    join public.organization_memberships memberships
      on memberships.organization_id = partners.organization_id
    where partners.id = platform_partner_opportunity_routes.partner_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists platform_partner_opportunity_events_select_member
  on public.platform_partner_opportunity_events;
create policy platform_partner_opportunity_events_select_member
on public.platform_partner_opportunity_events
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.platform_partner_service_opportunities opportunities
    join public.organization_memberships memberships
      on memberships.organization_id = opportunities.organization_id
    where opportunities.id = platform_partner_opportunity_events.opportunity_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists platform_partner_unmet_demand_select_operator
  on public.platform_partner_unmet_demand;
create policy platform_partner_unmet_demand_select_operator
on public.platform_partner_unmet_demand
for select
using (public.is_platform_operator());

revoke all on public.platform_partner_service_opportunities from public, anon;
revoke all on public.platform_partner_opportunity_routes from public, anon;
revoke all on public.platform_partner_opportunity_events from public, anon;
revoke all on public.platform_partner_unmet_demand from public, anon;

grant select on public.platform_partner_service_opportunities to authenticated;
grant select on public.platform_partner_opportunity_routes to authenticated;
grant select on public.platform_partner_opportunity_events to authenticated;
grant select on public.platform_partner_unmet_demand to authenticated;

comment on table public.platform_partner_service_opportunities is
  'PARTNER-006 authenticated org service opportunities. Service-role writes only. Distinct from public partner service requests.';
comment on table public.platform_partner_opportunity_routes is
  'PARTNER-006 opportunity-to-partner routing. Do not duplicate the opportunity payload.';
comment on table public.platform_partner_unmet_demand is
  'PARTNER-006 aggregate unmet demand. Category, city/region, timestamp only. No requester PII.';

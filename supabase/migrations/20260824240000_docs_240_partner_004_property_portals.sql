-- PARTNER-004 / docs/240 — Property-specific partner service portals
-- Additive. References canonical property_properties. Does not clone properties.
-- Do not apply this file to Production from the implement package.

create table if not exists public.platform_partner_property_portals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  public_slug text not null,
  enabled boolean not null default true,
  public_display_name text,
  public_instructions text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_partner_property_portals_partner_property_uidx unique (partner_id, property_id)
);

create unique index if not exists platform_partner_property_portals_partner_slug_uidx
  on public.platform_partner_property_portals (partner_id, lower(public_slug));

create index if not exists platform_partner_property_portals_org_idx
  on public.platform_partner_property_portals (organization_id, enabled, created_at desc);

create index if not exists platform_partner_property_portals_property_idx
  on public.platform_partner_property_portals (property_id);

drop trigger if exists trg_platform_partner_property_portals_updated_at
  on public.platform_partner_property_portals;
create trigger trg_platform_partner_property_portals_updated_at
before update on public.platform_partner_property_portals
for each row
execute function public.set_updated_at();

alter table public.platform_partner_service_requests
  add column if not exists property_portal_id uuid
    references public.platform_partner_property_portals (id) on delete set null;

alter table public.platform_partner_service_requests
  add column if not exists property_id uuid
    references public.property_properties (id) on delete set null;

alter table public.platform_partner_service_requests
  add column if not exists intake_source text not null default 'generic_portal';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'platform_partner_service_requests_intake_source_check'
  ) then
    alter table public.platform_partner_service_requests
      add constraint platform_partner_service_requests_intake_source_check
      check (intake_source in ('generic_portal', 'property_portal'));
  end if;
end $$;

create index if not exists platform_partner_service_requests_property_portal_idx
  on public.platform_partner_service_requests (property_portal_id, created_at desc)
  where property_portal_id is not null;

create index if not exists platform_partner_service_requests_property_idx
  on public.platform_partner_service_requests (property_id)
  where property_id is not null;

alter table public.platform_partner_property_portals enable row level security;

drop policy if exists partner_property_portals_select_operator
  on public.platform_partner_property_portals;
create policy partner_property_portals_select_operator
on public.platform_partner_property_portals
for select
using (
  public.is_platform_operator()
  or public.is_org_member(organization_id)
);

revoke all on public.platform_partner_property_portals from public, anon;
grant select on public.platform_partner_property_portals to authenticated;

comment on table public.platform_partner_property_portals is
  'PARTNER-004 partner-to-canonical-property portal links. Service-role writes. Public slugs are partner-scoped.';
comment on column public.platform_partner_property_portals.public_slug is
  'Public property slug unique per partner. Never a UUID.';
comment on column public.platform_partner_property_portals.enabled is
  'Disable stops new intake. Historical requests remain.';
comment on column public.platform_partner_service_requests.property_portal_id is
  'Authoritative property-portal link when intake_source is property_portal.';
comment on column public.platform_partner_service_requests.property_id is
  'Canonical property_properties id. Set server-side for property portals.';
comment on column public.platform_partner_service_requests.intake_source is
  'generic_portal or property_portal. Not a commission source.';

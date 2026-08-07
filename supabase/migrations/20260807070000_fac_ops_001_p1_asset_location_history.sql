-- FAC-OPS-001 P1 remediation — Asset location history (J-F6 relocate)
-- No Capital, inventory expansion, or new Facility capabilities beyond approved relocate.

create table if not exists public.facility_asset_location_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  asset_id uuid not null references public.facility_assets (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  from_location_id uuid references public.facility_locations (id) on delete set null,
  to_location_id uuid references public.facility_locations (id) on delete set null,
  reason text,
  relocated_by uuid references auth.users (id) on delete set null,
  relocated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_asset_location_history_asset_idx
  on public.facility_asset_location_history (organization_id, asset_id, relocated_at desc);

create index if not exists facility_asset_location_history_site_idx
  on public.facility_asset_location_history (organization_id, site_id, relocated_at desc);

alter table public.facility_asset_location_history enable row level security;

drop policy if exists facility_asset_location_history_select on public.facility_asset_location_history;
create policy facility_asset_location_history_select on public.facility_asset_location_history
for select using (public.is_org_member(organization_id));

drop policy if exists facility_asset_location_history_write on public.facility_asset_location_history;
create policy facility_asset_location_history_write on public.facility_asset_location_history
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

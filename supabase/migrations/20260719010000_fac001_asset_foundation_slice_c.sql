-- FAC-001 Slice C: Asset Foundation
-- Permanent FacilityAsset registry + optional Facility Record / Timeline links.
-- Vault entity_type extended with 'asset'. No PM / warranty engine / health scoring.

create table if not exists public.facility_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  building_id uuid,
  unit_id uuid,
  location_scope text not null default 'property' check (
    location_scope in ('property', 'building', 'unit', 'common_area')
  ),
  asset_code text not null,
  name text not null,
  asset_type text not null,
  custom_type_label text,
  install_date date,
  manufacturer text,
  model text,
  serial_number text,
  expected_life_years numeric(6, 2),
  warranty_placeholder text,
  status text not null default 'active' check (
    status in ('active', 'replaced', 'retired')
  ),
  location_note text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, asset_code),
  constraint facility_assets_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade,
  constraint facility_assets_unit_fk
    foreign key (unit_id)
    references public.units (id)
    on delete set null,
  constraint facility_assets_unit_scope_chk check (
    (location_scope = 'unit' and unit_id is not null)
    or (location_scope <> 'unit' and unit_id is null)
  )
);

create index if not exists facility_assets_org_property_idx
  on public.facility_assets (organization_id, property_id)
  where deleted_at is null;

create index if not exists facility_assets_org_unit_idx
  on public.facility_assets (organization_id, unit_id)
  where deleted_at is null and unit_id is not null;

create index if not exists facility_assets_org_type_idx
  on public.facility_assets (organization_id, asset_type)
  where deleted_at is null;

create index if not exists facility_assets_org_status_idx
  on public.facility_assets (organization_id, status)
  where deleted_at is null;

create index if not exists facility_assets_search_idx
  on public.facility_assets using gin (
    to_tsvector(
      'english',
      coalesce(asset_code, '') || ' ' ||
      coalesce(name, '') || ' ' ||
      coalesce(asset_type, '') || ' ' ||
      coalesce(custom_type_label, '') || ' ' ||
      coalesce(manufacturer, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(serial_number, '') || ' ' ||
      coalesce(location_note, '') || ' ' ||
      coalesce(notes, '')
    )
  );

drop trigger if exists trg_facility_assets_updated_at on public.facility_assets;
create trigger trg_facility_assets_updated_at
before update on public.facility_assets
for each row
execute function public.set_updated_at();

alter table public.facility_assets enable row level security;

drop policy if exists facility_assets_select_authorized on public.facility_assets;
create policy facility_assets_select_authorized
on public.facility_assets
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists facility_assets_insert_authorized on public.facility_assets;
create policy facility_assets_insert_authorized
on public.facility_assets
for insert
with check (public.has_org_capability(organization_id, 'maintenance:update'));

drop policy if exists facility_assets_update_authorized on public.facility_assets;
create policy facility_assets_update_authorized
on public.facility_assets
for update
using (public.has_org_capability(organization_id, 'maintenance:update'))
with check (public.has_org_capability(organization_id, 'maintenance:update'));

-- Soft-delete only via update (no delete policy).

alter table public.facility_records
  add column if not exists asset_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'facility_records_asset_fk'
  ) then
    alter table public.facility_records
      add constraint facility_records_asset_fk
      foreign key (asset_id, organization_id)
      references public.facility_assets (id, organization_id)
      on delete set null;
  end if;
end $$;

create index if not exists facility_records_org_asset_idx
  on public.facility_records (organization_id, asset_id, completed_at desc)
  where status = 'active' and asset_id is not null;

alter table public.facility_timeline_events
  add column if not exists asset_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'facility_timeline_asset_fk'
  ) then
    alter table public.facility_timeline_events
      add constraint facility_timeline_asset_fk
      foreign key (asset_id, organization_id)
      references public.facility_assets (id, organization_id)
      on delete set null;
  end if;
end $$;

create index if not exists facility_timeline_org_asset_idx
  on public.facility_timeline_events (organization_id, asset_id, occurred_at desc)
  where asset_id is not null;

-- Extend Document Vault polymorphic entity types with asset.
alter table public.vault_documents
  drop constraint if exists vault_documents_entity_type_check;

alter table public.vault_documents
  add constraint vault_documents_entity_type_check
  check (
    entity_type in (
      'applicant',
      'tenant',
      'lease',
      'property',
      'unit',
      'vendor',
      'maintenance',
      'asset'
    )
  );

comment on table public.facility_assets is
  'FAC-001 Slice C: permanent building/unit equipment identity. Repair history links via facility_records.asset_id.';

comment on column public.facility_records.asset_id is
  'Optional link to FacilityAsset. Repairs accumulate under the asset; history is never duplicated.';

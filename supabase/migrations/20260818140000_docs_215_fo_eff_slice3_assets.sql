-- FO-EFF Slice 3: additive asset registry polish for Asset QR + location labels.
-- Reuses FAC-003 facility_assets and docs/204 facility_request_intakes.
-- Does not rewrite work orders, public submissions, FIN-OPS, Stripe, July, or M5.
-- Do not apply on Production until Owner authorizes a Slice 3 Production release.

alter table public.facility_assets
  add column if not exists department_label text;

alter table public.facility_assets
  add column if not exists active_request_intake_id uuid
    references public.facility_request_intakes (id) on delete set null;

create unique index if not exists facility_assets_org_serial_uidx
  on public.facility_assets (organization_id, lower(btrim(serial_number)))
  where deleted_at is null
    and serial_number is not null
    and btrim(serial_number) <> '';

create index if not exists facility_assets_org_intake_idx
  on public.facility_assets (organization_id, active_request_intake_id)
  where active_request_intake_id is not null
    and deleted_at is null;

create index if not exists facility_assets_org_search_idx
  on public.facility_assets (organization_id, name, asset_code)
  where deleted_at is null;

comment on column public.facility_assets.department_label is
  'Label-only department/area for QR locked context. Not a registry.';
comment on column public.facility_assets.active_request_intake_id is
  'Current docs/204 intake used for this asset QR. Public resolution remains token hash lookup.';

-- docs/204 / ADR-034 Phase 1: Facility public work-request forms + QR/link intake.
-- Additive only. Do not replay J6 / STAB-004 / MEDIA-001 / FAC-003 / docs/180 / docs/194.
-- Not applied to Production from this package.

-- ---------------------------------------------------------------------------
-- Work-order intake columns
-- ---------------------------------------------------------------------------

alter table public.maintenance_work_orders
  add column if not exists intake_channel text not null default 'internal';

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_intake_channel_check;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_intake_channel_check
  check (intake_channel in ('internal', 'qr', 'public_link', 'authenticated'));

alter table public.maintenance_work_orders add column if not exists request_number text;
alter table public.maintenance_work_orders add column if not exists floor_label text;
alter table public.maintenance_work_orders add column if not exists department_label text;
alter table public.maintenance_work_orders add column if not exists room_label text;

create unique index if not exists maintenance_work_orders_org_request_number_uidx
  on public.maintenance_work_orders (organization_id, request_number)
  where request_number is not null;

-- ---------------------------------------------------------------------------
-- Request number counters (org + year, collision-safe)
-- ---------------------------------------------------------------------------

create table if not exists public.facility_request_number_counters (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  year integer not null check (year >= 2000 and year <= 2100),
  last_value integer not null default 0 check (last_value >= 0),
  primary key (organization_id, year)
);

alter table public.facility_request_number_counters enable row level security;

-- ---------------------------------------------------------------------------
-- Forms + immutable versions
-- ---------------------------------------------------------------------------

create table if not exists public.facility_request_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  instructions text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive')),
  access_policy text not null default 'contact_required'
    check (access_policy in ('contact_required', 'authenticated_only')),
  applicability text not null default 'all_buildings'
    check (applicability in ('all_buildings', 'one_building')),
  property_id uuid references public.property_properties (id) on delete set null,
  current_version_id uuid,
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_request_forms_org_status_idx
  on public.facility_request_forms (organization_id, status);

create table if not exists public.facility_request_form_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  form_id uuid not null references public.facility_request_forms (id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  field_snapshot jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (form_id, version_number)
);

create index if not exists facility_request_form_versions_form_idx
  on public.facility_request_form_versions (form_id, version_number desc);

alter table public.facility_request_forms
  drop constraint if exists facility_request_forms_current_version_id_fkey;

alter table public.facility_request_forms
  add constraint facility_request_forms_current_version_id_fkey
  foreign key (current_version_id) references public.facility_request_form_versions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Public intakes (QR / share link)
-- ---------------------------------------------------------------------------

create table if not exists public.facility_request_intakes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  form_id uuid not null references public.facility_request_forms (id) on delete cascade,
  public_token_hash text not null unique,
  public_token_prefix text not null,
  context_kind text not null default 'general'
    check (context_kind in ('general', 'building', 'floor', 'department', 'room', 'asset')),
  context_json jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz
);

create index if not exists facility_request_intakes_org_form_idx
  on public.facility_request_intakes (organization_id, form_id, status);

-- ---------------------------------------------------------------------------
-- Immutable submissions
-- ---------------------------------------------------------------------------

create table if not exists public.facility_request_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  form_id uuid not null references public.facility_request_forms (id) on delete restrict,
  form_version_id uuid not null references public.facility_request_form_versions (id) on delete restrict,
  intake_id uuid not null references public.facility_request_intakes (id) on delete restrict,
  work_order_id uuid not null unique references public.maintenance_work_orders (id) on delete restrict,
  source text not null
    check (source in ('qr', 'public_link', 'authenticated')),
  requester_name text,
  requester_email text,
  requester_phone text,
  requester_identified boolean not null default true,
  status_token_hash text not null unique,
  values_snapshot jsonb not null,
  idempotency_key text not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, intake_id, idempotency_key)
);

create index if not exists facility_request_submissions_org_submitted_idx
  on public.facility_request_submissions (organization_id, submitted_at desc);

create table if not exists public.facility_request_submission_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  submission_id uuid not null references public.facility_request_submissions (id) on delete cascade,
  field_key text not null,
  value_text text,
  value_json jsonb
);

create index if not exists facility_request_submission_values_submission_idx
  on public.facility_request_submission_values (submission_id);

create table if not exists public.facility_request_media_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  intake_id uuid not null references public.facility_request_intakes (id) on delete cascade,
  media_id uuid,
  storage_reference text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_request_media_grants_intake_idx
  on public.facility_request_media_grants (intake_id, expires_at);

-- ---------------------------------------------------------------------------
-- MEDIA-001: public intake parent + nullable uploader
-- ---------------------------------------------------------------------------

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
    'facility_request_intake'
  ));

alter table public.media_attachments
  alter column uploaded_by_user_id drop not null;

-- ---------------------------------------------------------------------------
-- RLS — staff only. Public writes use the service role after token hash lookup.
-- ---------------------------------------------------------------------------

alter table public.facility_request_forms enable row level security;
alter table public.facility_request_form_versions enable row level security;
alter table public.facility_request_intakes enable row level security;
alter table public.facility_request_submissions enable row level security;
alter table public.facility_request_submission_values enable row level security;
alter table public.facility_request_media_grants enable row level security;

drop policy if exists facility_request_forms_select on public.facility_request_forms;
create policy facility_request_forms_select
on public.facility_request_forms
for select
to authenticated
using (public.is_org_member(organization_id) and public.org_allows_work_surface(organization_id, 'facility'));

drop policy if exists facility_request_forms_write on public.facility_request_forms;
create policy facility_request_forms_write
on public.facility_request_forms
for all
to authenticated
using (public.can_manage_facility_ops(organization_id))
with check (public.can_manage_facility_ops(organization_id));

drop policy if exists facility_request_form_versions_select on public.facility_request_form_versions;
create policy facility_request_form_versions_select
on public.facility_request_form_versions
for select
to authenticated
using (public.is_org_member(organization_id) and public.org_allows_work_surface(organization_id, 'facility'));

drop policy if exists facility_request_form_versions_write on public.facility_request_form_versions;
create policy facility_request_form_versions_write
on public.facility_request_form_versions
for all
to authenticated
using (public.can_manage_facility_ops(organization_id))
with check (public.can_manage_facility_ops(organization_id));

drop policy if exists facility_request_intakes_select on public.facility_request_intakes;
create policy facility_request_intakes_select
on public.facility_request_intakes
for select
to authenticated
using (public.is_org_member(organization_id) and public.org_allows_work_surface(organization_id, 'facility'));

drop policy if exists facility_request_intakes_write on public.facility_request_intakes;
create policy facility_request_intakes_write
on public.facility_request_intakes
for all
to authenticated
using (public.can_manage_facility_ops(organization_id))
with check (public.can_manage_facility_ops(organization_id));

drop policy if exists facility_request_submissions_select on public.facility_request_submissions;
create policy facility_request_submissions_select
on public.facility_request_submissions
for select
to authenticated
using (public.is_org_member(organization_id) and public.org_allows_work_surface(organization_id, 'facility'));

drop policy if exists facility_request_submission_values_select on public.facility_request_submission_values;
create policy facility_request_submission_values_select
on public.facility_request_submission_values
for select
to authenticated
using (public.is_org_member(organization_id) and public.org_allows_work_surface(organization_id, 'facility'));

revoke all on public.facility_request_forms from anon, public;
revoke all on public.facility_request_form_versions from anon, public;
revoke all on public.facility_request_intakes from anon, public;
revoke all on public.facility_request_submissions from anon, public;
revoke all on public.facility_request_submission_values from anon, public;
revoke all on public.facility_request_media_grants from anon, public;
revoke all on public.facility_request_number_counters from anon, public;

grant select on public.facility_request_forms to authenticated;
grant select, insert, update, delete on public.facility_request_forms to authenticated;
grant select on public.facility_request_form_versions to authenticated;
grant select, insert, update, delete on public.facility_request_form_versions to authenticated;
grant select on public.facility_request_intakes to authenticated;
grant select, insert, update on public.facility_request_intakes to authenticated;
grant select on public.facility_request_submissions to authenticated;
grant select on public.facility_request_submission_values to authenticated;

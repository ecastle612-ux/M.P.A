-- MX-001 foundation: Customer Migration Center — jobs, imports, mapping, review, rollback.

-- ---------------------------------------------------------------------------
-- Migration jobs
-- ---------------------------------------------------------------------------

create table if not exists public.migration_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_number text not null,
  name text not null,
  status text not null default 'draft' check (
    status in (
      'draft',
      'source_selected',
      'files_uploaded',
      'mapped',
      'preview_ready',
      'importing',
      'completed',
      'failed',
      'rolled_back',
      'cancelled'
    )
  ),
  source_software text not null default 'custom' check (
    source_software in (
      'custom',
      'appfolio',
      'buildium',
      'doorloop',
      'rent_manager',
      'propertyware',
      'yardi',
      'rentvine',
      'other'
    )
  ),
  current_step text not null default 'select_software' check (
    current_step in (
      'select_software',
      'upload',
      'map_columns',
      'preview',
      'import',
      'results',
      'review_exceptions'
    )
  ),
  progress_total integer not null default 0,
  progress_imported integer not null default 0,
  progress_errors integer not null default 0,
  progress_warnings integer not null default 0,
  completion_pct numeric(5, 2) not null default 0,
  checkpoint_id uuid,
  summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  rolled_back_at timestamptz,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, job_number)
);

create index if not exists migration_jobs_org_status_idx
  on public.migration_jobs (organization_id, status)
  where deleted_at is null;

create index if not exists migration_jobs_org_updated_idx
  on public.migration_jobs (organization_id, updated_at desc)
  where deleted_at is null;

drop trigger if exists trg_migration_jobs_updated_at on public.migration_jobs;
create trigger trg_migration_jobs_updated_at
before update on public.migration_jobs
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Migration checkpoints (rollback snapshots)
-- ---------------------------------------------------------------------------

create table if not exists public.migration_checkpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  label text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint migration_checkpoints_job_fk
    foreign key (job_id, organization_id)
    references public.migration_jobs (id, organization_id)
    on delete cascade
);

create index if not exists migration_checkpoints_org_job_idx
  on public.migration_checkpoints (organization_id, job_id, created_at desc);

alter table public.migration_jobs
  drop constraint if exists migration_jobs_checkpoint_fk;

alter table public.migration_jobs
  add constraint migration_jobs_checkpoint_fk
  foreign key (checkpoint_id, organization_id)
  references public.migration_checkpoints (id, organization_id)
  on delete set null;

-- composite unique for checkpoint FK from jobs
create unique index if not exists migration_checkpoints_org_id_uidx
  on public.migration_checkpoints (id, organization_id);

-- ---------------------------------------------------------------------------
-- Import files
-- ---------------------------------------------------------------------------

create table if not exists public.migration_import_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  file_type text not null check (file_type in ('csv', 'xlsx', 'zip', 'folder')),
  original_filename text not null,
  storage_path text,
  entity_type text check (
    entity_type is null
    or entity_type in ('property', 'unit', 'tenant', 'lease', 'vendor', 'applicant', 'document')
  ),
  row_count integer not null default 0,
  column_headers jsonb not null default '[]'::jsonb,
  parse_status text not null default 'pending' check (
    parse_status in ('pending', 'parsed', 'failed')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint migration_import_files_job_fk
    foreign key (job_id, organization_id)
    references public.migration_jobs (id, organization_id)
    on delete cascade
);

create index if not exists migration_import_files_org_job_idx
  on public.migration_import_files (organization_id, job_id, created_at desc);

create unique index if not exists migration_import_files_org_id_uidx
  on public.migration_import_files (id, organization_id);

-- ---------------------------------------------------------------------------
-- Mapping templates
-- ---------------------------------------------------------------------------

create table if not exists public.migration_mapping_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  source_software text not null,
  entity_type text not null check (
    entity_type in ('property', 'unit', 'tenant', 'lease', 'vendor', 'applicant', 'document')
  ),
  column_map jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists migration_mapping_templates_source_idx
  on public.migration_mapping_templates (source_software, entity_type, is_system);

drop trigger if exists trg_migration_mapping_templates_updated_at on public.migration_mapping_templates;
create trigger trg_migration_mapping_templates_updated_at
before update on public.migration_mapping_templates
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Review queue
-- ---------------------------------------------------------------------------

create table if not exists public.migration_review_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  item_type text not null check (
    item_type in (
      'unknown_property',
      'duplicate_property',
      'duplicate_unit',
      'duplicate_tenant',
      'duplicate_lease',
      'duplicate_vendor',
      'unmapped_field',
      'validation_error',
      'ambiguous_match'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'resolved', 'skipped', 'merged', 'replaced', 'kept')
  ),
  title text not null,
  description text,
  source_row jsonb not null default '{}'::jsonb,
  candidate_records jsonb not null default '[]'::jsonb,
  resolution jsonb not null default '{}'::jsonb,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint migration_review_items_job_fk
    foreign key (job_id, organization_id)
    references public.migration_jobs (id, organization_id)
    on delete cascade
);

create index if not exists migration_review_items_org_job_status_idx
  on public.migration_review_items (organization_id, job_id, status)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Activity audit log
-- ---------------------------------------------------------------------------

create table if not exists public.migration_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  event_type text not null check (
    event_type in (
      'job_created',
      'source_selected',
      'file_uploaded',
      'mapping_saved',
      'preview_generated',
      'import_started',
      'import_progress',
      'import_completed',
      'import_failed',
      'review_item_created',
      'review_item_resolved',
      'rollback_started',
      'rollback_completed',
      'job_updated',
      'job_deleted'
    )
  ),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint migration_activity_job_fk
    foreign key (job_id, organization_id)
    references public.migration_jobs (id, organization_id)
    on delete cascade
);

create index if not exists migration_activity_org_job_idx
  on public.migration_activity (organization_id, job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Record links (rollback scope)
-- ---------------------------------------------------------------------------

create table if not exists public.migration_record_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  entity_type text not null check (
    entity_type in ('property', 'unit', 'tenant', 'lease', 'vendor', 'applicant', 'vault_document')
  ),
  entity_id uuid not null,
  source_key text,
  source_row_index integer,
  import_file_id uuid,
  rolled_back_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint migration_record_links_job_fk
    foreign key (job_id, organization_id)
    references public.migration_jobs (id, organization_id)
    on delete cascade,
  constraint migration_record_links_import_file_fk
    foreign key (import_file_id, organization_id)
    references public.migration_import_files (id, organization_id)
    on delete set null
);

create index if not exists migration_record_links_org_job_idx
  on public.migration_record_links (organization_id, job_id)
  where rolled_back_at is null;

create index if not exists migration_record_links_entity_idx
  on public.migration_record_links (organization_id, entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('migration:create', 'migration', 'Create migration jobs'),
  ('migration:read', 'migration', 'Read migration jobs and imports'),
  ('migration:update', 'migration', 'Update migration jobs, mappings, and reviews'),
  ('migration:rollback', 'migration', 'Rollback migration imports'),
  ('migration:delete', 'migration', 'Delete migration jobs')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'migration:create'),
  ('property_manager', 'migration:read'),
  ('property_manager', 'migration:update'),
  ('property_manager', 'migration:rollback'),
  ('property_manager', 'migration:delete'),
  ('property_owner', 'migration:create'),
  ('property_owner', 'migration:read'),
  ('property_owner', 'migration:update'),
  ('property_owner', 'migration:rollback'),
  ('property_owner', 'migration:delete')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.migration_jobs enable row level security;
alter table public.migration_checkpoints enable row level security;
alter table public.migration_import_files enable row level security;
alter table public.migration_mapping_templates enable row level security;
alter table public.migration_review_items enable row level security;
alter table public.migration_activity enable row level security;
alter table public.migration_record_links enable row level security;

-- migration_jobs
drop policy if exists migration_jobs_select on public.migration_jobs;
create policy migration_jobs_select on public.migration_jobs for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_jobs_insert on public.migration_jobs;
create policy migration_jobs_insert on public.migration_jobs for insert
with check (public.has_org_capability(organization_id, 'migration:create') and created_by = auth.uid());

drop policy if exists migration_jobs_update on public.migration_jobs;
create policy migration_jobs_update on public.migration_jobs for update
using (
  public.has_org_capability(organization_id, 'migration:update')
  or public.has_org_capability(organization_id, 'migration:rollback')
  or public.has_org_capability(organization_id, 'migration:delete')
)
with check (
  public.has_org_capability(organization_id, 'migration:update')
  or public.has_org_capability(organization_id, 'migration:rollback')
  or public.has_org_capability(organization_id, 'migration:delete')
);

drop policy if exists migration_jobs_delete on public.migration_jobs;
create policy migration_jobs_delete on public.migration_jobs for delete
using (public.has_org_capability(organization_id, 'migration:delete'));

-- migration_checkpoints
drop policy if exists migration_checkpoints_select on public.migration_checkpoints;
create policy migration_checkpoints_select on public.migration_checkpoints for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_checkpoints_insert on public.migration_checkpoints;
create policy migration_checkpoints_insert on public.migration_checkpoints for insert
with check (public.has_org_capability(organization_id, 'migration:update') and created_by = auth.uid());

-- migration_import_files
drop policy if exists migration_import_files_select on public.migration_import_files;
create policy migration_import_files_select on public.migration_import_files for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_import_files_insert on public.migration_import_files;
create policy migration_import_files_insert on public.migration_import_files for insert
with check (public.has_org_capability(organization_id, 'migration:update') and created_by = auth.uid());

drop policy if exists migration_import_files_update on public.migration_import_files;
create policy migration_import_files_update on public.migration_import_files for update
using (public.has_org_capability(organization_id, 'migration:update'))
with check (public.has_org_capability(organization_id, 'migration:update'));

-- migration_mapping_templates
drop policy if exists migration_mapping_templates_select on public.migration_mapping_templates;
create policy migration_mapping_templates_select on public.migration_mapping_templates for select
using (
  is_system = true
  or organization_id is null
  or public.has_org_capability(organization_id, 'migration:read')
);

drop policy if exists migration_mapping_templates_insert on public.migration_mapping_templates;
create policy migration_mapping_templates_insert on public.migration_mapping_templates for insert
with check (
  organization_id is not null
  and public.has_org_capability(organization_id, 'migration:update')
);

drop policy if exists migration_mapping_templates_update on public.migration_mapping_templates;
create policy migration_mapping_templates_update on public.migration_mapping_templates for update
using (
  organization_id is not null
  and public.has_org_capability(organization_id, 'migration:update')
)
with check (
  organization_id is not null
  and public.has_org_capability(organization_id, 'migration:update')
);

-- migration_review_items
drop policy if exists migration_review_items_select on public.migration_review_items;
create policy migration_review_items_select on public.migration_review_items for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_review_items_insert on public.migration_review_items;
create policy migration_review_items_insert on public.migration_review_items for insert
with check (public.has_org_capability(organization_id, 'migration:update'));

drop policy if exists migration_review_items_update on public.migration_review_items;
create policy migration_review_items_update on public.migration_review_items for update
using (public.has_org_capability(organization_id, 'migration:update'))
with check (public.has_org_capability(organization_id, 'migration:update'));

-- migration_activity
drop policy if exists migration_activity_select on public.migration_activity;
create policy migration_activity_select on public.migration_activity for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_activity_insert on public.migration_activity;
create policy migration_activity_insert on public.migration_activity for insert
with check (public.has_org_capability(organization_id, 'migration:update') and created_by = auth.uid());

-- migration_record_links
drop policy if exists migration_record_links_select on public.migration_record_links;
create policy migration_record_links_select on public.migration_record_links for select
using (public.has_org_capability(organization_id, 'migration:read'));

drop policy if exists migration_record_links_insert on public.migration_record_links;
create policy migration_record_links_insert on public.migration_record_links for insert
with check (public.has_org_capability(organization_id, 'migration:update'));

drop policy if exists migration_record_links_update on public.migration_record_links;
create policy migration_record_links_update on public.migration_record_links for update
using (
  public.has_org_capability(organization_id, 'migration:update')
  or public.has_org_capability(organization_id, 'migration:rollback')
)
with check (
  public.has_org_capability(organization_id, 'migration:update')
  or public.has_org_capability(organization_id, 'migration:rollback')
);

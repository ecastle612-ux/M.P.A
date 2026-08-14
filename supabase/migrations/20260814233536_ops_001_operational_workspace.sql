-- OPS-001 Phase 1: authored documents + operational tables (additive).
-- Do not rewrite existing document_documents rows or storage objects.

-- ---------------------------------------------------------------------------
-- A. Evolve the existing document library
-- ---------------------------------------------------------------------------

alter table public.document_documents
  add column if not exists kind text not null default 'file',
  add column if not exists template_id text,
  add column if not exists body_json jsonb,
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_documents_kind_check'
  ) then
    alter table public.document_documents
      add constraint document_documents_kind_check
      check (kind in ('file', 'authored'));
  end if;
end
$$;

create index if not exists document_documents_org_kind_idx
  on public.document_documents (organization_id, kind, created_at desc)
  where deleted_at is null;

create index if not exists document_documents_org_deleted_idx
  on public.document_documents (organization_id, deleted_at);

alter table public.document_document_versions
  add column if not exists body_json jsonb;

-- Existing document RLS stays org-scoped (is_org_member / is_org_manager).
-- Soft-delete visibility is enforced in the application so restore can list deleted rows.

-- ---------------------------------------------------------------------------
-- B. Operational tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspace_tables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  connection_source text,
  connection_surface text,
  snapshot_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint workspace_tables_connection_source_check
    check (
      connection_source is null
      or connection_source in ('facility_assets', 'facility_stock', 'work_orders')
    ),
  constraint workspace_tables_connection_surface_check
    check (
      connection_surface is null
      or connection_surface in ('residential', 'facility')
    )
);

create table if not exists public.workspace_table_columns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  table_id uuid not null references public.workspace_tables (id) on delete cascade,
  name text not null,
  data_type text not null default 'text',
  position integer not null default 0,
  select_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint workspace_table_columns_data_type_check
    check (data_type in ('text', 'number', 'date', 'select', 'boolean'))
);

create table if not exists public.workspace_table_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  table_id uuid not null references public.workspace_tables (id) on delete cascade,
  position integer not null default 0,
  cells jsonb not null default '{}'::jsonb,
  source_entity_type text,
  source_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_tables_org_idx
  on public.workspace_tables (organization_id, created_at desc)
  where deleted_at is null;

create index if not exists workspace_table_columns_table_idx
  on public.workspace_table_columns (table_id, position);

create index if not exists workspace_table_rows_table_idx
  on public.workspace_table_rows (table_id, position);

alter table public.workspace_tables enable row level security;
alter table public.workspace_table_columns enable row level security;
alter table public.workspace_table_rows enable row level security;

-- Staff-only workspace access: current-row org predicates + membership roles
-- on organization_memberships (other table). Do not self-select workspace_* by id.

drop policy if exists workspace_tables_select on public.workspace_tables;
create policy workspace_tables_select
  on public.workspace_tables
  for select
  using (
    deleted_at is null
    and public.is_org_member(organization_id)
    and exists (
      select 1
      from public.organization_memberships memberships
      where memberships.organization_id = workspace_tables.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
        and memberships.roles && array[
          'organization_admin',
          'property_manager',
          'leasing_agent',
          'maintenance_technician'
        ]::text[]
    )
  );

drop policy if exists workspace_tables_write on public.workspace_tables;
create policy workspace_tables_write
  on public.workspace_tables
  for all
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

drop policy if exists workspace_table_columns_select on public.workspace_table_columns;
create policy workspace_table_columns_select
  on public.workspace_table_columns
  for select
  using (
    public.is_org_member(organization_id)
    and exists (
      select 1
      from public.organization_memberships memberships
      where memberships.organization_id = workspace_table_columns.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
        and memberships.roles && array[
          'organization_admin',
          'property_manager',
          'leasing_agent',
          'maintenance_technician'
        ]::text[]
    )
  );

drop policy if exists workspace_table_columns_write on public.workspace_table_columns;
create policy workspace_table_columns_write
  on public.workspace_table_columns
  for all
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

drop policy if exists workspace_table_rows_select on public.workspace_table_rows;
create policy workspace_table_rows_select
  on public.workspace_table_rows
  for select
  using (
    public.is_org_member(organization_id)
    and exists (
      select 1
      from public.organization_memberships memberships
      where memberships.organization_id = workspace_table_rows.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
        and memberships.roles && array[
          'organization_admin',
          'property_manager',
          'leasing_agent',
          'maintenance_technician'
        ]::text[]
    )
  );

drop policy if exists workspace_table_rows_write on public.workspace_table_rows;
create policy workspace_table_rows_write
  on public.workspace_table_rows
  for all
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

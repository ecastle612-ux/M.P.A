-- FAC-OPS-001 Phase E.6 — Inspections + Safety + Compliance
-- Facility owns programs/findings; Maintenance executes spawned shared WOs.
-- Out of scope: capital projects.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.inspections:read', 'facility.inspections', 'Read inspection programs and runs'),
  ('facility.inspections:write', 'facility.inspections', 'Create and run facility inspections'),
  ('facility.safety:read', 'facility.safety', 'Read safety incidents and actions'),
  ('facility.safety:write', 'facility.safety', 'Report and manage safety incidents'),
  ('facility.compliance:read', 'facility.compliance', 'Read compliance obligations'),
  ('facility.compliance:write', 'facility.compliance', 'Create and satisfy compliance obligations'),
  ('facility.compliance:waive', 'facility.compliance', 'Waive compliance obligations with reason')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'facility.inspections:read'),
  ('organization_admin', 'facility.inspections:write'),
  ('organization_admin', 'facility.safety:read'),
  ('organization_admin', 'facility.safety:write'),
  ('organization_admin', 'facility.compliance:read'),
  ('organization_admin', 'facility.compliance:write'),
  ('organization_admin', 'facility.compliance:waive'),
  ('property_manager', 'facility.inspections:read'),
  ('property_manager', 'facility.inspections:write'),
  ('property_manager', 'facility.safety:read'),
  ('property_manager', 'facility.safety:write'),
  ('property_manager', 'facility.compliance:read'),
  ('property_manager', 'facility.compliance:write'),
  ('property_manager', 'facility.compliance:waive'),
  ('maintenance_technician', 'facility.inspections:read'),
  ('maintenance_technician', 'facility.inspections:write'),
  ('maintenance_technician', 'facility.safety:read'),
  ('maintenance_technician', 'facility.safety:write'),
  ('maintenance_technician', 'facility.compliance:read'),
  ('property_owner', 'facility.inspections:read'),
  ('property_owner', 'facility.safety:read'),
  ('property_owner', 'facility.compliance:read')
on conflict (role, capability_key) do nothing;

-- Documents: evidence attach for FO aggregates (E6-4)
alter table public.document_documents
  drop constraint if exists document_documents_entity_type_check;

alter table public.document_documents
  add constraint document_documents_entity_type_check
  check (
    entity_type in (
      'property',
      'resident',
      'lease',
      'maintenance',
      'vendor',
      'organization',
      'facility_inspection_run',
      'facility_safety_incident',
      'facility_compliance_obligation'
    )
  );

create table if not exists public.facility_inspection_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  asset_id uuid references public.facility_assets (id) on delete set null,
  system_id uuid references public.facility_systems (id) on delete set null,
  name text not null,
  scope_type text not null default 'site'
    check (scope_type in ('site', 'asset', 'system')),
  cadence_unit text not null default 'month'
    check (cadence_unit in ('day', 'week', 'month', 'year', 'one_shot')),
  cadence_interval integer not null default 1 check (cadence_interval >= 1),
  next_due_on date,
  checklist_template jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'retired')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint facility_inspection_programs_scope_check check (
    (scope_type = 'site' and asset_id is null and system_id is null)
    or (scope_type = 'asset' and asset_id is not null)
    or (scope_type = 'system' and system_id is not null)
  )
);

create index if not exists facility_inspection_programs_org_idx
  on public.facility_inspection_programs (organization_id, status, next_due_on);

create table if not exists public.facility_inspection_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  program_id uuid not null references public.facility_inspection_programs (id) on delete restrict,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  asset_id uuid references public.facility_assets (id) on delete set null,
  system_id uuid references public.facility_systems (id) on delete set null,
  status text not null default 'scheduled'
    check (status in (
      'scheduled',
      'in_progress',
      'completed_pass',
      'completed_fail',
      'cancelled'
    )),
  due_on date,
  started_at timestamptz,
  completed_at timestamptz,
  actor_user_id uuid references auth.users (id) on delete set null,
  results jsonb not null default '[]'::jsonb,
  cancel_reason text,
  completion_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_inspection_runs_org_idx
  on public.facility_inspection_runs (organization_id, status, due_on);

create table if not exists public.facility_inspection_run_work_orders (
  run_id uuid not null references public.facility_inspection_runs (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  checklist_item_key text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (run_id, work_order_id)
);

create table if not exists public.facility_safety_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  asset_id uuid references public.facility_assets (id) on delete set null,
  system_id uuid references public.facility_systems (id) on delete set null,
  incident_type text not null default 'incident'
    check (incident_type in ('incident', 'near_miss')),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'reported'
    check (status in ('reported', 'triaged', 'actions_open', 'closed')),
  title text not null,
  description text not null,
  closed_summary text,
  reported_by_user_id uuid references auth.users (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_safety_incidents_org_idx
  on public.facility_safety_incidents (organization_id, status, severity);

create table if not exists public.facility_safety_incident_work_orders (
  incident_id uuid not null references public.facility_safety_incidents (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (incident_id, work_order_id)
);

create table if not exists public.facility_compliance_obligations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  title text not null,
  authority text not null default 'internal',
  requirement text,
  due_on date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'due', 'overdue', 'satisfied', 'waived')),
  evidence_document_ids uuid[] not null default '{}',
  waiver_reason text,
  waived_by_user_id uuid references auth.users (id) on delete set null,
  satisfied_at timestamptz,
  waived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_compliance_obligations_org_idx
  on public.facility_compliance_obligations (organization_id, status, due_on);

alter table public.facility_inspection_programs enable row level security;
alter table public.facility_inspection_runs enable row level security;
alter table public.facility_inspection_run_work_orders enable row level security;
alter table public.facility_safety_incidents enable row level security;
alter table public.facility_safety_incident_work_orders enable row level security;
alter table public.facility_compliance_obligations enable row level security;

drop policy if exists facility_inspection_programs_select on public.facility_inspection_programs;
create policy facility_inspection_programs_select on public.facility_inspection_programs
for select using (public.is_org_member(organization_id));
drop policy if exists facility_inspection_programs_manage on public.facility_inspection_programs;
create policy facility_inspection_programs_manage on public.facility_inspection_programs
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_inspection_runs_select on public.facility_inspection_runs;
create policy facility_inspection_runs_select on public.facility_inspection_runs
for select using (public.is_org_member(organization_id));
drop policy if exists facility_inspection_runs_manage on public.facility_inspection_runs;
create policy facility_inspection_runs_manage on public.facility_inspection_runs
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);

drop policy if exists facility_inspection_run_wos_select on public.facility_inspection_run_work_orders;
create policy facility_inspection_run_wos_select on public.facility_inspection_run_work_orders
for select using (public.is_org_member(organization_id));
drop policy if exists facility_inspection_run_wos_manage on public.facility_inspection_run_work_orders;
create policy facility_inspection_run_wos_manage on public.facility_inspection_run_work_orders
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);

drop policy if exists facility_safety_incidents_select on public.facility_safety_incidents;
create policy facility_safety_incidents_select on public.facility_safety_incidents
for select using (public.is_org_member(organization_id));
drop policy if exists facility_safety_incidents_manage on public.facility_safety_incidents;
create policy facility_safety_incidents_manage on public.facility_safety_incidents
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);

drop policy if exists facility_safety_incident_wos_select on public.facility_safety_incident_work_orders;
create policy facility_safety_incident_wos_select on public.facility_safety_incident_work_orders
for select using (public.is_org_member(organization_id));
drop policy if exists facility_safety_incident_wos_manage on public.facility_safety_incident_work_orders;
create policy facility_safety_incident_wos_manage on public.facility_safety_incident_work_orders
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);

drop policy if exists facility_compliance_obligations_select on public.facility_compliance_obligations;
create policy facility_compliance_obligations_select on public.facility_compliance_obligations
for select using (public.is_org_member(organization_id));
drop policy if exists facility_compliance_obligations_manage on public.facility_compliance_obligations;
create policy facility_compliance_obligations_manage on public.facility_compliance_obligations
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

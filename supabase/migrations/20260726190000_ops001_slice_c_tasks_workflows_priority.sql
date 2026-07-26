-- OPS-001 Slice C: Task Engine + Workflow Orchestration + Priority Engine substrate.
-- Additive tables only. Preserves Slice A Event Bus / Slice B notify/remind/schedule.
-- No FAC-002 / maintenance WO schema redesign.

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table if not exists public.ops_tasks (
  task_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (
    priority in ('critical', 'high', 'medium', 'low')
  ),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'blocked', 'done', 'canceled')
  ),
  due_at timestamptz,
  owner_principal_id uuid,
  followers jsonb not null default '[]'::jsonb,
  dependency_task_ids jsonb not null default '[]'::jsonb,
  subject_type text not null,
  subject_id uuid not null,
  deep_link text,
  source_event_id uuid,
  workflow_instance_id uuid,
  workflow_step_id text,
  idempotency_key text not null,
  created_by text not null default 'system' check (
    created_by in ('system', 'automation', 'user', 'workflow')
  ),
  created_by_principal_id uuid,
  completed_at timestamptz,
  canceled_at timestamptz,
  last_error text,
  attempt_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, idempotency_key)
);

create index if not exists ops_tasks_org_priority_status_idx
  on public.ops_tasks (organization_id, priority, status, due_at);

create index if not exists ops_tasks_org_subject_idx
  on public.ops_tasks (organization_id, subject_type, subject_id);

create index if not exists ops_tasks_org_owner_idx
  on public.ops_tasks (organization_id, owner_principal_id, status)
  where owner_principal_id is not null;

create index if not exists ops_tasks_source_event_idx
  on public.ops_tasks (source_event_id)
  where source_event_id is not null;

comment on table public.ops_tasks is
  'OPS-001 Slice C Task Engine. Org-scoped; retry-safe via (organization_id, idempotency_key).';

-- ---------------------------------------------------------------------------
-- Workflow templates (versioned definitions)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_workflow_templates (
  template_id text primary key,
  version integer not null default 1,
  name text not null,
  description text,
  trigger_event_type text not null,
  definition jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.ops_workflow_templates is
  'OPS-001 Slice C workflow template registry. Pilot: maintenance.standard.v1.';

-- ---------------------------------------------------------------------------
-- Workflow instances
-- ---------------------------------------------------------------------------
create table if not exists public.ops_workflow_instances (
  instance_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id text not null references public.ops_workflow_templates (template_id),
  template_version integer not null default 1,
  subject_type text not null,
  subject_id uuid not null,
  status text not null default 'active' check (
    status in ('active', 'completed', 'canceled', 'failed')
  ),
  current_step_id text not null,
  priority text not null default 'medium' check (
    priority in ('critical', 'high', 'medium', 'low')
  ),
  correlation_id text,
  trigger_event_id uuid,
  last_event_id uuid,
  last_error text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, template_id, subject_type, subject_id)
);

create index if not exists ops_workflow_instances_org_status_idx
  on public.ops_workflow_instances (organization_id, status, updated_at desc);

create index if not exists ops_workflow_instances_subject_idx
  on public.ops_workflow_instances (organization_id, subject_type, subject_id);

comment on table public.ops_workflow_instances is
  'OPS-001 Slice C running workflow cases (one active pilot instance per subject+template).';

-- ---------------------------------------------------------------------------
-- Workflow step history (idempotent advances)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_workflow_step_events (
  step_event_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  instance_id uuid not null references public.ops_workflow_instances (instance_id) on delete cascade,
  step_id text not null,
  action text not null check (action in ('entered', 'exited', 'skipped')),
  causation_event_id uuid,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  unique (instance_id, step_id, action, causation_event_id)
);

create index if not exists ops_workflow_step_events_instance_idx
  on public.ops_workflow_step_events (instance_id, occurred_at);

-- FK from tasks → workflow instances (added after instances exist)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ops_tasks_workflow_instance_fkey'
  ) then
    alter table public.ops_tasks
      add constraint ops_tasks_workflow_instance_fkey
      foreign key (workflow_instance_id)
      references public.ops_workflow_instances (instance_id)
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ops_tasks enable row level security;
alter table public.ops_workflow_templates enable row level security;
alter table public.ops_workflow_instances enable row level security;
alter table public.ops_workflow_step_events enable row level security;

drop policy if exists ops_tasks_select_member on public.ops_tasks;
create policy ops_tasks_select_member
on public.ops_tasks for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_tasks_insert_member on public.ops_tasks;
create policy ops_tasks_insert_member
on public.ops_tasks for insert
with check (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_tasks_update_member on public.ops_tasks;
create policy ops_tasks_update_member
on public.ops_tasks for update
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_workflow_templates_select_all on public.ops_workflow_templates;
create policy ops_workflow_templates_select_all
on public.ops_workflow_templates for select
using (true);

drop policy if exists ops_workflow_instances_select_member on public.ops_workflow_instances;
create policy ops_workflow_instances_select_member
on public.ops_workflow_instances for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_workflow_instances.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_workflow_step_events_select_member on public.ops_workflow_step_events;
create policy ops_workflow_step_events_select_member
on public.ops_workflow_step_events for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_workflow_step_events.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

-- Service role bypasses RLS for engine writes (same pattern as Slice A/B).

-- ---------------------------------------------------------------------------
-- Seed maintenance.standard.v1 pilot template
-- ---------------------------------------------------------------------------
insert into public.ops_workflow_templates (
  template_id, version, name, description, trigger_event_type, definition, enabled
) values (
  'maintenance.standard.v1',
  1,
  'Maintenance standard (pilot)',
  'OPS-001 Slice C pilot — event-backed WO orchestration without redesigning FAC-002 UI.',
  'maintenance.request.created',
  '{
    "steps": [
      {"id": "assign_vendor", "title": "Assign vendor"},
      {"id": "vendor_accepted", "title": "Vendor accepted"},
      {"id": "on_site", "title": "Technician on site"},
      {"id": "repair_complete", "title": "Repair complete"}
    ],
    "transitions": [
      {"from": "assign_vendor", "on": "maintenance.vendor.assigned", "to": "vendor_accepted", "task": "Confirm vendor acceptance"},
      {"from": "assign_vendor", "on": "maintenance.vendor.declined", "to": "assign_vendor", "task": "Reassign vendor after decline", "reenter": true},
      {"from": "vendor_accepted", "on": "maintenance.technician.arrived", "to": "on_site", "task": "Complete on-site work"},
      {"from": "on_site", "on": "maintenance.work.completed", "to": "repair_complete", "terminal": true}
    ],
    "startStep": "assign_vendor",
    "startTask": "Assign vendor to work order"
  }'::jsonb,
  true
)
on conflict (template_id) do update set
  version = excluded.version,
  name = excluded.name,
  description = excluded.description,
  trigger_event_type = excluded.trigger_event_type,
  definition = excluded.definition,
  enabled = excluded.enabled,
  updated_at = timezone('utc', now());

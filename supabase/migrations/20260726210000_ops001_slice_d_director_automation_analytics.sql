-- OPS-001 Slice D: AI Operations Director + Automation Engine + Operational Analytics.
-- Additive tables only. Preserves Slices A–C. No FAC-002 / Command Center / Slice E surfaces.

-- ---------------------------------------------------------------------------
-- Automation rules (org-scoped + platform templates)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_automation_rules (
  rule_id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  template_key text,
  name text not null,
  description text,
  trigger_kind text not null check (trigger_kind in ('event', 'schedule')),
  trigger_event_type text,
  schedule_cron text,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  human_gate boolean not null default false,
  priority integer not null default 100,
  enabled boolean not null default true,
  max_depth integer not null default 3,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ops_automation_rules_org_or_template check (
    organization_id is not null or template_key is not null
  )
);

create unique index if not exists ops_automation_rules_org_template_uidx
  on public.ops_automation_rules (organization_id, template_key)
  where organization_id is not null and template_key is not null;

create unique index if not exists ops_automation_rules_platform_template_uidx
  on public.ops_automation_rules (template_key)
  where organization_id is null and template_key is not null;

create index if not exists ops_automation_rules_trigger_idx
  on public.ops_automation_rules (trigger_event_type, enabled)
  where trigger_kind = 'event';

comment on table public.ops_automation_rules is
  'OPS-001 Slice D Automation Engine rules. Platform templates (org null) apply per event org.';

-- ---------------------------------------------------------------------------
-- Automation fire ledger (idempotent)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_automation_fires (
  fire_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  rule_id uuid not null references public.ops_automation_rules (rule_id) on delete cascade,
  event_id uuid,
  idempotency_key text not null,
  status text not null default 'pending' check (
    status in ('pending', 'running', 'succeeded', 'failed', 'skipped', 'awaiting_approval')
  ),
  depth integer not null default 0,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (rule_id, idempotency_key)
);

create index if not exists ops_automation_fires_org_status_idx
  on public.ops_automation_fires (organization_id, status, created_at desc);

create index if not exists ops_automation_fires_event_idx
  on public.ops_automation_fires (event_id)
  where event_id is not null;

comment on table public.ops_automation_fires is
  'OPS-001 Slice D automation execution ledger. Idempotent on (rule_id, idempotency_key).';

-- ---------------------------------------------------------------------------
-- AI Operations Director recommendations
-- ---------------------------------------------------------------------------
create table if not exists public.ops_ai_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_event_id uuid,
  situation_key text not null,
  action_class text not null check (
    action_class in (
      'label',
      'recommend',
      'draft',
      'alert',
      'escalate',
      'reassign',
      'create_task',
      'outbound_message'
    )
  ),
  title text not null,
  summary text not null,
  confidence numeric(4, 3) not null default 0.700,
  confidence_band text not null check (confidence_band in ('high', 'medium', 'low')),
  requires_human_gate boolean not null default true,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'applied', 'expired', 'canceled')
  ),
  subject_type text not null,
  subject_id uuid not null,
  proposed_action jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  deep_link text,
  approved_by_principal_id uuid,
  approved_at timestamptz,
  rejection_reason text,
  applied_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, idempotency_key)
);

create index if not exists ops_ai_recommendations_org_status_idx
  on public.ops_ai_recommendations (organization_id, status, created_at desc);

create index if not exists ops_ai_recommendations_subject_idx
  on public.ops_ai_recommendations (organization_id, subject_type, subject_id);

comment on table public.ops_ai_recommendations is
  'OPS-001 Slice D AI Operations Director recommendations. Mutating/outbound require human gate.';

-- ---------------------------------------------------------------------------
-- KPI snapshots (operational analytics materialization)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_kpi_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  window_start timestamptz not null,
  window_end timestamptz not null,
  kpi_key text not null,
  kpi_value numeric not null,
  unit text,
  meta jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, kpi_key, window_start, window_end)
);

create index if not exists ops_kpi_snapshots_org_key_idx
  on public.ops_kpi_snapshots (organization_id, kpi_key, window_end desc);

comment on table public.ops_kpi_snapshots is
  'OPS-001 Slice D operational KPI materialization. Org-scoped; secret-free rollups.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ops_automation_rules enable row level security;
alter table public.ops_automation_fires enable row level security;
alter table public.ops_ai_recommendations enable row level security;
alter table public.ops_kpi_snapshots enable row level security;

drop policy if exists ops_automation_rules_select_member on public.ops_automation_rules;
create policy ops_automation_rules_select_member
on public.ops_automation_rules for select
using (
  organization_id is null
  or exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_automation_rules.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_automation_fires_select_member on public.ops_automation_fires;
create policy ops_automation_fires_select_member
on public.ops_automation_fires for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_automation_fires.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_ai_recommendations_select_member on public.ops_ai_recommendations;
create policy ops_ai_recommendations_select_member
on public.ops_ai_recommendations for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_ai_recommendations.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists ops_kpi_snapshots_select_member on public.ops_kpi_snapshots;
create policy ops_kpi_snapshots_select_member
on public.ops_kpi_snapshots for select
using (
  exists (
    select 1 from public.organization_memberships m
    where m.organization_id = ops_kpi_snapshots.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

-- Service role bypasses RLS for engine writes (same pattern as A–C).

-- ---------------------------------------------------------------------------
-- Seed platform playbooks (lease expiry + maintenance overdue)
-- ---------------------------------------------------------------------------
insert into public.ops_automation_rules (
  organization_id, template_key, name, description, trigger_kind, trigger_event_type,
  conditions, actions, human_gate, priority, enabled
)
select
  null,
  'lease.expiring.v1',
  'Lease expiry playbook',
  'OPS-001 Slice D — notify + task on lease.expiring. Outbound AI draft remains human-gated.',
  'event',
  'lease.expiring',
  '{}'::jsonb,
  '[
    {"type":"notify","title":"Lease expiring","body":"A lease is approaching expiry.","category":"leases","priority":"high"},
    {"type":"task.create","title":"Generate lease renewal","priority":"high"},
    {"type":"ai.request","situation":"lease_expiring_draft","action_class":"draft","requires_human_gate":true}
  ]'::jsonb,
  false,
  10,
  true
where not exists (
  select 1 from public.ops_automation_rules r
  where r.organization_id is null and r.template_key = 'lease.expiring.v1'
);

insert into public.ops_automation_rules (
  organization_id, template_key, name, description, trigger_kind, trigger_event_type,
  conditions, actions, human_gate, priority, enabled
)
select
  null,
  'maintenance.overdue.v1',
  'Maintenance overdue playbook',
  'OPS-001 Slice D — escalate follow-up on maintenance.overdue via tasks/notify; priority escalate via director gate.',
  'event',
  'maintenance.overdue',
  '{}'::jsonb,
  '[
    {"type":"notify","title":"Maintenance overdue","body":"A work order is overdue.","category":"maintenance","priority":"emergency"},
    {"type":"task.create","title":"Follow up overdue work order","priority":"critical"},
    {"type":"ai.request","situation":"maintenance_overdue_escalate","action_class":"escalate","requires_human_gate":true}
  ]'::jsonb,
  false,
  5,
  true
where not exists (
  select 1 from public.ops_automation_rules r
  where r.organization_id is null and r.template_key = 'maintenance.overdue.v1'
);

-- Seed KPI materialization schedule (platform interval job)
insert into public.ops_schedules (
  organization_id, name, job_type, schedule_kind, interval_seconds, timezone, next_run_at, enabled, payload
)
select null, 'ops_kpi_materialize', 'ops_kpi_materialize', 'interval', 300, 'UTC', timezone('utc', now()), true, '{}'::jsonb
where not exists (
  select 1 from public.ops_schedules s where s.organization_id is null and s.name = 'ops_kpi_materialize'
);

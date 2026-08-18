-- FO-EFF Slice 6: Deterministic assignment / routing rules.
-- Additive only. Does not rewrite historical work orders, public intake, Slice 1–5, finance, July, or M5.
-- In-repo only. Do not apply this stamp on Production until a later Owner Production package.

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------

create table if not exists public.facility_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'inactive'
    check (status in ('active', 'inactive')),
  sort_order integer not null check (sort_order >= 1),
  assignee_user_id uuid not null references auth.users (id) on delete restrict,
  conditions jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users (id) on delete set null,
  updated_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, sort_order)
);

create index if not exists facility_assignment_rules_org_status_order_idx
  on public.facility_assignment_rules (organization_id, status, sort_order);

create index if not exists facility_assignment_rules_org_assignee_idx
  on public.facility_assignment_rules (organization_id, assignee_user_id);

comment on table public.facility_assignment_rules is
  'FO-EFF Slice 6 deterministic assignment rules. First matching active rule by sort_order wins. Destination is one authorized staff member.';

comment on column public.facility_assignment_rules.sort_order is
  'Unique per organization. 1 is highest priority. Evaluation never uses table row order.';

comment on column public.facility_assignment_rules.conditions is
  'Structured JSON conditions validated server-side. No executable code.';

-- ---------------------------------------------------------------------------
-- Evaluation audit
-- ---------------------------------------------------------------------------

create table if not exists public.facility_assignment_rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  rule_id uuid references public.facility_assignment_rules (id) on delete set null,
  rule_snapshot jsonb not null default '{}'::jsonb,
  result text not null check (result in ('matched', 'no_match', 'invalid_destination')),
  assigned_user_id uuid,
  reason text not null,
  trigger text not null check (trigger in ('initial_create', 'manager_rerun')),
  evaluated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists facility_assignment_eval_initial_wo_uidx
  on public.facility_assignment_rule_evaluations (work_order_id)
  where trigger = 'initial_create';

create index if not exists facility_assignment_eval_org_wo_idx
  on public.facility_assignment_rule_evaluations (organization_id, work_order_id, evaluated_at desc);

create index if not exists facility_assignment_eval_org_rule_idx
  on public.facility_assignment_rule_evaluations (organization_id, rule_id, evaluated_at desc)
  where rule_id is not null;

comment on table public.facility_assignment_rule_evaluations is
  'Immutable routing audit. Rule edits do not rewrite historical snapshots. One initial_create evaluation per work order.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.facility_assignment_rules enable row level security;
alter table public.facility_assignment_rule_evaluations enable row level security;

drop policy if exists facility_assignment_rules_org_all on public.facility_assignment_rules;
create policy facility_assignment_rules_org_all
  on public.facility_assignment_rules
  for all
  using (
    organization_id in (
      select m.organization_id
      from public.organization_memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  )
  with check (
    organization_id in (
      select m.organization_id
      from public.organization_memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  );

drop policy if exists facility_assignment_evals_org_all on public.facility_assignment_rule_evaluations;
create policy facility_assignment_evals_org_all
  on public.facility_assignment_rule_evaluations
  for all
  using (
    organization_id in (
      select m.organization_id
      from public.organization_memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  )
  with check (
    organization_id in (
      select m.organization_id
      from public.organization_memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  );

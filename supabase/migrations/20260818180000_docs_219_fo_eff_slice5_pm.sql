-- FO-EFF Slice 5: Preventive Maintenance plans + idempotent generation.
-- Additive only. Does not rewrite historical work orders, public intake, Slice 1–4, finance, July, or M5.
-- Production registered as 20260818081710 / docs_219_fo_eff_slice5_pm.
-- Do not replay this unused source stamp 20260818180000 on Production.

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

create table if not exists public.facility_pm_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'inactive')),
  target_kind text not null
    check (target_kind in ('asset', 'location')),
  facility_asset_id uuid references public.facility_assets (id) on delete restrict,
  property_id uuid references public.property_properties (id) on delete restrict,
  floor_label text,
  department_label text,
  room_label text,
  priority text not null default 'normal',
  category text not null default 'preventive',
  recurrence_kind text not null
    check (recurrence_kind in (
      'weekly',
      'every_n_weeks',
      'monthly',
      'every_n_months',
      'quarterly',
      'semiannual',
      'annual'
    )),
  interval_n integer not null default 1 check (interval_n >= 1 and interval_n <= 52),
  next_due_on date not null,
  due_time text,
  generate_days_before integer not null default 7
    check (generate_days_before >= 0 and generate_days_before <= 90),
  anchor_day_of_month integer not null check (anchor_day_of_month between 1 and 31),
  template_id uuid references public.facility_work_templates (id) on delete set null,
  last_generated_due_on date,
  missed_occurrence_count integer not null default 0,
  created_by_user_id uuid references auth.users (id) on delete set null,
  updated_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (target_kind = 'asset' and facility_asset_id is not null)
    or (target_kind = 'location' and property_id is not null)
  )
);

create index if not exists facility_pm_plans_org_status_due_idx
  on public.facility_pm_plans (organization_id, status, next_due_on);

create index if not exists facility_pm_plans_org_asset_idx
  on public.facility_pm_plans (organization_id, facility_asset_id)
  where facility_asset_id is not null;

create index if not exists facility_pm_plans_org_search_idx
  on public.facility_pm_plans (organization_id, name);

-- ---------------------------------------------------------------------------
-- Occurrences (idempotency)
-- ---------------------------------------------------------------------------

create table if not exists public.facility_pm_occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_id uuid not null references public.facility_pm_plans (id) on delete cascade,
  occurrence_due_on date not null,
  work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  generated_at timestamptz not null default timezone('utc', now()),
  unique (plan_id, occurrence_due_on)
);

create index if not exists facility_pm_occurrences_org_plan_idx
  on public.facility_pm_occurrences (organization_id, plan_id, occurrence_due_on desc);

-- ---------------------------------------------------------------------------
-- Canonical WO source + PM references (additive)
-- ---------------------------------------------------------------------------

alter table public.maintenance_work_orders
  add column if not exists origin_source text
    check (origin_source in ('manual', 'preventive', 'public_request'));

alter table public.maintenance_work_orders
  add column if not exists pm_plan_id uuid
    references public.facility_pm_plans (id) on delete set null;

alter table public.maintenance_work_orders
  add column if not exists pm_occurrence_due_on date;

create unique index if not exists maintenance_work_orders_pm_plan_due_uidx
  on public.maintenance_work_orders (pm_plan_id, pm_occurrence_due_on)
  where pm_plan_id is not null
    and pm_occurrence_due_on is not null;

create index if not exists maintenance_work_orders_pm_plan_idx
  on public.maintenance_work_orders (organization_id, pm_plan_id)
  where pm_plan_id is not null;

comment on column public.maintenance_work_orders.origin_source is
  'Canonical staff source: manual, preventive, or public_request. Public intake_channel stays qr/public_link/authenticated.';
comment on column public.maintenance_work_orders.pm_plan_id is
  'FO-EFF Slice 5 plan that generated this facility work order.';
comment on table public.facility_pm_occurrences is
  'One generated occurrence per plan due date. Unique (plan_id, occurrence_due_on) is the scheduler idempotency contract.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.facility_pm_plans enable row level security;
alter table public.facility_pm_occurrences enable row level security;

drop policy if exists facility_pm_plans_org_all on public.facility_pm_plans;
create policy facility_pm_plans_org_all
  on public.facility_pm_plans
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

drop policy if exists facility_pm_occurrences_org_all on public.facility_pm_occurrences;
create policy facility_pm_occurrences_org_all
  on public.facility_pm_occurrences
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

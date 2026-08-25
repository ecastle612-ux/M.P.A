-- docs/207 FO-EFF Slice 1: work-order templates / checklists
-- IN-REPO ONLY. Do not apply to Production without a separate Owner release Authorize.

-- ---------------------------------------------------------------------------
-- Templates + immutable versions
-- ---------------------------------------------------------------------------

create table if not exists public.facility_work_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  current_version_id uuid,
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_work_templates_org_status_idx
  on public.facility_work_templates (organization_id, status);

create table if not exists public.facility_work_template_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.facility_work_templates (id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  snapshot jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, version_number)
);

create index if not exists facility_work_template_versions_template_idx
  on public.facility_work_template_versions (template_id, version_number desc);

alter table public.facility_work_templates
  drop constraint if exists facility_work_templates_current_version_fk;

alter table public.facility_work_templates
  add constraint facility_work_templates_current_version_fk
  foreign key (current_version_id)
  references public.facility_work_template_versions (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- Work-order checklist instances (immutable definition copy + mutable responses)
-- ---------------------------------------------------------------------------

alter table public.maintenance_work_orders
  add column if not exists template_version_id uuid
    references public.facility_work_template_versions (id) on delete set null;

alter table public.maintenance_work_orders
  add column if not exists checklist_snapshot jsonb;

alter table public.maintenance_work_orders
  add column if not exists require_completion_photo boolean not null default false;

create index if not exists maintenance_work_orders_template_version_idx
  on public.maintenance_work_orders (template_version_id)
  where template_version_id is not null;

create table if not exists public.facility_work_order_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  item_key text not null,
  sort_order integer not null default 0,
  item_type text not null
    check (item_type in ('checkbox', 'text', 'number', 'yes_no', 'photo')),
  label text not null,
  required boolean not null default false,
  value_boolean boolean,
  value_text text,
  value_number numeric,
  value_yes_no boolean,
  media_attachment_id uuid,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (work_order_id, item_key)
);

create index if not exists facility_work_order_checklist_items_wo_idx
  on public.facility_work_order_checklist_items (work_order_id, sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.facility_work_templates enable row level security;
alter table public.facility_work_template_versions enable row level security;
alter table public.facility_work_order_checklist_items enable row level security;

drop policy if exists facility_work_templates_org_all on public.facility_work_templates;
create policy facility_work_templates_org_all
  on public.facility_work_templates
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

drop policy if exists facility_work_template_versions_org_all on public.facility_work_template_versions;
create policy facility_work_template_versions_org_all
  on public.facility_work_template_versions
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

drop policy if exists facility_work_order_checklist_items_org_all on public.facility_work_order_checklist_items;
create policy facility_work_order_checklist_items_org_all
  on public.facility_work_order_checklist_items
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

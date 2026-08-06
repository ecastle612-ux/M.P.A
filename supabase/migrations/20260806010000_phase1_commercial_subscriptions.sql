-- Phase 1 Product Architecture alignment: commercial subscriptions & Master Admin operators.
-- No Facility/Financial business feature tables.

create table if not exists public.product_skus (
  code text primary key check (code in ('mpa_property_manager', 'mpa_facility_operations', 'mpa_complete_platform')),
  label text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.product_skus (code, label, description)
values
  (
    'mpa_property_manager',
    'Property Manager',
    'Organizations, properties, residents, leasing, maintenance, vendors, financial operations, documents, and communications.'
  ),
  (
    'mpa_facility_operations',
    'Facility Operations',
    'Facility operations, assets, inventory, parts, preventive maintenance, inspections, safety, compliance, and building systems.'
  ),
  (
    'mpa_complete_platform',
    'Complete Platform',
    'Property Manager and Facility Operations together — one capability, one workflow, one home.'
  )
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description;

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  sku_code text not null references public.product_skus (code),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled')),
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_setup_state (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  product_confirmed boolean not null default false,
  checklist jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_organization_subscriptions_updated_at on public.organization_subscriptions;
create trigger trg_organization_subscriptions_updated_at
before update on public.organization_subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_organization_setup_state_updated_at on public.organization_setup_state;
create trigger trg_organization_setup_state_updated_at
before update on public.organization_setup_state
for each row
execute function public.set_updated_at();

drop trigger if exists trg_platform_operators_updated_at on public.platform_operators;
create trigger trg_platform_operators_updated_at
before update on public.platform_operators
for each row
execute function public.set_updated_at();

create or replace function public.is_platform_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_operators po
    where po.user_id = auth.uid()
      and po.status = 'active'
  )
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'platform_operator')::boolean, false);
$$;

revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;

alter table public.product_skus enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_setup_state enable row level security;
alter table public.platform_operators enable row level security;

drop policy if exists product_skus_select_authenticated on public.product_skus;
create policy product_skus_select_authenticated
on public.product_skus
for select
using (auth.role() = 'authenticated');

drop policy if exists organization_subscriptions_select_member on public.organization_subscriptions;
create policy organization_subscriptions_select_member
on public.organization_subscriptions
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = organization_subscriptions.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists organization_subscriptions_insert_manager on public.organization_subscriptions;
create policy organization_subscriptions_insert_manager
on public.organization_subscriptions
for insert
with check (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
);

drop policy if exists organization_subscriptions_update_manager on public.organization_subscriptions;
create policy organization_subscriptions_update_manager
on public.organization_subscriptions
for update
using (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
)
with check (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
);

drop policy if exists organization_setup_state_select_member on public.organization_setup_state;
create policy organization_setup_state_select_member
on public.organization_setup_state
for select
using (
  public.is_platform_operator()
  or exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = organization_setup_state.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists organization_setup_state_upsert_manager on public.organization_setup_state;
create policy organization_setup_state_insert_manager
on public.organization_setup_state
for insert
with check (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
);

drop policy if exists organization_setup_state_update_manager on public.organization_setup_state;
create policy organization_setup_state_update_manager
on public.organization_setup_state
for update
using (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
)
with check (
  public.is_platform_operator()
  or public.is_org_manager(organization_id)
);

drop policy if exists platform_operators_select_self_or_admin on public.platform_operators;
create policy platform_operators_select_self_or_admin
on public.platform_operators
for select
using (
  user_id = auth.uid()
  or public.is_platform_operator()
);

drop policy if exists platform_operators_manage_admin on public.platform_operators;
create policy platform_operators_manage_admin
on public.platform_operators
for all
using (public.is_platform_operator())
with check (public.is_platform_operator());

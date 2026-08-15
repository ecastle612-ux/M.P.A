-- ADR-033 / docs/127 — member operating scope (Complete delegated operations).
-- Repo-only. Do not apply to Production in this slice.
-- Additive. No Stripe / SKU / role catalog / FIN-OPS financial_* changes.
-- Does not reinterpret OPS-001 workspace_* tables.

-- ---------------------------------------------------------------------------
-- Storage: nullable assigned scope on membership + invitation
-- NULL = unassigned (Complete compatibility BOTH until an admin assigns)
-- ---------------------------------------------------------------------------

alter table public.organization_memberships
  add column if not exists operating_scope text;

alter table public.organization_memberships
  drop constraint if exists organization_memberships_operating_scope_check;

alter table public.organization_memberships
  add constraint organization_memberships_operating_scope_check
  check (
    operating_scope is null
    or operating_scope in ('property_operations', 'facility_operations', 'both')
  );

alter table public.organization_invitations
  add column if not exists operating_scope text;

alter table public.organization_invitations
  drop constraint if exists organization_invitations_operating_scope_check;

alter table public.organization_invitations
  add constraint organization_invitations_operating_scope_check
  check (
    operating_scope is null
    or operating_scope in ('property_operations', 'facility_operations', 'both')
  );

comment on column public.organization_memberships.operating_scope is
  'ADR-033 member operating scope. Not a SKU. Not an OPS-001 workspace.';
comment on column public.organization_invitations.operating_scope is
  'ADR-033 invite operating scope copied onto membership at accept.';

-- ---------------------------------------------------------------------------
-- Append-only assignment audit
-- ---------------------------------------------------------------------------

create table if not exists public.organization_operating_scope_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  membership_id uuid references public.organization_memberships (id) on delete set null,
  invitation_id uuid references public.organization_invitations (id) on delete set null,
  from_scope text,
  to_scope text,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    from_scope is null
    or from_scope in ('property_operations', 'facility_operations', 'both')
  ),
  check (
    to_scope is null
    or to_scope in ('property_operations', 'facility_operations', 'both')
  )
);

create index if not exists organization_operating_scope_events_org_created_idx
  on public.organization_operating_scope_events (organization_id, created_at desc);

alter table public.organization_operating_scope_events enable row level security;

drop policy if exists operating_scope_events_select_member on public.organization_operating_scope_events;
create policy operating_scope_events_select_member
  on public.organization_operating_scope_events
  for select
  using (
    exists (
      select 1
      from public.organization_memberships memberships
      where memberships.organization_id = organization_operating_scope_events.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

drop policy if exists operating_scope_events_insert_manager on public.organization_operating_scope_events;
create policy operating_scope_events_insert_manager
  on public.organization_operating_scope_events
  for insert
  with check (public.is_org_manager(organization_id));

-- ---------------------------------------------------------------------------
-- Effective scope / surface helpers (SKU always wins)
-- ---------------------------------------------------------------------------

create or replace function public.member_operating_scope(target_org_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when memberships.roles && array['tenant', 'vendor', 'property_owner']::text[]
      and not memberships.roles && array[
        'organization_admin',
        'property_manager',
        'leasing_agent',
        'maintenance_technician'
      ]::text[]
    then null
    when memberships.operating_scope in ('property_operations', 'facility_operations', 'both')
    then memberships.operating_scope
    when public.org_sku(target_org_id) = 'mpa_property_manager' then 'property_operations'
    when public.org_sku(target_org_id) = 'mpa_facility_operations' then 'facility_operations'
    when public.org_sku(target_org_id) = 'mpa_complete_platform' then 'both'
    else null
  end
  from public.organization_memberships memberships
  where memberships.organization_id = target_org_id
    and memberships.user_id = target_user_id
    and memberships.status = 'active'
  limit 1;
$$;

create or replace function public.member_allows_work_surface(
  target_org_id uuid,
  target_surface text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.org_allows_work_surface(target_org_id, target_surface)
    and (
      public.org_sku(target_org_id) is distinct from 'mpa_complete_platform'
      or (
        case
          when target_surface = 'residential' then
            public.member_operating_scope(target_org_id, target_user_id) in ('property_operations', 'both')
          when target_surface = 'facility' then
            public.member_operating_scope(target_org_id, target_user_id) in ('facility_operations', 'both')
          else false
        end
      )
    );
$$;

-- Tenant comms remain a PM desk. Complete + FACILITY must fail closed.
create or replace function public.is_pm_comms_staff(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and memberships.roles && array[
        'organization_admin',
        'property_manager',
        'leasing_agent'
      ]::text[]
      and not memberships.roles && array['maintenance_technician']::text[]
      and public.org_sku(target_org_id) in ('mpa_property_manager', 'mpa_complete_platform')
      and public.member_allows_work_surface(target_org_id, 'residential')
  );
$$;

-- Staff WO visibility intersects member scope. Resident / vendor self-access unchanged.
create or replace function public.can_select_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_work_orders work_orders
    where work_orders.id = target_work_order_id
      and (
        (
          public.is_maintenance_manager(work_orders.organization_id)
          and public.org_allows_work_surface(work_orders.organization_id, work_orders.work_surface)
          and public.member_allows_work_surface(
            work_orders.organization_id,
            work_orders.work_surface
          )
        )
        or (
          public.is_maintenance_technician(work_orders.organization_id)
          and public.org_allows_work_surface(work_orders.organization_id, work_orders.work_surface)
          and public.member_allows_work_surface(
            work_orders.organization_id,
            work_orders.work_surface
          )
          and (
            work_orders.technician_user_id = auth.uid()
            or work_orders.technician_user_id is null
            or work_orders.status in ('submitted', 'triaged')
          )
        )
        or (
          work_orders.requested_by_user_id = auth.uid()
          and work_orders.work_surface = 'residential'
        )
        or (
          work_orders.work_surface = 'residential'
          and exists (
            select 1
            from public.pm_residents residents
            where residents.id = work_orders.resident_id
              and residents.user_id = auth.uid()
          )
        )
        or exists (
          select 1
          from public.vendor_vendors vendors
          where vendors.id = work_orders.vendor_id
            and vendors.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.member_operating_scope(uuid, uuid) from public, anon;
revoke all on function public.member_allows_work_surface(uuid, text, uuid) from public, anon;
revoke all on function public.is_pm_comms_staff(uuid) from public, anon;
revoke all on function public.can_select_work_order(uuid) from public, anon;

grant execute on function public.member_operating_scope(uuid, uuid) to authenticated;
grant execute on function public.member_allows_work_surface(uuid, text, uuid) to authenticated;
grant execute on function public.is_pm_comms_staff(uuid) to authenticated;
grant execute on function public.can_select_work_order(uuid) to authenticated;

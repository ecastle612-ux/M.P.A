-- PLAT-002 / ADR-026 authorization hardening (C4 work-order surface + C5 comms staff)
-- Additive. No Stripe / SKU / entitlement-key / role catalog changes.
-- Do not drop work_surface or rewrite rows.

-- ---------------------------------------------------------------------------
-- SKU helpers (mirror entitlementsForSku surface mapping — no key list in SQL)
-- ---------------------------------------------------------------------------

create or replace function public.org_sku(target_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select subscriptions.sku_code
  from public.organization_subscriptions subscriptions
  where subscriptions.organization_id = target_org_id
    and subscriptions.status is distinct from 'canceled'
  limit 1;
$$;

create or replace function public.org_allows_work_surface(target_org_id uuid, target_surface text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_surface = 'residential' then
      public.org_sku(target_org_id) in ('mpa_property_manager', 'mpa_complete_platform')
    when target_surface = 'facility' then
      public.org_sku(target_org_id) in ('mpa_facility_operations', 'mpa_complete_platform')
    else false
  end;
$$;

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
        )
        or (
          public.is_maintenance_technician(work_orders.organization_id)
          and public.org_allows_work_surface(work_orders.organization_id, work_orders.work_surface)
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

-- ---------------------------------------------------------------------------
-- C5: PM / Complete comms desk (technicians excluded)
-- ---------------------------------------------------------------------------

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
  );
$$;

create or replace function public.can_access_tenant_conversation(
  target_org_id uuid,
  target_lease_id uuid,
  target_tenant_account_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_pm_comms_staff(target_org_id)
    or (
      public.is_lease_resident(target_lease_id)
      and exists (
        select 1
        from public.pm_residents residents
        where residents.id = target_tenant_account_id
          and residents.organization_id = target_org_id
          and residents.lease_id = target_lease_id
          and residents.user_id = auth.uid()
      )
    );
$$;

revoke all on function public.org_sku(uuid) from public, anon;
revoke all on function public.org_allows_work_surface(uuid, text) from public, anon;
revoke all on function public.can_select_work_order(uuid) from public, anon;
revoke all on function public.is_pm_comms_staff(uuid) from public, anon;
revoke all on function public.can_access_tenant_conversation(uuid, uuid, uuid) from public, anon;

grant execute on function public.org_sku(uuid) to authenticated;
grant execute on function public.org_allows_work_surface(uuid, text) to authenticated;
grant execute on function public.can_select_work_order(uuid) to authenticated;
grant execute on function public.is_pm_comms_staff(uuid) to authenticated;
grant execute on function public.can_access_tenant_conversation(uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- C4: work-order policies
-- ---------------------------------------------------------------------------

drop policy if exists maintenance_work_orders_select on public.maintenance_work_orders;
create policy maintenance_work_orders_select on public.maintenance_work_orders
for select using (public.can_select_work_order(id));

drop policy if exists maintenance_work_orders_insert_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_resident on public.maintenance_work_orders
for insert with check (
  requested_by_user_id = auth.uid()
  and work_surface = 'residential'
  and exists (
    select 1 from public.pm_residents residents
    where residents.id = resident_id
      and residents.organization_id = organization_id
      and residents.user_id = auth.uid()
      and residents.portal_status = 'active'
  )
);

drop policy if exists maintenance_work_orders_manage_manager on public.maintenance_work_orders;
create policy maintenance_work_orders_manage_manager on public.maintenance_work_orders
for all
using (
  public.is_maintenance_manager(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
)
with check (
  public.is_maintenance_manager(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
);

drop policy if exists maintenance_work_orders_update_technician on public.maintenance_work_orders;
create policy maintenance_work_orders_update_technician on public.maintenance_work_orders
for update using (
  public.is_maintenance_technician(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and technician_user_id = auth.uid()
)
with check (
  public.is_maintenance_technician(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and technician_user_id = auth.uid()
);

drop policy if exists maintenance_work_orders_update_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_update_resident on public.maintenance_work_orders
for update using (
  public.is_work_order_resident(id)
  and work_surface = 'residential'
)
with check (
  public.is_work_order_resident(id)
  and work_surface = 'residential'
);

drop policy if exists maintenance_updates_select on public.maintenance_work_order_updates;
create policy maintenance_updates_select on public.maintenance_work_order_updates
for select using (public.can_select_work_order(work_order_id));

drop policy if exists maintenance_notifications_insert on public.maintenance_notifications;
create policy maintenance_notifications_insert on public.maintenance_notifications
for insert with check (
  public.is_maintenance_manager(organization_id)
  or user_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- C5: comms policies must not use is_pm_staff
-- ---------------------------------------------------------------------------

drop policy if exists comms_conversations_insert_staff on public.comms_conversations;
create policy comms_conversations_insert_staff
on public.comms_conversations
for insert
to authenticated
with check (public.is_pm_comms_staff(organization_id));

drop policy if exists comms_thread_messages_select on public.comms_conversation_messages;
create policy comms_thread_messages_select
on public.comms_conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.comms_conversations conversations
    where conversations.id = conversation_id
      and public.can_access_tenant_conversation(
        conversations.organization_id,
        conversations.lease_id,
        conversations.tenant_account_id
      )
  )
  and (
    hidden_at is null
    or public.is_pm_comms_staff(organization_id)
  )
);

drop policy if exists comms_thread_messages_update_staff on public.comms_conversation_messages;
create policy comms_thread_messages_update_staff
on public.comms_conversation_messages
for update
to authenticated
using (public.is_pm_comms_staff(organization_id))
with check (public.is_pm_comms_staff(organization_id));

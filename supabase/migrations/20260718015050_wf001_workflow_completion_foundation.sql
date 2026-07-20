-- WF-001: Workflow completion — tenant identity, resident/vendor capabilities, scoped RLS

-- Link auth users to tenant CRM records (invite accept / activation)
alter table public.tenants
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists tenants_org_user_id_idx
  on public.tenants (organization_id, user_id)
  where user_id is not null and deleted_at is null;

-- Resident + vendor capabilities required to finish portal workflows
insert into public.role_permission_grants (role, capability_key)
values
  ('tenant', 'maintenance:read'),
  ('tenant', 'maintenance:create'),
  ('tenant', 'media:write'),
  ('tenant', 'document:read'),
  ('vendor', 'maintenance:read'),
  ('vendor', 'maintenance:update'),
  ('vendor', 'vendor:read'),
  ('vendor', 'vendor:assign')
on conflict (role, capability_key) do nothing;

-- Tenants can read their own CRM row (needed for portal maintenance/payments resolution)
drop policy if exists tenants_select_authorized on public.tenants;
create policy tenants_select_authorized
on public.tenants
for select
using (
  public.has_org_capability(organization_id, 'tenant:read')
  or (user_id = auth.uid() and deleted_at is null)
  or (
    user_id is null
    and deleted_at is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Allow a resident to claim an unlinked tenant row that matches their email
drop policy if exists tenants_update_self_link on public.tenants;
create policy tenants_update_self_link
on public.tenants
for update
using (
  deleted_at is null
  and user_id is null
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  deleted_at is null
  and user_id = auth.uid()
);

-- Activity events may be written when creating a work order (resident path)
drop policy if exists maintenance_activity_insert_authorized on public.maintenance_activity_events;
create policy maintenance_activity_insert_authorized
on public.maintenance_activity_events
for insert
with check (
  public.has_org_capability(organization_id, 'maintenance:update')
  or public.has_org_capability(organization_id, 'maintenance:create')
);

-- Scope work-order visibility: staff see all; residents/vendors see linked rows
drop policy if exists maintenance_work_orders_select_authorized on public.maintenance_work_orders;
create policy maintenance_work_orders_select_authorized
on public.maintenance_work_orders
for select
using (
  (
    public.has_org_capability(organization_id, 'maintenance:read')
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = maintenance_work_orders.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.roles && array['property_manager', 'property_owner']::text[]
    )
  )
  or created_by = auth.uid()
  or exists (
    select 1
    from public.tenants t
    where t.id = maintenance_work_orders.tenant_id
      and t.organization_id = maintenance_work_orders.organization_id
      and t.user_id = auth.uid()
      and t.deleted_at is null
  )
  or (
    public.has_org_capability(organization_id, 'maintenance:read')
    and vendor_id is not null
    and exists (
      select 1
      from public.vendors v
      where v.id = maintenance_work_orders.vendor_id
        and v.organization_id = maintenance_work_orders.organization_id
        and v.deleted_at is null
        and v.email is not null
        and lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

-- Residents with document:read only see their own tenant/lease vault files; staff keep full read
drop policy if exists vault_documents_select on public.vault_documents;
create policy vault_documents_select
on public.vault_documents
for select
using (
  public.has_org_capability(organization_id, 'document:read')
  and (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = vault_documents.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.roles && array['property_manager', 'property_owner']::text[]
    )
    or (
      entity_type = 'tenant'
      and exists (
        select 1
        from public.tenants t
        where t.id = vault_documents.entity_id
          and t.organization_id = vault_documents.organization_id
          and t.user_id = auth.uid()
          and t.deleted_at is null
      )
    )
    or (
      entity_type = 'lease'
      and exists (
        select 1
        from public.leases l
        join public.tenants t
          on t.id = l.primary_tenant_id
         and t.organization_id = l.organization_id
        where l.id = vault_documents.entity_id
          and l.organization_id = vault_documents.organization_id
          and t.user_id = auth.uid()
          and t.deleted_at is null
      )
    )
  )
);

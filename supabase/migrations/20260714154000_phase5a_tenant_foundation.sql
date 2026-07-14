-- Phase 5A foundation: canonical tenant domain.

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  phone text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create unique index if not exists tenants_org_email_unique_idx
  on public.tenants (organization_id, lower(email))
  where deleted_at is null;

create index if not exists tenants_org_status_idx
  on public.tenants (organization_id, status)
  where deleted_at is null;

create index if not exists tenants_org_name_idx
  on public.tenants (organization_id, last_name, first_name)
  where deleted_at is null;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

insert into public.permission_capabilities (key, namespace, description)
values
  ('tenant:create', 'tenant', 'Create tenants'),
  ('tenant:read', 'tenant', 'Read tenants'),
  ('tenant:update', 'tenant', 'Update tenants'),
  ('tenant:archive', 'tenant', 'Archive and restore tenants'),
  ('tenant:delete', 'tenant', 'Soft-delete tenants')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'tenant:create'),
  ('property_manager', 'tenant:read'),
  ('property_manager', 'tenant:update'),
  ('property_manager', 'tenant:archive'),
  ('property_manager', 'tenant:delete'),
  ('property_owner', 'tenant:read')
on conflict (role, capability_key) do nothing;

alter table public.tenants enable row level security;

drop policy if exists tenants_select_authorized on public.tenants;
create policy tenants_select_authorized
on public.tenants
for select
using (public.has_org_capability(organization_id, 'tenant:read'));

drop policy if exists tenants_insert_authorized on public.tenants;
create policy tenants_insert_authorized
on public.tenants
for insert
with check (
  public.has_org_capability(organization_id, 'tenant:create')
  and created_by = auth.uid()
);

drop policy if exists tenants_update_authorized on public.tenants;
create policy tenants_update_authorized
on public.tenants
for update
using (
  public.has_org_capability(organization_id, 'tenant:update')
  or public.has_org_capability(organization_id, 'tenant:archive')
  or public.has_org_capability(organization_id, 'tenant:delete')
)
with check (
  public.has_org_capability(organization_id, 'tenant:update')
  or public.has_org_capability(organization_id, 'tenant:archive')
  or public.has_org_capability(organization_id, 'tenant:delete')
);

drop policy if exists tenants_delete_authorized on public.tenants;
create policy tenants_delete_authorized
on public.tenants
for delete
using (public.has_org_capability(organization_id, 'tenant:delete'));

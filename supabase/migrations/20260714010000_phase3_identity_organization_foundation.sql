-- Phase 3 foundation: organizations, memberships, invitations.
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  roles text[] not null default '{}'::text[],
  status text not null default 'active' check (status in ('active', 'inactive')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id),
  check (
    roles <@ array['property_manager', 'property_owner', 'tenant', 'vendor']::text[]
  )
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  roles text[] not null default '{}'::text[],
  invited_by uuid not null references auth.users (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    roles <@ array['property_manager', 'property_owner', 'tenant', 'vendor']::text[]
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_organization_memberships_updated_at on public.organization_memberships;
create trigger trg_organization_memberships_updated_at
before update on public.organization_memberships
for each row
execute function public.set_updated_at();

drop trigger if exists trg_organization_invitations_updated_at on public.organization_invitations;
create trigger trg_organization_invitations_updated_at
before update on public.organization_invitations
for each row
execute function public.set_updated_at();

create or replace function public.is_org_manager(target_org_id uuid)
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
      and 'property_manager' = any(memberships.roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_invitations enable row level security;

drop policy if exists organizations_select_by_membership on public.organizations;
create policy organizations_select_by_membership
on public.organizations
for select
using (
  exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = organizations.id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists organizations_insert_by_creator on public.organizations;
create policy organizations_insert_by_creator
on public.organizations
for insert
with check (created_by = auth.uid());

drop policy if exists organizations_update_by_manager on public.organizations;
create policy organizations_update_by_manager
on public.organizations
for update
using (public.is_org_manager(id))
with check (public.is_org_manager(id));

drop policy if exists organizations_delete_by_manager on public.organizations;
create policy organizations_delete_by_manager
on public.organizations
for delete
using (public.is_org_manager(id));

drop policy if exists memberships_select_self_or_manager on public.organization_memberships;
create policy memberships_select_self_or_manager
on public.organization_memberships
for select
using (user_id = auth.uid() or public.is_org_manager(organization_id));

drop policy if exists memberships_insert_creator_or_manager on public.organization_memberships;
create policy memberships_insert_creator_or_manager
on public.organization_memberships
for insert
with check (
  user_id = auth.uid()
  or public.is_org_manager(organization_id)
  or exists (
    select 1
    from public.organizations organizations
    where organizations.id = organization_id
      and organizations.created_by = auth.uid()
  )
);

drop policy if exists memberships_update_manager on public.organization_memberships;
create policy memberships_update_manager
on public.organization_memberships
for update
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists memberships_delete_manager on public.organization_memberships;
create policy memberships_delete_manager
on public.organization_memberships
for delete
using (public.is_org_manager(organization_id));

drop policy if exists invitations_select_member on public.organization_invitations;
create policy invitations_select_member
on public.organization_invitations
for select
using (
  public.is_org_manager(organization_id)
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

drop policy if exists invitations_insert_manager on public.organization_invitations;
create policy invitations_insert_manager
on public.organization_invitations
for insert
with check (public.is_org_manager(organization_id));

drop policy if exists invitations_update_manager_or_recipient on public.organization_invitations;
create policy invitations_update_manager_or_recipient
on public.organization_invitations
for update
using (
  public.is_org_manager(organization_id)
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
)
with check (
  public.is_org_manager(organization_id)
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

-- COM-002 Tenant Communication Center — M1 production compatibility prerequisites
-- docs/83 Approved · ADR-025 Accepted
-- Additive and idempotent. Does not apply FIN-OPS or LAUNCH-001 wholesale.
-- Does not replace is_org_member / is_org_manager.
-- Does not touch conversation_threads, communication_messages, or in_app_notifications.
-- Does not add comms_notifications.conversation_id (M2).

-- ---------------------------------------------------------------------------
-- Capabilities (insert if missing)
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('platform.communications:read', 'platform.communications', 'Read messages, notices, and notification inbox'),
  ('platform.communications:write', 'platform.communications', 'Send resident/owner/vendor messages and notices')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'platform.communications:read'),
  ('organization_admin', 'platform.communications:write'),
  ('property_manager', 'platform.communications:read'),
  ('property_manager', 'platform.communications:write'),
  ('leasing_agent', 'platform.communications:read'),
  ('leasing_agent', 'platform.communications:write'),
  ('maintenance_technician', 'platform.communications:read'),
  ('property_owner', 'platform.communications:read'),
  ('property_owner', 'platform.communications:write'),
  ('tenant', 'platform.communications:read'),
  ('vendor', 'platform.communications:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- lease_residents + is_lease_resident (FIN-OPS S1 shape only)
-- ---------------------------------------------------------------------------

create table if not exists public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  email text,
  is_primary boolean not null default true,
  financial_status text not null default 'current'
    check (financial_status in ('current', 'delinquent', 'prepaid', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (lease_id, email)
);

create index if not exists lease_residents_user_idx
  on public.lease_residents (user_id)
  where user_id is not null;

create or replace function public.is_lease_resident(target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents residents
    where residents.lease_id = target_lease_id
      and residents.user_id = auth.uid()
  );
$$;

alter table public.lease_residents enable row level security;

drop policy if exists lease_residents_select on public.lease_residents;
create policy lease_residents_select
on public.lease_residents
for select
using (
  public.is_org_member(organization_id) or user_id = auth.uid()
);

drop policy if exists lease_residents_manage_manager on public.lease_residents;
create policy lease_residents_manage_manager
on public.lease_residents
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

-- ---------------------------------------------------------------------------
-- One-way notices (LAUNCH-001 comms shape; no conversation_id)
-- ---------------------------------------------------------------------------

create table if not exists public.comms_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  audience_type text not null
    check (audience_type in ('resident', 'owner', 'vendor')),
  subject text not null,
  body text not null,
  property_id uuid references public.property_properties (id) on delete set null,
  resident_id uuid references public.pm_residents (id) on delete set null,
  vendor_id uuid references public.vendor_vendors (id) on delete set null,
  owner_user_id uuid references auth.users (id) on delete set null,
  recipient_user_id uuid references auth.users (id) on delete set null,
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'both')),
  delivery_status text not null default 'delivered'
    check (delivery_status in ('queued', 'delivered', 'email_sent', 'email_failed', 'failed')),
  email_provider_id text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comms_messages_org_created_idx
  on public.comms_messages (organization_id, created_at desc);

create index if not exists comms_messages_recipient_idx
  on public.comms_messages (organization_id, recipient_user_id, created_at desc);

create table if not exists public.comms_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message_id uuid references public.comms_messages (id) on delete cascade,
  notification_key text not null default 'comms.message.received',
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comms_notifications_user_idx
  on public.comms_notifications (organization_id, user_id, created_at desc);

alter table public.comms_messages enable row level security;
alter table public.comms_notifications enable row level security;

drop policy if exists comms_messages_select_member on public.comms_messages;
create policy comms_messages_select_member
on public.comms_messages
for select
to authenticated
using (
  public.is_org_member(organization_id)
  or recipient_user_id = auth.uid()
  or owner_user_id = auth.uid()
);

drop policy if exists comms_messages_insert_manager on public.comms_messages;
create policy comms_messages_insert_manager
on public.comms_messages
for insert
to authenticated
with check (
  public.is_org_manager(organization_id)
  or public.is_org_member(organization_id)
);

drop policy if exists comms_notifications_select_own on public.comms_notifications;
create policy comms_notifications_select_own
on public.comms_notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_org_manager(organization_id)
);

drop policy if exists comms_notifications_insert_member on public.comms_notifications;
create policy comms_notifications_insert_member
on public.comms_notifications
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
);

drop policy if exists comms_notifications_update_own on public.comms_notifications;
create policy comms_notifications_update_own
on public.comms_notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_org_manager(organization_id)
)
with check (
  user_id = auth.uid()
  or public.is_org_manager(organization_id)
);

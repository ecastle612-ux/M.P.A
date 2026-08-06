-- LAUNCH-001 Property Manager Promise Remediation
-- Documents + Communications operational MVP (Shared Platform).

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('platform.documents:read', 'platform.documents', 'Read shared document library and attachments'),
  ('platform.documents:write', 'platform.documents', 'Upload and organize shared documents'),
  ('platform.communications:read', 'platform.communications', 'Read messages, notices, and notification inbox'),
  ('platform.communications:write', 'platform.communications', 'Send resident/owner/vendor messages and notices')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'platform.documents:read'),
  ('organization_admin', 'platform.documents:write'),
  ('organization_admin', 'platform.communications:read'),
  ('organization_admin', 'platform.communications:write'),
  ('property_manager', 'platform.documents:read'),
  ('property_manager', 'platform.documents:write'),
  ('property_manager', 'platform.communications:read'),
  ('property_manager', 'platform.communications:write'),
  ('leasing_agent', 'platform.documents:read'),
  ('leasing_agent', 'platform.documents:write'),
  ('leasing_agent', 'platform.communications:read'),
  ('leasing_agent', 'platform.communications:write'),
  ('maintenance_technician', 'platform.documents:read'),
  ('maintenance_technician', 'platform.communications:read'),
  ('property_owner', 'platform.documents:read'),
  ('property_owner', 'platform.communications:read'),
  ('property_owner', 'platform.communications:write'),
  ('tenant', 'platform.documents:read'),
  ('tenant', 'platform.communications:read'),
  ('vendor', 'platform.documents:read'),
  ('vendor', 'platform.communications:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table if not exists public.document_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('property', 'resident', 'lease', 'maintenance', 'vendor', 'organization')),
  entity_id uuid not null,
  title text not null,
  category text not null default 'general'
    check (category in (
      'general',
      'lease',
      'agreement',
      'evidence',
      'maintenance',
      'vendor',
      'financial',
      'identity',
      'other'
    )),
  source text not null default 'upload'
    check (source in ('upload', 'generated', 'signwell', 'offline')),
  mime_type text not null default 'text/plain',
  file_name text,
  content_text text,
  content_base64 text,
  byte_size integer not null default 0,
  signwell_document_id text,
  external_url text,
  property_id uuid references public.property_properties (id) on delete set null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists document_documents_org_entity_idx
  on public.document_documents (organization_id, entity_type, entity_id, created_at desc);

create index if not exists document_documents_org_property_idx
  on public.document_documents (organization_id, property_id, created_at desc);

alter table public.document_documents enable row level security;

drop policy if exists document_documents_select_member on public.document_documents;
create policy document_documents_select_member
on public.document_documents
for select
to authenticated
using (
  public.is_org_member(organization_id)
);

drop policy if exists document_documents_write_manager on public.document_documents;
create policy document_documents_write_manager
on public.document_documents
for all
to authenticated
using (
  public.is_org_manager(organization_id)
)
with check (
  public.is_org_manager(organization_id)
);

-- ---------------------------------------------------------------------------
-- Communications
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

-- Allow recipients to mark existing domain notifications as read.
drop policy if exists financial_notifications_update_own on public.financial_notifications;
create policy financial_notifications_update_own
on public.financial_notifications
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

drop policy if exists maintenance_notifications_update_own on public.maintenance_notifications;
create policy maintenance_notifications_update_own
on public.maintenance_notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_maintenance_manager(organization_id)
)
with check (
  user_id = auth.uid()
  or public.is_maintenance_manager(organization_id)
);

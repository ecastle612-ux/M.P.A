-- MHF-001: Unified Communication Platform foundation extension.
-- Workflow-linked threads, in-app notifications, community events.

-- ---------------------------------------------------------------------------
-- conversation_threads
-- ---------------------------------------------------------------------------

create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thread_type text not null check (
    thread_type in (
      'resident_pm',
      'resident_maintenance',
      'pm_vendor',
      'pm_owner',
      'internal_staff',
      'applicant_leasing'
    )
  ),
  source_entity_type text not null check (
    source_entity_type in (
      'maintenance',
      'lease',
      'applicant',
      'resident',
      'vendor_assignment',
      'inspection',
      'financial',
      'general',
      'announcement_reply'
    )
  ),
  source_entity_id uuid,
  property_id uuid references public.properties (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  status text not null default 'active' check (
    status in ('active', 'unread', 'read', 'archived', 'resolved')
  ),
  subject text not null,
  last_message_at timestamptz,
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

create index if not exists conversation_threads_org_status_idx
  on public.conversation_threads (organization_id, status)
  where deleted_at is null;

create index if not exists conversation_threads_org_last_message_idx
  on public.conversation_threads (organization_id, last_message_at desc nulls last)
  where deleted_at is null;

create index if not exists conversation_threads_source_idx
  on public.conversation_threads (organization_id, source_entity_type, source_entity_id)
  where deleted_at is null;

create unique index if not exists conversation_threads_source_unique_idx
  on public.conversation_threads (organization_id, source_entity_type, source_entity_id)
  where deleted_at is null and source_entity_id is not null;

-- ---------------------------------------------------------------------------
-- conversation_participants
-- ---------------------------------------------------------------------------

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thread_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  participant_role text not null check (
    participant_role in ('pm', 'resident', 'vendor', 'owner', 'staff', 'applicant')
  ),
  last_read_at timestamptz,
  muted boolean not null default false,
  pinned boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, thread_id, user_id),
  constraint conversation_participants_thread_fk
    foreign key (thread_id, organization_id)
    references public.conversation_threads (id, organization_id)
    on delete cascade
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (organization_id, user_id);

create index if not exists conversation_participants_thread_idx
  on public.conversation_participants (organization_id, thread_id);

-- ---------------------------------------------------------------------------
-- communication_messages
-- ---------------------------------------------------------------------------

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thread_id uuid not null,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  visibility text not null default 'resident' check (
    visibility in ('resident', 'internal', 'vendor')
  ),
  delivery_status text not null default 'sent' check (
    delivery_status in ('sent', 'delivered', 'read')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint communication_messages_thread_fk
    foreign key (thread_id, organization_id)
    references public.conversation_threads (id, organization_id)
    on delete cascade
);

create index if not exists communication_messages_thread_idx
  on public.communication_messages (organization_id, thread_id, created_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- message_read_receipts
-- ---------------------------------------------------------------------------

create table if not exists public.message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  message_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, message_id, user_id),
  constraint message_read_receipts_message_fk
    foreign key (message_id, organization_id)
    references public.communication_messages (id, organization_id)
    on delete cascade
);

create index if not exists message_read_receipts_user_idx
  on public.message_read_receipts (organization_id, user_id);

-- ---------------------------------------------------------------------------
-- in_app_notifications
-- ---------------------------------------------------------------------------

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (
    category in ('message', 'maintenance', 'lease', 'financial', 'announcement', 'applicant', 'ai')
  ),
  title text not null,
  body text not null,
  href text,
  source_entity_type text,
  source_entity_id uuid,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create index if not exists in_app_notifications_user_unread_idx
  on public.in_app_notifications (organization_id, user_id, created_at desc)
  where read_at is null;

create index if not exists in_app_notifications_user_idx
  on public.in_app_notifications (organization_id, user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- community_events
-- ---------------------------------------------------------------------------

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  title text not null,
  event_type text not null check (
    event_type in ('event', 'office_hours', 'pool', 'holiday', 'package', 'emergency')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  body text not null default '',
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

create index if not exists community_events_org_starts_idx
  on public.community_events (organization_id, starts_at)
  where deleted_at is null;

create index if not exists community_events_property_idx
  on public.community_events (organization_id, property_id, starts_at)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('message:create', 'message', 'Create workflow-linked conversation messages and threads'),
  ('message:read', 'message', 'Read conversation threads and messages'),
  ('message:update', 'message', 'Update thread status, participants, and read state'),
  ('notification:read', 'notification', 'Read in-app notifications'),
  ('notification:update', 'notification', 'Mark notifications read and manage notification state')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'message:create'),
  ('property_manager', 'message:read'),
  ('property_manager', 'message:update'),
  ('property_manager', 'notification:read'),
  ('property_manager', 'notification:update'),
  ('property_owner', 'message:read'),
  ('property_owner', 'notification:read'),
  ('tenant', 'message:create'),
  ('tenant', 'message:read'),
  ('tenant', 'message:update'),
  ('tenant', 'notification:read'),
  ('tenant', 'notification:update'),
  ('vendor', 'message:create'),
  ('vendor', 'message:read'),
  ('vendor', 'message:update'),
  ('vendor', 'notification:read'),
  ('vendor', 'notification:update')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.conversation_threads enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.communication_messages enable row level security;
alter table public.message_read_receipts enable row level security;
alter table public.in_app_notifications enable row level security;
alter table public.community_events enable row level security;

-- conversation_threads
drop policy if exists conversation_threads_select on public.conversation_threads;
create policy conversation_threads_select
on public.conversation_threads for select
using (
  public.has_org_capability(organization_id, 'message:read')
  or exists (
    select 1
    from public.conversation_participants p
    where p.thread_id = conversation_threads.id
      and p.organization_id = conversation_threads.organization_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists conversation_threads_insert on public.conversation_threads;
create policy conversation_threads_insert
on public.conversation_threads for insert
with check (
  public.has_org_capability(organization_id, 'message:create')
  and created_by = auth.uid()
);

drop policy if exists conversation_threads_update on public.conversation_threads;
create policy conversation_threads_update
on public.conversation_threads for update
using (
  public.has_org_capability(organization_id, 'message:update')
  or exists (
    select 1
    from public.conversation_participants p
    where p.thread_id = conversation_threads.id
      and p.organization_id = conversation_threads.organization_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.has_org_capability(organization_id, 'message:update')
  or exists (
    select 1
    from public.conversation_participants p
    where p.thread_id = conversation_threads.id
      and p.organization_id = conversation_threads.organization_id
      and p.user_id = auth.uid()
  )
);

-- conversation_participants
drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select
on public.conversation_participants for select
using (
  public.has_org_capability(organization_id, 'message:read')
  or user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_participants self
    where self.thread_id = conversation_participants.thread_id
      and self.organization_id = conversation_participants.organization_id
      and self.user_id = auth.uid()
  )
);

drop policy if exists conversation_participants_insert on public.conversation_participants;
create policy conversation_participants_insert
on public.conversation_participants for insert
with check (
  public.has_org_capability(organization_id, 'message:create')
  or user_id = auth.uid()
);

drop policy if exists conversation_participants_update on public.conversation_participants;
create policy conversation_participants_update
on public.conversation_participants for update
using (
  public.has_org_capability(organization_id, 'message:update')
  or user_id = auth.uid()
)
with check (
  public.has_org_capability(organization_id, 'message:update')
  or user_id = auth.uid()
);

-- communication_messages
drop policy if exists communication_messages_select on public.communication_messages;
create policy communication_messages_select
on public.communication_messages for select
using (
  public.has_org_capability(organization_id, 'message:read')
  or (
    exists (
      select 1
      from public.conversation_participants p
      where p.thread_id = communication_messages.thread_id
        and p.organization_id = communication_messages.organization_id
        and p.user_id = auth.uid()
    )
    and (
      visibility <> 'internal'
      or public.has_org_capability(organization_id, 'message:update')
    )
  )
);

drop policy if exists communication_messages_insert on public.communication_messages;
create policy communication_messages_insert
on public.communication_messages for insert
with check (
  sender_id = auth.uid()
  and created_by = auth.uid()
  and (
    public.has_org_capability(organization_id, 'message:create')
    or exists (
      select 1
      from public.conversation_participants p
      where p.thread_id = communication_messages.thread_id
        and p.organization_id = communication_messages.organization_id
        and p.user_id = auth.uid()
    )
  )
);

drop policy if exists communication_messages_update on public.communication_messages;
create policy communication_messages_update
on public.communication_messages for update
using (
  public.has_org_capability(organization_id, 'message:update')
  or sender_id = auth.uid()
)
with check (
  public.has_org_capability(organization_id, 'message:update')
  or sender_id = auth.uid()
);

-- message_read_receipts
drop policy if exists message_read_receipts_select on public.message_read_receipts;
create policy message_read_receipts_select
on public.message_read_receipts for select
using (
  public.has_org_capability(organization_id, 'message:read')
  or user_id = auth.uid()
);

drop policy if exists message_read_receipts_insert on public.message_read_receipts;
create policy message_read_receipts_insert
on public.message_read_receipts for insert
with check (user_id = auth.uid());

drop policy if exists message_read_receipts_update on public.message_read_receipts;
create policy message_read_receipts_update
on public.message_read_receipts for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- in_app_notifications
drop policy if exists in_app_notifications_select on public.in_app_notifications;
create policy in_app_notifications_select
on public.in_app_notifications for select
using (
  public.has_org_capability(organization_id, 'notification:read')
  and user_id = auth.uid()
);

drop policy if exists in_app_notifications_insert on public.in_app_notifications;
create policy in_app_notifications_insert
on public.in_app_notifications for insert
with check (
  public.has_org_capability(organization_id, 'message:create')
  or public.has_org_capability(organization_id, 'communication:publish')
);

drop policy if exists in_app_notifications_update on public.in_app_notifications;
create policy in_app_notifications_update
on public.in_app_notifications for update
using (
  user_id = auth.uid()
  and public.has_org_capability(organization_id, 'notification:update')
)
with check (
  user_id = auth.uid()
  and public.has_org_capability(organization_id, 'notification:update')
);

-- community_events
drop policy if exists community_events_select on public.community_events;
create policy community_events_select
on public.community_events for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or public.has_org_capability(organization_id, 'message:read')
);

drop policy if exists community_events_insert on public.community_events;
create policy community_events_insert
on public.community_events for insert
with check (
  public.has_org_capability(organization_id, 'communication:create')
  and created_by = auth.uid()
);

drop policy if exists community_events_update on public.community_events;
create policy community_events_update
on public.community_events for update
using (public.has_org_capability(organization_id, 'communication:update'))
with check (public.has_org_capability(organization_id, 'communication:update'));

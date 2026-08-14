-- COM-002 Tenant Communication Center (ADR-024)
-- Two-way threads beside one-way comms_messages notices.
-- No billing / Stripe / commercial SKU changes.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_pm_staff(target_org_id uuid)
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
        'leasing_agent',
        'maintenance_technician'
      ]::text[]
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
    public.is_pm_staff(target_org_id)
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

-- ---------------------------------------------------------------------------
-- Conversation domain
-- ---------------------------------------------------------------------------

create table if not exists public.comms_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  lease_id uuid not null references public.lease_agreements (id) on delete restrict,
  tenant_account_id uuid not null references public.pm_residents (id) on delete restrict,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  linked_entity_type text
    check (linked_entity_type is null or linked_entity_type in ('work_order', 'lease', 'property')),
  linked_entity_id uuid,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz,
  last_message_preview text,
  last_sender_user_id uuid references auth.users (id) on delete set null
);

create unique index if not exists comms_conversations_unique_link_idx
  on public.comms_conversations (
    organization_id,
    tenant_account_id,
    coalesce(linked_entity_type, ''),
    coalesce(linked_entity_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists comms_conversations_org_inbox_idx
  on public.comms_conversations (organization_id, last_message_at desc nulls last);

create index if not exists comms_conversations_tenant_idx
  on public.comms_conversations (organization_id, tenant_account_id, last_message_at desc nulls last);

create table if not exists public.comms_conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.comms_conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  participant_type text not null check (participant_type in ('tenant', 'staff')),
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_account_id uuid references public.pm_residents (id) on delete set null,
  added_at timestamptz not null default timezone('utc', now()),
  last_read_at timestamptz,
  muted_at timestamptz,
  unique (conversation_id, user_id)
);

create index if not exists comms_conversation_participants_user_idx
  on public.comms_conversation_participants (organization_id, user_id);

create table if not exists public.comms_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.comms_conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete restrict,
  sender_plane text not null check (sender_plane in ('tenant', 'staff')),
  body text not null default '',
  linked_document_id uuid references public.document_documents (id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default timezone('utc', now()),
  hidden_at timestamptz,
  hidden_by uuid references auth.users (id) on delete set null
);

create unique index if not exists comms_conversation_messages_idempotency_idx
  on public.comms_conversation_messages (organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists comms_conversation_messages_thread_idx
  on public.comms_conversation_messages (conversation_id, created_at, id);

create table if not exists public.comms_message_reads (
  message_id uuid not null references public.comms_conversation_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  primary key (message_id, user_id)
);

create index if not exists comms_message_reads_user_idx
  on public.comms_message_reads (organization_id, user_id, read_at desc);

alter table public.comms_notifications
  add column if not exists conversation_id uuid references public.comms_conversations (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.comms_conversations enable row level security;
alter table public.comms_conversation_participants enable row level security;
alter table public.comms_conversation_messages enable row level security;
alter table public.comms_message_reads enable row level security;

drop policy if exists comms_conversations_select on public.comms_conversations;
create policy comms_conversations_select
on public.comms_conversations
for select
to authenticated
using (
  public.can_access_tenant_conversation(organization_id, lease_id, tenant_account_id)
);

drop policy if exists comms_conversations_insert_staff on public.comms_conversations;
create policy comms_conversations_insert_staff
on public.comms_conversations
for insert
to authenticated
with check (public.is_pm_staff(organization_id));

drop policy if exists comms_conversations_update_staff on public.comms_conversations;
create policy comms_conversations_update_staff
on public.comms_conversations
for update
to authenticated
using (
  public.can_access_tenant_conversation(organization_id, lease_id, tenant_account_id)
)
with check (
  public.can_access_tenant_conversation(organization_id, lease_id, tenant_account_id)
);

drop policy if exists comms_participants_select on public.comms_conversation_participants;
create policy comms_participants_select
on public.comms_conversation_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.comms_conversations c
    where c.id = conversation_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
);

drop policy if exists comms_participants_write on public.comms_conversation_participants;
create policy comms_participants_write
on public.comms_conversation_participants
for all
to authenticated
using (
  exists (
    select 1
    from public.comms_conversations c
    where c.id = conversation_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
)
with check (
  exists (
    select 1
    from public.comms_conversations c
    where c.id = conversation_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
);

drop policy if exists comms_thread_messages_select on public.comms_conversation_messages;
create policy comms_thread_messages_select
on public.comms_conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.comms_conversations c
    where c.id = conversation_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
  and (
    hidden_at is null
    or public.is_pm_staff(organization_id)
  )
);

drop policy if exists comms_thread_messages_insert on public.comms_conversation_messages;
create policy comms_thread_messages_insert
on public.comms_conversation_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.comms_conversations c
    where c.id = conversation_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
);

drop policy if exists comms_thread_messages_update_staff on public.comms_conversation_messages;
create policy comms_thread_messages_update_staff
on public.comms_conversation_messages
for update
to authenticated
using (public.is_pm_staff(organization_id))
with check (public.is_pm_staff(organization_id));

drop policy if exists comms_message_reads_select on public.comms_message_reads;
create policy comms_message_reads_select
on public.comms_message_reads
for select
to authenticated
using (
  exists (
    select 1
    from public.comms_conversation_messages m
    join public.comms_conversations c on c.id = m.conversation_id
    where m.id = message_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
);

drop policy if exists comms_message_reads_insert on public.comms_message_reads;
create policy comms_message_reads_insert
on public.comms_message_reads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.comms_conversation_messages m
    join public.comms_conversations c on c.id = m.conversation_id
    where m.id = message_id
      and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
  )
);

-- ---------------------------------------------------------------------------
-- MEDIA-001 extension: conversation_message parent type
-- ---------------------------------------------------------------------------

alter table public.media_attachments
  drop constraint if exists media_attachments_related_entity_type_check;

alter table public.media_attachments
  add constraint media_attachments_related_entity_type_check
  check (related_entity_type in (
    'maintenance',
    'vendor',
    'inspection',
    'incident',
    'organization',
    'conversation_message'
  ));

drop policy if exists media_attachments_select_member on public.media_attachments;
create policy media_attachments_select_member
on public.media_attachments
for select
to authenticated
using (
  deleted_at is null
  and (
    case
      when related_entity_type = 'conversation_message' then
        (
          related_entity_id is null
          and uploaded_by_user_id = auth.uid()
          and public.is_org_member(organization_id)
        )
        or exists (
          select 1
          from public.comms_conversation_messages m
          join public.comms_conversations c on c.id = m.conversation_id
          where m.id = media_attachments.related_entity_id
            and public.can_access_tenant_conversation(c.organization_id, c.lease_id, c.tenant_account_id)
        )
      else
        public.is_org_member(organization_id)
    end
  )
);

comment on table public.comms_conversations is
  'COM-002 Tenant Communication Center threads. Distinct from one-way comms_messages notices.';

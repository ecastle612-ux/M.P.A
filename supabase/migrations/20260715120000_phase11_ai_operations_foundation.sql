-- Phase 11 foundation: AI Operations Center — assistant-only, relational context, no embeddings.

-- ---------------------------------------------------------------------------
-- ai_conversations
-- ---------------------------------------------------------------------------

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  status text not null default 'active' check (status in ('active', 'archived')),
  last_prompt_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

-- ---------------------------------------------------------------------------
-- ai_messages
-- ---------------------------------------------------------------------------

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  prompt_key text,
  sources jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint ai_messages_conversation_fk
    foreign key (conversation_id, organization_id)
    references public.ai_conversations (id, organization_id)
    on delete cascade
);

-- ---------------------------------------------------------------------------
-- ai_insights (summaries, recommendations, risks, drafts)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  insight_type text not null check (
    insight_type in ('summary', 'recommendation', 'risk', 'draft')
  ),
  category text not null check (
    category in (
      'portfolio',
      'maintenance',
      'vendor',
      'financial',
      'communication',
      'lease',
      'vacancy',
      'general'
    )
  ),
  priority text not null default 'medium' check (
    priority in ('high', 'medium', 'low')
  ),
  status text not null default 'active' check (
    status in ('active', 'dismissed', 'applied')
  ),
  title text not null,
  content text not null,
  action_href text,
  action_label text,
  entity_type text,
  entity_id uuid,
  prompt_key text,
  sources jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

-- ---------------------------------------------------------------------------
-- ai_activity (append-only assistant activity log)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type text not null check (
    activity_type in (
      'prompt_run',
      'insight_generated',
      'insight_dismissed',
      'insight_applied',
      'draft_created',
      'summary_generated'
    )
  ),
  conversation_id uuid,
  insight_id uuid,
  prompt_key text,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------

create index if not exists ai_conversations_org_user_idx
  on public.ai_conversations (organization_id, user_id, updated_at desc)
  where deleted_at is null;

create index if not exists ai_messages_org_conversation_idx
  on public.ai_messages (organization_id, conversation_id, created_at asc);

create index if not exists ai_insights_org_status_idx
  on public.ai_insights (organization_id, status, priority)
  where deleted_at is null;

create index if not exists ai_insights_org_category_idx
  on public.ai_insights (organization_id, category)
  where deleted_at is null;

create index if not exists ai_insights_org_type_idx
  on public.ai_insights (organization_id, insight_type)
  where deleted_at is null;

create index if not exists ai_activity_org_created_idx
  on public.ai_activity (organization_id, created_at desc);

create index if not exists ai_activity_org_user_idx
  on public.ai_activity (organization_id, user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_ai_conversations_updated_at on public.ai_conversations;
create trigger trg_ai_conversations_updated_at
before update on public.ai_conversations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ai_insights_updated_at on public.ai_insights;
create trigger trg_ai_insights_updated_at
before update on public.ai_insights
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('ai:read', 'ai', 'Read AI insights, summaries, and conversation history'),
  ('ai:use', 'ai', 'Run AI assistant prompts and generate drafts')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'ai:read'),
  ('property_manager', 'ai:use'),
  ('property_owner', 'ai:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ai_activity enable row level security;

-- ai_conversations
drop policy if exists ai_conversations_select on public.ai_conversations;
create policy ai_conversations_select
on public.ai_conversations for select
using (
  public.has_org_capability(organization_id, 'ai:read')
  and (user_id = auth.uid() or public.has_org_capability(organization_id, 'ai:use'))
);

drop policy if exists ai_conversations_insert on public.ai_conversations;
create policy ai_conversations_insert
on public.ai_conversations for insert
with check (
  public.has_org_capability(organization_id, 'ai:use')
  and user_id = auth.uid()
  and created_by = auth.uid()
);

drop policy if exists ai_conversations_update on public.ai_conversations;
create policy ai_conversations_update
on public.ai_conversations for update
using (
  public.has_org_capability(organization_id, 'ai:use')
  and user_id = auth.uid()
)
with check (
  public.has_org_capability(organization_id, 'ai:use')
  and user_id = auth.uid()
);

-- ai_messages
drop policy if exists ai_messages_select on public.ai_messages;
create policy ai_messages_select
on public.ai_messages for select
using (public.has_org_capability(organization_id, 'ai:read'));

drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert
on public.ai_messages for insert
with check (
  public.has_org_capability(organization_id, 'ai:use')
  and created_by = auth.uid()
);

-- ai_insights
drop policy if exists ai_insights_select on public.ai_insights;
create policy ai_insights_select
on public.ai_insights for select
using (public.has_org_capability(organization_id, 'ai:read'));

drop policy if exists ai_insights_insert on public.ai_insights;
create policy ai_insights_insert
on public.ai_insights for insert
with check (
  public.has_org_capability(organization_id, 'ai:use')
  and created_by = auth.uid()
);

drop policy if exists ai_insights_update on public.ai_insights;
create policy ai_insights_update
on public.ai_insights for update
using (public.has_org_capability(organization_id, 'ai:use'))
with check (public.has_org_capability(organization_id, 'ai:use'));

-- ai_activity
drop policy if exists ai_activity_select on public.ai_activity;
create policy ai_activity_select
on public.ai_activity for select
using (public.has_org_capability(organization_id, 'ai:read'));

drop policy if exists ai_activity_insert on public.ai_activity;
create policy ai_activity_insert
on public.ai_activity for insert
with check (
  public.has_org_capability(organization_id, 'ai:use')
  and user_id = auth.uid()
);

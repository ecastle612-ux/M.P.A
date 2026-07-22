-- VENDOR-001 Phase A: tokenized vendor work-order access + job sessions
-- Additive statuses only; does not redesign PM work-order UX.

-- Work order statuses: Vendor On Site / Awaiting Approval
alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_status_check;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_status_check
  check (
    status in (
      'submitted',
      'triaged',
      'assigned',
      'in_progress',
      'vendor_on_site',
      'awaiting_approval',
      'on_hold',
      'completed',
      'cancelled'
    )
  );

-- Activity events for token job lifecycle
alter table public.maintenance_activity_events
  drop constraint if exists maintenance_activity_events_event_type_check;

alter table public.maintenance_activity_events
  add constraint maintenance_activity_events_event_type_check
  check (
    event_type in (
      'created',
      'status_changed',
      'assigned',
      'note_added',
      'updated',
      'completed',
      'archived',
      'restored',
      'vendor_assigned',
      'vendor_reassigned',
      'vendor_status_changed',
      'vendor_accepted',
      'vendor_arrived',
      'vendor_completed',
      'vendor_cancelled',
      'vendor_job_viewed',
      'vendor_job_started',
      'vendor_job_finished',
      'vendor_token_minted',
      'vendor_token_revoked'
    )
  );

create table if not exists public.vendor_work_order_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null,
  vendor_id uuid null,
  token_hash text not null unique,
  token_prefix text not null,
  expires_at timestamptz null,
  revoked_at timestamptz null,
  last_viewed_at timestamptz null,
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_work_order_tokens_wo_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade
);

create index if not exists vendor_work_order_tokens_org_wo_idx
  on public.vendor_work_order_tokens (organization_id, work_order_id, created_at desc);

create index if not exists vendor_work_order_tokens_active_wo_idx
  on public.vendor_work_order_tokens (organization_id, work_order_id)
  where revoked_at is null;

create table if not exists public.vendor_job_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null,
  token_id uuid not null references public.vendor_work_order_tokens (id) on delete cascade,
  started_at timestamptz null,
  completed_at timestamptz null,
  arrival_latitude double precision null,
  arrival_longitude double precision null,
  arrival_accuracy_m double precision null,
  device_summary text null,
  completion_notes text null,
  photo_paths jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_job_sessions_wo_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade
);

create index if not exists vendor_job_sessions_org_wo_idx
  on public.vendor_job_sessions (organization_id, work_order_id, created_at desc);

create unique index if not exists vendor_job_sessions_one_open_per_token_idx
  on public.vendor_job_sessions (token_id)
  where completed_at is null and started_at is not null;

drop trigger if exists trg_vendor_work_order_tokens_updated_at on public.vendor_work_order_tokens;
create trigger trg_vendor_work_order_tokens_updated_at
before update on public.vendor_work_order_tokens
for each row execute function public.set_updated_at();

drop trigger if exists trg_vendor_job_sessions_updated_at on public.vendor_job_sessions;
create trigger trg_vendor_job_sessions_updated_at
before update on public.vendor_job_sessions
for each row execute function public.set_updated_at();

alter table public.vendor_work_order_tokens enable row level security;
alter table public.vendor_job_sessions enable row level security;

-- PM org members with maintenance:read can view tokens/sessions for their org.
drop policy if exists vendor_wo_tokens_select on public.vendor_work_order_tokens;
create policy vendor_wo_tokens_select on public.vendor_work_order_tokens
for select using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists vendor_wo_tokens_manage on public.vendor_work_order_tokens;
create policy vendor_wo_tokens_manage on public.vendor_work_order_tokens
for all using (public.has_org_capability(organization_id, 'maintenance:update'))
with check (public.has_org_capability(organization_id, 'maintenance:update'));

drop policy if exists vendor_job_sessions_select on public.vendor_job_sessions;
create policy vendor_job_sessions_select on public.vendor_job_sessions
for select using (public.has_org_capability(organization_id, 'maintenance:read'));

-- Mutations for public token flow use service role (no anon write policies).

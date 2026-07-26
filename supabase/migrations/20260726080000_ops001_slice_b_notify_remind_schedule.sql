-- OPS-001 Slice B: Notification Center substrate + Reminder Engine + Scheduler foundation.
-- Consumes Slice A Event Bus / Activity Timeline — no parallel bus.
-- Domain modules must not call channel SDKs directly; fan-out via Notification Center.

-- ---------------------------------------------------------------------------
-- Reminder Engine
-- ---------------------------------------------------------------------------
create table if not exists public.ops_reminders (
  reminder_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  reminder_type text not null check (
    reminder_type in ('absolute', 'relative', 'recurring', 'snooze', 'escalation')
  ),
  subject_type text not null,
  subject_id uuid not null,
  recipient_principal_id uuid,
  fire_at timestamptz not null,
  cadence text,
  rrule text,
  action text not null default 'emit_event' check (
    action in ('emit_event', 'notify', 'emit_and_notify')
  ),
  event_type text,
  notify_category text,
  notify_priority text not null default 'normal' check (
    notify_priority in ('low', 'normal', 'high', 'emergency')
  ),
  title text,
  body text,
  href text,
  property_id uuid,
  unit_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'processing', 'fired', 'canceled', 'error')
  ),
  idempotency_key text not null,
  consolidation_key text,
  terminal_cancel_reason text,
  last_error text,
  fired_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, idempotency_key)
);

create index if not exists ops_reminders_due_idx
  on public.ops_reminders (status, fire_at)
  where status = 'scheduled';

create index if not exists ops_reminders_org_subject_idx
  on public.ops_reminders (organization_id, subject_type, subject_id);

create index if not exists ops_reminders_org_recipient_idx
  on public.ops_reminders (organization_id, recipient_principal_id, fire_at)
  where recipient_principal_id is not null;

create index if not exists ops_reminders_consolidation_idx
  on public.ops_reminders (organization_id, consolidation_key, fire_at)
  where consolidation_key is not null and status = 'scheduled';

comment on table public.ops_reminders is
  'OPS-001 Slice B Reminder Engine. Idempotent fire via (organization_id, idempotency_key).';

-- ---------------------------------------------------------------------------
-- Scheduler foundation
-- ---------------------------------------------------------------------------
create table if not exists public.ops_schedules (
  schedule_id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  name text not null,
  job_type text not null,
  schedule_kind text not null check (
    schedule_kind in ('cron', 'interval', 'one_shot')
  ),
  cron_expr text,
  interval_seconds integer,
  run_at timestamptz,
  timezone text not null default 'UTC',
  payload jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ops_schedules_due_idx
  on public.ops_schedules (enabled, next_run_at)
  where enabled = true;

create unique index if not exists ops_schedules_platform_name_uidx
  on public.ops_schedules (name)
  where organization_id is null;

create unique index if not exists ops_schedules_org_name_uidx
  on public.ops_schedules (organization_id, name)
  where organization_id is not null;

comment on table public.ops_schedules is
  'OPS-001 Slice B Scheduler definitions. organization_id null = platform schedule.';

create table if not exists public.ops_scheduler_leader (
  leader_key text primary key default 'default',
  holder_id text not null,
  leased_until timestamptz not null,
  heartbeat_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.ops_scheduler_leader is
  'OPS-001 Slice B single-leader lease. Only the holder may enqueue due schedules.';

create table if not exists public.ops_scheduler_runs (
  run_id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.ops_schedules (schedule_id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  window_key text not null,
  job_type text not null,
  status text not null default 'running' check (
    status in ('running', 'completed', 'failed', 'skipped')
  ),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error text,
  result jsonb not null default '{}'::jsonb,
  unique (schedule_id, window_key)
);

create index if not exists ops_scheduler_runs_started_idx
  on public.ops_scheduler_runs (started_at desc);

comment on table public.ops_scheduler_runs is
  'OPS-001 Slice B idempotent schedule run windows (schedule_id + window_key).';

-- Org notification policy floors (cannot disable required categories without override)
create table if not exists public.ops_notification_org_policies (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  required_categories text[] not null default array['emergency', 'system']::text[],
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start_local text not null default '22:00',
  quiet_hours_end_local text not null default '07:00',
  quiet_hours_timezone text not null default 'UTC',
  emergency_override boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.ops_notification_org_policies is
  'OPS-001 Slice B org policy floors for Notification Center preference fan-out.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ops_reminders enable row level security;
alter table public.ops_schedules enable row level security;
alter table public.ops_scheduler_leader enable row level security;
alter table public.ops_scheduler_runs enable row level security;
alter table public.ops_notification_org_policies enable row level security;

create policy ops_reminders_member_select on public.ops_reminders
  for select to authenticated
  using (
    exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_reminders.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

create policy ops_reminders_member_insert on public.ops_reminders
  for insert to authenticated
  with check (
    exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_reminders.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

create policy ops_reminders_member_update on public.ops_reminders
  for update to authenticated
  using (
    exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_reminders.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

create policy ops_schedules_member_select on public.ops_schedules
  for select to authenticated
  using (
    organization_id is null
    or exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_schedules.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

create policy ops_notification_org_policies_member_select on public.ops_notification_org_policies
  for select to authenticated
  using (
    exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_notification_org_policies.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

create policy ops_scheduler_runs_member_select on public.ops_scheduler_runs
  for select to authenticated
  using (
    organization_id is null
    or exists (
      select 1 from public.organization_memberships memberships
      where memberships.organization_id = ops_scheduler_runs.organization_id
        and memberships.user_id = auth.uid()
        and memberships.status = 'active'
    )
  );

-- Leader + writes for schedules/runs/policies: service_role bypasses RLS

-- ---------------------------------------------------------------------------
-- Leader lease RPC (SKIP LOCKED style single-leader)
-- ---------------------------------------------------------------------------
create or replace function public.ops_acquire_scheduler_leader(
  p_holder_id text,
  p_lease_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_until timestamptz := v_now + make_interval(secs => greatest(p_lease_seconds, 15));
  v_updated integer;
begin
  insert into public.ops_scheduler_leader (leader_key, holder_id, leased_until, heartbeat_at, updated_at)
  values ('default', p_holder_id, v_until, v_now, v_now)
  on conflict (leader_key) do update
    set holder_id = excluded.holder_id,
        leased_until = excluded.leased_until,
        heartbeat_at = excluded.heartbeat_at,
        updated_at = excluded.updated_at
    where public.ops_scheduler_leader.leased_until <= v_now
       or public.ops_scheduler_leader.holder_id = p_holder_id;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    -- Try heartbeat renew if we already hold
    update public.ops_scheduler_leader
      set leased_until = v_until,
          heartbeat_at = v_now,
          updated_at = v_now
      where leader_key = 'default'
        and holder_id = p_holder_id;
    get diagnostics v_updated = row_count;
  end if;

  return v_updated > 0;
end;
$$;

revoke all on function public.ops_acquire_scheduler_leader(text, integer) from public;
grant execute on function public.ops_acquire_scheduler_leader(text, integer) to service_role;

-- Claim due reminders (SKIP LOCKED) for processing
create or replace function public.ops_claim_due_reminders(
  p_limit integer default 50,
  p_claimer text default 'reminder-engine'
)
returns setof public.ops_reminders
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select r.reminder_id
    from public.ops_reminders r
    where r.status = 'scheduled'
      and r.fire_at <= timezone('utc', now())
    order by r.fire_at asc
    limit greatest(p_limit, 1)
    for update skip locked
  )
  update public.ops_reminders r
    set status = 'processing',
        updated_at = timezone('utc', now())
  from due
  where r.reminder_id = due.reminder_id
  returning r.*;
end;
$$;

revoke all on function public.ops_claim_due_reminders(integer, text) from public;
grant execute on function public.ops_claim_due_reminders(integer, text) to service_role;

-- Seed platform schedules (idempotent)
insert into public.ops_schedules (
  organization_id, name, job_type, schedule_kind, interval_seconds, timezone, next_run_at, enabled, payload
)
select null, 'outbox_sweeper', 'outbox_sweeper', 'interval', 60, 'UTC', timezone('utc', now()), true, '{}'::jsonb
where not exists (
  select 1 from public.ops_schedules s where s.organization_id is null and s.name = 'outbox_sweeper'
);

insert into public.ops_schedules (
  organization_id, name, job_type, schedule_kind, interval_seconds, timezone, next_run_at, enabled, payload
)
select null, 'reminder_due_scan', 'reminder_due_scan', 'interval', 60, 'UTC', timezone('utc', now()), true, '{}'::jsonb
where not exists (
  select 1 from public.ops_schedules s where s.organization_id is null and s.name = 'reminder_due_scan'
);

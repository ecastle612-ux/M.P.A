-- STAB-006 / STAB-007 — Production Stabilization Sprint 5
-- Additive only. Do not apply to mpa-prod from this sprint automatically.

-- ---------------------------------------------------------------------------
-- Critical production error feed (Master Admin)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_error_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  severity text not null
    check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  message text not null,
  error_name text,
  stack text,
  request_id text,
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id uuid,
  route text,
  source text not null default 'server'
    check (source in ('server', 'client', 'edge', 'job')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists platform_error_events_created_idx
  on public.platform_error_events (created_at desc);

create index if not exists platform_error_events_severity_created_idx
  on public.platform_error_events (severity, created_at desc);

create index if not exists platform_error_events_org_created_idx
  on public.platform_error_events (organization_id, created_at desc);

alter table public.platform_error_events enable row level security;

-- Platform operators only (service role bypasses RLS for inserts from app sinks).
drop policy if exists platform_error_events_operator_select on public.platform_error_events;
create policy platform_error_events_operator_select
on public.platform_error_events
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_operators op
    where op.user_id = auth.uid()
      and op.status = 'active'
  )
);

-- ---------------------------------------------------------------------------
-- Maintenance notification delivery honesty (email channel)
-- ---------------------------------------------------------------------------

alter table public.maintenance_notifications
  add column if not exists channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'in_app_and_email'));

alter table public.maintenance_notifications
  add column if not exists email_delivery_status text
    check (
      email_delivery_status is null
      or email_delivery_status in (
        'skipped_no_email',
        'skipped_not_configured',
        'queued',
        'sent',
        'failed'
      )
    );

alter table public.maintenance_notifications
  add column if not exists email_delivery_error text;

alter table public.maintenance_notifications
  add column if not exists email_provider_id text;

alter table public.maintenance_notifications
  add column if not exists email_attempted_at timestamptz;

comment on table public.platform_error_events is
  'STAB-006 durable critical/error feed for Master Admin Command Center.';

comment on column public.maintenance_notifications.email_delivery_status is
  'STAB-007 honest email delivery outcome; null when email was not attempted.';

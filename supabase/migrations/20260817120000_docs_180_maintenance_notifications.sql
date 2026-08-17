-- docs/180 P1-10 — additive maintenance_notifications end state only.
-- Does NOT replay J6 work-order DDL. Production already has work-order infrastructure.
-- Designed columns: J6 + STAB-007. Policies: J6 select + PLAT-002 insert + update-own.
-- Do not apply this file to Production from the implement package.

create table if not exists public.maintenance_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_order_id uuid references public.maintenance_work_orders (id) on delete cascade,
  notification_key text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'in_app_and_email')),
  email_delivery_status text
    check (
      email_delivery_status is null
      or email_delivery_status in (
        'skipped_no_email',
        'skipped_not_configured',
        'queued',
        'sent',
        'failed'
      )
    ),
  email_delivery_error text,
  email_provider_id text,
  email_attempted_at timestamptz
);

alter table public.maintenance_notifications
  add column if not exists channel text not null default 'in_app';

alter table public.maintenance_notifications
  add column if not exists email_delivery_status text;

alter table public.maintenance_notifications
  add column if not exists email_delivery_error text;

alter table public.maintenance_notifications
  add column if not exists email_provider_id text;

alter table public.maintenance_notifications
  add column if not exists email_attempted_at timestamptz;

create index if not exists maintenance_notifications_user_idx
  on public.maintenance_notifications (user_id, created_at desc);

create index if not exists maintenance_notifications_org_user_idx
  on public.maintenance_notifications (organization_id, user_id, created_at desc);

alter table public.maintenance_notifications enable row level security;

drop policy if exists maintenance_notifications_select_own on public.maintenance_notifications;
create policy maintenance_notifications_select_own
on public.maintenance_notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists maintenance_notifications_insert on public.maintenance_notifications;
create policy maintenance_notifications_insert
on public.maintenance_notifications
for insert
to authenticated
with check (
  public.is_maintenance_manager(organization_id)
  or user_id = auth.uid()
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

revoke all on table public.maintenance_notifications from public, anon;
grant select, insert, update on table public.maintenance_notifications to authenticated;

comment on table public.maintenance_notifications is
  'Work-order lifecycle in-app notifications. Optional/legacy until applied; Notification Center source=maintenance.';

comment on column public.maintenance_notifications.email_delivery_status is
  'STAB-007 honest email delivery outcome; null when email was not attempted.';

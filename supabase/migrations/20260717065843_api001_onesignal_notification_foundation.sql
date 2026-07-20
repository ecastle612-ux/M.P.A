-- API-001 — OneSignal notification foundation
-- Extends in_app_notifications + resident_devices for provider delivery.

-- ---------------------------------------------------------------------------
-- Category remap (legacy → API-001 taxonomy)
-- ---------------------------------------------------------------------------
update public.in_app_notifications set category = 'messages' where category = 'message';
update public.in_app_notifications set category = 'leases' where category = 'lease';
update public.in_app_notifications set category = 'announcements' where category = 'announcement';
update public.in_app_notifications set category = 'applicants' where category = 'applicant';
update public.in_app_notifications set category = 'ai_operations' where category = 'ai';

alter table public.in_app_notifications
  drop constraint if exists in_app_notifications_category_check;

alter table public.in_app_notifications
  add constraint in_app_notifications_category_check check (
    category in (
      'maintenance',
      'messages',
      'announcements',
      'residents',
      'applicants',
      'leases',
      'financial',
      'vendors',
      'inspections',
      'emergency',
      'ai_operations',
      'system'
    )
  );

alter table public.in_app_notifications
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'emergency'));

alter table public.in_app_notifications
  add column if not exists property_id uuid references public.properties (id) on delete set null;

alter table public.in_app_notifications
  add column if not exists unit_id uuid references public.units (id) on delete set null;

alter table public.in_app_notifications
  add column if not exists archived_at timestamptz;

alter table public.in_app_notifications
  add column if not exists deleted_at timestamptz;

alter table public.in_app_notifications
  add column if not exists push_delivery_status text not null default 'skipped'
    check (
      push_delivery_status in ('pending', 'sent', 'delivered', 'failed', 'skipped')
    );

alter table public.in_app_notifications
  add column if not exists push_external_id text;

alter table public.in_app_notifications
  add column if not exists push_last_error text;

alter table public.in_app_notifications
  add column if not exists idempotency_key text;

create unique index if not exists in_app_notifications_org_idempotency_uidx
  on public.in_app_notifications (organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists in_app_notifications_user_active_idx
  on public.in_app_notifications (organization_id, user_id, created_at desc)
  where deleted_at is null and archived_at is null;

create index if not exists in_app_notifications_user_unread_active_idx
  on public.in_app_notifications (organization_id, user_id, created_at desc)
  where read_at is null and deleted_at is null and archived_at is null;

create index if not exists in_app_notifications_priority_idx
  on public.in_app_notifications (organization_id, priority, created_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- resident_devices — real provider subscription ids
-- ---------------------------------------------------------------------------
alter table public.resident_devices
  add column if not exists external_subscription_id text;

alter table public.resident_devices
  add column if not exists provider_key text not null default 'noop';

update public.resident_devices
set external_subscription_id = coalesce(external_subscription_id, push_token_placeholder)
where external_subscription_id is null
  and push_token_placeholder is not null;

create index if not exists resident_devices_subscription_idx
  on public.resident_devices (organization_id, user_id, provider_key)
  where deleted_at is null and is_active = true;

-- ---------------------------------------------------------------------------
-- notification_preferences — emergency override + richer quiet hours default
-- ---------------------------------------------------------------------------
alter table public.notification_preferences
  add column if not exists emergency_override boolean not null default true;

alter table public.notification_preferences
  add column if not exists property_preferences jsonb not null default '[]'::jsonb;

-- Phase 9 foundation: resident communication platform (MHF-001).
-- Digital announcements, QR enrollment, delivery placeholders, read receipts.

create or replace function public.generate_building_qr_token()
returns text
language sql
as $$
  select encode(gen_random_bytes(24), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- building_qr_codes — one active QR per property (auto-provisioned)
-- ---------------------------------------------------------------------------

create table if not exists public.building_qr_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  qr_token text not null default public.generate_building_qr_token(),
  label text not null default 'Property enrollment',
  building_name text,
  is_active boolean not null default true,
  enrollment_count integer not null default 0 check (enrollment_count >= 0),
  last_scanned_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (qr_token)
);

create unique index if not exists building_qr_codes_one_active_per_property_idx
  on public.building_qr_codes (organization_id, property_id)
  where is_active = true and deleted_at is null;

create index if not exists building_qr_codes_org_property_idx
  on public.building_qr_codes (organization_id, property_id)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- resident_communication_channels — per-resident delivery channel registry
-- ---------------------------------------------------------------------------

create table if not exists public.resident_communication_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  property_id uuid not null references public.properties (id) on delete cascade,
  channel_type text not null check (
    channel_type in ('in_app', 'push', 'email', 'sms')
  ),
  status text not null default 'active' check (
    status in ('active', 'placeholder', 'disabled')
  ),
  enrolled_via text not null default 'portal' check (
    enrolled_via in ('qr', 'portal', 'manual')
  ),
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, user_id, property_id, channel_type)
);

create index if not exists resident_communication_channels_org_user_idx
  on public.resident_communication_channels (organization_id, user_id)
  where deleted_at is null;

create index if not exists resident_communication_channels_org_property_idx
  on public.resident_communication_channels (organization_id, property_id)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- resident_devices — device enrollment (push-ready placeholder)
-- ---------------------------------------------------------------------------

create table if not exists public.resident_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  property_id uuid not null references public.properties (id) on delete cascade,
  platform text not null default 'web' check (
    platform in ('web', 'ios', 'android', 'unknown')
  ),
  device_label text,
  push_token_placeholder text,
  enrolled_via text not null default 'portal' check (
    enrolled_via in ('qr', 'portal', 'manual')
  ),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, user_id, property_id)
);

create index if not exists resident_devices_org_user_idx
  on public.resident_devices (organization_id, user_id)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  category_preferences jsonb not null default '{
    "community": true,
    "emergency": true,
    "maintenance": true,
    "lease": true,
    "general": true
  }'::jsonb,
  quiet_hours jsonb not null default '{}'::jsonb,
  language_code text not null default 'en',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, user_id)
);

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  message text not null,
  priority text not null default 'normal' check (
    priority in ('normal', 'high', 'emergency')
  ),
  category text not null default 'general' check (
    category in ('general', 'community', 'emergency', 'maintenance', 'lease')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'scheduled', 'published', 'archived')
  ),
  targeting_scope text not null default 'organization' check (
    targeting_scope in (
      'organization',
      'property',
      'building',
      'floor',
      'unit',
      'lease',
      'tenant',
      'selected_residents'
    )
  ),
  target_property_id uuid references public.properties (id) on delete set null,
  target_building text,
  target_floor_placeholder text,
  target_unit_id uuid references public.units (id) on delete set null,
  target_lease_id uuid references public.leases (id) on delete set null,
  target_tenant_id uuid references public.tenants (id) on delete set null,
  selected_tenant_ids jsonb not null default '[]'::jsonb,
  attachment_placeholder text,
  requires_acknowledgment boolean not null default false,
  scheduled_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  read_count integer not null default 0 check (read_count >= 0),
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

create index if not exists announcements_org_status_idx
  on public.announcements (organization_id, status)
  where deleted_at is null;

create index if not exists announcements_org_priority_idx
  on public.announcements (organization_id, priority)
  where deleted_at is null;

create index if not exists announcements_org_category_idx
  on public.announcements (organization_id, category)
  where deleted_at is null;

create index if not exists announcements_org_scheduled_idx
  on public.announcements (organization_id, scheduled_at)
  where status = 'scheduled' and deleted_at is null;

create index if not exists announcements_org_published_idx
  on public.announcements (organization_id, published_at desc)
  where status = 'published' and deleted_at is null;

-- ---------------------------------------------------------------------------
-- announcement_recipients — resolved delivery targets
-- ---------------------------------------------------------------------------

create table if not exists public.announcement_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  announcement_id uuid not null,
  tenant_id uuid references public.tenants (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  delivery_channel text not null default 'in_app' check (
    delivery_channel in ('in_app', 'push', 'email', 'sms')
  ),
  delivery_status text not null default 'pending' check (
    delivery_status in ('pending', 'delivered', 'failed', 'placeholder')
  ),
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (announcement_id, tenant_id, delivery_channel),
  constraint announcement_recipients_announcement_fk
    foreign key (announcement_id, organization_id)
    references public.announcements (id, organization_id)
    on delete cascade
);

create index if not exists announcement_recipients_org_announcement_idx
  on public.announcement_recipients (organization_id, announcement_id);

create index if not exists announcement_recipients_org_user_idx
  on public.announcement_recipients (organization_id, user_id);

-- ---------------------------------------------------------------------------
-- announcement_reads — permanent read receipt history
-- ---------------------------------------------------------------------------

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  announcement_id uuid not null,
  recipient_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  acknowledged_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (announcement_id, user_id),
  constraint announcement_reads_announcement_fk
    foreign key (announcement_id, organization_id)
    references public.announcements (id, organization_id)
    on delete cascade,
  constraint announcement_reads_recipient_fk
    foreign key (recipient_id, organization_id)
    references public.announcement_recipients (id, organization_id)
    on delete cascade
);

create index if not exists announcement_reads_org_announcement_idx
  on public.announcement_reads (organization_id, announcement_id);

create index if not exists announcement_reads_org_user_idx
  on public.announcement_reads (organization_id, user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_building_qr_codes_updated_at on public.building_qr_codes;
create trigger trg_building_qr_codes_updated_at
before update on public.building_qr_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_resident_communication_channels_updated_at on public.resident_communication_channels;
create trigger trg_resident_communication_channels_updated_at
before update on public.resident_communication_channels
for each row execute function public.set_updated_at();

drop trigger if exists trg_resident_devices_updated_at on public.resident_devices;
create trigger trg_resident_devices_updated_at
before update on public.resident_devices
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists trg_announcement_recipients_updated_at on public.announcement_recipients;
create trigger trg_announcement_recipients_updated_at
before update on public.announcement_recipients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-provision QR codes for properties
-- ---------------------------------------------------------------------------

create or replace function public.create_building_qr_code_for_property()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.building_qr_codes (
    organization_id,
    property_id,
    qr_token,
    label,
    created_by
  )
  values (
    NEW.organization_id,
    NEW.id,
    public.generate_building_qr_token(),
    coalesce(NEW.name, 'Property enrollment'),
    NEW.created_by
  )
  on conflict do nothing;
  return NEW;
end;
$$;

drop trigger if exists trg_properties_building_qr_code on public.properties;
create trigger trg_properties_building_qr_code
after insert on public.properties
for each row
execute function public.create_building_qr_code_for_property();

insert into public.building_qr_codes (organization_id, property_id, qr_token, label, created_by)
select
  p.organization_id,
  p.id,
  public.generate_building_qr_token(),
  coalesce(p.name, 'Property enrollment'),
  p.created_by
from public.properties p
where p.deleted_at is null
  and not exists (
    select 1
    from public.building_qr_codes b
    where b.property_id = p.id
      and b.organization_id = p.organization_id
      and b.deleted_at is null
  );

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('communication:create', 'communication', 'Create announcements and communication assets'),
  ('communication:read', 'communication', 'Read announcements and communication analytics'),
  ('communication:update', 'communication', 'Update draft announcements and preferences'),
  ('communication:archive', 'communication', 'Archive announcements'),
  ('communication:publish', 'communication', 'Publish and schedule announcements'),
  ('communication:delete', 'communication', 'Soft-delete announcements')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'communication:create'),
  ('property_manager', 'communication:read'),
  ('property_manager', 'communication:update'),
  ('property_manager', 'communication:archive'),
  ('property_manager', 'communication:publish'),
  ('property_manager', 'communication:delete'),
  ('tenant', 'communication:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.building_qr_codes enable row level security;
alter table public.resident_communication_channels enable row level security;
alter table public.resident_devices enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_recipients enable row level security;
alter table public.announcement_reads enable row level security;

-- building_qr_codes
drop policy if exists building_qr_codes_select_authorized on public.building_qr_codes;
create policy building_qr_codes_select_authorized
on public.building_qr_codes for select
using (public.has_org_capability(organization_id, 'communication:read'));

drop policy if exists building_qr_codes_insert_authorized on public.building_qr_codes;
create policy building_qr_codes_insert_authorized
on public.building_qr_codes for insert
with check (public.has_org_capability(organization_id, 'communication:create') and created_by = auth.uid());

drop policy if exists building_qr_codes_update_authorized on public.building_qr_codes;
create policy building_qr_codes_update_authorized
on public.building_qr_codes for update
using (public.has_org_capability(organization_id, 'communication:update'))
with check (public.has_org_capability(organization_id, 'communication:update'));

-- announcements (PM + resident recipients)
drop policy if exists announcements_select_authorized on public.announcements;
create policy announcements_select_authorized
on public.announcements for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or exists (
    select 1
    from public.announcement_recipients r
    where r.announcement_id = announcements.id
      and r.organization_id = announcements.organization_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists announcements_insert_authorized on public.announcements;
create policy announcements_insert_authorized
on public.announcements for insert
with check (public.has_org_capability(organization_id, 'communication:create') and created_by = auth.uid());

drop policy if exists announcements_update_authorized on public.announcements;
create policy announcements_update_authorized
on public.announcements for update
using (
  public.has_org_capability(organization_id, 'communication:update')
  or public.has_org_capability(organization_id, 'communication:archive')
  or public.has_org_capability(organization_id, 'communication:publish')
  or public.has_org_capability(organization_id, 'communication:delete')
)
with check (
  public.has_org_capability(organization_id, 'communication:update')
  or public.has_org_capability(organization_id, 'communication:archive')
  or public.has_org_capability(organization_id, 'communication:publish')
  or public.has_org_capability(organization_id, 'communication:delete')
);

drop policy if exists announcements_delete_authorized on public.announcements;
create policy announcements_delete_authorized
on public.announcements for delete
using (public.has_org_capability(organization_id, 'communication:delete'));

-- announcement_recipients
drop policy if exists announcement_recipients_select_authorized on public.announcement_recipients;
create policy announcement_recipients_select_authorized
on public.announcement_recipients for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or user_id = auth.uid()
);

drop policy if exists announcement_recipients_insert_authorized on public.announcement_recipients;
create policy announcement_recipients_insert_authorized
on public.announcement_recipients for insert
with check (public.has_org_capability(organization_id, 'communication:publish'));

drop policy if exists announcement_recipients_update_authorized on public.announcement_recipients;
create policy announcement_recipients_update_authorized
on public.announcement_recipients for update
using (public.has_org_capability(organization_id, 'communication:publish'))
with check (public.has_org_capability(organization_id, 'communication:publish'));

-- announcement_reads
drop policy if exists announcement_reads_select_authorized on public.announcement_reads;
create policy announcement_reads_select_authorized
on public.announcement_reads for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or user_id = auth.uid()
);

drop policy if exists announcement_reads_insert_authorized on public.announcement_reads;
create policy announcement_reads_insert_authorized
on public.announcement_reads for insert
with check (user_id = auth.uid());

drop policy if exists announcement_reads_update_authorized on public.announcement_reads;
create policy announcement_reads_update_authorized
on public.announcement_reads for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- resident channels / devices / preferences (self-service + PM read)
drop policy if exists resident_communication_channels_select on public.resident_communication_channels;
create policy resident_communication_channels_select
on public.resident_communication_channels for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or user_id = auth.uid()
);

drop policy if exists resident_communication_channels_insert on public.resident_communication_channels;
create policy resident_communication_channels_insert
on public.resident_communication_channels for insert
with check (user_id = auth.uid() and created_by = auth.uid());

drop policy if exists resident_communication_channels_update on public.resident_communication_channels;
create policy resident_communication_channels_update
on public.resident_communication_channels for update
using (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'))
with check (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'));

drop policy if exists resident_devices_select on public.resident_devices;
create policy resident_devices_select
on public.resident_devices for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or user_id = auth.uid()
);

drop policy if exists resident_devices_insert on public.resident_devices;
create policy resident_devices_insert
on public.resident_devices for insert
with check (user_id = auth.uid() and created_by = auth.uid());

drop policy if exists resident_devices_update on public.resident_devices;
create policy resident_devices_update
on public.resident_devices for update
using (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'))
with check (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'));

drop policy if exists notification_preferences_select on public.notification_preferences;
create policy notification_preferences_select
on public.notification_preferences for select
using (
  public.has_org_capability(organization_id, 'communication:read')
  or user_id = auth.uid()
);

drop policy if exists notification_preferences_insert on public.notification_preferences;
create policy notification_preferences_insert
on public.notification_preferences for insert
with check (user_id = auth.uid() and created_by = auth.uid());

drop policy if exists notification_preferences_update on public.notification_preferences;
create policy notification_preferences_update
on public.notification_preferences for update
using (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'))
with check (user_id = auth.uid() or public.has_org_capability(organization_id, 'communication:update'));

-- public QR token resolution (no PII — property context only)
create or replace function public.resolve_building_qr_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'organizationId', b.organization_id,
    'propertyId', b.property_id,
    'propertyName', p.name,
    'label', b.label,
    'qrToken', b.qr_token
  )
  into result
  from public.building_qr_codes b
  join public.properties p on p.id = b.property_id and p.organization_id = b.organization_id
  where b.qr_token = p_token
    and b.is_active = true
    and b.deleted_at is null
    and p.deleted_at is null;
  return coalesce(result, 'null'::jsonb);
end;
$$;

grant execute on function public.resolve_building_qr_token(text) to anon, authenticated;

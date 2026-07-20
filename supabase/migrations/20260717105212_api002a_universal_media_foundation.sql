-- API-002A — Universal Media Upload Foundation
-- Slice 0: schema, RLS, private storage bucket, profile media FK

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------
insert into public.permission_capabilities (key, namespace, description)
values
  ('media:read', 'media', 'Read organization media assets'),
  ('media:write', 'media', 'Create and replace organization media assets'),
  ('media:delete', 'media', 'Delete organization media assets')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'media:read'),
  ('property_manager', 'media:write'),
  ('property_manager', 'media:delete'),
  ('property_owner', 'media:read'),
  ('tenant', 'media:read'),
  ('vendor', 'media:read'),
  ('vendor', 'media:write')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- media_assets
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  plane text not null check (plane in ('user', 'organization')),
  kind text not null check (
    kind in (
      'profile_photo',
      'property_photo',
      'unit_photo',
      'maintenance_photo',
      'inspection_photo',
      'document',
      'general'
    )
  ),
  entity_type text,
  entity_id uuid,
  status text not null default 'pending_upload' check (
    status in ('pending_upload', 'processing', 'ready', 'failed', 'deleted')
  ),
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  content_hash text,
  storage_bucket text not null default 'media-private',
  storage_path text not null,
  original_filename text,
  width integer,
  height integer,
  version integer not null default 1 check (version >= 1),
  replaced_asset_id uuid references public.media_assets (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint media_assets_plane_org_check check (
    (plane = 'user' and organization_id is null)
    or (plane = 'organization' and organization_id is not null)
  )
);

create index if not exists media_assets_owner_idx on public.media_assets (owner_user_id);
create index if not exists media_assets_org_idx on public.media_assets (organization_id)
  where organization_id is not null;
create index if not exists media_assets_entity_idx on public.media_assets (entity_type, entity_id)
  where entity_id is not null;
create index if not exists media_assets_status_idx on public.media_assets (status);
create index if not exists media_assets_content_hash_idx on public.media_assets (content_hash)
  where content_hash is not null;

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at
before update on public.media_assets
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- media_asset_variants
-- ---------------------------------------------------------------------------
create table if not exists public.media_asset_variants (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  variant text not null check (variant in ('thumb', 'small', 'medium', 'large', 'original')),
  storage_path text not null,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  width integer,
  height integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (media_asset_id, variant)
);

create index if not exists media_asset_variants_asset_idx on public.media_asset_variants (media_asset_id);

-- ---------------------------------------------------------------------------
-- media_audit_events (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.media_audit_events (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid references public.media_assets (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  event_type text not null check (
    event_type in (
      'uploaded',
      'replaced',
      'deleted',
      'signed_url_issued',
      'processing_started',
      'processing_completed',
      'processing_failed',
      'scan_queued',
      'scan_cleared',
      'scan_blocked'
    )
  ),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists media_audit_events_asset_idx on public.media_audit_events (media_asset_id);
create index if not exists media_audit_events_created_idx on public.media_audit_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Profile: media_asset_id (never image_url as SoR)
-- ---------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists avatar_media_asset_id uuid references public.media_assets (id) on delete set null;

create index if not exists user_profiles_avatar_media_asset_idx
  on public.user_profiles (avatar_media_asset_id)
  where avatar_media_asset_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: media_assets
-- ---------------------------------------------------------------------------
alter table public.media_assets enable row level security;

drop policy if exists media_assets_select on public.media_assets;
create policy media_assets_select
on public.media_assets
for select
using (
  deleted_at is null
  and (
    owner_user_id = auth.uid()
    or (
      plane = 'organization'
      and organization_id is not null
      and public.has_org_capability(organization_id, 'media:read')
    )
  )
);

drop policy if exists media_assets_insert on public.media_assets;
create policy media_assets_insert
on public.media_assets
for insert
with check (
  owner_user_id = auth.uid()
  and (
    (plane = 'user' and organization_id is null)
    or (
      plane = 'organization'
      and organization_id is not null
      and public.has_org_capability(organization_id, 'media:write')
    )
  )
);

drop policy if exists media_assets_update on public.media_assets;
create policy media_assets_update
on public.media_assets
for update
using (
  owner_user_id = auth.uid()
  or (
    plane = 'organization'
    and organization_id is not null
    and public.has_org_capability(organization_id, 'media:write')
  )
)
with check (
  owner_user_id = auth.uid()
  or (
    plane = 'organization'
    and organization_id is not null
    and public.has_org_capability(organization_id, 'media:write')
  )
);

drop policy if exists media_assets_delete on public.media_assets;
create policy media_assets_delete
on public.media_assets
for delete
using (
  owner_user_id = auth.uid()
  or (
    plane = 'organization'
    and organization_id is not null
    and public.has_org_capability(organization_id, 'media:delete')
  )
);

-- ---------------------------------------------------------------------------
-- RLS: variants (via parent asset)
-- ---------------------------------------------------------------------------
alter table public.media_asset_variants enable row level security;

drop policy if exists media_asset_variants_select on public.media_asset_variants;
create policy media_asset_variants_select
on public.media_asset_variants
for select
using (
  exists (
    select 1
    from public.media_assets asset
    where asset.id = media_asset_id
      and asset.deleted_at is null
      and (
        asset.owner_user_id = auth.uid()
        or (
          asset.plane = 'organization'
          and asset.organization_id is not null
          and public.has_org_capability(asset.organization_id, 'media:read')
        )
      )
  )
);

drop policy if exists media_asset_variants_insert on public.media_asset_variants;
create policy media_asset_variants_insert
on public.media_asset_variants
for insert
with check (
  exists (
    select 1
    from public.media_assets asset
    where asset.id = media_asset_id
      and (
        asset.owner_user_id = auth.uid()
        or (
          asset.plane = 'organization'
          and asset.organization_id is not null
          and public.has_org_capability(asset.organization_id, 'media:write')
        )
      )
  )
);

drop policy if exists media_asset_variants_update on public.media_asset_variants;
create policy media_asset_variants_update
on public.media_asset_variants
for update
using (
  exists (
    select 1
    from public.media_assets asset
    where asset.id = media_asset_id
      and (
        asset.owner_user_id = auth.uid()
        or (
          asset.plane = 'organization'
          and asset.organization_id is not null
          and public.has_org_capability(asset.organization_id, 'media:write')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.media_assets asset
    where asset.id = media_asset_id
      and (
        asset.owner_user_id = auth.uid()
        or (
          asset.plane = 'organization'
          and asset.organization_id is not null
          and public.has_org_capability(asset.organization_id, 'media:write')
        )
      )
  )
);

drop policy if exists media_asset_variants_delete on public.media_asset_variants;
create policy media_asset_variants_delete
on public.media_asset_variants
for delete
using (
  exists (
    select 1
    from public.media_assets asset
    where asset.id = media_asset_id
      and (
        asset.owner_user_id = auth.uid()
        or (
          asset.plane = 'organization'
          and asset.organization_id is not null
          and public.has_org_capability(asset.organization_id, 'media:delete')
        )
      )
  )
);

-- ---------------------------------------------------------------------------
-- RLS: audit — select for actors / org readers; insert for authenticated owner paths
-- ---------------------------------------------------------------------------
alter table public.media_audit_events enable row level security;

drop policy if exists media_audit_events_select on public.media_audit_events;
create policy media_audit_events_select
on public.media_audit_events
for select
using (
  actor_user_id = auth.uid()
  or (
    organization_id is not null
    and public.has_org_capability(organization_id, 'media:read')
  )
);

drop policy if exists media_audit_events_insert on public.media_audit_events;
create policy media_audit_events_insert
on public.media_audit_events
for insert
with check (
  actor_user_id = auth.uid()
  or actor_user_id is null
);

-- ---------------------------------------------------------------------------
-- Storage bucket (private only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-private',
  'media-private',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Signed uploads / reads are issued by MediaService (service role).
-- Authenticated policies allow defense-in-depth for path-scoped access.

drop policy if exists media_private_select on storage.objects;
create policy media_private_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'media-private'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_org_capability(((storage.foldername(name))[1])::uuid, 'media:read')
    )
  )
);

drop policy if exists media_private_insert on storage.objects;
create policy media_private_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-private'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_org_capability(((storage.foldername(name))[1])::uuid, 'media:write')
    )
  )
);

drop policy if exists media_private_update on storage.objects;
create policy media_private_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media-private'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_org_capability(((storage.foldername(name))[1])::uuid, 'media:write')
    )
  )
)
with check (
  bucket_id = 'media-private'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_org_capability(((storage.foldername(name))[1])::uuid, 'media:write')
    )
  )
);

drop policy if exists media_private_delete on storage.objects;
create policy media_private_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media-private'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_org_capability(((storage.foldername(name))[1])::uuid, 'media:delete')
    )
  )
);

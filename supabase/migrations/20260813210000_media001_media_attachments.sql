-- MEDIA-001 Phase 1: universal media attachments (private storage + org RLS).
-- No public URLs. Binaries live in private Storage bucket `media`.

create table if not exists public.media_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  uploaded_by_user_id uuid not null references auth.users (id) on delete restrict,
  related_entity_type text not null
    check (related_entity_type in (
      'maintenance',
      'vendor',
      'inspection',
      'incident',
      'organization'
    )),
  related_entity_id uuid,
  file_type text not null check (file_type in ('image', 'video')),
  mime_type text not null,
  storage_reference text not null,
  thumbnail_reference text,
  preview_reference text,
  file_size bigint not null check (file_size >= 0),
  sort_order integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'processing', 'quarantined', 'failed', 'deleted')),
  metadata jsonb not null default '{}'::jsonb,
  checksum text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists media_attachments_entity_lookup_idx
  on public.media_attachments (organization_id, related_entity_type, related_entity_id, sort_order)
  where deleted_at is null;

create index if not exists media_attachments_org_status_idx
  on public.media_attachments (organization_id, status, created_at desc);

create index if not exists media_attachments_uploader_idx
  on public.media_attachments (organization_id, uploaded_by_user_id, created_at desc);

alter table public.media_attachments enable row level security;

drop policy if exists media_attachments_select_member on public.media_attachments;
create policy media_attachments_select_member
on public.media_attachments
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and deleted_at is null
);

drop policy if exists media_attachments_insert_member on public.media_attachments;
create policy media_attachments_insert_member
on public.media_attachments
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and uploaded_by_user_id = auth.uid()
);

drop policy if exists media_attachments_update_member on public.media_attachments;
create policy media_attachments_update_member
on public.media_attachments
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    uploaded_by_user_id = auth.uid()
    or public.is_org_manager(organization_id)
  )
)
with check (public.is_org_member(organization_id));

-- Private media bucket (idempotent). Public access forbidden.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object access is not granted to anon/authenticated clients directly.
-- Trusted API mints short-lived signed URLs via service role after authz checks.
-- (Service role bypasses Storage RLS.)

comment on table public.media_attachments is
  'MEDIA-001 operational media metadata. Binaries in private Storage bucket media; access via signed URLs only.';

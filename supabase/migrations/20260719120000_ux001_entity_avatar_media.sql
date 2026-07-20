-- UX-001 WI-2: entity avatars via media assets (no URL paste)

alter table public.tenants
  add column if not exists avatar_media_asset_id uuid references public.media_assets (id) on delete set null;

create index if not exists tenants_avatar_media_asset_idx
  on public.tenants (avatar_media_asset_id)
  where avatar_media_asset_id is not null;

alter table public.applicants
  add column if not exists avatar_media_asset_id uuid references public.media_assets (id) on delete set null;

create index if not exists applicants_avatar_media_asset_idx
  on public.applicants (avatar_media_asset_id)
  where avatar_media_asset_id is not null;

alter table public.vendors
  add column if not exists avatar_media_asset_id uuid references public.media_assets (id) on delete set null;

create index if not exists vendors_avatar_media_asset_idx
  on public.vendors (avatar_media_asset_id)
  where avatar_media_asset_id is not null;

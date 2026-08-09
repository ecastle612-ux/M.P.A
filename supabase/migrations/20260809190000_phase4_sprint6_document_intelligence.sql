-- Phase 4 Sprint 6 — Document Intelligence Center (additive)
-- Extends LAUNCH-001 document_documents without replacing the library.

-- ---------------------------------------------------------------------------
-- Intelligence columns on document_documents
-- ---------------------------------------------------------------------------

alter table public.document_documents
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists notes text,
  add column if not exists status text not null default 'active',
  add column if not exists keywords text,
  add column if not exists version_number integer not null default 1;

alter table public.document_documents
  drop constraint if exists document_documents_status_check;

alter table public.document_documents
  add constraint document_documents_status_check
  check (status in ('active', 'archived', 'draft', 'superseded'));

-- Expand entity types (documents belong to things)
alter table public.document_documents
  drop constraint if exists document_documents_entity_type_check;

alter table public.document_documents
  add constraint document_documents_entity_type_check
  check (entity_type in (
    'property',
    'unit',
    'resident',
    'lease',
    'maintenance',
    'vendor',
    'organization',
    'asset',
    'inspection',
    'compliance',
    'financial',
    'building'
  ));

-- Expand categories
alter table public.document_documents
  drop constraint if exists document_documents_category_check;

alter table public.document_documents
  add constraint document_documents_category_check
  check (category in (
    'general',
    'lease',
    'agreement',
    'evidence',
    'maintenance',
    'vendor',
    'financial',
    'identity',
    'inspection',
    'compliance',
    'warranty',
    'invoice',
    'report',
    'photo',
    'other'
  ));

create index if not exists document_documents_org_status_idx
  on public.document_documents (organization_id, status, created_at desc);

create index if not exists document_documents_org_tags_idx
  on public.document_documents using gin (tags);

-- ---------------------------------------------------------------------------
-- Relationships — one document, many entities (no duplicate files)
-- ---------------------------------------------------------------------------

create table if not exists public.document_document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.document_documents (id) on delete cascade,
  entity_type text not null
    check (entity_type in (
      'property',
      'unit',
      'resident',
      'lease',
      'maintenance',
      'vendor',
      'organization',
      'asset',
      'inspection',
      'compliance',
      'financial',
      'building'
    )),
  entity_id uuid not null,
  label text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (document_id, entity_type, entity_id)
);

create index if not exists document_document_links_org_entity_idx
  on public.document_document_links (organization_id, entity_type, entity_id);

create index if not exists document_document_links_document_idx
  on public.document_document_links (document_id);

alter table public.document_document_links enable row level security;

drop policy if exists document_document_links_select_member on public.document_document_links;
create policy document_document_links_select_member
on public.document_document_links
for select
to authenticated
using (
  public.is_org_member(organization_id)
);

drop policy if exists document_document_links_write_manager on public.document_document_links;
create policy document_document_links_write_manager
on public.document_document_links
for all
to authenticated
using (
  public.is_org_manager(organization_id)
)
with check (
  public.is_org_manager(organization_id)
);

-- ---------------------------------------------------------------------------
-- Version history — snapshots without duplicating the live file identity
-- ---------------------------------------------------------------------------

create table if not exists public.document_document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.document_documents (id) on delete cascade,
  version_number integer not null,
  title text not null,
  mime_type text not null default 'text/plain',
  file_name text,
  content_text text,
  content_base64 text,
  byte_size integer not null default 0,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (document_id, version_number)
);

create index if not exists document_document_versions_doc_idx
  on public.document_document_versions (document_id, version_number desc);

alter table public.document_document_versions enable row level security;

drop policy if exists document_document_versions_select_member on public.document_document_versions;
create policy document_document_versions_select_member
on public.document_document_versions
for select
to authenticated
using (
  public.is_org_member(organization_id)
);

drop policy if exists document_document_versions_write_manager on public.document_document_versions;
create policy document_document_versions_write_manager
on public.document_document_versions
for all
to authenticated
using (
  public.is_org_manager(organization_id)
)
with check (
  public.is_org_manager(organization_id)
);

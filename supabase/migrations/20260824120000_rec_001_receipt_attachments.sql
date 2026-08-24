-- REC-001: Universal receipt uploads on MEDIA-001 (additive).
-- Reuses public.media_attachments + private bucket `media`.
-- Does not create a second storage bucket or receipt table.
-- In-repo only. Do not apply to Production without a separate Owner gate.

-- ---------------------------------------------------------------------------
-- Classification: evidence (existing work photos) vs receipt (financial)
-- ---------------------------------------------------------------------------

alter table public.media_attachments
  add column if not exists attachment_category text not null default 'evidence';

alter table public.media_attachments
  drop constraint if exists media_attachments_attachment_category_check;

alter table public.media_attachments
  add constraint media_attachments_attachment_category_check
  check (attachment_category in ('evidence', 'receipt'));

create index if not exists media_attachments_receipt_lookup_idx
  on public.media_attachments (organization_id, related_entity_type, related_entity_id, attachment_category)
  where deleted_at is null and attachment_category = 'receipt';

-- ---------------------------------------------------------------------------
-- Parent: vendor invoices (canonical PM/Complete expense record)
-- Work-order receipts continue to use related_entity_type = maintenance
-- with attachment_category = receipt.
-- ---------------------------------------------------------------------------

alter table public.media_attachments
  drop constraint if exists media_attachments_related_entity_type_check;

alter table public.media_attachments
  add constraint media_attachments_related_entity_type_check
  check (related_entity_type in (
    'maintenance',
    'vendor',
    'inspection',
    'incident',
    'organization',
    'conversation_message',
    'facility_asset',
    'vendor_invoice'
  ));

-- PDF receipts are documents. Evidence stays image/video.
alter table public.media_attachments
  drop constraint if exists media_attachments_file_type_check;

alter table public.media_attachments
  add constraint media_attachments_file_type_check
  check (file_type in ('image', 'video', 'document'));

-- Narrow Storage allowlist addition for receipt PDFs. Application validation
-- still rejects PDF for non-receipt (evidence) uploads.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'application/pdf'
]::text[]
where id = 'media'
  and public is false;

comment on column public.media_attachments.attachment_category is
  'REC-001: evidence = operational media; receipt = financial supporting document. Same MEDIA-001 row; no second store.';

-- PARTNER-003 / docs/237 — Partner Command Center
-- Additive. Preserves PARTNER-001 and PARTNER-002 tables.
-- Do not apply this file to Production from the implement package.

alter table public.platform_partners
  add column if not exists logo_media_id uuid references public.media_attachments (id) on delete set null;

create index if not exists platform_partners_logo_media_idx
  on public.platform_partners (logo_media_id)
  where logo_media_id is not null;

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
    'facility_request_intake',
    'vendor_invoice',
    'partner_service_request',
    'partner_branding'
  ));

alter table public.media_attachments
  drop constraint if exists media_attachments_attachment_category_check;

alter table public.media_attachments
  add constraint media_attachments_attachment_category_check
  check (attachment_category in ('evidence', 'receipt', 'partner_branding'));

comment on column public.platform_partners.logo_media_id is
  'PARTNER-003 optional company logo stored as MEDIA partner_branding. Private bucket only.';

comment on table public.platform_partners is
  'Partner Program records. Command Center access requires normal M.P.A. Auth, org membership, and receiving-organization binding — not possession of partner_id.';

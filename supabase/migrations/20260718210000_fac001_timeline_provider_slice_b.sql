-- FAC-001 Slice B: Property Timeline enhancements + Service Provider Intelligence hooks.

alter table public.facility_timeline_events
  add column if not exists performed_by_label text,
  add column if not exists service_provider_display_name text,
  add column if not exists href text,
  add column if not exists document_ids uuid[] not null default '{}'::uuid[];

-- Dedupe Slice A re-completion duplicates before unique index.
delete from public.facility_timeline_events a
using public.facility_timeline_events b
where a.ctid < b.ctid
  and a.organization_id = b.organization_id
  and a.source_entity_type = b.source_entity_type
  and a.source_entity_id = b.source_entity_id
  and a.event_type = b.event_type;

create unique index if not exists facility_timeline_source_idempotent_idx
  on public.facility_timeline_events (
    organization_id,
    source_entity_type,
    source_entity_id,
    event_type
  );

create index if not exists facility_timeline_org_event_type_idx
  on public.facility_timeline_events (organization_id, event_type, occurred_at desc);

create index if not exists facility_timeline_org_vendor_idx
  on public.facility_timeline_events (organization_id, legacy_vendor_id, occurred_at desc)
  where legacy_vendor_id is not null;

create index if not exists facility_timeline_search_idx
  on public.facility_timeline_events using gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(performed_by_label, '') || ' ' ||
      coalesce(service_provider_display_name, '')
    )
  );

comment on table public.facility_timeline_events is
  'FAC-001 Property Timeline. Extensible event_type namespace. Future: assets, PM, compliance, health.';

comment on column public.facility_records.metadata is
  'FAC-001 Facility Record metadata. Future hooks: assetId, warrantyId, pmScheduleId, healthSignals.';

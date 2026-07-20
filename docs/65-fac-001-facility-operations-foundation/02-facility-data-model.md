# 02 — Facility Data Model

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

Conceptual model only. Table names are illustrative; Implement chooses physical schema after Approve.

---

## Core entities

| Entity | Purpose | Mutability |
| --- | --- | --- |
| `FacilityRecord` | Permanent outcome of facility work (repair/service/etc.) | Immutable (+ admin correction) |
| `TimelineEvent` | Permanent stream entry for property/unit/org | Append-only |
| `ServiceProvider` | Who performs work (generalizes Vendor) | Mutable directory; history links stay |
| `FacilityAsset` | Tracked building/unit equipment or system | Mutable metadata; history links stay |
| `Warranty` | Coverage window linked to asset and/or record | Mutable status; audit changes |
| `FacilityMediaLink` | Pointer to vault/media for facility context | Append/soft-delete per vault policy |
| `WorkOrder` (existing) | Coordination ticket | Existing lifecycle unchanged |
| `Vendor` (existing) | Migration source → ServiceProvider | Compatibility period |

---

## FacilityRecord (summary)

See [04](./04-facility-records.md) for full field set.

Minimum identity:

- `id`, `organization_id`, `property_id`, `unit_id?`, `building_id?`  
- `work_order_id?` (link; WO may later archive)  
- `service_provider_id?`, `provider_kind` snapshot  
- `issue_summary`, `root_cause?`, `resolution`  
- `completed_at`, `created_at`  
- `warranty_id?`, `invoice_reference?`  
- `correction_of_id?` (admin correction chain)  
- `status`: `active` \| `superseded_by_correction`

---

## TimelineEvent (summary)

See [03](./03-property-timeline.md).

- `event_type` (enum + extensible string namespace)  
- `occurred_at`, `property_id`, `unit_id?`  
- `actor_user_id?`, `source_entity_type`, `source_entity_id`  
- `title`, `summary`, `payload` (json)  
- `facility_record_id?`, `asset_id?`, `provider_id?`

---

## ServiceProvider (summary)

See [05](./05-service-provider-model.md).

- `provider_type`: internal \| vendor \| contractor \| emergency_vendor \| owner \| volunteer \| other  
- Links to existing `vendors.id` during migration (`legacy_vendor_id`)  
- Org-scoped uniqueness rules TBD at Implement

---

## FacilityAsset (summary)

See [06](./06-asset-foundation.md).

- `asset_category`, `name`, `property_id`, `unit_id?`  
- `install_date?`, `expected_life_years?`, `status`  
- Links: warranties, facility records, media, future PM schedules

---

## Warranty

- `starts_on`, `ends_on`, `provider_name` / `service_provider_id?`  
- `coverage_summary`, `document_media_ids[]`  
- Linked to `asset_id` and/or `facility_record_id`

---

## Cardinality

| From | To | Cardinality |
| --- | --- | --- |
| Property | FacilityRecord | 1:N |
| Unit | FacilityRecord | 0..1:N |
| WorkOrder | FacilityRecord | 0..1:0..1 (normally 1 on complete) |
| ServiceProvider | FacilityRecord | 0..1:N |
| FacilityAsset | FacilityRecord | 0..1:N |
| FacilityRecord | Media links | 1:N |
| Property | TimelineEvent | 1:N |

---

## Buildings

Phase 1 may treat **Property** as the primary site aggregate. Optional `Building` entity is reserved for multi-structure sites (Approve Q4). Timeline and records must support `building_id` nullable without blocking Phase 1.

---

## Retention

| Class | Default |
| --- | --- |
| FacilityRecord | Retain indefinitely (org legal hold aware) |
| TimelineEvent | Retain indefinitely |
| Media | Vault retention policies ([API-002A](../46-api-002a-universal-media-foundation/README.md) / vault) |
| Soft-deleted providers/assets | Hide from UI; preserve historical links |

Purge of Facility Records is **out of Phase 1** and requires a future security/legal Approve.

---

## Indexing (Implement guidance)

- `(organization_id, property_id, completed_at desc)` on FacilityRecord  
- `(organization_id, property_id, occurred_at desc)` on TimelineEvent  
- Full-text / search index fields per [08](./08-search-architecture.md)  
- RLS: org isolation; property-scoped reads for authorized roles

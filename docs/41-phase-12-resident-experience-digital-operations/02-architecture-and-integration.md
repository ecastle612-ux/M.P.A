# Phase 12 — Architecture & Integration

**Principle:** One graph, many surfaces. Extend existing domains; no parallel systems.

---

## Domain model (proposed)

### Core identity: `person_records`

Single org-scoped record from applicant → resident (never fork).

```
person_records
  ├── lifecycle_status: applicant | resident | former_resident | denied
  ├── tenant_id (nullable FK — set when lease-bound)
  ├── profile extensions (contact, emergency, employment, income, vehicles, pets)
  └── links to user_id when portal account exists
```

Applicant conversion **updates** `lifecycle_status`; history tables append-only.

### Document vault (polymorphic)

```
documents
  ├── organization_id
  ├── entity_type (org | property | unit | person | lease | work_order | vendor | financial_record)
  ├── entity_id
  ├── storage_path (Supabase Storage)
  ├── mime_type, size_bytes, category, tags[]
  └── version_of (nullable self-FK)

document_versions / document_audit_log
```

Future: `ocr_status`, `ai_analysis_json` columns nullable.

### Signatures

```
signature_requests
  ├── document_id, lease_id (nullable)
  ├── template_type (lease | renewal | pet | ach | …)
  ├── provider_key, external_id
  └── status workflow

signature_events (audit)
```

### Screening

```
screening_cases
  ├── person_record_id
  ├── authorization_document_id
  ├── provider_key, external_id
  └── status + result_summary (PM-visible)

screening_checks (credit, criminal, eviction, income — line items)
```

### Messaging (unified thread model)

```
conversation_threads
  ├── thread_type: resident_pm | resident_maintenance | pm_vendor | maintenance_work_order
  ├── context_entity_type + context_entity_id
  └── participants via conversation_participants

messages
  ├── body, attachments → documents
  ├── visibility: resident | internal | vendor
  └── read_receipts
```

Maintenance WO auto-creates thread on submit; reuses work order ID as context.

### Community hub

Extends `announcements` — **do not duplicate**.

```
community_events (optional new table)
announcement_categories extended: emergency | event | office_hours | pool | package | holiday
```

### Timeline (read model)

```
entity_timeline_events (projection)
  ├── source_event_id (domain event UUID)
  ├── entity_type + entity_id
  ├── event_type, summary, actor_id, occurred_at
  └── immutable append
```

Populated by subscribers to existing domain event bus (ADR-005).

### Offline queue (client)

```
offline_operations (IndexedDB — not Postgres)
  ├── operation_type, payload, attachments blobs
  ├── sync_status, retry_count
  └── idempotency_key
```

Server ingestion via existing API patterns + idempotent upsert.

---

## Integration points (existing modules)

| Module | Integration |
|--------|-------------|
| Tenants | `person_records.tenant_id`; applicant promotes in-place |
| Leases | Signature + screening link to lease lifecycle |
| Maintenance | WO → conversation thread; photos → documents |
| Financials | Timeline reads charges/payments; no new payment rails |
| Communications | Community hub = announcements + events |
| AI Operations | Screening summary card; document analysis hook (human review) |
| Operations Center | Widgets: unread messages, pending signatures, screening queue |
| Command Center | Providers: persons, messages, documents, screenings, timeline |
| Resident portal | Primary UX for messaging, hub, documents, offline sync status |

---

## Authorization

- Reuse `has_org_capability()` and extend `permission_capabilities`:
  - `resident:read|update`, `applicant:read|update`, `document:*`, `message:*`, `screening:*`, `signature:*`
- RLS: all tables `organization_id` + plane-aware policies
- Resident plane: read/write own threads, documents tagged resident-visible
- Vendor plane: assigned WO threads only

---

## Events (ADR-005)

New event types (illustrative):

- `person.applicant_submitted`, `person.resident_promoted`
- `document.uploaded`, `document.signed`
- `screening.completed`, `screening.decision_recorded`
- `message.sent`, `message.read`
- `offline.sync_completed`

Timeline projection and Operations Center widgets subscribe to these.

---

## Non-goals

- No second announcement table
- No duplicate file upload component (one vault UI, context-aware)
- No payment processing
- No auto approve/deny on screening

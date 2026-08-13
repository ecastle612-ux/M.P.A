# MEDIA-001 UNIVERSAL MEDIA ATTACHMENT FRAMEWORK DESIGN

**Status:** Draft — awaiting Product Owner / Architect approval  
**Date:** 2026-08-13  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Related ADR:** [ADR-023](../18-decision-log/adr-023-universal-media-attachment-framework.md) (Proposed)  
**Production:** NO DEPLOYMENT · NO migrations · NO storage changes · NO code from this package  

---

## Problem statement

Operational workflows need high-quality photo and short-video evidence at the moment of work — for example a Facility Operations user creating a work order (“Chair broken in Clinic Room 204”) and attaching photos or a short clip so the facility team and vendors can review, assign, and complete the job.

Today M.P.A. has a Shared Documents spine (`document_documents`) with deep-links from PM/FO work surfaces, but binary storage is still DB/base64-oriented with tight size limits. That path is unsuitable for high-resolution images and short video. Teams also need a **reusable attachment UX** (capture, preview, reorder, review) that is not reinvented per workflow.

MEDIA-001 designs one universal media attachment framework for operational evidence, without modifying existing production workflows until Approve → Implement.

---

## Goals

1. One shared media attachment system for operational entities (not a new product SKU).  
2. First-class **image** and **short video** support with thumbnails and secure playback.  
3. Reusable UX: take photo / record video / upload → preview → remove → reorder → confirm.  
4. Storage via **signed URLs**, org isolation, no public file URLs.  
5. Polymorphic attach to work orders, maintenance, vendor jobs, inspections, incidents (and future AI/compliance).  
6. Align with Document Intelligence “single vault” direction where practical; do not invent a second uncontrolled blob store.  
7. Preserve Product Constitution and Implementation Gate — design only until Approved.

## Non-goals (this design package)

- Implementation, migrations, bucket creation, or Production deploy  
- Changing live FO/PM workflow behavior before Approve  
- Full Document Center redesign  
- Long-form video / streaming CDN product  
- Customer-facing self-serve “media plan” tiers  
- AI analysis implementation (design hooks only)

---

## Supported workflows

### Initial integrations (post-Approve implement order)

| Workflow | Primary entity | Notes |
|----------|----------------|-------|
| Facility Operations work orders | `maintenance` / work order id | Same `maintenance_work_orders` table FO already uses |
| Maintenance requests | `maintenance` | PM Maintenance Command Center |
| Vendor jobs | `vendor` + linked work order | Vendor portal evidence view |
| Property inspections | `inspection` | Photo/video checklist evidence |
| Incident reports | `maintenance` or future `incident` type | Start with maintenance/evidence category |

### Future integrations

| Area | Use |
|------|-----|
| AI analysis | Damage detection, summarization of media (read-only consumers) |
| Documentation | Promote operational media into Document Center records |
| Compliance | Retention locks, export packages, evidence packs |

---

## Architecture proposal

### Principle: Shared Platform media service

MEDIA-001 is a **Shared Platform** capability consumed by PM and FO (and later portals). It is not a commercial product and must not introduce SaaS tiers.

```
┌─────────────────────────────────────────────────────────────┐
│  Workflow UIs (FO WO, PM Maintenance, Vendor, Inspection)   │
│  MediaAttachmentField (Canopy) — capture / upload / preview │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Media Attachment API (authenticated, org-scoped)           │
│  create → signed upload → confirm → list → signed download  │
└───────────────┬─────────────────────────────┬───────────────� → confirm → list → signed download  │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼───────────────┐   ┌─────────▼────────────────┐
│  media_attachments (metadata) │   │  Object storage (private) │
│  + optional document link     │   │  originals + thumbnails   │
└───────────────────────────────┘   └──────────────────────────┘
```

### Relationship to Shared Documents

| Concern | Decision (proposed) |
|---------|---------------------|
| Operational capture UX | MEDIA-001 attachment component + `media_attachments` |
| Long-lived org documents / vault search | Continue Document Intelligence / `document_documents` |
| Bridge | Optional: on confirm, create/link a Document record (`category=photo` / evidence) so media appears in Document Center without a second vault |
| Path layout | Align with security standards: `{organization_id}/{entity_type}/{entity_id}/{media_id}/…` |

**ADR-023** records: private object storage + signed URLs; polymorphic `related_entity_*`; no public buckets; reuse org RLS patterns.

### Entitlement / capability reuse

- Prefer existing capabilities where possible (`platform.documents:write` / domain write caps) **or** introduce a narrow `platform.media:write` / `platform.media:read` only if documents caps are too broad — decide at Approve.  
- FO/PM route entitlements unchanged; media APIs enforce membership + entity access.

---

## Media types

### Images

| Format | Support |
|--------|---------|
| JPEG / JPG | Required |
| PNG | Required |
| WebP | Required |
| HEIC / HEIF | Required (accept upload; normalize to JPEG/WebP derivative for preview where needed) |

Requirements:

- High-resolution upload (design target: up to **20 MB** per image; final limit set at Approve)  
- Server- or worker-generated **thumbnail** + responsive preview derivative  
- In-app lightbox / gallery preview  

### Video

| Format | Support |
|--------|---------|
| MP4 (H.264/H.265) | Required |
| MOV | Required (accept; prefer transcode/normalize to MP4 for playback) |

Requirements:

- **Short clips** only (design target: **≤ 60 seconds**, **≤ 100 MB** pending Approve)  
- Poster/thumbnail frame for lists  
- In-app playback via **short-lived signed URL** (HTML5 video)  
- Compression strategy: client hint (capture constraints) + async server normalize/transcode job for oversized MOV/high bitrate  

### Rejected / deferred MIME

Executable, archives, arbitrary documents (those stay on Document Center upload path). Strict allowlist at API edge.

---

## User experience design

Reuse Canopy; no new design language. Prefer one shared `MediaAttachmentField` composition used by workflows (no cards-in-hero marketing patterns — operational Canopy forms).

### Attachment controls (composer)

| Control | Behavior |
|---------|----------|
| Take photo | Device camera (`capture="environment"` / native where available) |
| Record video | Short clip recorder with max duration indicator |
| Upload file | File picker filtered to allowlisted MIME types |

### Before submission

| Action | Behavior |
|--------|----------|
| Preview | Thumbnail grid; tap opens full preview / video scrub |
| Remove | Drop from pending set (abort in-flight upload) |
| Reorder | Drag or up/down; persists `sort_order` on confirm |
| Confirm upload | Explicit confirm after signed PUT success; draft attachments not visible to others until parent entity save rules say so |

**Composer rules:**

1. User may attach media while drafting a work order.  
2. Uploads use signed URLs; UI shows progress.  
3. Parent save associates pending media IDs to `related_entity_id`.  
4. Fail closed: if upload fails, block submit or allow submit without failed items with clear error.

### After submission (review surfaces)

| Element | Content |
|---------|---------|
| Thumbnails | Image thumbs / video posters in gallery strip |
| Metadata | Filename, type, dimensions/duration when known, size |
| Uploaded by | Display name of `uploaded_by_user_id` |
| Timestamp | `created_at` (org timezone formatting later) |
| Actions | View / play via signed URL; delete if role permits |

Vendor / facility reviewer sees the same gallery, authorization-scoped.

---

## Storage model

### Provider approach

| Option | Proposal |
|--------|----------|
| Primary | **Supabase Storage** private bucket (e.g. `media` or extend planned `documents` bucket with media prefix) — matches platform standards |
| Alternative | S3-compatible private bucket behind same signed-URL API if scale requires |

No public buckets. No permanent public object URLs.

### Object layout

```
{organization_id}/{related_entity_type}/{related_entity_id}/{media_id}/original.{ext}
{organization_id}/{related_entity_type}/{related_entity_id}/{media_id}/thumb.webp
{organization_id}/{related_entity_type}/{related_entity_id}/{media_id}/preview.{ext}
```

### Signed URL flow

1. Authenticated client requests **upload intent** (MIME, size, entity type, optional entity id).  
2. API validates authz + allowlist + quotas → creates `media_attachments` row (`status=pending`) → returns **signed upload URL** (short TTL, e.g. 15 minutes).  
3. Client PUTs bytes directly to storage.  
4. Client calls **confirm**; API verifies object exists/size/type → sets `status=ready` → enqueues thumbnail/transcode job.  
5. Readers request **signed download/playback URL** (15-minute TTL default per security standards); never embed long-lived public URLs.

### Access control

- Storage RLS / path policies: access iff caller can access the org **and** the related entity (mirror DB authorization).  
- Service role only for processing workers.  

### Lifecycle management

| Stage | Behavior |
|-------|----------|
| Pending orphan | TTL cleanup job deletes unused pending objects (e.g. 24h) |
| Active | Retained with parent entity |
| Soft delete | `deleted_at`; hide from UI; retain per retention policy |
| Hard delete | After retention / org offboarding; purge storage + row |
| Quotas | Per-org storage budget (design; enforce post-Approve) |

---

## Security model

| Control | Requirement |
|---------|-------------|
| Authentication | Supabase session required for all media APIs |
| Authorization | Org membership + capability + **entity-level** access (e.g. can view that work order) |
| Tenant isolation | `organization_id` on every row; storage paths prefixed by org; RLS mandatory |
| File validation | MIME allowlist, extension check, max size, optional magic-byte sniff on confirm |
| Upload limits | Per-file and per-entity counts; rate limits per user/org |
| Malware scanning | Design: async scan hook on confirm (provider TBD — ClamAV/cloud AV); quarantine status blocks playback until clean; fail closed on scan error for high-risk portals |
| No public URLs | Signed URLs only; cache-control private |
| Audit | Upload, confirm, download/play (sensitive), delete — via `audit_events` / domain events |
| Client trust | Zero — UI is convenience only |

### Audit events (proposed names)

- `media.upload_intent`  
- `media.upload_confirmed`  
- `media.thumbnail_ready`  
- `media.accessed` (download/play mint)  
- `media.deleted`  

Reuse `audit_events` + `event_domain_events` patterns; do not invent a parallel audit store.

---

## Data model (proposed — not implemented)

### `media_attachments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid NOT NULL | Tenant |
| `uploaded_by_user_id` | uuid NOT NULL | Actor |
| `related_entity_type` | text NOT NULL | e.g. `maintenance`, `vendor`, `inspection`, `incident` |
| `related_entity_id` | uuid NULL | Null while drafting; required once attached |
| `file_type` | text NOT NULL | `image` \| `video` |
| `mime_type` | text NOT NULL | Allowlisted MIME |
| `storage_reference` | text NOT NULL | Private object key |
| `thumbnail_reference` | text NULL | Thumb key |
| `preview_reference` | text NULL | Normalized preview/playback key |
| `size_bytes` | bigint NOT NULL | |
| `sort_order` | int NOT NULL default 0 | Gallery order |
| `status` | text NOT NULL | `pending` \| `ready` \| `processing` \| `quarantined` \| `failed` \| `deleted` |
| `metadata` | jsonb NOT NULL default `{}` | width, height, duration_ms, original_filename, device hints |
| `checksum` | text NULL | Optional integrity |
| `created_at` | timestamptz NOT NULL | |
| `updated_at` | timestamptz NOT NULL | |
| `deleted_at` | timestamptz NULL | Soft delete |

Indexes: `(organization_id, related_entity_type, related_entity_id)`, `(organization_id, status, created_at)`.

RLS: org member select when entity visible; write for roles with media/document write + entity permission.

### Optional bridge

`document_document_links` or `media_document_id` nullable FK to promote media into Document Center without duplicating bytes (same `storage_reference`).

---

## Workflow example — Facility work order

### Create request (Facility / requester)

1. User opens Facility Operations → create work order.  
2. Enters description: “Chair broken in Clinic Room 204”; sets location.  
3. Uses **Take photo** / **Record video** / **Upload**.  
4. Previews, removes a blurry shot, reorders best evidence first.  
5. Confirms uploads (signed PUT + confirm).  
6. Submits work order; media rows receive `related_entity_id = work_order.id`.

### Facility team

1. Opens work order detail.  
2. Reviews thumbnail gallery; plays short video via signed URL.  
3. Assigns vendor / technician using existing assignment workflow (**unchanged** aside from media panel).  

### Vendor

1. Verifies portal access to the job.  
2. Views issue evidence (authorization-scoped signed URLs).  
3. Completes work; may attach completion photos via same framework (future slice).

**Constraint:** Existing create/assign/complete APIs stay intact until an approved implement slice wires the media field.

---

## Future expansion

| Horizon | Capability |
|---------|------------|
| AI | Async jobs consume `storage_reference` for damage/classification; results as metadata annotations |
| Compliance | Legal hold flag; export evidence packs |
| Offline / mobile | Queue uploads; MEDIA aligns with future native strategy without new backend |
| Resident portal | Resident-originated request photos (separate authz matrix) |
| Annotations | Markup on images for inspectors |

---

## Implementation considerations (after Approve only)

1. **Phased delivery**  
   - Slice A: schema + signed upload/download + FO work order composer/detail gallery  
   - Slice B: PM maintenance + vendor view  
   - Slice C: inspections/incidents + AV scan + transcode worker  
2. **Do not** modify unrelated workflows in Slice A.  
3. **Migrate carefully** from base64 document photos if any; no big-bang required.  
4. **Canopy:** implement `MediaAttachmentField` in `@mpa/ui` / web components per approved Experience Architecture.  
5. **Testing:** RLS isolation, signed URL expiry, MIME reject, orphan cleanup, entitlement regression.  
6. **Observability:** upload failure rates, processing lag, quarantine counts.  
7. **No Production deploy** until Owner-authorized release after implement certification.

---

## Approval checklist

- [ ] Product Owner approves MEDIA-001 scope and phased integrations  
- [ ] Architect accepts ADR-023 (storage + polymorphic attachment model)  
- [ ] Security review of signed URLs, limits, malware approach  
- [ ] Status → **Approved**  
- [ ] Only then: Implement → test → Owner-authorized deploy  

**Silence is not approval** (ADR-012).

---

## Design status

| Item | Status |
|------|--------|
| Design | **COMPLETE (Draft)** |
| Document | **This record** |
| ADR-023 | **Proposed** |
| Approve | **Pending** |
| Implementation | **NOT STARTED** |
| Production | **NO** |

### Final status

**DESIGN COMPLETE**

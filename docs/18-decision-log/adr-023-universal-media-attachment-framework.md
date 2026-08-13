# ADR-023: Universal Media Attachment Framework (MEDIA-001)

## Status
Proposed

## Date
2026-08-13

## Context

Operational workflows (Facility Operations work orders, maintenance, vendor jobs, inspections, incidents) need high-quality photos and short videos as evidence. The Shared Documents spine exists for org document management, but current binary handling is not fit for high-resolution images and short video. Inventing per-workflow upload systems would fragment security, storage, and UX.

Related:

- ADR-012 Implementation Gate  
- ADR-015 Three Commercial Products + Master Admin OS (Shared Platform capabilities)  
- ADR-019 Product Constitution  
- Document Intelligence: `docs/56-phase-4-document-intelligence/`  
- Security storage standards: `docs/14-security-standards/`  
- Feature design: `docs/73-media-001-universal-media-attachment/index.md`

## Decision

1. Introduce a **universal media attachment framework** as a Shared Platform capability (not a commercial product or pricing tier).

2. Persist operational media metadata in a dedicated **`media_attachments`** entity (polymorphic `related_entity_type` + `related_entity_id`) with org isolation and RLS aligned to entity access.

3. Store binaries in a **private object store** (Supabase Storage preferred) using org-prefixed paths. **No public buckets / public file URLs.** Access only via **short-lived signed URLs** (default ~15 minutes).

4. Support allowlisted **images** (JPEG, PNG, HEIC, WebP) and **short video** (MP4, MOV) with thumbnail/poster generation and a compression/normalize strategy for video.

5. Reuse existing authentication, org membership, capability checks, and `audit_events` / domain-event patterns. Optional bridge to Document Center records without a second uncontrolled vault.

6. UX is a reusable Canopy attachment field: take photo / record video / upload → preview → remove → reorder → confirm; review surfaces show thumbnails, uploader, timestamp.

7. **No implementation** until this ADR is **Accepted** and `docs/73-media-001-universal-media-attachment` is **Approved**. Existing production workflows must not be modified in the design phase.

## Consequences

**Easier:** One secure media path across FO/PM/vendor/inspection; consistent UX; clear security story; AI/compliance can consume a single metadata+storage contract later.

**More difficult:** Thumbnail/transcode/AV-scan pipeline; careful draft-vs-attached lifecycle; quota and retention operations; coordination with Document Intelligence bridge.

## Alternatives Considered

- **Only extend base64 `document_documents`:** Rejected for video/high-res scale and performance.  
- **Public CDN URLs for simplicity:** Rejected — violates tenant isolation and security standards.  
- **Per-workflow attachment tables:** Rejected — duplicates security and UX.  
- **Implement before approval:** Rejected — violates ADR-012.

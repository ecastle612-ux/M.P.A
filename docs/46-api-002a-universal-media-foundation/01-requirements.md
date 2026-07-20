# 01 — Requirements

**Package:** API-002A  
**Status:** Draft — Ready for Approval

---

## Problem statement

M.P.A. asks users to paste image URLs and stores free-form strings. There is no Storage-backed upload path, no image variant pipeline, and no shared upload component. Modules are already inventing placeholders (`file_url`, `photo_placeholder`, vault metadata without binaries). Without a universal foundation, every future photo/document feature will fork insecure, inconsistent upload UX.

---

## Goals

| # | Goal |
|---|------|
| G1 | One MediaService is the only server write path for binary media |
| G2 | One Canopy `MediaUpload` pattern is the only upload UI |
| G3 | Persist storage references (`media_asset_id` / `storage_path`), never manual paste URLs as source of truth |
| G4 | Support images and documents with clear kind-specific rules |
| G5 | Generate image variants (thumb → large + original) automatically |
| G6 | Enforce org isolation, ownership, MIME/size limits, signed delivery |
| G7 | Design offline queue / resume so PWA and future mobile share contracts |
| G8 | First consumer after Approve: profile photo (closes BUG-002 UX defect) |
| G9 | Future modules attach media without building uploaders |

---

## Non-goals

- Implementing any code, migrations, or buckets in this documentation task
- Replacing every placeholder field in every module in the first implementation wave
- Building a full Dropbox clone (media library is phased)
- Shipping virus scanning (design hooks only)
- Allowing modules to keep URL-paste as an alternative after MediaUpload ships for that surface

---

## PRR / package traceability

| ID / Source | Requirement | API-002A coverage |
|-------------|-------------|-------------------|
| INT-901 | Supabase Storage primary | Entire storage + MediaService design |
| INT-902 | Virus scan on upload | Hook + slice deferred |
| INT-903 | Cold archival | Lifecycle / retention hooks |
| MHF / docs vault | Attachments | [05](./05-document-storage.md) binding model |
| PX-006 | Optional profile photo | First consumer; no onboarding redesign |
| Phase 12 documents | `storage_path` on documents | Aligns; media_assets is binary SoR |
| Security 14 | Storage RLS + 15-min signed URLs | [06](./06-security-and-rls.md) |
| Performance 15 | Transforms / CDN | [04](./04-image-processing.md) |
| Component 12 | `FileUpload` pattern | Specified as `MediaUpload` in [03](./03-upload-component.md) |
| MOB-* | Mobile capture / offline | [03](./03-upload-component.md), [08](./08-offline-behavior.md) |
| AI-* | Image analysis | Assets remain addressable for future AI jobs |

---

## Functional requirements

### Universal upload

| ID | Requirement |
|----|-------------|
| R-UP-01 | Drag & drop on desktop |
| R-UP-02 | Tap / click to select files on mobile and desktop |
| R-UP-03 | Camera capture where the browser/device supports `capture` |
| R-UP-04 | Preview before commit (especially images with crop) |
| R-UP-05 | Crop, rotate, zoom for image intents that require framing (e.g. profile avatar) |
| R-UP-06 | Replace existing asset; delete/remove asset |
| R-UP-07 | Multiple file upload when intent allows |
| R-UP-08 | Progress indicator per file; overall batch progress |
| R-UP-09 | Retry failed uploads; pause and cancel in-flight uploads |
| R-UP-10 | Friendly validation for type/size/count errors |
| R-UP-11 | Keyboard accessible; screen-reader labels; loading announcements |
| R-UP-12 | No URL text field as the upload mechanism |

### Storage & metadata

| ID | Requirement |
|----|-------------|
| R-ST-01 | Bytes live in Supabase Storage; metadata in Postgres (`media_assets`) |
| R-ST-02 | Persist `storage_path` / asset id — not user-entered URLs |
| R-ST-03 | Private-by-default; signed URLs for read |
| R-ST-04 | Org-scoped assets isolated by RLS |
| R-ST-05 | User-plane assets (e.g. profile photo before/without org) owned by `user_id` |
| R-ST-06 | Support kinds: profile, property, unit, maintenance, inspection, document, general |
| R-ST-07 | Lifecycle: retention, soft-delete, versioning strategy documented |
| R-ST-08 | Duplicate detection (content hash) to avoid redundant storage where safe |

### Image quality

| ID | Requirement |
|----|-------------|
| R-IM-01 | Accept JPG, PNG, WEBP (and HEIC if processing can normalize — see open questions) |
| R-IM-02 | Max upload size default **10 MB** for images (documents may differ by kind) |
| R-IM-03 | Generate thumbnail, small, medium, large, and retain original |
| R-IM-04 | Preserve aspect ratio for non-forced crops; avatar crop may enforce square |
| R-IM-05 | Optimize automatically; prefer modern formats for delivery variants |
| R-IM-06 | Avatars and list UIs must request thumb/small — never force original download |

### Documents

| ID | Requirement |
|----|-------------|
| R-DO-01 | PDF and common office types allowed for document intents |
| R-DO-02 | Domain document rows reference `media_asset_id` |
| R-DO-03 | Versioning supported for replace flows |

### Offline & resume

| ID | Requirement |
|----|-------------|
| R-OF-01 | Queue uploads when offline; resume when connectivity returns |
| R-OF-02 | Contracts usable by future native apps without redesign |

### Security

| ID | Requirement |
|----|-------------|
| R-SE-01 | Storage RLS + DB RLS mirror ownership rules |
| R-SE-02 | MIME allowlists per intent |
| R-SE-03 | Rate limits on upload endpoints |
| R-SE-04 | Audit trail for create/replace/delete |
| R-SE-05 | Malware scanning hook (future INT-902) |

### Reuse law

| ID | Requirement |
|----|-------------|
| R-RE-01 | Modules configure MediaUpload intents — they do not fork upload widgets |
| R-RE-02 | Code review rejects new `type=file` upload UIs outside MediaUpload |
| R-RE-03 | Code review rejects new “paste image URL” fields for media SoR |

---

## Consumer matrix (eventual)

| Module | Media kinds | First wave? |
|--------|-------------|-------------|
| User profile | `profile_photo` | **Yes** (slice after foundation) |
| Property | `property_photo` | Soon after |
| Unit | `unit_photo` | Soon after |
| Maintenance / repairs | `maintenance_photo`, before/after | Phased |
| Inspections | `inspection_photo` | Phased |
| Residents / owners / vendors | documents | With vault adoption |
| Leases / applicants | attachments | With vault adoption |
| Pets / vehicles | photos | Later |
| AI analysis | any image asset | Later (read pipeline) |

---

## Acceptance criteria (package approval)

- Architecture is implementable without inventing a second upload system
- Profile URL field replacement is specified as first consumer, not a separate product
- Security model matches org isolation + signed URL posture in docs/14
- Offline and mobile are designed, not deferred as “figure out later”
- Implementation slices are ordered and gateable

---

## Deferred to later slices / packages

| Item | Where |
|------|-------|
| Virus scanning | INT-902 + [06](./06-security-and-rls.md) |
| Full media library UX | [07](./07-media-library.md) |
| Cold archival | INT-903 |
| HEIC native support | Open question in [11](./11-risk-analysis.md) |
| Every module gallery UI | Per-module after foundation |

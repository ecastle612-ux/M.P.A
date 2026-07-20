# 09 — Implementation Slices

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Constraint:** No slice starts until this package is **Approved**. No application code before Approve.

---

## Slice overview

| Slice | Name | Deployable outcome |
|-------|------|--------------------|
| 0 | Schema + buckets + RLS | `media_assets` / variants / audit live; private bucket + policies; RLS tests |
| 1 | MediaService + upload/read APIs | Intent → signed upload → confirm → signed read |
| 2 | Image processing pipeline | Variants generated; status lifecycle |
| 3 | MediaUpload + MediaImage | Canopy pattern; crop/rotate/zoom; a11y |
| 4 | Profile photo consumer (BUG-002) | URL field removed; setup + profile use MediaUpload |
| 5 | Offline queue (MVP) | Queue + resume for web |
| 6 | Property / unit photo adoption | First org-plane gallery consumers |
| 7 | Document vault binding | Domain docs use `media_asset_id` |
| 8 | Media library L1 | Browse / picker mode |
| 9 | Hardening & closeout | Quotas, GC, docs → Implemented; INT-901 satisfied for foundation |

Virus scanning = separate INT-902 package/slice after hooks land in 0–2.

---

## Slice 0 — Schema + buckets + RLS

**Includes**

- Migrations for `media_assets`, `media_asset_variants`, `media_audit_events`
- `media-private` bucket
- Storage + DB RLS policies per [06](./06-security-and-rls.md)
- RLS integration tests

**Excludes**

- UI, processing workers

**Done when**

- Authenticated tests prove cross-org isolation
- Service role can manage objects for processing

---

## Slice 1 — MediaService + APIs

**Includes**

- Create intent, signed upload, confirm, get signed read URL, delete/replace
- MIME/size/rate-limit validation
- User-plane + org-plane authz

**Done when**

- API-level upload of a PNG succeeds and object exists at designed path
- Read requires capability; unsigned public access fails

---

## Slice 2 — Image processing

**Includes**

- Async variant generation (thumb → large)
- Status `processing` → `ready` / `failed`
- EXIF orientation normalize; GPS strip on variants

**Done when**

- Confirmed image yields all variants
- Failure path is observable and retryable

---

## Slice 3 — MediaUpload + MediaImage

**Includes**

- Drag/drop, tap, camera, progress, retry/cancel
- Crop/rotate/zoom editor
- Validation messages; a11y
- MediaImage lazy-load helper

**Done when**

- Storybook or fixture page demonstrates full online happy path
- No URL text field in the pattern

---

## Slice 4 — Profile photo consumer (closes BUG-002)

**Includes**

- Setup wizard profile step: replace URL input with MediaUpload
- Profile settings form: same
- Persist asset reference; resolve thumb for Avatar / profile menu
- Remove manual URL entry

**Excludes**

- Onboarding workflow redesign
- Media library

**Done when**

- New user can upload/crop/save profile photo; reload persists
- Replace and remove work
- lint / typecheck / test / build pass

---

## Slice 5 — Offline queue MVP

**Includes**

- IndexedDB queue; auto-resume; UX badge

**Done when**

- Airplane mode → queue → online → upload completes

---

## Slice 6 — Property / unit photos

**Includes**

- Gallery bind to property/unit entities via MediaUpload multiple

**Done when**

- PM can add/replace/remove property photos without URL paste

---

## Slice 7 — Document vault binding

**Includes**

- Vault / lease attachments write `media_asset_id`
- Deprecate new `file_url` writes

**Done when**

- Applicant/lease document upload uses MediaUpload

---

## Slice 8 — Media library L1

**Includes**

- Org grid + picker mode

**Done when**

- User can attach an existing asset from library where intent allows

---

## Slice 9 — Hardening & closeout

**Includes**

- Quotas, orphan GC, retention job stubs
- Command Center / ops storage health (optional light metrics)
- Package status → Implemented
- ADR if Architect requires for Storage adoption

**Done when**

- DoD in [10](./10-definition-of-done.md) satisfied for foundation + profile consumer

---

## Recommended order rationale

Foundation (0–3) before any consumer. Profile (4) closes the acceptance defect early without waiting for library/docs. Org galleries and vault follow. Offline and library improve quality after the happy path is proven.

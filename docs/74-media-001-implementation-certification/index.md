# MEDIA-001 IMPLEMENTATION CERTIFICATION

**Status:** IMPLEMENTATION COMPLETE  
**Date:** 2026-08-13  
**Scope:** Phase 1 — Platform media foundation + Facility Operations work orders  
**Approved design:** `docs/73-media-001-universal-media-attachment` · ADR-023 Accepted  
**Production deploy:** **NO**  

---

## Scope implemented

1. Private Storage bucket `media` + `media_attachments` table with org RLS  
2. Shared validation (JPG/PNG/HEIC/WebP, MP4/MOV) + size limits  
3. Media API: upload-intent (signed URL), confirm, list, attach, signed download, delete  
4. Reusable `MediaAttachmentField` (photo / video / upload, preview, remove, playback)  
5. FO work order create attaches media; detail shows evidence gallery  
6. No public file URLs — signed placeholders/URLs only  

---

## Storage architecture

| Item | Implementation |
|------|----------------|
| Bucket | Private `media` (non-public) |
| Path | `{organization_id}/{entity_type}/{entity_id\|draft}/{media_id}/original.{ext}` |
| Upload | API authz → service-role signed upload URL → client PUT → confirm |
| Download / play | API authz → short-lived signed download URL |
| Public URLs | **Forbidden** |

---

## Database changes

Migration: `supabase/migrations/20260813210000_media001_media_attachments.sql`

Columns: id, organization_id, uploaded_by_user_id, related_entity_type, related_entity_id, file_type, mime_type, storage_reference, thumbnail_reference, preview_reference, **file_size**, sort_order, status, metadata, timestamps, deleted_at.

Indexes for entity lookup + org/status. RLS: org member select; insert as uploader; update uploader/manager.

---

## Security validation

| Check | Result |
|-------|--------|
| Unauthenticated upload | 401 |
| Unauthorized actor | 403 |
| Org path prefix on download | Enforced |
| Soft-deleted media | Not listed; download 404 |
| RBAC architecture | Unchanged — reuses `pm.maintenance:*` + FO/PM entitlements |
| Billing / Stripe | Unchanged |

---

## Facility workflow integration

| Actor | Behavior |
|-------|----------|
| Requester | Add photos/short video on create form; submit WO; media attached to `maintenance` entity |
| Facility team | View evidence gallery on work order detail (signed playback) |
| Vendor | Org members with maintenance read can access authorized attachments via same list/url APIs |

Example supported: “Chair broken in Clinic Room 204” + photos + short video.

---

## Test results

| Suite | Result |
|-------|--------|
| `@mpa/shared` media validation | **4 passed** |
| `media-service.test.ts` | **6 passed** |
| `media.route.test.ts` | **5 passed** |
| Facility / maintenance / vendor FO regression | **48 passed** (11 files) |
| `apps/web` tsc `--noEmit` | **Pass** |

Commands:

```bash
pnpm --filter @mpa/shared exec vitest run src/media
pnpm --filter @mpa/web exec vitest run src/lib/media src/app/api/shared/media
pnpm --filter @mpa/web exec vitest run \
  src/lib/facility \
  src/lib/maintenance \
  src/app/api/facility \
  src/app/api/portal/vendor/maintenance \
  src/components/facility
pnpm --filter @mpa/web exec tsc --noEmit
```

---

## Deployment status

| Item | Status |
|------|--------|
| Implementation | **COMPLETE** |
| Production deploy | **NOT PERFORMED** |
| Migration apply | Owner-authorized release only |

---

## Final verdict

**IMPLEMENTATION COMPLETE**

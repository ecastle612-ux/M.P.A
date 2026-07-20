# 02 — Storage Architecture

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Aligns with:** [Database Architecture — Document Storage](../09-database-architecture/index.md) · [Security — Documents](../14-security-standards/index.md) · [INT-901](../31-product-requirements/integration-roadmap.md)

---

## Principles

1. **Postgres is the system of record for media metadata**; Storage holds bytes.
2. **Private by default.** Public buckets only for explicitly non-sensitive brand/marketing assets (not profile photos, not tenant documents).
3. **Path layout encodes tenancy and ownership** so Storage RLS and ops tooling can reason about objects.
4. **Signed URLs** are the default read mechanism (15-minute TTL unless a shorter intent is required).
5. **CDN delivery** for variants in production (Supabase Storage CDN / Edge).
6. **No free-form user-entered URLs** as source of truth.

---

## Logical model

### `media_assets` (proposed)

| Column | Purpose |
|--------|---------|
| `id` | UUID primary key |
| `organization_id` | Nullable for user-plane assets; required for org-plane |
| `owner_user_id` | Uploader / owner (required) |
| `plane` | `user` \| `organization` |
| `kind` | Enum-like text: `profile_photo`, `property_photo`, `unit_photo`, `maintenance_photo`, `inspection_photo`, `document`, `general`, … |
| `entity_type` | Polymorphic attach target (`user`, `property`, `unit`, `work_order`, `lease`, …) |
| `entity_id` | Target id (nullable until bound) |
| `status` | `pending_upload` \| `processing` \| `ready` \| `failed` \| `deleted` |
| `mime_type` | Detected/validated MIME |
| `byte_size` | Original size |
| `content_hash` | SHA-256 for duplicate detection |
| `storage_bucket` | Bucket name |
| `storage_path` | Path to original object |
| `original_filename` | Sanitized client name (display only) |
| `width` / `height` | For images when known |
| `version` | Integer; increments on replace |
| `replaced_asset_id` | Prior version link (nullable) |
| `metadata` | JSONB (EXIF stripped flags, crop rect, etc.) |
| `created_at` / `updated_at` / `deleted_at` | Lifecycle |

### `media_asset_variants` (proposed)

| Column | Purpose |
|--------|---------|
| `id` | UUID |
| `media_asset_id` | FK |
| `variant` | `thumb` \| `small` \| `medium` \| `large` \| `original` |
| `storage_path` | Object path |
| `mime_type` | May differ from original (e.g. WEBP/AVIF) |
| `byte_size` | |
| `width` / `height` | |
| `created_at` | |

### `media_audit_events` (proposed)

Append-only: `uploaded`, `replaced`, `deleted`, `signed_url_issued` (optional sampling), `scan_queued`, `scan_cleared`, `scan_blocked`.

Domain tables (properties, work orders, vault documents, `user_profiles`) store **`media_asset_id`** (or arrays of ids), not raw URLs.

**Profile mapping:** `user_profiles.avatar_url` today holds a URL string. After adoption, either:

- Prefer `user_profiles.avatar_media_asset_id` (schema change in implementation slice), **or**
- Persist only an internal storage reference string derived from the asset (not a user-pasted URL),

with display always resolving via MediaService → signed URL for `thumb`/`small`. Exact column migration is an implementation detail of the profile consumer slice; **manual URL entry is removed either way**.

---

## Buckets

| Bucket | Visibility | Contents |
|--------|------------|----------|
| `media-private` | Private | Default for all org and user operational media |
| `media-public` | Public (CDN) | Optional; only non-sensitive public brand assets if product later needs them |

**v1 recommendation:** Ship **`media-private` only**. Do not put profile photos or documents in a public bucket.

---

## Path layout

### Organization plane

```
{organization_id}/{kind}/{entity_type}/{entity_id}/{asset_id}/original/{filename}
{organization_id}/{kind}/{entity_type}/{entity_id}/{asset_id}/variants/{variant}.{ext}
```

### User plane (profile before/without org)

```
users/{user_id}/profile/{asset_id}/original/{filename}
users/{user_id}/profile/{asset_id}/variants/{variant}.{ext}
```

Rules:

- All path segments are UUIDs or controlled enums — never raw user filenames in middle segments.
- Filename at leaf is sanitized (alphanumeric, dash, underscore, single extension).
- Replace creates a new `asset_id` (or new version folder) and marks prior asset soft-deleted / superseded.

---

## Upload flow (server-mediated)

```
1. Client requests upload intent (kind, entity, mime, size, hash)
2. MediaService validates authz + allowlist + quota + rate limit
3. MediaService creates media_assets row (status=pending_upload)
4. MediaService returns short-lived signed upload URL (or accepts multipart proxy)
5. Client uploads bytes directly to Storage (preferred) or via server proxy for small files
6. Client confirms upload complete
7. MediaService verifies object exists + size/hash, sets status=processing
8. ImageProcessor generates variants async
9. status=ready; clients poll or receive realtime/event
```

**Preferred:** signed upload to Storage (less app-server bandwidth).  
**Fallback:** server proxy for environments where direct upload is blocked.

---

## Read / delivery

| Consumer need | Variant | Mechanism |
|---------------|---------|-----------|
| Avatar in nav | `thumb` or `small` | Signed URL or short-cache edge rewrite |
| Property card | `small` / `medium` | Signed URL |
| Lightbox / detail | `large` | Signed URL |
| Download / AI / print | `original` | Signed URL + capability check |
| Public marketing (future) | public bucket object | CDN URL only if classified public |

Default signed URL TTL: **15 minutes** (Security Standards). Clients refresh via MediaService; do not embed long-lived public URLs for private assets in DB.

---

## CDN & caching

- Enable Storage CDN in production.
- Cache-Control on variants: immutable content-hashed paths preferred (`…/variants/small.webp` under unique `asset_id`).
- Avatars: aggressive cache of signed responses only within TTL; prefer re-sign rather than storing permanent CDN URLs in profiles.

---

## Quotas & lifecycle

| Concern | Design |
|---------|--------|
| Org quota | Soft quota in org settings; hard reject near limit |
| Retention | Soft-delete assets; purge job after retention window (configurable; default 30 days for deleted) |
| Versioning | Replace keeps prior asset soft-deleted + `replaced_asset_id` chain |
| Cold archive | INT-903: move originals older than N years to cold tier; keep thumbs hot |
| Orphans | GC job for `pending_upload` older than 24h and unreferenced deleted assets |

Aligns with architecture improvement: unbounded Storage is a margin risk.

---

## Relationship to existing placeholders

| Today | After API-002A |
|-------|----------------|
| `user_profiles.avatar_url` text | Media asset id / resolved signed URL |
| `vault_documents.file_url` optional text | `media_asset_id` |
| `lease_documents.file_url_placeholder` | Media attachment |
| Migration `storage_path` = filename string | Unrelated; migration stays import-only |
| Phase 12 `documents.storage_path` | Points at MediaService-managed path or FK to `media_assets` |

API-002A **owns** INT-901 design. Phase 12 vault consumes it; it does not invent a second bucket scheme.

---

## Multi-kind support matrix

| Kind | Plane | Typical max size | Crop UX |
|------|-------|------------------|---------|
| Profile photo | User (or org member) | 10 MB | Required square crop |
| Property / unit photos | Org | 10 MB | Optional |
| Maintenance / before-after | Org | 10 MB | Optional |
| Inspection photos | Org | 10 MB | Optional |
| Documents (PDF, etc.) | Org | 25 MB default (configurable) | N/A |
| General media | Org | Kind policy | Optional |

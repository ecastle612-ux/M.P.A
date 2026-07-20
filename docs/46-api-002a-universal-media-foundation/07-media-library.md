# 07 — Media Library

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Phase:** Post-foundation (not required to close BUG-002)

---

## Purpose

An org-scoped **Media Library** lets authorized users browse, search, and reuse existing assets instead of re-uploading duplicates. It is a consumer of MediaService — not a second storage system.

---

## Capabilities (phased)

### Phase L1 — Basic library (after foundation + profile)

- List ready assets for current org (filter by kind, entity, date, uploader)
- Grid with `thumb` variants
- Open detail: metadata, variants, linked entity
- Delete / soft-delete with permission
- “Use this photo” returns `media_asset_id` to calling MediaUpload / picker mode

### Phase L2 — Reuse & dedupe

- Duplicate detection prompts during upload
- Attach existing asset to another entity when policy allows (reference, not copy)
- Collections / albums (optional later)

### Phase L3 — Search & ops

- Full-text on filename/title/tags
- Storage usage by property / kind
- Quarantine queue (with INT-902)

---

## Picker mode

MediaUpload supports:

```
mode: "upload" | "library" | "upload_or_library"
```

Profile photo: upload-only (or replace) is enough for BUG-002.  
Property gallery: upload_or_library.

---

## Permissions

Library visibility follows media read capabilities. Sensitive document kinds may be excluded from general library and only visible in their domain vault UI.

---

## Non-goals for library v1

- External sync (Google Drive / Dropbox)
- Public share links without auth
- Cross-org asset marketplace

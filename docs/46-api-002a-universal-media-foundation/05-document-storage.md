# 05 — Document Storage

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Aligns with:** [Phase 12 vault model](../41-phase-12-resident-experience-digital-operations/02-architecture-and-integration.md) · [Database Architecture](../09-database-architecture/index.md)

---

## Separation of concerns

| Layer | Responsibility |
|-------|----------------|
| **Media foundation (API-002A)** | Bytes, variants, signed delivery, upload UX, Storage RLS |
| **Domain document records** | Business meaning: category, tags, entity link, retention class, signature linkage |
| **Workflows** | When to require a document, who can view, OCR/AI later |

Documents are **media assets with document kind + domain metadata**, not a second binary system.

---

## Attachment model

```
domain_document (vault / lease_documents / etc.)
  ├── organization_id
  ├── entity_type / entity_id
  ├── title, category, tags
  ├── media_asset_id          ← binary SoR
  ├── version_of (optional)
  └── audit fields
```

Rules:

- Creating a document row without bytes is allowed only as a draft/placeholder if product needs it — but “upload” always goes through MediaUpload.
- `file_url` free-text fields are deprecated for new work.
- Version replace: new media asset + new document version row (or version field), prior retained per retention policy.

---

## Allowed document types (v1 proposal)

| MIME | Extensions |
|------|------------|
| `application/pdf` | pdf |
| `image/jpeg`, `image/png`, `image/webp` | jpg, png, webp (scanned docs) |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | docx |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | xlsx |

Reject executables, HTML, SVG-as-scriptable, and archives unless a later package approves them (zip bombs / malware risk).

Default max size for documents: **25 MB** (override per intent).

---

## Images that are “documents”

Maintenance photos are `kind=maintenance_photo` (image pipeline).  
A PDF lease is `kind=document` (no image variant ladder; optional PDF first-page preview later).

---

## Consumer modules

| Module | Uses media as |
|--------|----------------|
| Applicant documents | Document attachments |
| Lease attachments | Document attachments |
| Resident / owner / vendor docs | Document attachments |
| Property / unit photos | Image gallery assets |
| Maintenance before/after | Image assets linked to work order |
| Profile photo | Single image asset on user profile |

All use the same MediaUpload + MediaService.

---

## Migration from placeholders

| Current | Target |
|---------|--------|
| Vault metadata + optional `file_url` | Require `media_asset_id` for “uploaded” docs |
| Lease `file_url_placeholder` | Media-backed attachment |
| Tenant `documents_placeholder` | Structured attachments |

Implementation may keep reading legacy `file_url` for old rows during a sunset period; new uploads never write paste URLs.

---

## Search & library

Document search remains domain-driven (title, tags, entity). Media library ([07](./07-media-library.md)) can list document-kind assets for reuse where policy allows.

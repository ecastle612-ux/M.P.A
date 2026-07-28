# 03 — Coverage Matrix

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

Legend: **Compliant** = uses MediaUpload-like path with dual acquisition after UX-010 · **Partial** = MediaUpload but no dual picker yet · **Gap** = images supported or planned without standard · **N/A** = images forbidden / not applicable · **Follow-up** = needs post-Approve slice

---

## Current surfaces (as of 2026-07-23)

| Area | Current implementation | UX-010 target | Slice |
|------|------------------------|---------------|-------|
| Profile pictures | `MediaUpload` + `profilePhotoUploadIntent` (`capture: true`) | Partial → Compliant | A |
| Setup / onboarding photo | `MediaUpload` | Partial → Compliant | A |
| Tenant avatar (`EntityAvatarField`) | Wraps `MediaUpload` | Partial → Compliant | A |
| Maintenance work orders (PM) | `MediaUpload` `maintenance_photo` + capture | Partial → Compliant | A |
| Resident work orders | `MediaUpload` + capture | Partial → Compliant | A |
| Announcement attachments | `MediaUpload` `property_photo` + crop | Partial → Compliant | A |
| Vendor job finish photos | Ad-hoc `<input>` + `media` bucket | Gap → Compliant via API-002A | B |
| Vendor invoice photos | Ad-hoc `<input>` + `media` bucket | Gap → Compliant (images) / PDF path separate | B |
| Property photos | Kind exists; **no gallery UI** | Gap when UI opens | C |
| Unit photos | Kind exists; **no UI** | Gap when UI opens | C |
| Inspection photos | Kind exists; **no UI** | Gap when UI opens | C |
| Organization logos | No user upload UI (brand assets static) | Gap when product opens | C |
| Document Vault image upload | Vault metadata; no first-class image binary uploader UI | Gap when product opens | C |
| Messages | Attachment via vault document IDs; limited image UX | Follow-up when message images allowed | C |
| Owner documents (images) | Read/browse oriented; upload not OWNER-001 MVP | Follow-up when images supported | C |
| Applicant documents (images) | Screening/docs packages — confirm per feature | Follow-up | C |
| AI image workflows | No dedicated acquisition UI | Must use ImageAttachmentButton when opened | C |

---

## Future modules (binding when images allowed)

| Module / capability | Rule |
|---------------------|------|
| Any new maintenance / facility photo | Mandatory ImageAttachmentButton |
| Lease / applicant image attachments | Mandatory unless images explicitly forbidden |
| Owner portal uploads (if Approve adds) | Mandatory |
| Copilot / AI “analyze this photo” | Mandatory acquisition via ImagePicker |
| Native shell / PWA | Same UX; camera prefers device capture |

---

## Explicit exceptions (images forbidden)

Features may opt out **only** with product-documented forbid:

| Example | Reason |
|---------|--------|
| Strict PDF-only legal packet | MIME allowlist excludes images |
| CSV/XLSX migration dropzone | Non-image (`MigrationFileDropzone`) |

Opt-out must be explicit in feature docs — silence is not an exception.

---

## Follow-up inventory (post-Approve engineering)

These are **not** implemented by this Draft. They become Slice work after Approve:

1. Refactor `MediaUpload` to open `ImagePicker` (all current consumers inherit).  
2. Migrate vendor job photo + invoice **image** path to MediaService + ImageAttachmentButton.  
3. Decide vendor invoice **PDF** path (may keep non-image picker; must not look like a one-off image dialog).  
4. When property/unit/inspection galleries ship — start from ImageAttachmentButton only.  
5. Org logo + vault binary image upload — product packages + Slice C.  
6. Messaging image attach — product decision + Slice C.

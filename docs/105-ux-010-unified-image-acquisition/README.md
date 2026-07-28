# UX-010 — Unified Image Acquisition Standard

**Status:** 📝 **Draft — Awaiting Approval** · Implement 🔒 **locked**  
**Initiative ID:** UX-010  
**Priority:** Platform UX (cross-cutting)  
**Parent foundation:** [API-002A — Universal Media Foundation](../46-api-002a-universal-media-foundation/README.md) (**Approved · Implemented**)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Canopy:** [06 Design Language](../06-design-language/index.md) (must remain approved)  
**Date:** 2026-07-23

> **This package does not authorize implementation.**  
> No new components, call-site migrations, or vendor upload rewrites until Status → **Approved** and a slice is unlocked.  
> Commercial freeze / FIN-003 hold are unaffected.

---

## Executive summary

Every image-capable surface in M.P.A. must offer the **same acquisition UX**:

| Option | Label |
|--------|--------|
| 📷 | **Capture Photo** |
| 📁 | **Upload From Device** |

Today, [API-002A](../46-api-002a-universal-media-foundation/README.md) ships `MediaUpload` + `media-private` + `/api/media/*` — the correct **storage and upload pipeline**. Acquisition UX is incomplete:

- Single native file picker (optional `capture="environment"`) — **no explicit two-choice picker**
- Vendor job / invoice flows use **ad-hoc** `<input type="file">` outside MediaUpload
- Several media kinds exist without UI consumers (property/unit/inspection galleries, org logos, vault binary upload)

**UX-010** designs the platform **Image Acquisition** layer on top of API-002A — one reusable picker component, one interaction flow, mandatory reuse everywhere images are allowed.

---

## Binding rule (proposed)

```
If a feature supports images → it MUST use ImageAttachmentButton / ImagePicker
  → which MUST acquire via Capture Photo | Upload From Device
  → which MUST upload via API-002A MediaService (media-private)

Exceptions: only when the feature explicitly forbids images
            (e.g. PDF-only legal packets with no image MIME)

Forbidden: duplicate upload dialogs, raw Storage calls in React,
           URL-paste photo fields, vendor-only parallel upload UX
```

---

## Package contents

| Doc | Purpose |
|-----|---------|
| [00 — Purpose and scope](./00-purpose-and-scope.md) | Goals, in/out of scope, relationship to API-002A |
| [01 — UX standard](./01-ux-standard.md) | Unified picker, flow, labels, a11y |
| [02 — Component architecture](./02-component-architecture.md) | `ImagePicker` / `ImageAttachmentButton` · MediaUpload reuse |
| [03 — Coverage matrix](./03-coverage-matrix.md) | Current surfaces + gaps + future modules |
| [04 — Mobile and desktop behavior](./04-mobile-and-desktop-behavior.md) | Camera / webcam / fallbacks |
| [05 — Future extensibility](./05-future-extensibility.md) | Multi, crop, OCR, AI — architect only |
| [06 — Acceptance criteria](./06-acceptance-criteria.md) | Pass/fail for Approve + post-Approve slices |
| [07 — Open questions](./07-open-questions.md) | Decisions needed at Approve |
| [08 — Approval checklist](./08-approval-checklist.md) | Sign-off form |

---

## Implementation slices (post-Approve only)

| Slice | Scope | Authorized only after |
|-------|-------|------------------------|
| **A** | Ship `ImageAttachmentButton` + acquisition sheet; wire into existing `MediaUpload` consumers | Approve + Slice A unlock |
| **B** | Migrate vendor ad-hoc image inputs onto API-002A + ImageAttachmentButton | Slice A done + B unlock |
| **C** | Property / unit / inspection / org logo / vault image entry points as product opens them | Per-feature Approve if new patterns |

No slice is unlocked by this Draft package.

---

## Related

| Doc | Role |
|-----|------|
| [API-002A 03 — Upload Component](../46-api-002a-universal-media-foundation/03-upload-component.md) | MediaUpload foundation |
| [Component Standards](../12-component-standards/index.md) | FileUpload ≡ MediaUpload naming |
| [Development Freeze](../00-governance/development-freeze-checkpoint.md) | Commercial freeze unrelated; this package stays Draft |
| [Technical Debt Register](../00-governance/technical-debt-register.md) | May list vendor dual-path after Approve |

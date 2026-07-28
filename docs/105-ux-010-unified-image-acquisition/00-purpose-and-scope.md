# 00 — Purpose and Scope

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

---

## Purpose

1. Establish a **platform-wide image acquisition standard** so every “Add Image / Attach Image / Upload Photo” action presents the same two choices: **Capture Photo** and **Upload From Device**.  
2. Define a **single reusable component** that all features must use.  
3. **Reuse** API-002A MediaService / `MediaUpload` / `media-private` — do not invent a second upload stack.  
4. Architect for future capabilities (multi, crop, OCR, AI) without implementing them in v1.

---

## Problem

| Observation | Impact |
|-------------|--------|
| `MediaUpload` opens one native picker; camera is a side-effect of `capture` when set | Users do not always see an explicit Capture vs Upload choice |
| Vendor job photos / invoices use separate file inputs + `media` bucket | Parallel UX and storage path |
| Property / unit / inspection kinds exist without gallery UI | Future builders will invent local pickers unless standard is binding |
| Vault / messages attach documents by ID; image UX inconsistent when images appear | Fragmented experience |

---

## In scope (this design package)

| Area | In scope? |
|------|-----------|
| UX law: Capture + Upload From Device everywhere images are allowed | Yes |
| Component API: `ImageAttachmentButton` / `ImagePicker` | Yes |
| Standard flow: Capture → Preview → Replace → Remove → Upload | Yes |
| Mobile camera + desktop webcam + graceful fallback | Yes |
| Coverage matrix of current and future consumers | Yes |
| Mapping onto API-002A intents / kinds | Yes |
| Future extensibility hooks (design only) | Yes |
| Approval checklist | Yes |

---

## Out of scope (this package / Draft)

| Area | Out of scope |
|------|----------------|
| Application / UI code | Yes — until Approve |
| New Storage buckets or MediaService rewrite | Yes — reuse API-002A |
| Implementing crop / OCR / AI analysis / annotation | Yes — future (see [05](./05-future-extensibility.md)) |
| PDF-only non-image document pickers | Separate (may share chrome later) |
| FIN-003 / commercial launch work | Unrelated |
| Changing commercial roadmap or freeze | Forbidden |

---

## Relationship to API-002A

```
API-002A (Approved · Implemented)
  MediaService + media-private + /api/media/*
  MediaUpload (pipeline: intent → signed upload → confirm → process)
  ImageEditorModal (crop/rotate — already exists)

UX-010 (this package — Draft)
  Image acquisition UX layer (picker choice + flow)
  ImageAttachmentButton / ImagePicker (entry points)
  Mandates MediaUpload / MediaService underneath
```

UX-010 **does not replace** API-002A. It **completes** the acquisition UX contract that API-002A already named (camera / tap / preview) but did not ship as an explicit dual-option picker.

---

## Success definition

After Approve + Slice A–B:

- No image-capable product surface uses a one-off upload dialog.  
- Every Add/Attach Image affordance shows Capture Photo + Upload From Device.  
- All new image binaries still land in `media_assets` / `media-private` via MediaService.

# 05 — Future Extensibility

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

> **Do not implement these in Slice A.** Design hooks only so future packages need no UX redesign.

---

## Planned capabilities (deferred)

| Capability | Hook | Notes |
|------------|------|-------|
| Multiple images | `intent.multiple` / `maxFiles` | Queue UI after acquisition |
| Drag & drop | Already partial on MediaUpload | Keep as accelerator; sheet remains canonical for CTA |
| Image preview | Ready-state `MediaImage` | Enhance lightbox later |
| Crop / rotate / zoom | Existing `ImageEditorModal` | Extend tools; don’t fork |
| Compression | `onBeforeUpload` | Client compress before intent |
| Annotation | `tools: ['annotate']` | New approved package later |
| OCR | `ocr: true` → job | AI/docs package |
| AI image analysis | `analysis: 'queued'` | AI-001 / IA packages |
| Offline queue | API-002A slice 5 contracts | Resume uploads |

---

## Architecture constraints for future work

1. **Acquisition sheet stays stable** — Capture + Upload From Device remain the first decision.  
2. **New tools attach after file exists** (preview/edit pipeline), not as alternate entry dialogs.  
3. **Storage remains API-002A** — no parallel buckets for “AI images.”  
4. **Each material capability** still needs Design → Document → Approve if it changes product/architecture patterns.

---

## Non-goals forever (unless ADR changes)

- Pasting arbitrary remote image URLs as the primary path  
- Module-owned Storage SDKs  
- Capture-only or Upload-only product defaults (except explicit forbid-images features)

# API-002A — Universal Media Upload Foundation

**Status:** Approved · Implemented (slices 0–4)  
**Initiative ID:** API-002A  
**Also tracked as:** BUG-002 (acceptance defect: profile photo URL field)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**PRR / integration:** [INT-901](../31-product-requirements/integration-roadmap.md) (Supabase Storage primary) · [INT-902](../31-product-requirements/integration-roadmap.md) (virus scan — future)  
**Related:** [Phase 12 document vault](../41-phase-12-resident-experience-digital-operations/02-architecture-and-integration.md) · [PX-006 onboarding](../38-px-006-workflow-experience-enterprise-ux/03-onboarding-and-invitations.md) · [Security — Documents](../14-security-standards/index.md) · [Component Standards — FileUpload](../12-component-standards/index.md)  
**Gate owner:** Product + Lead Architect + Security  
**Architectural decisions (Approve):** Q1 `media_asset_id` only · Q2 signed upload URLs · Q3 async variants · Q4 JPEG/PNG/WEBP/HEIC (+ convert) · Q5 private only · Q6 offline deferred to slice 5

---

## Executive Summary

Manual acceptance testing exposed an unacceptable UX:

> Profile completion asks users to paste a **Profile Photo URL**.

That pattern is not viable for an enterprise property operations platform. More importantly, M.P.A. has **no shipped media architecture**: no Storage buckets, no binary upload API, no image pipeline, and no reusable upload component. Document and photo surfaces today are metadata placeholders or free-text URLs.

**API-002A designs the universal media foundation** — one Storage model, one processing pipeline, one Canopy upload experience — reused by every current and future module.

This is **not** a profile feature. Profile photo upload is the **first consumer** after foundation approval. Property, unit, maintenance, inspection, lease, applicant, vendor, owner, pet, vehicle, and AI image analysis modules must all consume this system. **No module may invent its own uploader.**

### What this package defines

| Area | Outcome |
|------|---------|
| Universal upload UX | Drag/drop, tap, camera, crop/rotate/zoom, preview, replace, delete, multi-file, progress, retry/pause/cancel |
| Storage architecture | Supabase Storage buckets, path layout, signed URLs, private-by-default, CDN delivery |
| Image processing | Thumbnail / small / medium / large / original; optimization; modern formats; lazy loading |
| Document storage | Binary + metadata separation; domain docs reference media assets |
| Security & RLS | Org isolation, ownership, MIME/size limits, rate limits, audit; malware scan future |
| Media library | Org-scoped browse/search/reuse (phased) |
| Offline | Upload queue, resume, mobile-ready contracts |
| Reuse law | One MediaService + one MediaUpload pattern; zero duplicate upload widgets |

### Explicitly out of scope (this package)

- Application code, migrations, buckets, API routes, SDKs, or env commits (**Design/Document only**)
- Implementing profile photo UI before Approve
- Building every consumer module’s photo galleries in v1
- Native App Store apps (contracts must not block them)
- Virus scanning implementation (design hooks only — INT-902)
- Third-party DAM / Dropbox-style sync products

---

## Problem analysis (from acceptance)

| Observed | Interpretation |
|----------|----------------|
| “Profile photo URL” text field | Users cannot complete a professional photo workflow |
| No Storage buckets in migrations | INT-901 never designed as a reusable platform layer |
| Vault / lease “uploads” are metadata or placeholders | Domain modules are inventing parallel half-solutions |
| Manual URLs in `avatar_url` | Persist external URLs → broken links, no ownership, no variants, XSS/hotlink risk |
| Component standards list `FileUpload` | Pattern named but never designed or shipped |

---

## Architecture overview

```
Module UI (profile, property, WO, lease, …)
  → MediaUpload (Canopy pattern — one component)
    → MediaClient (progress, offline queue, resume)
      → MediaService (server — only public write path)
        → validation + authz + audit
          → Supabase Storage (private buckets)
          → media_assets (+ variants metadata)
            → ImageProcessor (async variants)
              → CDN / signed URL delivery
```

**Invariant:** Domain modules never call Supabase Storage directly. They never paste free-form image URLs as the source of truth. They bind to `media_asset_id` (and optionally display a derived signed URL for a chosen variant).

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, non-goals, PRR mapping, acceptance |
| [02 — Storage Architecture](./02-storage-architecture.md) | Buckets, paths, CDN, signed URLs, lifecycle |
| [03 — Upload Component](./03-upload-component.md) | Universal MediaUpload UX + API |
| [04 — Image Processing](./04-image-processing.md) | Variants, formats, optimization, caching |
| [05 — Document Storage](./05-document-storage.md) | Docs vs images; domain attachment model |
| [06 — Security and RLS](./06-security-and-rls.md) | Isolation, limits, audit, malware future |
| [07 — Media Library](./07-media-library.md) | Browse, reuse, search (phased) |
| [08 — Offline Behavior](./08-offline-behavior.md) | Queue, resume, mobile readiness |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices after Approve |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Recommended rollout

1. **Approve** this package (Product + Architect + Security).
2. Implement foundation slices first ([09](./09-implementation-slices.md)): schema, buckets, MediaService, processing, MediaUpload.
3. **First consumer:** replace profile photo URL with MediaUpload (setup wizard + profile settings) — closes BUG-002 without redesigning onboarding workflow.
4. Adopt remaining modules incrementally (property/unit → maintenance → documents vault → others). Forbid new URL-paste fields in review.
5. Phase media library + offline resume + virus scan as later slices / INT-902.

---

## Approval checklist

- [x] Product sign-off on UX scope, first consumer (profile), and reuse law
- [x] Architect sign-off on MediaService, buckets, metadata model, processing
- [x] Security sign-off on Storage RLS, signed URLs, org isolation, limits
- [x] Status on this README changed to **Approved**
- [x] Implementation authorized only for approved slices in [09](./09-implementation-slices.md)

---

## Gate status

| Stage | State |
|-------|--------|
| Design | **Complete** |
| Document | **Complete** |
| Approve | **Complete** |
| Implement | **Complete (slices 0–4)** — offline queue / library / additional consumers deferred |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔ (foundation + profile consumer)**

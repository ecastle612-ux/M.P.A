# 11 — Risk Analysis

**Package:** API-002A  
**Status:** Draft — Ready for Approval

---

## Risks

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Modules keep shipping URL fields / custom uploaders | High | Medium | Reuse law in review checklist; MediaUpload only |
| R2 | Unbounded Storage cost | High | Medium | Quotas, retention, GC, variant size caps ([02](./02-storage-architecture.md)) |
| R3 | Weak Storage RLS → cross-tenant leak | Critical | Low–Med | Mandatory RLS tests; private bucket; path prefixes |
| R4 | Signed URL leakage / long TTL | High | Medium | 15-min TTL; no permanent URLs in DB |
| R5 | Processing CPU overload | Medium | Medium | Async worker; queue; reject huge megapixel images |
| R6 | Profile setup before org exists | Medium | High | Explicit user-plane paths ([02](./02-storage-architecture.md)) |
| R7 | Offline queue stores sensitive blobs on device | Medium | Medium | Encryption/clear on logout; size caps ([08](./08-offline-behavior.md)) |
| R8 | Malware in uploads | High | Medium | INT-902 hook; quarantine status ([06](./06-security-and-rls.md)) |
| R9 | HEIC from iPhones rejected → user frustration | Medium | High | Convert or clear error + guidance ([04](./04-image-processing.md)) |
| R10 | Scope creep into full DAM before foundation ships | Medium | High | Slice order; library deferred ([07](./07-media-library.md), [09](./09-implementation-slices.md)) |
| R11 | Duplicate systems vs Phase 12 vault | High | Medium | Single MediaService; vault references assets ([05](./05-document-storage.md)) |
| R12 | `next/image` remotePatterns / CSP misconfig | Medium | Medium | Document hosts; MediaImage helper centralizes |

---

## Open questions (resolve at Approve)

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | Profile column: new `avatar_media_asset_id` vs overload `avatar_url`? | A) New FK column B) Store internal ref string in `avatar_url` | **A** — clearer SoR |
| Q2 | Direct signed upload vs server proxy? | A) Signed B) Proxy | **A** with proxy fallback |
| Q3 | Processor: Edge/worker vs Next route? | A) Worker B) Route | **A** |
| Q4 | HEIC in v1? | Convert / reject | Convert if feasible; else reject with message |
| Q5 | Media capability names vs reuse existing grants? | New `media:*` / map existing | Architect decides per kind |
| Q6 | Block profile save until `ready`? | Block / allow processing | Allow `processing` with asset id; block setup advance on `failed` |

---

## Dependencies

| Dependency | Notes |
|------------|-------|
| Supabase Storage enabled on project | Ops prerequisite |
| Canopy tokens for upload states | Avoid contrast defects (see BUG-001 lesson) |
| INT-901 | This package is the design vehicle |
| Phase 12 vault | Consumer, not competitor |
| PX-006 | Profile photo optional; workflow unchanged |

---

## What happens if not approved

- Profile URL field remains (enterprise UX failure)
- Modules continue inventing placeholders and paste URLs
- INT-901 stays unimplemented in practice
- Higher rewrite cost when Storage finally lands

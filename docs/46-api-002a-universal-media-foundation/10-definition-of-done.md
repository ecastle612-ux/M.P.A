# 10 — Definition of Done

**Package:** API-002A  
**Status:** Draft — Ready for Approval

---

## Gate DoD (this documentation task)

| Criterion | State |
|-----------|--------|
| Design complete | ✔ |
| Documented under `docs/46-api-002a-universal-media-foundation/` | ✔ |
| Linked from Blueprint index | Required as part of Document |
| Explicit Approve recorded on README | Pending |
| Application code / migrations / buckets | **Not started** (correct) |

**Design ✔ · Document ✔ · Approve Pending · Implement Blocked**

---

## Implementation DoD (after Approve — foundation)

Foundation (slices 0–3) is done when:

- [ ] Private Storage bucket exists with RLS tests green
- [ ] `media_assets` + variants are SoR for binaries
- [ ] MediaService is the only write path used by app code
- [ ] MediaUpload is the only upload UI pattern
- [ ] Image variants generate successfully
- [ ] Signed URLs enforce TTL and authz
- [ ] No module calls Storage directly
- [ ] `pnpm lint` / `typecheck` / `test` / `build` pass

---

## BUG-002 consumer DoD (slice 4)

Done when a brand-new user (or profile settings user) can:

- [ ] Upload JPG / PNG / WEBP
- [ ] Drag & drop (desktop) and tap (mobile viewport)
- [ ] Crop / rotate / zoom and preview before save
- [ ] Save profile; asset persists across reload
- [ ] Replace photo
- [ ] Remove photo
- [ ] Avatar UIs use thumb/small — not original
- [ ] No “Profile photo URL” / “Avatar URL” text field remains on those surfaces
- [ ] No console/network/server failures on happy path

---

## Platform reuse DoD

- [ ] Review checklist forbids duplicate uploaders and URL-paste media fields
- [ ] At least one org-plane consumer planned or shipped (property/unit) after profile
- [ ] Document attachment path designed against `media_asset_id` ([05](./05-document-storage.md))

---

## Package complete

API-002A is **Implemented** when slices through hardening ([09](./09-implementation-slices.md) slice 9) meet criteria above, README status updated, and INT-901 is marked satisfied for the **foundation** (virus scan remains INT-902).

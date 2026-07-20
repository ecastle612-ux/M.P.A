# 08 — Offline Behavior

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Aligns with:** [Mobile Roadmap](../31-product-requirements/mobile-roadmap.md) · PWA offline shell

---

## Goals

- Uploads started offline (or interrupted) are not silently lost.
- Connectivity return resumes the queue automatically.
- Contracts work for web PWA today and native apps later.

---

## Client upload queue

```
MediaClient queue (IndexedDB / SQLite on native)
  ├── local file blob / URI
  ├── intent snapshot
  ├── crop export blob (if edited)
  ├── attempts, last error
  └── state: queued | uploading | paused | failed | completed
```

Rules:

- Persist queue across refresh where platform allows.
- Cap queued bytes (e.g. 100 MB device budget) with user-visible warning.
- Do not store queue in `localStorage` (size/security).
- On login change / logout: clear or encrypt-at-rest per security review.

---

## Resume strategy

| Scenario | Behavior |
|----------|----------|
| Offline before start | Queue locally; upload when online |
| Failure mid-upload | Retry with backoff; resumable upload if Storage supports; else restart from byte 0 with same asset id if still pending |
| App killed | On next launch, reconcile pending `media_assets` vs local queue |
| Pause | User pause holds item; auto-resume optional setting |
| Cancel | Remove local blob; cancel pending server asset |

---

## Sync with server

1. Create upload intent when online (or create upon reconnect before PUT).
2. Prefer idempotency key = client-generated upload id.
3. Confirm complete → processing → ready.
4. Mark local queue item completed; delete local blob.

---

## UX

- Banner: “X photos waiting to upload”
- Per-item status in MediaUpload list
- Manual “Retry all”
- Never claim “Saved” on the domain entity until required assets are `ready` (or product allows pending with clear badge)

Profile save: either

- block save until avatar ready, or
- save profile and show “Photo still uploading” with non-blocking progress —

**Recommendation:** for required crop confirm, finish upload to `ready` (or at least `processing` with asset id persisted) before advancing setup step.

---

## Mobile / native

- Same MediaService HTTP contracts
- Native uses OS background upload APIs mapped to the same intent/confirm lifecycle
- Camera capture writes to queue identically

---

## Out of scope for first foundation slice

Full offline queue may land in a dedicated slice after basic online upload works. **Contracts and UX states must be designed now** so online-only v1 does not paint a corner.

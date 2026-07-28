# 06 — Acceptance Criteria

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

---

## Design package acceptance (Approve gate)

| # | Criterion | Pass when |
|---|-----------|-----------|
| D1 | Dual-option acquisition is mandatory for image surfaces | Written in [01](./01-ux-standard.md) |
| D2 | Component composition reuses API-002A | Written in [02](./02-component-architecture.md) |
| D3 | Coverage matrix lists current gaps | [03](./03-coverage-matrix.md) complete |
| D4 | Mobile + desktop behaviors defined | [04](./04-mobile-and-desktop-behavior.md) |
| D5 | Future hooks without implementing futures | [05](./05-future-extensibility.md) |
| D6 | Open questions resolved or deferred with owners | [07](./07-open-questions.md) |
| D7 | Implement remains locked until Approve | README + [08](./08-approval-checklist.md) |

---

## Slice A acceptance (post-Approve implement — not authorized now)

| # | Criterion |
|---|-----------|
| A1 | `ImagePicker` shows Capture Photo + Upload From Device |
| A2 | `ImageAttachmentButton` is the only CTA pattern for image add/attach/upload on migrated surfaces |
| A3 | Existing MediaUpload consumers inherit dual acquisition without domain logic changes beyond import |
| A4 | Upload still uses `/api/media/*` + `media-private` |
| A5 | Replace / Remove / Preview flow unchanged in meaning |
| A6 | Desktop webcam fallback never dead-ends |
| A7 | No new Storage architecture |

---

## Slice B acceptance (vendor migration)

| # | Criterion |
|---|-----------|
| B1 | Vendor finish **photos** use ImageAttachmentButton + MediaService |
| B2 | No new ad-hoc image `<input>` in vendor-jobs for photos |
| B3 | Existing vendor job completion still works (no regression) |

---

## Explicit non-criteria for v1

- Multi-image gallery polish  
- OCR / AI analysis  
- Org logo / property gallery product features (need their own product Approve if new)

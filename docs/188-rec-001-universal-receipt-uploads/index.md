# REC-001 — Universal Receipt Uploads

**Status:** PASS — REC-001 UNIVERSAL RECEIPT UPLOADS IMPLEMENTED  
**Date:** 2026-08-24  
**Gate:** Owner-authorized implementation · Design → Document → Approve → Implement  
**Production deploy:** **NO** — in-repo implementation certification only  
**Implementation SHA:** `0ea03608b5cae567addb7b5adde5f65e1fe18043`  
**Related:** MEDIA-001 (`docs/73`, `docs/74`, ADR-023) · Product Constitution ADR-019  
**Production-live record:** [docs/230](../230-rec-001-production-receipt-uploads-certification/index.md) — this file remains the in-repo implementation certification only.  

---

## Chosen relationship (documented before implementation)

There is **no** standalone `expenses` table on this codebase. Inventing one would compete with existing finance records.

| Surface | Canonical parent | MEDIA-001 association |
|---------|------------------|------------------------|
| Property Manager / Complete vendor & property expenses | `financial_vendor_invoices` | `related_entity_type = vendor_invoice` + `attachment_category = receipt` |
| Facility Operations / Complete / PM work-order costs | `maintenance_work_orders` (existing `maintenance` entity) | `related_entity_type = maintenance` + `attachment_category = receipt` |
| Work-order photos / video | same work order | `related_entity_type = maintenance` + `attachment_category = evidence` (unchanged) |
| Tenant payment receipt **numbers** | `financial_receipts` | **Out of scope** — ledger receipt IDs, not files |

`financial_receipts` remains tenant payment confirmation metadata (docs/170). REC-001 does not store binaries there and does not create a second receipt table.

Work-order vendor invoices already support `work_order_id`. Receipts attach to the resulting vendor invoice when that record exists, and may also attach to the work order as **Financial receipt** without duplicating the invoice or moving money.

---

## Architecture used

```
Create/Edit expense or work order
        │
        ▼
ReceiptAttachmentField (Add Receipt / Take Photo / Choose File)
        │
        ▼
POST /api/shared/media/upload-intent  (authz on parent record)
        │  private bucket `media`
        ▼
Client PUT to short-lived signed upload URL
        │
        ▼
POST /api/shared/media/:id/confirm
        │
        ▼
Optional POST /api/shared/media attach to parent id
        │
        ▼
Detail: list + signed view/download + authorized soft-delete
```

Reuse only:

- Private bucket `media`
- `public.media_attachments`
- Signed upload / download
- Organization isolation and existing MEDIA RLS
- Soft-delete
- MIME / size validation (global evidence allowlist unchanged)
- Audit via `audit_events` (`media.receipt.uploaded` / `media.receipt.removed`) — no signed URLs or storage credentials logged

No second bucket, upload service, OCR, or AI extraction.

---

## Migration

**File:** `supabase/migrations/20260824120000_rec_001_receipt_attachments.sql`  
**Applied to Production:** **NO**

Additive:

1. `attachment_category text not null default 'evidence'` (`evidence` \| `receipt`)
2. `related_entity_type` check adds `vendor_invoice`
3. `file_type` check adds `document`
4. Storage bucket `media` allowlist adds `application/pdf` (application validation still rejects PDF for evidence uploads)
5. Receipt lookup index

**Rollback / compatibility:** Existing rows default to `evidence`. Dropping the column and restoring the prior check constraints reverses the additive change after no receipt rows remain. Do not apply to Production without a separate Owner Production gate.

---

## MEDIA-001 reuse

| Capability | Reuse |
|------------|--------|
| Private storage | Same `media` bucket |
| Metadata table | Same `media_attachments` |
| Signed URLs | Same minting after authz |
| Org isolation | Same RLS + org path prefix |
| Soft-delete | Same `status=deleted` + `deleted_at` |
| Evidence uploads | Unchanged MIME (JPG/PNG/HEIC/WebP/MP4/MOV) |
| Receipt uploads | Narrow PDF + images when `attachment_category=receipt` only |

---

## Supported file types

### Receipts

- JPG / JPEG, PNG, HEIC / HEIF, WebP
- PDF (`application/pdf`, `file_type=document`)
- Max size: 20 MB (MEDIA image/document limit — not the 100 MB video cap)

### Rejected

- Video on receipts
- Archives / executables / other MIME
- Evidence-path PDF (global MEDIA allowlist not loosened)

### Count

- Max 10 active (`pending` + `ready`) receipts per parent (or per uploader draft)

---

## Authorization

| Parent | Read | Write / remove |
|--------|------|----------------|
| `vendor_invoice` | `pm.finance:read` + `pm.financial_operations` | `pm.finance:vendor_invoice.review` |
| `maintenance` receipt | Existing MEDIA operations actor (`pm.maintenance:*` + FO/PM maintenance entitlements) | Same write actor |
| Conversation / tenant | Cannot reach vendor-invoice or work-order receipts via conversation fallback | Guessed IDs 404 |

Authorization follows the parent record. Knowing an attachment UUID is not sufficient. Client-supplied organization ID and uploader ID are ignored; server session values are used.

### Plan entitlements (tested independently)

| Plan | Vendor invoice receipts | Work-order receipts |
|------|-------------------------|---------------------|
| Property Manager | Yes (`pm.financial_operations`) | Yes (`pm.maintenance`) |
| Facility Operations | No (FO SKU excluded from finance) | Yes (`facility.operations`) |
| Complete (`both`) | Yes | Yes |

Complete is **not** required. No receipt add-on.

---

## UI / UX

Canopy labels: **Add Receipt**, **Take Photo**, **Choose File**, **Receipts & Attachments**, **Open Receipt**, **Remove Receipt**.  
Empty state: **No receipts attached**. Receipts are optional.  
Image preview preserves aspect ratio and opens a larger view. PDF uses **Open Receipt** (signed, no custom renderer).  
No “signed URL”, MIME, bucket, or UUID jargon in the UI.

Surfaces:

- PM Collections — Submit vendor invoice + existing invoice **Receipts** panel
- FO operations create + detail (evidence vs financial receipt)
- PM Maintenance Command Center detail (existing work orders)

---

## Certification record

| # | Item | Result |
|---|------|--------|
| 1 | Implementation SHA | `0ea03608b5cae567addb7b5adde5f65e1fe18043` |
| 2 | Changed files | See commit `0ea03608` (19 files) + this package |
| 3 | Architecture | MEDIA-001 polymorphic attach; parents above |
| 4 | Migration | `20260824120000_rec_001_receipt_attachments.sql` — in-repo only |
| 5 | MEDIA-001 reuse | Same bucket, table, signed URLs, RLS, soft-delete |
| 6 | Supported file types | JPG, PNG, HEIC, WebP, PDF · 20 MB · reject zip/exe/video-on-receipt |
| 7 | PM result | Vendor invoice + PM work-order receipt surfaces wired; finance plane tested |
| 8 | FO result | Work-order receipt surfaces wired; FO has no finance entitlement (independent) |
| 9 | Complete result | Both planes entitled when scope is `both` (independent of PM-only / FO-only) |
| 10 | Multiple-receipt result | Cap 10; UI allows more than one; HEIC+WebP service test |
| 11 | Mobile capture result | **Implemented** via browser `capture` + photo library / file picker. Not exercised on physical iOS/Android in this environment (P2 device QA). |
| 12 | PDF result | Narrow receipt allowlist; evidence PDF still rejected; Open Receipt |
| 13 | Cross-org result | Signed download rejects foreign org prefix; missing invoice 404 |
| 14 | IDOR result | Parent lookup org-scoped; conversation fallback cannot open non-conversation media; UUID guess → 404 |
| 15 | Soft-delete result | Uploader/manager soft-delete; deleted rows excluded from ready lists |
| 16 | Finance regression | No amount, Stripe, Checkout, Connect, AutoPay, FIN-OPS, M5, or July changes. Attach/delete does not move money. Shared finance tests passed. |
| 17 | MEDIA regression | Evidence MIME/size tests still reject PDF; existing MEDIA service/route tests passed |
| 18 | Tests | `@mpa/shared` 54 files / 356 tests pass · `@mpa/web` 115 files / 551 tests pass |
| 19 | Typecheck | `@mpa/shared` pass · `@mpa/web` pass |
| 20 | Lint | eslint on changed files — pass |
| 21 | Build | `pnpm --filter @mpa/web build` — pass (Next.js 16.2.10) |
| 22 | P0/P1/P2 remaining | P2: physical iOS/Android capture QA; Production migration apply (Owner gate). P1 none for in-repo scope. |
| 23 | Production deployment | **Not deployed.** Migration **not applied** to Production. |
| 24 | Final verdict | **PASS — REC-001 UNIVERSAL RECEIPT UPLOADS IMPLEMENTED** |

---

## Security / SEC-001

REC-001 does not modify Auth configuration, password policy, MFA, leaked-password protection, or other SEC-001 controls. MEDIA MIME/size, signed URL org-prefix, and RLS remain in force. Service-role storage minting is unchanged.

---

## Explicitly not done (STOP)

- OCR / AI extraction / auto vendor or amount
- Pricing, plan SKUs, Stripe, Checkout, Connect, AutoPay
- M5, July unfreeze, FIN-OPS write-guard lift
- SignWell expansion
- Production apply or deploy
- Second storage architecture

---

## Commands run

```bash
pnpm --filter @mpa/shared typecheck
pnpm --filter @mpa/web typecheck
pnpm --filter @mpa/shared test
pnpm --filter @mpa/web test
# lint: eslint on changed web + shared files
pnpm --filter @mpa/web build
```

---

## Owner return

Control returns to the Owner. REC-001 is implemented and certified in-repo. Production migration/deploy requires a separate Owner gate.

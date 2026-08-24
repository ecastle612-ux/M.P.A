# 230 — REC-001 Production Receipt Uploads

**Title:** REC-001 UNIVERSAL RECEIPT UPLOADS — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — REC-001 PRODUCTION RECEIPT UPLOADS CERTIFIED**  
**Date:** 2026-08-24  
**Authority:** Owner authorization — controlled Production release of REC-001 Universal Receipt Uploads for existing eligible users across Property Manager, Facility Operations, and Complete. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/188](../188-rec-001-universal-receipt-uploads/index.md)  
**Product boundary:** Receipt files on existing MEDIA-001 attachments only. No OCR. No AI extraction. No Stripe / Checkout / Connect / AutoPay / FIN-OPS / pricing change. July freeze remains ON. M5 remains unauthorized.

This package does **not** start another feature, enable leaked-password protection, change operator MFA, expand SignWell, or unfreeze July.

---

## Current verdict

**PASS — REC-001 PRODUCTION RECEIPT UPLOADS CERTIFIED**

REC-001 is Production-live on `www.my-property-assistant.com` at SHA `d096b22d`. Eligible users can attach, list, open, and soft-delete receipt files on vendor invoices (`vendor_invoice` + `receipt`) and work orders (`maintenance` + `receipt`) without moving money.

---

## 1. Certification path

`docs/230-rec-001-production-receipt-uploads-certification/index.md`

docs/188 remains the in-repo implementation PASS and is not rewritten as Production-live.

## 2. Original REC-001 implementation SHA

`0ea03608b5cae567addb7b5adde5f65e1fe18043`

That SHA was **not** deployed. It was built on stale `origin/main` (`b30567e3`) and would have regressed certified Production work (SEC-001, SignWell, FO-EFF `facility_request_intake`).

## 3. Final release SHA

`d096b22dbb5c0f980460428739047648c97fe2e5` (`d096b22d`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `589acd591836fc240817c62c892ed17272f081bd` | SEC-001 Stage 2 Production baseline |
| REC-001 cherry-pick | `0ea03608` onto that baseline | Receipt uploads |
| RC compose | `b0d25ce85c54c420bb5068be633ab0a8d61fbe26` | Keep `facility_request_intake` + Production `userId: string \| null` |
| Soft-delete persist | `d096b22d` | Authorized delete through service-role writer (SELECT RLS hides `deleted_at`) |

Branch: `cursor/rec-001-production-release-6821`.

## 4. Production deployment

| Item | Value |
|------|--------|
| Final deployment ID | `dpl_2BT8G3N5hUaxtLQ6APSzuT59ooJW` |
| State | READY / Production alias assigned |
| Alias | `www.my-property-assistant.com` |
| Homepage | HTTP 200; HTML references `dpl_2BT8G3N5hUaxtLQ6APSzuT59ooJW` |
| Prior RC deploy (pre soft-delete fix) | `dpl_BSdh8GARrymjBdvtmMCr1rvBR2Xj` @ `b0d25ce8` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`. Pricing / plan subscriptions not modified.

## 5. Migration result

Applied **only** `20260824120000_rec_001_receipt_attachments.sql` via MCP `apply_migration` name `rec_001_receipt_attachments`.

Recorded stamp: **`20260824025311`**.

Additive: `attachment_category` (`evidence` \| `receipt`, default `evidence`); `related_entity_type` adds `vendor_invoice` while keeping `facility_request_intake`; `file_type` adds `document`; bucket `media` allowlist adds `application/pdf`. No second bucket. No receipt table. No `financial_receipts` mutation.

## 6. MEDIA-001 preservation

After apply, existing 14 MEDIA rows remained intact (all `evidence`). `facility_request_intake` (1 row) remains valid. Bucket `media` still private. After live UAT receipts:

| Check | Result |
|-------|--------|
| Intake attachments | 1 live |
| Evidence live | 16 (original 14 + 2 synthetic UAT evidence JPEGs on Furniture Repair) |
| Receipts live | 6 (4 vendor-invoice + 2 work-order) |
| Receipts soft-deleted | 11 (1 PNG proof + 10 cap-probe pending rows) |

No existing evidence row was reclassified or hard-deleted.

## 7. PM vendor-invoice receipt

Synthetic UAT invoice `REC-001-UAT-812199` on Clinic Demo (`vendor_invoice` + `receipt`). API: create invoice → Add Receipt → JPG ready → list → signed open. UI: Financial Operations → Vendor invoices → receipts modal with Preview / Open Receipt / Remove Receipt. Amount remained **12.34**. Existing customer invoice `db54b93a-…` remained **125.50 / paid**.

## 8. FO work-order receipt

Furniture Repair `dc81b996-…` (`FR-2026-00003`): FO-authorized Clinic staff attached `maintenance` + `receipt` (PNG). Existing work-evidence photos remain `maintenance` + `evidence`. UI shows separate **Work evidence** and **Receipts & Attachments** sections.

## 9. PM maintenance receipt

API: Complete-org PM user attached `maintenance` + `receipt` (JPEG) to Furniture Repair. UI: `/pm/maintenance` exposes the same **Add Receipt** field (verified on ADR-033 UAT residential WO). ReceiptAttachmentField is not Complete-SKU gated. `entitlementsForSku("mpa_property_manager")` includes `pm.maintenance` and `pm.financial_operations`.

Dedicated Property Demo (`uat.pm.property.demo@…`) and complimentary FO passwords were **not** present in this environment, so a PM-only SKU login was not repeated live. That is recorded as P1 residual, not a product Complete requirement.

## 10. Complete-plan result

UAT Clinic Demo SKU `mpa_complete_platform` inherited both workflows: vendor-invoice receipts and work-order receipts. No Complete-only receipt behavior.

## 11. JPG / PNG / HEIC / WebP

Live upload-intent + PUT + confirm on the UAT invoice: JPEG, PNG, WebP, HEIC all **201/200/ready**.

## 12. PDF receipt

`application/pdf` receipt on `vendor_invoice` confirmed ready. UI lists `rec001-pm.pdf` with Open Receipt.

## 13. PDF evidence rejection

`maintenance` + `evidence` + `application/pdf` → **400** (MEDIA-001 evidence allowlist unchanged). Confirmed for both Complete PM and FO-scoped Clinic staff.

## 14. 20 MB limit

Upload-intent `fileSize = 20 * 1024 * 1024 + 1` → **400** maximum-size.

## 15. 10-receipt limit

Ten pending receipt intents on synthetic CAP invoice; eleventh → **400** `You can attach up to 10 receipts.` The ten pending rows were later authorized-soft-deleted.

## 16. Preview / open / download

Signed GET `/api/shared/media/:id/url` → 200, `expiresIn=900`, HTTPS tokenized URL (not logged). UI **Open Receipt** opened the JPG. Soft-deleted PNG URL → **404**.

## 17. Existing-record receipt

Receipts attached to existing Furniture Repair work order. New synthetic vendor invoices only; the paid customer invoice was not opened or changed.

## 18. Multiple-receipt result

UAT invoice held JPG + PNG + PDF + WebP + HEIC concurrently (PNG later removed). Work order holds JPEG + PNG receipts plus evidence photos.

## 19. Soft-delete

First Production build (`b0d25ce8` / `a4cbbd92`) failed authorized DELETE: SELECT RLS `deleted_at IS NULL` rejects member UPDATE that sets `deleted_at`. Fix in `d096b22d`: user-scoped load + uploader/manager gate, persist via existing service-role writer.

After that deploy: DELETE PNG **200**; list hides it; signed URL **404**; parent invoice amount still 12.34.

## 20. Cross-org

Clinic staff cannot attach a receipt to Property Demo work order `ba38f82f-…` → **404**. Wrong-org cookie (complimentary FO org id) → **403**. Tenant on Property Demo cannot upload or sign Clinic receipts (**403** / **404**).

## 21. IDOR

Random UUID signed-URL → **404**. Attachment UUID alone does not authorize. Server derives organization from session + `mpa_active_organization_id` hint; cookie is not authority for foreign parents.

## 22. Signed / private URL

Download URLs are short-lived signed HTTPS links (`expiresIn=900`). They are not written to this certification. Bucket `media` remains private.

## 23. Finance / money-movement

| Ledger | Before live receipts | After |
|--------|----------------------|-------|
| `financial_receipts` | 4 | **4** |
| `financial_ledger_entries` | 50 | **50** |
| `financial_payments` | 14 | **14** |
| Existing invoice `db54b93a-…` | 125.50 paid | **125.50 paid** |
| UAT invoice `7ead4dfc-…` | 12.34 submitted | **12.34 submitted** |
| July freeze | ON | **ON** |

No Checkout, Connect, AutoPay, or FIN-OPS execution. Two synthetic submitted UAT invoices were created (12.34 and 1.01 cap probe) and were not reviewed, scheduled, or marked paid.

## 24. `financial_receipts` regression

Table was not written. Count remains 4. Tenant payment-number concept is unchanged.

## 25. SEC-001 regression

| Check | Result |
|-------|--------|
| Stamp `20260818210000` / `docs_226_sec_001_security_hardening` | Present |
| SignWell RLS | `signwell_webhook_events_operator_select` SELECT only |
| Durable rate limiter | `platform_rate_limit_buckets` RLS on; authenticated SELECT/INSERT **false** |
| WAF Rules 1–4 | Active (`SEC-001 RULE 1` … `RULE 4`); firewallEnabled |
| Password minimum | Management API `password_min_length` **12** |
| Leaked-password (HIBP) | Still **disabled** — not enabled from this package |
| Operator MFA | Not enrolled/changed |

## 26. SignWell regression

Exact callback remains `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` (one hook). Unsigned POST → **401**. `signwell_webhook_events` count still **8**. No new SignWell document.

## 27. Stripe regression

No Stripe SaaS / Checkout / Connect / AutoPay / pricing mutation. `saas_checkout_sessions` 0. `saas_stripe_webhook_events` 0. Pre-existing web test `tenant-portal-billing-copy.test.ts` still expects `stripe_payment_execution_enabled` copy that Production billing does not use — **not** changed (would be a Stripe copy edit).

## 28. July / M5

`finance_july_freeze_enabled() = true`. `isFinanceM5Authorized()` remains `false` in `apps/web/src/lib/finance/m5-hard-stop.ts`.

## 29. Tests

RC (`b0d25ce8`): shared 70 files / 482 PASS; focused REC-001 / MEDIA / finance / FO / entitlement web 41/220 and shared 10/60 PASS. Full web suite still has the pre-existing billing-copy failure (Stripe copy; out of scope).

Post-fix: `apps/web/src/lib/media/media-service.test.ts` 8/8 PASS.

## 30. Typecheck

`pnpm --filter @mpa/shared typecheck` PASS (RC). `pnpm --filter @mpa/web typecheck` PASS (RC and after soft-delete fix).

## 31. Lint

ESLint on changed REC-001 / MEDIA web + shared files PASS on the RC.

## 32. Build

`pnpm --filter @mpa/web build` PASS on the RC (Next 16.2.11). Subsequent Production deploys of `a4cbbd92` and `d096b22d` reached READY.

## 33. Production observation

Direct live API + UI verification is the primary evidence. Homepage 200 on the intended deployment. Media upload-intent / confirm / list / url / DELETE succeeded on UAT Clinic. Vercel per-deployment event log API was not available (`not_found`); absence of that log is not treated as proof.

## 34. Exact Production mutations

1. Applied migration `rec_001_receipt_attachments` (stamp `20260824025311`).
2. Deployed RC then the soft-delete persist fix to Production (`dpl_BSdh8GARrymjBdvtmMCr1rvBR2Xj`, `dpl_3qceWdsFCdLePHdkdKsutcpapsgq`, `dpl_2BT8G3N5hUaxtLQ6APSzuT59ooJW`).
3. Created two synthetic Clinic UAT vendor invoices and attached UAT receipt/evidence files; soft-deleted the PNG proof and ten cap-probe pending rows.
4. Did **not** modify pricing, Stripe, SignWell documents, SEC-001 Auth settings, or the paid customer invoice.

## 35. P0 remaining

None for this package.

## 36. P1 remaining

1. Dedicated Property Demo / complimentary FO UAT passwords were not in this agent environment, so SKU-isolated live login (PM-only org, FO-only org) was not repeated. Entitlement tests + ungated UI remain the SKU proof.
2. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard work). Not enabled here.
3. Pre-existing `@mpa/web` billing-copy test vs Production `gate.executionEnabled` copy.

## 37. P2 deferred

OCR, AI extraction, receipt-to-ledger posting, second bucket, receipt table, formulas, DOCX, M5, July unfreeze, SignWell expansion.

## 38. Final verdict

**PASS — REC-001 PRODUCTION RECEIPT UPLOADS CERTIFIED**

**STOP.** Return control to the Owner.

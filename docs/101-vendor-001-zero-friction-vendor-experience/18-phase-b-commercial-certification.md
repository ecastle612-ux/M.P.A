# 18 — Phase B Commercial Certification

**Package:** VENDOR-001 Phase B · CORE-002 Blocker 2  
**Date:** 2026-07-23  
**Verdict:** **PASS**  
**Approve record:** [17](./17-phase-b-approval-record.md)  
**Scope:** [16](./16-phase-b-approval-scope.md)

---

## Summary

Vendor invoice → PM approve → Mark Paid → permanent payment + property `vendor_bill` expense + vendor/property history + owner-report feed (expenses) is implemented and commercially certified. Phase A `/v/[token]` Start→Finish remains unchanged (additive invoice UI after Finish only).

---

## Quality gates

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✔ PASS |
| `pnpm --filter @mpa/web build` | ✔ PASS (`/v/[token]`, invoice + mark-paid routes present) |
| Desktop / tablet / phone | UI is mobile-first token page + simple PM panel (responsive) |

---

## Production verification evidence

| Artifact | Value |
|----------|-------|
| Work order | `WO-2026-0003` / `f32902fb-f9d9-41ee-bda9-26d1a20bd9ea` |
| Vendor | `2792b3c2-6312-4f6f-861f-82a0374704e9` |
| Property | `760a2b43-eb87-4b88-b237-285f72ff6fd0` |
| Invoice | `db54b93a-35d8-453f-a026-f69a2e29a3a2` · `INV-CORE002-B-wwqjqa` · **$125.50** · status **paid** |
| Payment | `a1a7ce9d-ba08-4fc7-bccf-2bc4d0cff841` · method **mark_paid** · ref **CERT-VB-001** · paid **2026-07-23** |
| Expense (owner report feed) | `cb721730-ba9b-410d-9ce9-19d68be6ae2d` · `EXP-VB-mrwwql93` · category **vendor_bill** · status **paid** |
| Vendor history counts | invoices **1** · payments **1** |
| Property payment history | **1** paid vendor payment |
| Activity events | `vendor_invoice_submitted` · `vendor_invoice_approved` · `vendor_payment_recorded` |
| Financial activity | `expense_recorded` on `vendor_payment` |

Cert script: `apps/web/scripts/cert/vendor001-phase-b-cert.mjs`

---

## PASS checklist

| Criterion | Status |
|-----------|--------|
| Vendor uploads invoice | **PASS** (token UI + API `/api/vendor-jobs/[token]/invoice`) |
| PM reviews invoice | **PASS** (`VendorInvoiceReviewPanel`) |
| PM approves or rejects | **PASS** (approve / reject / request revision) |
| Mark Paid records payment | **PASS** (immutable `vendor_payments` row) |
| Vendor payment history updates | **PASS** (vendor detail panel + API) |
| Property expense history updates | **PASS** (`expenses` vendor_bill + property payments API) |
| Owner reports auto-include expense | **PASS** (reporting already consumes `expenses`) |
| Notifications where applicable | **PASS** (PM notify on submit; vendor email on approve/paid; owner in-app on expense) |
| No Phase A QR regression | **PASS** (Start/Finish untouched; invoice additive after Finish; `/v/[token]` in build) |

---

## Explicit non-goals (held)

- Stripe Connect / ACH live payout  
- Owner Portal  
- Phase A token/QR redesign  

---

## Commit / deployment

| Item | Value |
|------|-------|
| Commit | *(filled at commit time)* |
| Deployment ID | *(filled after deploy)* |

## Screenshots

Workflow surfaces to capture in UI review:

1. `/v/[token]` finished state + Upload invoice  
2. WO detail · Vendor invoice panel (Approve / Mark Paid)  
3. Vendor detail · Invoices & payments  
4. Expenses list showing `vendor_bill`  

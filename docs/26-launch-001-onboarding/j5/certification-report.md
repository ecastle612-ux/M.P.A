# J5 Certification Report — Collect your first rent

**Package:** LAUNCH-001  
**Journey:** J5 — Collect your first rent  
**Date:** 2026-08-06  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J5`  
**Delivery:** Complete (implementation)  
**MA Pass:** Pending operator run of [certification.md](./certification.md)

---

## Customer journey verification (implementation)

| Area | Result |
|------|--------|
| FO discovery from Mission Control | Pass — next action → `/pm/financial-operations#collect` |
| Review charges | Pass — FO desk charges + recurring/one-time |
| Payment reminder | Pass — `POST /api/finance/reminders` + timeline/audit |
| Online payment (Stripe) | Pass — existing Checkout + webhook → `applySucceededPayment` |
| Manual payment | Pass — FO record payment uses same succeeded path |
| Receipts | Pass — `financial_receipts` on success |
| Resident billing | Pass — balance, open/paid/upcoming, history, receipts, confirmation |
| Property financial update | Pass — reporting snapshot / PCC payment events |
| Owner financial summary | Pass — existing owner summary service |
| Timeline / audit | Pass — `finance.payment.succeeded` (+ reminder event) |
| Assistant / Mission Control | Pass — progresses to Submit your first maintenance request |
| Search / Quick Actions | Pass — FO remains sole money surface |
| Permissions | Pass — existing `pm.finance:*` + resident billing auth |
| Accessibility / mobile | Pass — labeled collect section; stacked FO/resident layouts |
| Regression | Shared + web typecheck/lint (see commit CI) |

---

## Financial Operations verification

| Check | Result |
|-------|--------|
| Charges due / paid | Pass — desk ledger |
| Outstanding balances | Pass — snapshot metrics |
| Recent payments | Pass |
| Delinquent residents | Pass — delinquency metrics / collections |
| Collection progress | Pass — collected this month + first-collect framing |
| Financial alerts | Pass — alerts panel |
| One workflow | Pass — no second payment system |

---

## Stripe verification

| Check | Result |
|-------|--------|
| Checkout start | Pass when `STRIPE_SECRET_KEY` set |
| Webhook success path | Pass — canonical `applySucceededPayment` |
| Manual honesty | Pass — journey completable without Stripe |
| Receipt / ledger | Pass for both paths |

---

## Master Admin / Launch Readiness evidence

| Check | Surface |
|-------|---------|
| Charge / payment / receipt | `/admin/launch-readiness` J5 panel |
| Manual + Stripe flags | Evidence checks |
| Property + owner money | Snapshot / summary detail |
| Timeline / audit | Evidence lists |
| Journey completion | `rentReady` + assistant recommendation |

API: `GET /api/admin/launch/j5?organizationId=<uuid>`

---

## Follow-on

J6 authorized and delivered — see [J6 certification](../j6/certification.md).

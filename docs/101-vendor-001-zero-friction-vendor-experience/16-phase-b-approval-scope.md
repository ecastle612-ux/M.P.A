# 16 — Phase B Approval Scope (Vendor Payments)

**Package:** VENDOR-001  
**CORE-002 blocker:** #2 Vendor Payments  
**Status:** ✅ **Approved** — see [17 — Phase B Approval Record](./17-phase-b-approval-record.md)  
 
**Prerequisite:** Phase A commercial certification **PASS** ([15](./15-phase-a-commercial-certification.md))  
**Date:** 2026-07-22

---

## Gate

```
Design → Document → Approve → Implement
```

| Item | State |
|------|--------|
| Phase A | Certified **PASS** |
| Phase B docs (this file + linked 04/05/06/07/08) | Documented from commercial brief |
| Phase B **Approve** | **Missing** — required before any schema/UI/API code |
| Phase A QR / WO redesign | **Forbidden** — build on certified foundation only |

**Chat brief alone is not approval.** Reply with the exact Approve block below (or reject / amend).

---

## Binding constraints

1. Do **not** modify the certified Phase A QR / token Start→Finish workflow except additive hooks (e.g. post-Finish invoice upload on the same token).  
2. Do **not** redesign Work Orders.  
3. ACH via Stripe Connect = **future** (record method `ach` / “future Connect”; Mark Paid is the live path).  
4. Owner Portal is **out of scope** until this Phase B receives commercial certification.  
5. No raw bank/PAN storage.

---

## Objective workflow (approved intent)

```
Property Manager
  → Vendor completes work (Phase A Finish)
  → Vendor uploads invoice
  → Property Manager reviews (Approve | Reject | Request Revision)
  → Pay Vendor (deferred Connect) OR Mark Paid
  → Payment permanently recorded
  → Property financial history updated
  → Owner reporting updated
```

---

## Step 1 — Vendor invoice (after Finish Job)

| Capability | Required |
|------------|----------|
| Upload PDF | ✔ |
| Invoice number | Optional |
| Invoice amount | ✔ |
| Notes | Optional |
| Multiple photos | ✔ |
| Status after submit | **Awaiting Approval** |

Surface: same public token job page (additive after Finish) and/or PM-visible invoice queue. Phase A Finish semantics unchanged.

---

## Step 2 — Property Manager review

Display: Vendor, Work Order, Invoice (PDF), Amount, Photos, Notes.

| Action | Effect |
|--------|--------|
| **Approve** | Invoice approved → eligible for Mark Paid / Pay |
| **Reject** | Closed rejected; vendor notified |
| **Request Revision** | Returns to vendor for re-upload; status revision requested |

---

## Step 3 — Payment

| Method | Phase B |
|--------|---------|
| Mark Paid | **Required** (live) |
| Check | ✔ recordable |
| Other | ✔ recordable |
| ACH | Record preference / method only — Connect payout **future** |
| Pay Vendor (provider) | Stub / future — not required for PASS |

Record (immutable after `paid`): Amount, Date, Method, Reference Number, Status, WO, Property, Vendor, Actor.

---

## Step 4 — Vendor history

Every vendor automatically has:

- Payment history  
- Invoice history  
- Outstanding invoices  
- Paid invoices  

---

## Step 5 — Property history

On paid (and approved expense path as designed):

- Property expenses  
- Maintenance costs  
- Vendor payment history  

Prefer existing `expenses` (`vendor_id`, `work_order_id`) + financial activity — no parallel shadow ledger.

---

## Step 6 — Owner reports

Automatically include (no manual entry): Vendor, Invoice, Expense, Paid date, Payment method.

Pulls from the same payment/expense feed. Full owner **portal** UI remains a later blocker; **report data inclusion** is in Phase B PASS.

---

## Step 7 — Notifications

| Audience | Events |
|----------|--------|
| Vendor | Invoice approved · Vendor paid |
| Property Manager | Invoice submitted |
| Owner | Expense reflected on next statement (in-app / statement feed; not a new portal) |

---

## Explicit non-goals (this Approve)

- Stripe Connect live payouts (Phase C)  
- Authenticated vendor dashboard redesign beyond history lists needed for PASS  
- Changing Phase A token mint/rotate/Start/Finish  
- Owner Portal product  

---

## Quality / certification (for Implement after Approve)

- `pnpm typecheck`  
- `pnpm --filter @mpa/web build`  
- Desktop / Tablet / Phone verification  
- Commercial cert report + screenshots + commit + deploy  

### PASS criteria

- [ ] Vendor uploads invoice  
- [ ] PM approves (and reject / request revision work)  
- [ ] Mark Paid (or Pay) recorded  
- [ ] Property financial history updates  
- [ ] Owner reports reflect expense automatically  
- [ ] Vendor payment history complete  
- [ ] Notifications sent  
- [ ] Phase A QR workflow unaffected  

---

## Operator Approve reply (required)

Reply exactly:

```
Approve VENDOR-001 Phase B: YES
Scope: docs/101-vendor-001-zero-friction-vendor-experience/16-phase-b-approval-scope.md
Constraints: no Phase A QR changes; Mark Paid required; Connect ACH future; Owner Portal deferred
```

Or:

```
Reject VENDOR-001 Phase B: <reason>
```

Or list amendments; material changes restart Document → Approve.

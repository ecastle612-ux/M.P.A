# 00 — Purpose and Scope

**Package:** PAY-001 — Settlement Funding Foundation  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))  
**Sections:** Purpose · Scope · Non-goals · Success · Actors

---

## Purpose

Establish the **Settlement Funding Foundation**: resident rent payments fund the **organization settlement Stripe Connect Express** account through **destination charge routing**, with durable mapping, refund/dispute handling, ledger compatibility, reconciliation, money-safety controls, and kill switches.

PAY-001 exists so FIN-003 Phase C (owner transfers) can later debit a **real** settlement balance without M.P.A. holding rent on the platform — satisfying [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md).

### Binding custody purpose

M.P.A. orchestrates checkout and bookkeeping. **Stripe Connect holds settlement funds.** The platform retains only disclosed **application/platform fees**. PAY-001 must not invent a platform rent float or sweep model.

---

## In scope

| Area | Include |
|------|---------|
| Destination charge routing | Platform Checkout / PaymentIntent + `transfer_data.destination` + `application_fee_amount` → org settlement Express |
| Organization settlement readiness | Runtime fail closed when org Express not destination-ready (S1–S8) |
| Settlement balance SoT | Stripe available balance on org Express as transferable cash SoT |
| Charge → settlement mapping | Durable link payment/attempt → settlement `acct_…` + org |
| Refund lifecycle | Full/partial refunds against destination charges |
| Dispute lifecycle | Chargebacks/disputes affecting settlement |
| Ledger integration | Emit/consume facts needed for settlement-aware ops (fees, nets, reverses) |
| Operational reconciliation | Runbooks: funding mismatches, mapping gaps, Stripe retrieve |
| Money safety | Fail closed, audit, verification checklist |
| Kill switches | Independent enablement of destination routing vs FIN-003 transfers |

---

## Out of scope (explicit)

| Area | Disposition |
|------|-------------|
| Owner payouts | FIN-003 |
| Allocation engine / ownership splits | FIN-003 |
| Transfer execution / Connect transfers to owners | FIN-003 Phase C |
| Payout scheduling / PayoutRun | FIN-003 |
| Owner Express onboarding UX | FIN-003 (already Phase A/B) |
| Creating org settlement accounts (greenfield) | FIN-003 Phase A — PAY-001 **consumes** them |
| SaaS subscriptions | BILL-001 |
| Full GL / trust accounting | ADR-010 |
| Destination-to-owner shortcut | Deferred (FIN-003 D13) |
| Instant payouts | Out |

---

## Success definition

1. New resident payments (when funding enabled) land on **org settlement Express**, not as distributable rent on the platform balance.  
2. Platform receives **application fee only** (disclosed).  
3. Every routed payment is **mapped** to settlement account + org.  
4. Refunds/disputes have defined, fail-closed behavior.  
5. Ledger facts support settlement-aware reporting and future FIN-003 inputs.  
6. Kill switches can disable destination routing without enabling owner transfers.  
7. PAY-001 acceptance criteria PASS — unblocking **eligibility** for FIN-003 Phase C Authorize (does not itself Authorize Phase C).

---

## Actors

| Actor | Role in PAY-001 |
|-------|-----------------|
| Resident | Pays rent via existing API-005 checkout / AutoPay |
| Property manager / org admin | Ensures org settlement Connect is ready; receives ops alerts |
| M.P.A. platform | Application fees; PaymentProvider orchestration |
| Stripe | Charge routing, Connect balances, refunds/disputes |
| Finance / Support ops | Reconciliation using PAY-001 runbooks |
| FIN-003 (downstream) | Later consumes funded settlement — **not** in this package |

---

## Relationship to FIN-003

```
PAY-001 (this package)     →  funds org settlement
FIN-003 Phase A/B (done)   →  org + owner Connect accounts / eligibility
FIN-003 Phase C (locked)   →  transfers settlement → owners
```

PAY-001 **must** be Approved and Verified before FIN-003 Phase C authorization.

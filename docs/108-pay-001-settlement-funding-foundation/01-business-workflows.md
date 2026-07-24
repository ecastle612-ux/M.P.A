# 01 — Business Workflows

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))

---

## Workflow A — Org settlement ready for funding

```
PM opens Settings / payouts (existing FIN-003 surface)
  → Org settlement Connect onboarding (FIN-003 Phase A/B)
  → Stripe Account Link / requirements remediation
  → Org settlement destination-ready
  → PAY-001 may allow destination-routed charges for that org
```

| Step | System |
|------|--------|
| Create/link org Express | FIN-003 (existing) |
| Gate “ready for destination charges” | **PAY-001** |
| Enable funding flag for org/env | **PAY-001** kill switch |

---

## Workflow B — Resident pays rent (destination funded)

```
Resident initiates payment (API-005)
  → Billing resolves org settlement Express (PAY-001)
  → If destination-enrolled and (not ready or funding off) → hard block / clear error (no platform fallback)
  → PaymentProvider creates Checkout/PI with transfer_data.destination + application_fee_amount
  → Resident completes payment
  → Payments webhook settles attempt
  → Ledger updated; charge→settlement mapping persisted
  → Funds available on Org Settlement Express (Stripe)
```

**Honesty:** “Paid” in the resident ledger means payment succeeded. It does **not** mean owner was paid (FIN-003).

---

## Workflow C — AutoPay / scheduled resident collection

Same routing rules as Workflow B. AutoPay must not bypass settlement readiness or kill switches.

---

## Workflow D — Refund

```
PM or system initiates refund (existing API-005 patterns + PAY-001 rules)
  → Refund against original destination charge
  → Stripe adjusts org settlement / platform fee per Stripe rules
  → Ledger posts reversal / refund facts
  → Mapping retained for audit
  → Future FIN-003 allocation inputs must see reversed amounts (contract)
```

---

## Workflow E — Dispute / chargeback

```
Stripe dispute opened on destination charge
  → Payments/Connect signals ingested on correct rails
  → Org/platform liability handled per Stripe Connect dispute rules
  → Ledger marks disputed / lost / won
  → Ops runbook; block treating disputed funds as “safe settlement corpus”
```

---

## Workflow F — Ops reconciliation

```
Ops suspects funding mismatch
  → Lookup payment → settlement account (P4 mapping)
  → Retrieve Stripe charge + balance transactions
  → Compare ledger vs Stripe
  → Never invent settlement credit in M.P.A. DB without Stripe evidence
```

---

## Non-workflows (forbidden / deferred)

| Item | Why |
|------|-----|
| Transfer to owners | FIN-003 Phase C |
| Allocate ownership % | FIN-003 |
| Sweep platform balance → settlement as primary model | Rejected (ADR-023 / FIN-003 §31) |
| Pay owners from platform balance | Forbidden |

# 05 — Refunds and Disputes

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))

---

## Principles

1. Reversals follow **Stripe Connect destination-charge** economics — not a platform wallet fiction.  
2. Ledger must reflect reversals **before** any future FIN-003 allocation treats funds as distributable.  
3. Fail closed when refund/dispute/ACH-return state is unknown.  
4. Preserve charge→settlement mapping forever for audit.  
5. No owner compensating transfers in this package (FIN-003 D9 later).  
6. **Authoritative ingest** for charge refunds, disputes, and ACH returns on the rent rail is **`/api/webhooks/payments/[provider]`** — not the Connect account webhook rail.

---

## Refund lifecycle

```
Refund requested (PM/system)
  → Load mapping; confirm funding_mode + original PI/charge
  → Provider refund API against original destination charge/PI
  → Payments webhook / retrieve confirms refund
  → Ledger posts refund / fee reversal facts
  → Org Express available balance decreases per Stripe
  → Audit event
```

| Case | PAY-001 rule |
|------|----------------|
| Full refund before any FIN-003 transfer | Standard; books + Stripe converge |
| Partial refund | Proportional books; mapping unchanged |
| Refund while funding kill switch off | **Allowed** for historical destination charges |
| Legacy platform charge refund | Use legacy refund path; still never marks funds as Express corpus |
| **Insufficient org Express available balance** | Refund create **fails**; surface clear error; do **not** invent platform float to cover; ops runbook: fund settlement / wait available / partial if product allows |
| Refund after FIN-003 paid owner | See [§ FIN-003 handoff contract](#fin-003-handoff-contract-eventsfields-only) |

---

## ACH return lifecycle

ACH (and similar delayed bank methods) are not card disputes.

```
ACH payment succeeded (may still be pending → available)
  → Later ACH return / failure signal on payments rail
  → Mark attempt returned/failed per provider mapping
  → Ledger posts reversal (not “paid”)
  → Exclude from safe collected corpus for future FIN-003 inputs
  → Audit + optional PM notify
```

| Rule | Binding |
|------|---------|
| Pending ≠ available | Stripe **pending** balance is **not** transferable cash ([03](./03-payment-routing.md)) |
| Return after “succeeded” in UI | Honesty: resident/ledger must show return; do not leave “paid” without reversal |
| Acceptance | ACH return path must be verified for PAY-001 PASS ([07](./07-acceptance-criteria.md) A16) |

---

## Dispute lifecycle

```
Dispute opened (Stripe) on destination charge
  → Ingest on **payments** webhook rail (authoritative)
  → Mark attempt/charge disputed
  → Ledger: dispute hold
  → Notify PM ops (optional Notification Service)
  → Outcome won/lost → finalize ledger
  → Funds at risk ≠ safe settlement corpus
```

| Case | Rule |
|------|------|
| Dispute open | Exclude from “safe collected for distribution” in future FIN-003 inputs |
| Dispute lost | Permanent reversal facts; fee liability per below |
| Dispute won | Release hold per Stripe + ledger |

### Dispute fee liability (design default for locked destination charges)

Under the locked model (platform PI + `transfer_data.destination` + `application_fee_amount`):

| Item | Design default |
|------|----------------|
| Dispute / chargeback fee | **Platform** bears Stripe dispute fees unless Stripe docs for the live API version assign them to the connected account — **verify against Stripe Connect destination-charge docs at Approve** and record the attested result in the decision log ([08](./08-open-questions.md) Q4 attestation) |
| Lost dispute principal | Pulls from destination-charge economics (org Express / platform fee) per Stripe — ledger must mirror outcomes; do not invent M.P.A. wallet coverage |

Connect webhooks may update account capability after disputes; they are **not** the apply authority for dispute open/close on rent charges.

---

## FIN-003 handoff contract (events/fields only)

PAY-001 does **not** cancel transfers or run clawbacks. When a refund, ACH return, or lost dispute hits a payment that FIN-003 may already have allocated/paid:

| Field / event (design) | Purpose |
|------------------------|---------|
| `funding.reversal.detected` audit | Signal for ops + future FIN-003 consumers |
| Mapping: `payment_attempt_id`, `organization_id`, `property_id`, amounts, `funding_mode` | Identity |
| Ledger reversal facts | Books truth |
| Stripe refund/dispute/return ids | Retrieve |

| FIN-003 responsibility (later) | PAY-001 |
|--------------------------------|---------|
| Compensating transfer / clawback policy (D9) | **Out of scope** — consume handoff facts only |
| Freeze further transfers for affected period/property | FIN-003 |

---

## Interaction with FIN-003

| State | FIN-003 implication (downstream only) |
|-------|----------------------------------------|
| Refunded / disputed / ACH-returned | Must not allocate/transfer as if still collected |
| `legacy_platform` | Never transferable |
| PAY-001 | Provides facts; does **not** create/cancel TransferIntents |

---

## Ops runbooks (required for A12)

| Runbook | Minimum content |
|---------|-----------------|
| Refund failure (underfunded Express) | Detect, message, next actions |
| ACH return | Resident honesty, ledger, alerts |
| Dispute open/lost/won | Books + Stripe retrieve |
| Post-payout reversal handoff | Escalate to FIN-003 ops when transfers exist |
| Freeze funding | Block new creates; in-flight session policy ([03](./03-payment-routing.md)) |

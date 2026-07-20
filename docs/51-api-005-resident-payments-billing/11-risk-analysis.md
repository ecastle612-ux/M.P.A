# 11 — Risk Analysis

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Product & architecture risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe leak into business modules | Vendor lock, rewrite cost | Hard boundary: PaymentProvider only; lint/review gate |
| Premature full GL | Scope explosion | ADR-010 operational ledger first |
| Dual sources of truth (Stripe vs M.P.A.) | Wrong balances | M.P.A. ledger is SoT; Stripe is rail; reconcile jobs |
| AutoPay surprise charges | Trust / compliance | Explicit consent, versioned terms, easy disable, notify before run |
| Partial payments ambiguity | Disputes | Clear apply order (FIFO / selected charges) + receipt detail |
| Late fee policy variance | Legal / resident friction | Org-configurable policy; waive path; audit |

---

## Security & compliance risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Card data in app/logs | PCI breach | Provider-hosted fields; log redaction; reviews in Slice 6 |
| Webhook spoofing | False paid status | Signature verify + idempotency |
| Refund abuse | Money loss | Elevated permission + audit + amount thresholds |
| Cross-org data leak | Privacy | RLS + org_id on all financial tables |
| Receipt tampering | Fraud | Content hash + append-only |

---

## Operational risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ACH returns after “paid” | Wrong owner reports | Pending → settled states; reverse ledger on return |
| Webhook downtime | Stuck processing | Retry queue + reconcile poll |
| Provider outage | Residents can’t pay | Friendly status; manual payment path for PM |
| Fee confusion (platform vs rent) | Support load | Clear fee disclosure in UX; ledger fee lines |

---

## Delivery risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Building before approval | Gate violation | This package is design-only until Approved |
| Slice 2+3 coupling | Long PR | Keep Stripe adapter thin; portal consumes BillingService only |
| Overlap with Phase 10 manual financials | Confusion | Extend existing charges/payments; don’t fork parallel money models |

---

## AI-specific risks (future)

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI initiates payment/refund | Catastrophic | Hard product rule: AI advisory only; no money APIs for agents |
| Delinquency model bias | Unfair collections | Human approval for any recommended action |

---

## Residual acceptance

Phase 1 accepts Stripe as primary rail with operational (not full GL) ledger. Residual risk of ACH timing and provider outages is managed by status model + manual rails, not by multi-PSP failover in Phase 1.

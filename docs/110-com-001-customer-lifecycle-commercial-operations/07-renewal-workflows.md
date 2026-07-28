# 07 — Renewal Workflows

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Keep Active Customers continuously entitled through term renewal and plan expansion — with clear ownership and no surprise cancellations.

---

## Renewal types

| Type | Description |
|------|-------------|
| **Auto-renew** | Stripe subscription renews; invoice charged |
| **Assisted renew** | CS/AE confirms terms before charge (Enterprise default) |
| **Expansion renew** | Upgrade/add-ons concurrent with renewal |
| **Down-renew** | Lower plan within guardrails (retention) |

---

## Timeline (design defaults)

| Milestone | Action | Owner |
|-----------|--------|-------|
| T-90 | Renewal forecast; risk flag | CS / system |
| T-60 | Usage + value report to Org Admin | Automated + CS |
| T-30 | Renewal reminder; portal manage link | Billing + CS |
| T-14 | Human touch for Priority/Dedicated | CS |
| T-7 | Final reminder; payment method check | Billing |
| T-0 | Charge / renew | BILL-001 |
| T+1 | Failure → Past Due path | Billing + CS |

---

## Happy path

```
Active Customer
  → Renewal window notifications
  → Payment method valid
  → Renewal invoice paid
  → Entitlements continue (Active)
  → Optional expansion attached
```

---

## Failure path

```
Renewal charge fails
  → Past Due
  → Grace Period
  → Suspended (if unresolved)
  → Cancelled (policy)
```

CS save attempts run in parallel during Past Due / Grace.

---

## Expansion at renewal

| Action | Notes |
|--------|-------|
| Plan upgrade | Proration per BILL-001 |
| Seat/property packs | Attach add-ons |
| Support tier upgrade | Commercial change |
| Multi-year | Enterprise contracting |

---

## Non-renewal

If customer declines:

1. Confirm Cancelled intent  
2. Enter [08 Cancellation](./08-cancellation-workflows.md)  
3. Offer pause/suspend only if policy allows (rare)  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| REN-01 | T-90→T-0 reminder sequence defined |
| REN-02 | Auto vs assisted renew ownership clear |
| REN-03 | Failed renewal enters Past Due state machine |
| REN-04 | Expansion can attach at renewal without new customer create |

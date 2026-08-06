# Ownership, Permissions & Domain Integration

**Parent:** [FIN-OPS-001](./index.md)  
**Status:** Draft — awaiting APPROVE FIN-OPS-001

---

## 1. Subscription ownership

| Layer | Value |
|-------|-------|
| SKU | `mpa_property_manager` or `mpa_complete_platform` |
| Entitlement | `pm.financial_operations` (required) |
| Facility-only SKU | **No access** — fail closed |
| SaaS plan billing | Separate (`platform.billing_self`) — never mixed into FO module |

Nav, search, launcher, routes, and APIs must all require `pm.financial_operations`.

---

## 2. Permission model (within entitlement)

Capability namespace: `pm.finance:*` (extends foundation permission evaluator).

| Capability | PM Admin | PM Manager | PM Member (collections) | Owner | Resident | Vendor |
|------------|:--------:|:----------:|:-----------------------:|:----:|:--------:|:------:|
| `pm.finance:read` | ● | ● | ● | ○ scoped | ○ own | ○ own invoices |
| `pm.finance:charge.write` | ● | ● | ○ | — | — | — |
| `pm.finance:payment.refund` | ● | ○ | — | — | — | — |
| `pm.finance:late_fee.manage` | ● | ● | ○ | — | — | — |
| `pm.finance:vendor_invoice.review` | ● | ● | ○ | — | — | — |
| `pm.finance:vendor_payment.release` | ● | ○ | — | — | — | — |
| `pm.finance:reports.read` | ● | ● | ○ | ○ owner summary | — | — |
| `pm.finance:settings.manage` | ● | — | — | — | — | — |

● primary · ○ limited/scoped · — none

Owners never see other owners’ properties. Residents see only their lease ledger. Vendors see only their invoices/payouts.

---

## 3. Property integration

| Link | Rule |
|------|------|
| Every charge | `organization_id` + `property_id` (+ `unit_id` when applicable) |
| Summaries | Roll up by property for period |
| Mission Control | Delinquency items carry property context |
| Search | Property-scoped finance documents |

No orphan charges without property context (corporate overhead charges deferred Phase 2).

---

## 4. Resident integration

| Link | Rule |
|------|------|
| Charge | Requires `lease_id` and resident access via lease |
| Ledger | Resident portal: balance, history, pay CTA |
| Communications | Threads reference charge/payment IDs |
| Move-in / move-out | Deposit accounting Phase 2; launch may record deposit as charge type `deposit` without full escrow automation |

---

## 5. Vendor integration

| Link | Rule |
|------|------|
| Invoice | Prefer `work_order_id`; allow standalone payable Phase 2 |
| Identity | Marketplace vendor id (ADR-004) for Connect payouts |
| Approval | PM FO desk — not a second AP product |
| Payment | Only after `approved`; Connect account required |

Facility work orders (future) must not invent a second vendor pay system; Complete Platform reuses this payable model under PM entitlement when paying residential/ops vendors. Facility-specific AP is out of scope for FIN-OPS-001.

---

## 6. One-home rule

| Capability | Home |
|------------|------|
| Collections desk | FO → Collections |
| Resident pay | Tenant portal → Pay |
| Vendor invoice inbox | FO → Payables (+ Vendor portal submit) |
| Property money snapshot | FO → Property summary / Reports |
| Owner money snapshot | Owner portal + Owner Reporting feed |

Maintenance may deep-link “Create payable from work order” into FO; it must not embed a parallel payments UI.

---

## 7. Master Admin

Master Admin must expose FO capabilities in the catalog (already Planned → becomes Aligned after implementation) and support:

- org FO entitlement inspection,
- Stripe Connect health (read-only),
- payment webhook failure queues (ops),
- audited break-glass — no silent ledger edits.

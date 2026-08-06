# FIN-OPS-001 — Surfaces, Dashboard, Notifications, Search & Mobile

**Status:** Approved (FIN-OPS-001)  
**Date:** 2026-08-06

---

## 1. Surface strategy

| Surface | Audience | Role |
|---------|----------|------|
| **PM Financial Operations workspace** (`/pm/financial-operations`) | Org staff with FO permission | Primary ops home |
| **Property money context** | Staff on property detail | Property-scoped summary + deep links |
| **Resident money context** | Staff on resident profile | Ledger + charges + payments |
| **Vendor money context** | Staff on vendor profile | Invoices + payment history |
| **Owner summary** | Staff (and Phase 2 owner portal) | Property/owner P&L lite |
| **Resident portal payments** | Residents | Pay open charges (Launch) |
| **Master Admin finance health** | Operators | Connect readiness, webhook health, dispute rate — **not** org ledger editing |

Facility Ops product surfaces **do not** include FO. Facility users see money only if they also hold PM/Complete entitlement (unusual; Complete SKU).

---

## 2. Dashboard strategy

### 2.1 Workspace home (`/pm/financial-operations`) — Launch

One composition, not a dashboard of widgets. Primary job: **What needs money action today?**

| Block | Content |
|-------|---------|
| Brand/context | Financial Operations + org name |
| Headline metric strip (minimal) | Open A/R total · Past due count · Invoices awaiting approval |
| Action queue | Top overdue resident charges; invoices in `submitted`/`approved` |
| Shortcuts | New charge · Post late fees · Vendor invoices · Reports |

Avoid: multi-card KPI walls, ERP-style charts gallery, GL trial balance.

### 2.2 Property financial summary — Launch

On property money tab / report:

- Collected MTD / YTD
- Outstanding A/R
- Expenses paid MTD (vendor payments)
- Net ops cash view (collections − vendor payments) — **cash operational**, not accrual GAAP

### 2.3 Owner financial summary — Launch

Per owner (or “unassigned” properties):

- Same cash view rolled up across owned properties
- Export CSV

### 2.4 Operational reporting — Launch

| Report | Grain |
|--------|-------|
| A/R aging | Resident / property |
| Collections | Period |
| Late fees posted | Period |
| Vendor spend | Vendor / property / period |
| Charge type mix | Period |

Phase 2: scheduled email digests, PDF branded statements.

---

## 3. Notifications

| Event | Channels (Launch) | Audience |
|-------|-------------------|----------|
| Charge due soon | In-app + email (if configured) | Resident |
| Payment succeeded | In-app + email | Resident + staff (optional digest) |
| Payment failed | In-app + email | Resident + staff |
| Charge past due | In-app + email | Resident; staff digest |
| Late fee posted | In-app + email | Resident |
| Invoice submitted | In-app | Approvers |
| Invoice approved / rejected | In-app + email | Submitter / vendor contact |
| Vendor payment sent | In-app + email | Vendor contact + staff |
| Dispute opened | In-app + email | Staff finance role + optional operator alert |
| Webhook processing failure | Operator alert | Master Admin |

Respect ADR-007 notification preference architecture; FO events are typed `finance.*`.

**Not Launch:** SMS rent reminders (Phase 2), owner portal push (Phase 2).

---

## 4. Audit

Every FO mutation writes an audit event (ADR-008 patterns) with:

- actor (user / system / webhook)
- org + property scope
- entity type + id
- before/after or action payload (no full PAN; Stripe ids only)
- correlation id (webhook event id when applicable)

Append-only ledger already provides financial audit; application audit covers permissioned actions and policy changes.

Master Admin may **view** org finance health metrics; may **not** edit ledger entries without break-glass policy (Post-launch).

---

## 5. Search

Extend product-aware Global Search (`searchCatalogForSku`) with FO entities when entitled:

| Entity | Query fields | Result deep link |
|--------|--------------|------------------|
| Charge | id, resident name, property, memo | Charge detail |
| Payment | Stripe session/payment intent id, amount, resident | Payment detail |
| Invoice | vendor name, invoice #, amount | Invoice detail |
| Resident (money) | name — show balance badge | Resident ledger |
| Vendor (money) | name — open AP | Vendor invoices |

⌘K / header search must not surface FO when SKU lacks entitlement (already fail-closed for routes).

Dead placeholders prohibited (P0-3 rule).

---

## 6. Mobile considerations

| Principle | Launch design |
|-----------|---------------|
| Staff FO | Responsive web first; approve invoice + view A/R on phone |
| Resident pay | Mobile-first Checkout; large CTA on resident portal |
| Offline | Not required Launch |
| Native app | Out of scope Launch |
| Tables | Stack cards on small screens for queues; full tables desktop |

Touch targets for Approve / Reject / Mark paid must meet a11y size.

---

## 7. Navigation placement (approved commercial IA)

Under Property Manager (and Complete):

```
Financial Operations
  Overview
  Charges & ledger
  Payments
  Late fees
  Vendor invoices
  Vendor payments
  Reports
```

SaaS **Billing** remains under Settings / `/billing` — separate entry, labeled “Platform subscription”.

---

## 8. Empty & error states

| State | UX |
|-------|----|
| Connect not ready | Block charge creation; CTA to Settings → Payments |
| No charges | Guided empty: “Post first rent charge” |
| Webhook delayed | Payment “Processing…” with refresh |
| Permission denied | Entitlement/permission empty, not blank 404 |

---

## Related docs

- [Product vision & scope](./product-vision-and-scope.md)
- [Stripe & ledger](./stripe-and-ledger-architecture.md)
- [Delivery & certification](./delivery-acceptance-risks-slices-certification.md)

# BILL-001 — SaaS Subscription Billing Architecture

**Status:** Approved · Phase A implemented (operator sandbox walk remaining)  
**Initiative ID:** BILL-001  
**Priority:** CRITICAL  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Proposed ADR:** [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)  
**Related:** [API-005](../51-api-005-resident-payments-billing/README.md) (tenant rent) · [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) (owner payouts) · [ADMIN-003](../95-admin-003-master-admin-operations-center/README.md) (HQ metrics)  
**Gate owners:** Product + Lead Architect + Security (+ Finance)

---

## Separation invariant (non-negotiable)

| Rail | Stripe product | Who pays | Purpose |
|------|----------------|----------|---------|
| **SaaS (this package)** | **Stripe Billing** | Property management **company (organization)** | M.P.A. subscription |
| Tenant rent | Stripe Payments (API-005) | Residents | Rent / charges |
| Owner payouts | Stripe Connect (FIN-003) | N/A (distributions) | Owner bank payouts |

**Do not** share Customers, Products, Prices, Subscriptions, Invoices, or webhooks across these rails without an explicit adapter boundary.  
**Do not** put SaaS subscription tables under `billing_*` used by resident payments. Prefer `saas_*` / `subscription_*` namespaces.  
**Do not** mix authentication with billing — Auth remains Supabase; entitlements are a separate gate after authz.

---

## Why this package exists

Commercial launch requires PM companies to pay M.P.A. automatically. Without a dedicated Stripe Billing architecture, teams will accidentally overload API-005 or Connect paths and corrupt financial separation.

---

## Proposed decisions (for Approve)

| # | Decision | Proposed |
|---|----------|----------|
| Q1 | Stripe product for SaaS | **Stripe Billing** (Subscriptions + Customer Portal) |
| Q2 | One org ↔ one subscription | Exactly **one** active/trialing/past_due subscription per `organization_id` |
| Q3 | Checkout | Stripe Checkout (subscription mode) + Customer Portal for manage |
| Q4 | Entitlements | Plan → feature flags / limits enforced server-side (`SubscriptionService.assertEntitled`) |
| Q5 | Founder plan | Manual grant + Stripe coupon/price; tracked as `plan_code=founder` |
| Q6 | Free trial | Stripe Subscription `trial_period_days` (configurable per price) |
| Q7 | Master Admin metrics | SaaS KPIs in ADMIN-003 Sales/Analytics workspace (later slice; data model now) |
| Q8 | Webhooks | Dedicated `/api/webhooks/saas/[provider]` — never `/api/webhooks/payments` or `/connect` |

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Goals / non-goals |
| [01 — Separation architecture](./01-separation-architecture.md) | Three Stripe rails |
| [02 — Catalog & plans](./02-catalog-and-plans.md) | Products, prices, tiers |
| [03 — Company admin experience](./03-company-admin-experience.md) | Plan, invoices, portal |
| [04 — Master admin metrics](./04-master-admin-metrics.md) | MRR, churn, trials |
| [05 — Entitlements & security](./05-entitlements-and-security.md) | Access model |
| [06 — Money & invoice flow](./06-money-and-invoice-flow.md) | Lifecycle |
| [07 — Webhooks](./07-webhooks.md) | Event catalog |
| [08 — Database impacts](./08-database-impacts.md) | Schema |
| [09 — API impacts](./09-api-impacts.md) | Routes / services |
| [10 — Failure handling](./10-failure-handling.md) | Past due, dunning |
| [11 — Implementation phases](./11-implementation-phases.md) | A–E |
| [12 — Certification plan](./12-certification-plan.md) | PASS scenarios |
| [13 — Risk assessment](./13-risk-assessment.md) | Risks |
| [14 — Definition of done](./14-definition-of-done.md) | DoD |
| [15 — Approval checklist](./15-approval-checklist.md) | Sign-off |
| [16 — Approval record](./16-approval-record.md) | Approve binding |
| [17 — Phase A certification](./17-phase-a-certification.md) | Foundation exit |
| [18 — Phase B blocked](./18-phase-b-blocked-pending-phase-a.md) | Prerequisite gate |
| [19 — Phase A commercial certification](./19-phase-a-commercial-certification.md) | Ops evidence / verdict |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✔ |
| Document | ✔ |
| Approve | ✔ **APPROVE BILL-001** (2026-07-22) |
| Implement | ✔ Phase A unlocked · B–E locked |

---

## PASS criteria (product)

A property management company can sign up, subscribe, manage billing, and renew automatically using Stripe Billing **without affecting** tenant payments or owner payouts.

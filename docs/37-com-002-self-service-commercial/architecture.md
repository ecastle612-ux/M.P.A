# COM-002 — Architecture

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft (amended A1–A7)  

---

## Amended constraints

| Constraint | Binding |
|------------|---------|
| Self-serve Checkout SKU | Property Manager only until FO-READY |
| SaaS webhooks | Dedicated endpoint |
| Demo data plane | Separate DB/project; snapshot + overlay |
| Access before email verify | Forbidden |
| Enterprise | No Checkout Session |

---

## System context

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Marketing /  │────▶│ Commerce App     │────▶│ Stripe Billing  │
│ Demo Host    │     │ (web)            │     │ (SaaS mode)     │
└──────────────┘     └────────┬─────────┘     └────────▲────────┘
                              │                        │
                              │ dedicated SaaS webhooks│
                              ▼                        │
                     ┌──────────────────┐              │
                     │ Provisioning     │──────────────┘
                     │ Orchestrator     │
                     │ (checkpoints)    │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Identity bind   Organizations    Entitlements
        (verify email)  + Memberships    + Limits
                              │
                              ▼
                    Guided Setup → Mission Control
                              │
                              ▼
                 PM (self-serve) / FO+Complete (Enterprise / FO-READY)
```

---

## Domain boundaries

| Domain | Owns | Must not own |
|--------|------|--------------|
| **SaaS Commerce** (COM-002) | Catalog, Checkout, SaaS subscriptions, plan entitlements, demo sessions | Resident rent, Connect payouts |
| **Operational Finance** (FIN-OPS-001) | Resident charges, rent Checkout, ledger | Platform plan billing |
| **Identity** | Users, sessions, email verify | SKU assignment |
| **Organization** | Orgs, memberships, roles | Stripe price IDs |
| **Entitlements** | Module access, limits | Payment capture |
| **Demo** | Ephemeral datasets/sessions | Production org rows |

**Hard rule:** Two Stripe concerns stay separate:

1. **Platform Billing** — `mode: subscription` for M.P.A. SaaS plans (COM-002).  
2. **Resident Payments** — FIN-OPS Checkout / Connect (ADR-016).

**Binding:** Dedicated SaaS webhook **endpoint** (not a single shared handler with metadata-only switches). Metadata `mpa_money_domain=saas_billing` remains required on SaaS objects.

---

## Logical components

| Component | Responsibility |
|-----------|----------------|
| Catalog Service | Resolve Product × Plan × Cycle → Price + entitlement set |
| Checkout Orchestrator | Create Checkout Sessions; success/cancel URLs |
| Webhook Consumer | Verify signatures; enqueue provisioning jobs |
| Provisioning Orchestrator | Idempotent org + subscription + entitlements + owner invite |
| Entitlement Engine | Fail-closed module/limit checks (extends existing) |
| Demo Session Service | Issue tokens, bind dataset, reset, expire |
| Billing Self-Serve UI | Plan status, portal link, upgrade/downgrade |
| Enterprise Lead Service | Capture Request Enterprise; notify sales |
| Master Admin Commerce | Observe subscriptions, manual Enterprise provision, support tools |

---

## Data entities (logical — no migration yet)

| Entity | Purpose |
|--------|---------|
| `commerce_catalog_offer` | Sellable offer definition |
| `saas_customers` | Stripe customer ↔ org/user link |
| `organization_subscriptions` | Extended with plan tier, cycle, Stripe ids, status |
| `subscription_events` | Audit of lifecycle transitions |
| `provisioning_jobs` | Idempotent job log |
| `enterprise_leads` | High-touch pipeline |
| `demo_sessions` | Ephemeral demo state |
| `demo_snapshots` | Reset source |

Schema detail is deferred to Slice A design refinement under Approve; this package defines **required fields and behaviors**, not SQL.

---

## Trust boundaries

1. Browser → App (public marketing/demo/commerce).  
2. App → Stripe (secret key server-only).  
3. Stripe → App webhooks (signature verified).  
4. Demo host → Demo data plane (no production DB credentials).  
5. Master Admin → Support actions (operator-only).

---

## Alignment with existing platform

| Existing | COM-002 use |
|----------|-------------|
| `PRODUCT_SKUS` / entitlements | Remain source of module inclusion |
| Guided Setup | Post-provision checklist (org may already exist) |
| Mission Control routing | Unchanged principle — role + entitlement aware |
| Master Admin subscriptions console | Gains SaaS observability + Enterprise tools |
| Confirm Plan funnel | Interim until Slice C replaces payment step |

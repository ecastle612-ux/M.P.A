# COM-002 — Provisioning Architecture

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Goal

After successful self-service Checkout (paid or valid trial), the customer receives a fully entitled organization without employee action.

---

## Provisioning pipeline

```
Webhook: checkout.session.completed (saas_billing)
    │
    ├─ 1. Validate metadata (sku, plan, cycle, session)
    ├─ 2. Upsert Stripe customer link
    ├─ 3. Create Organization (name from Checkout business name or email default)
    ├─ 4. Write organization_subscriptions (status, stripe ids, offer)
    ├─ 5. Apply entitlement grant + limits snapshot
    ├─ 6. Create owner membership bind to auth user (or pending invite)
    ├─ 7. Mark Guided Setup: "product provisioned" complete
    ├─ 8. Send welcome / verify / set-password
    └─ 9. Redirect target ready: /setup or /login
```

All steps idempotent under `provision:org:{checkout_session_id}`.

---

## Organization defaults

| Field | Source |
|-------|--------|
| Name | Checkout custom field / business name / “{email} Organization” |
| SKU | From offer `mpa_*` |
| Plan tier | professional / business |
| Billing cycle | monthly / annual |
| Owner role | Organization admin / manager (existing role model) |
| setupComplete | false until Guided Setup finished |

---

## Module activation

- Entitlement engine loads grant from CatalogOffer.  
- Nav and route guards fail closed until grant active.  
- Complete Platform enables both PM and FO homes.  
- Capital Projects remains excluded.

**Contrast with interim BUG-004:** Org create no longer forces Property Manager-only with later manual FO activation for self-serve Complete/FO offers — grant matches purchased offer immediately.

---

## Guided Setup handoff

| Checklist item | After COM-002 provision |
|----------------|-------------------------|
| Organization exists | Pre-satisfied |
| Product / plan confirmed | Pre-satisfied (show read-only purchased plan) |
| Billing reviewed | Link to Billing & Portal |
| First property / profile steps | Still customer-driven (LAUNCH-001 promises) |
| Mission Control home confirmed | Customer-driven |

Copy must say the plan is **active** (or **trialing**), not “waiting for commercial operations.”

---

## Account binding strategies

| Case | Behavior |
|------|----------|
| New email | Create auth user; force verify; set password |
| Existing email | Sign in; attach ownership if eligible; conflict rules if already in another owned org |
| Enterprise | Operator invites users |

Conflict policy (Approve): one primary owned org per user for self-serve v1, or allow multi-org membership (platform already multi-tenant capable — prefer keep multi-org).

---

## Master Admin (Enterprise / support)

Operator provisioning path:

1. Create org  
2. Assign SKU + Enterprise tier  
3. Optional Stripe customer attach  
4. Invite owner  
5. Audit log  

Self-serve provisioner and operator provisioner share entitlement apply codepath.

---

## Idempotency & reconciliation

| Scenario | Result |
|----------|--------|
| Duplicate webhook | No second org |
| Partial failure mid-pipeline | Job retries from last checkpoint |
| Stripe active but org missing | Reconciler creates org (support alert) |
| Org exists, entitlements drift | Reconciler repairs from Stripe Price metadata |

# Master Admin — Organization Detail (Diagnostic Model)

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed

---

## Mandate

Organization Detail is the **primary diagnostic surface** for Master Admin.

It must connect the full operational chain for one organization without forcing operators to hop across disconnected tools:

```
Organization
  → Users
  → Memberships
  → Modules / SKU entitlements
  → Properties
  → Units
  → Subscription
  → Stripe linkage
  → Checkout / Provisioning
  → Work orders
  → Vendors
  → Notifications
  → Errors
  → Audit history
```

This extends the live Owner Ops org profile (`loadOrganizationProfile`) into a complete Command Center diagnostic model. Prefer enriching that spine over creating a second “org 360.”

---

## Page structure

### Header (always visible)

| Field | Notes |
|-------|-------|
| Name / slug / id | id copyable; minimize accidental exposure in screenshots |
| Lifecycle status | provisioning → setup → active → suspended → cancellation → reactivation |
| Health tone | ok / warn / critical derived from subscription, provisioning, errors, webhooks |
| SKU / modules | Property Manager, Facility Operations, Complete Platform (constitution-safe labels) |
| Active/inactive | membership + subscription + explicit suspend flags |
| Primary actions | Inspect-only by default; Suspend / Reactivate / Retry provision / View As when authorized |

### Tabs / sections (single org scope)

1. **Summary** — lifecycle, setup, commercial snapshot, top risks  
2. **Users & Memberships** — members, roles, status, invitations  
3. **Modules & Entitlements** — SKU inclusion + entitlement state / overrides (read)  
4. **Properties & Units** — inventory counts, unit samples, capacity vs inventory  
5. **Subscription & Stripe** — status, interval, trial, Stripe customer/subscription/items/Price IDs, billing status  
6. **Capacity** — managed units, authorized capacity, additional blocks, pending next-period, reconciliation state  
7. **Checkout & Provisioning** — related checkout sessions, jobs, bind/provision status, failures  
8. **Operations** — work-order backlog summary (PM + FO surfaces), vendor health signals  
9. **Notifications** — recent in-app/email delivery failures for this org  
10. **Webhooks** — recent Stripe/SignWell events correlated to this org’s Stripe ids / leasing docs  
11. **Errors** — `platform_error_events` filtered by `organization_id`  
12. **Audit** — `platform_support_audit_events` + relevant `audit_events`  

Deep links from fleet lists must land on the correct tab with org id resolved server-side.

---

## Lifecycle model

| State | Meaning | Typical evidence |
|-------|---------|------------------|
| Provisioning | Checkout paid / job in progress; org may be partial | provisioning checkpoints, checkout bind |
| Setup | Org exists; Guided Setup incomplete | `organization_setup_state` |
| Active | Subscription active/trialing; setup complete | subscription + setup |
| Suspended | Operator or system suspension / unpaid grace exhaustion | lifecycle events + status |
| Cancellation | Cancel at period end or canceled | subscription status + lifecycle events |
| Reactivation | Return path after cancel/suspend | lifecycle events |

**Lifecycle history:** timeline from `saas_lifecycle_events`, provisioning job history, support audit, domain events — presented as one chronological feed with source tags.

---

## Diagnostic questions this page must answer

1. Who are the humans in this org and what can they do?
2. What product are they entitled to, and does Stripe agree?
3. How many units do they have vs what they are authorized/billed for?
4. Did checkout/provisioning complete cleanly?
5. Are webhooks healthy for their billing/leasing path?
6. Are there critical runtime errors on their routes?
7. What did operators already change, and why?

---

## Data binding rules

- All section queries are scoped by **server-validated** `organization_id` from the path/load function — not from arbitrary client body fields on GET.
- Mutations that accept an org id must re-load the org, confirm operator capability, and write audit with that server org id.
- Stripe identifiers are displayed as references; Master Admin does not become a Stripe Dashboard clone.
- Unit inventory comes from existing property/unit tables; capacity from `organization_subscriptions` capacity columns — reconcile in UI, do not invent a parallel capacity ledger.

---

## Empty & error states

| Condition | Behavior |
|-----------|----------|
| Org not found | 404 operator page; audit-worthy if id looked forged |
| Section query fails | Section-level error with retry; other sections still render |
| No units / no WOs | Honest empty, not “healthy green” fake metrics |
| Missing Stripe linkage | Explicit “unlinked” warning when subscription expects Stripe |

---

## Allowed actions on this page

See [Permissions & Mutations](./permissions-and-mutations.md). Default posture: **inspect everything; mutate narrowly.**

Impersonation (View As): only via existing governed, audited flow — never a silent “become user” button without reason capture.

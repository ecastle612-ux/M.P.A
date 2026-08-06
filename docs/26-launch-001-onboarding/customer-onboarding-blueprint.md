# 1 — Customer Onboarding Blueprint

**Status:** Draft  
**Parent:** [LAUNCH-001](./index.md)

---

## 1. Purpose

Define the **canonical Customer #1 onboarding journey** for Property Manager (primary launch SKU). Facility Operations and Complete Platform are in scope for clarity, but Customer #1 launch assumes **Property Manager** (or Complete including PM).

Onboarding succeeds when a new customer can go from account creation to **daily operations** without staff assistance.

---

## 2. SKU assumptions

| SKU | Onboarding posture for launch |
|-----|-------------------------------|
| **Property Manager** | Primary Customer #1 path |
| **Complete Platform** | Same PM path + clear dual-home chooser |
| **Facility Operations** | Purchase clarity only until Facility features are authorized — do not claim operational readiness |

---

## 3. Canonical journey (target)

```
Purchase subscription
        ↓
Account created (email verified)
        ↓
Organization created (SKU assigned by purchase / operator — not shopping cart UI)
        ↓
Guided Setup (product-aware operational checklist)
        ↓
First property created
        ↓
Users invited (email delivered + accept path works)
        ↓
Roles assigned / confirmed
        ↓
Stripe Connect configured (org ready to collect)
        ↓
SignWell configured (lease e-sign ready) — if in launch scope
        ↓
Resident added
        ↓
Lease created
        ↓
First rent collected (or clearly scheduled)
        ↓
Maintenance request submitted
        ↓
Vendor assigned
        ↓
Daily operations (Mission Control attention queue)
```

One primary path. No parallel “secret” setup desks that only engineers know about.

---

## 4. Journey stages (blueprint)

### Stage A — Acquire & authenticate

| Step | Customer outcome | Owner system |
|------|------------------|--------------|
| Purchase / assign SKU | Knows plan name and inclusions | Platform Billing + Master Admin |
| Sign up / sign in | Verified account | Identity |
| First landing | Clear next step (Setup or home) | Launcher / Guided Setup |

### Stage B — Commercial activation

| Step | Customer outcome | Owner system |
|------|------------------|--------------|
| Create organization | Named org + membership | Orgs |
| Confirm product | “You have Property Manager” — not a SKU picker | Guided Setup + Billing |
| Review plan | Understands included modules and Complete upgrades | `/billing` |
| Confirm home | Lands in PM Mission Control | Guided Setup |

### Stage C — Operational first wins

| Step | Customer outcome | Owner system |
|------|------------------|--------------|
| Create first property | Portfolio exists | Properties (not FO-only) |
| Invite teammate | Invitee receives email and can accept | Orgs + Email |
| Assign roles | Right people can act | Orgs / permissions |
| Configure Stripe Connect | Can collect rent online | FO + Connect onboarding |
| Configure SignWell | Can send lease for signature (if launch-scoped) | Documents / Leasing |

### Stage D — Money & people

| Step | Customer outcome | Owner system |
|------|------------------|--------------|
| Add resident | Person attached to lease | Residents |
| Create lease | Active agreement | Leasing |
| Collect rent | Payment succeeds or is recorded | Financial Operations |

### Stage E — Ops loop

| Step | Customer outcome | Owner system |
|------|------------------|--------------|
| Submit maintenance | Work item exists | Maintenance |
| Assign vendor | Vendor responsible | Vendors + Maintenance |
| Daily operations | Mission Control shows what needs attention | Mission Control |

---

## 5. Guided Setup — target checklist (PM)

Commercial hardening already covers org + billing + home confirm. Launch onboarding **extends** Setup:

| # | Step | Done when |
|---|------|-----------|
| 1 | Organization ready | Org exists + SKU assigned |
| 2 | Plan understood | Billing/Plan visited |
| 3 | Home confirmed | Mission Control opened |
| 4 | First property | ≥1 active property |
| 5 | Team invited | ≥1 invite accepted **or** solo skip with explicit “I’m the only user” |
| 6 | Payments ready | Stripe Connect status `ready` **or** explicit “collect manually for now” |
| 7 | First lease live | Active lease with resident |
| 8 | First money action | Charge posted **or** payment recorded / Checkout succeeded |
| 9 | Ops ready | Knows where Maintenance lives; empty state explains next action |

Facility SKU gets a parallel checklist only when Facility features are authorized.

---

## 6. First five minutes (aligned)

Reconcile with [First Five Minutes](../21-experience-architecture/first-five-minutes.md):

1. Land in calm Mission Control (not empty marketing).
2. One primary CTA if incomplete: **Add first property** (or continue Setup).
3. Complete one meaningful win in five minutes.
4. No feature zoo; no 12-checkbox wall without a primary path.

---

## 7. Surfaces involved

| Surface | Role in onboarding |
|---------|-------------------|
| `/login` | Auth + signup |
| `/launcher` | Workspace chooser |
| `/setup` | Guided Setup engine |
| `/billing` | Plan comprehension |
| `/pm/mission-control` | Daily home + first CTA |
| `/pm/properties` | Property lifecycle + money context |
| `/settings/organization` | Invites, members, roles |
| `/pm/financial-operations` | Collect rent / FO Command Center |
| `/pm/residents`, `/pm/leasing` | People & leases |
| `/pm/maintenance`, `/pm/vendors` | Ops loop |
| `/portal/tenant/billing` | Resident pay |
| Master Admin | Operator SKU assignment, health — never customer chrome |

---

## 8. Relationship to Financial Operations

FO S0–S3 delivers the **money loop** (property scaffolding, lease, charges, collect, delinquency, vendor AP, Command Center, owner summary).

Onboarding must **surface** that loop as the natural “first money win,” not bury it as an optional advanced desk.

FO does **not** replace:

- Real purchase
- Invite email delivery
- Mission Control daily ops
- Maintenance → vendor assignment
- SignWell
- Property import

---

## 9. Success definition

A Customer #1 Property Manager, alone:

1. Knows what they bought  
2. Completes Guided Setup without support tickets  
3. Creates a property and lease  
4. Collects or records first rent  
5. Submits a maintenance request and assigns a vendor  
6. Returns tomorrow and understands Mission Control  

If any step requires an engineer to paste an invite token or open FO “by lore,” onboarding has failed.

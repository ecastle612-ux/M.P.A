# 18 — Multi-Organization Future Architecture

**Package:** AUTH-001  
**Amendment:** A05 (Organization Switching)  
**Status:** Binding (Approved with Amendments)

---

## Intent

Design the authentication architecture **now** so customers who manage multiple organizations do not force a redesign later — even if MVP UX exposes a single organization.

Example:

```
ABC Management (principal)
  ├── Organization A
  ├── Organization B
  └── Organization C
```

---

## Core model (future-proof)

```
IdentityPrincipal (username, global)
        │
        ├── Membership(Org A, role, permissions)
        ├── Membership(Org B, role, permissions)
        └── Membership(Org C, role, permissions)

Session
  ├── authenticated_principal_id
  ├── active_organization_id
  └── active_role / plane
```

This aligns with Phase 3 “one user, multiple organizations” while AUTH-001 adds **username identity** and **ownership** semantics.

---

## Organization switching (A05)

Even if **hidden in MVP**, authentication and session context **must** support switching.

### Future UI (illustrative)

```
Current Organization
▼
ABC Management
────────────
Oak Ridge
Sunset Villas
Pine Grove
```

### Switch behavior

| Step | Rule |
|------|------|
| 1 | Authenticate once (username + password) |
| 2 | List memberships where status is active and org is not Archived |
| 3 | User selects target organization |
| 4 | Session `active_organization_id` updates |
| 5 | Dashboard re-resolved for that org ([07](./07-dashboard-assignment-rules.md)) |
| 6 | Entitlements re-resolved for that org’s subscription ([26](./26-subscription-capability-matrix.md)) |
| 7 | Audit optional `org.switch` for privileged roles |

### Isolation during switch

- No blended queries across orgs  
- Cached tenant data must invalidate on switch  
- AI / search / notifications scoped to active org  

---

## Ownership vs membership

| Concept | Meaning |
|---------|---------|
| **Primary Org Admin of Org X** | Ownership anchor for X only |
| **Member of Org Y** | Non-owner access in Y |
| **Billing owner** | SaaS subscription payer for an org (usually Org Admin) |

A principal may be Org Admin of multiple orgs **only** if each org independently designates them (purchase or Level 3 Master Admin transfer). There is **no** implicit parent org that bleeds data.

---

## MVP exposure vs architecture

| Concern | MVP | Architecture now |
|---------|-----|------------------|
| Multiple memberships in model | Allowed | ✔ |
| Org switcher UX | **Hidden** if single membership | Designed (this doc) |
| Cross-org portfolio rollup | Out | Future Approve |
| Shared username across orgs | Same principal | ✔ |
| Shared password across orgs | Same principal | ✔ |
| Data isolation | Absolute | ✔ |

---

## Login behavior (multi-org)

1. Authenticate once with username/password  
2. If one active membership → auto-select org  
3. If many → org picker (or last-used + switcher)  
4. Dashboard resolved **per active org** via [07](./07-dashboard-assignment-rules.md)  

No separate username per organization for the same human (anti-pattern).

---

## Holding companies (future)

A future “Enterprise Portfolio” SKU may introduce a **control affiliation** (billing family) **without** merging tenant data. Any such affiliation requires a separate Approve; AUTH-001 only reserves the principal/membership shape.

---

## Non-goals for MVP

- Cross-org search  
- Cross-org AI retrieval  
- Single invoice automatically covering unrelated orgs without BILL-001 rules  
- Moving properties between orgs without migration tooling  
- Shipping the switcher UI before a dedicated unlock  

---

## Acceptance (A05)

| ID | Criterion |
|----|-----------|
| SW-01 | Session model includes `active_organization_id` |
| SW-02 | Principal may hold multiple memberships without redesign |
| SW-03 | Switch re-resolves dashboard + entitlements fail-closed |
| SW-04 | MVP may hide switcher; architecture remains ready |

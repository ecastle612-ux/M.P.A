# 01 — Organization Architecture

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Definition

An **Organization** is the commercial tenant boundary and private M.P.A. workspace purchased by a subscriber.

Examples:

- ABC Property Management  
- Oak Ridge Apartments  
- Sunset Communities  
- Pine Grove HOA  

Everything operational belongs to exactly one Organization:

| Domain | Belongs to Organization |
|--------|-------------------------|
| Properties, units, leases | ✔ |
| Documents, maintenance, messages | ✔ |
| Users / memberships | ✔ |
| Reports, payments (tenant + ops) | ✔ |
| Branding, notification prefs | ✔ |
| SaaS subscription & entitlements | ✔ (BILL-001) |

---

## Ownership model

```
Subscriber (human / legal buyer)
        │
        ▼
Organization Administrator (Level 1 principal)
        │ owns
        ▼
Organization (workspace)
        │ contains
        ├── Properties / Units / Leases
        ├── Subaccounts (staff, tenants, vendors, owners…)
        ├── Modules enabled by plan
        └── Operational data
```

**Rule:** The Organization Administrator is the ownership anchor. Transfer of Org Admin requires an audited Level 0 procedure (see [16](./16-recovery-workflows.md) and [17](./17-emergency-recovery.md)).

---

## Organization types

Organization type is assigned at provisioning from the purchased subscription / commercial SKU. Users never choose a dashboard; type drives default Level 1 surface.

| Organization type | Primary Level 1 dashboard | Typical buyer |
|-------------------|---------------------------|---------------|
| `property_management_company` | Property Manager Dashboard | PM company |
| `property_owner` | Owner Dashboard | Direct owner subscriber |
| `hoa_community` *(future)* | HOA / Community Dashboard | HOA board / management |
| `enterprise_portfolio` *(future)* | Manager Dashboard (+ multi-org) | Large operators |

MVP focus: `property_management_company` and `property_owner`. Additional types must be Approved before exposure.

---

## Organization states

**Canonical commercial lifecycle:** [28 — Organization status lifecycle](./28-organization-status-lifecycle.md) (Amendment A03).

```
Prospect → Trial → Pending Setup → Active → Suspended / Past Due → Cancelled → Archived
```

Each state defines login, billing, user access, notifications, and recovery. State transitions are permanently audited and Level-gated.

---

## Isolation invariant

```
Organization A data  ∩  Organization B data  =  ∅
```

Enforcement layers (design requirement):

1. **Application AuthZ** — active organization context on every request  
2. **RLS** — every tenant table scoped by `organization_id` (or plane-specific access tables per ADR-003)  
3. **Storage** — signed URLs / object paths never cross orgs  
4. **Search / AI** — retrieval always org-scoped  
5. **Jobs / webhooks** — workers carry org context; no global fan-out of tenant data  

Violations are **P0 security defects**.

---

## Modules & subscription binding

| Concept | Owner package | AUTH-001 rule |
|---------|---------------|---------------|
| Plan / price / invoice | BILL-001 | One non-terminal SaaS subscription per org |
| Enabled modules | Entitlements service | Assigned at provision; changeable by Level 0 / billing events |
| Feature access | `assertEntitled` after AuthZ | Auth succeeds ≠ module access |

AUTH-001 provisions the org and binds the initial plan/modules; BILL-001 remains the money rail.

---

## Logical entities (design-level)

> Schema is **not** authorized here. These are conceptual contracts for a future Implement slice.

| Entity | Responsibility |
|--------|----------------|
| `Organization` | Workspace root; type; state; branding; recovery contacts |
| `OrganizationSubscriptionBinding` | Link to BILL-001 subscription / plan / modules |
| `IdentityPrincipal` | Global person/machine identity (username) |
| `OrganizationMembership` | Principal ↔ org role / status |
| `OrganizationAdministrator` | Designated ownership membership (exactly one primary) |
| `RecoveryContact` | Secondary verified recovery identity for org |
| `ProvisionedCredential` | Temp credential metadata (never plaintext password) |
| `AuditEvent` | Privileged action log |

---

## Non-goals

- Shared “holding company” data lake across orgs in MVP  
- Cross-org reporting without explicit multi-org principal + future Approve  
- M.P.A. staff as members of customer orgs for day-to-day operations

# M.P.A. Version 1.0 Subscription Architecture

**Type:** Binding product / platform SoT (documentation)  
**Status:** Active — Product Owner direction (2026-07-25)  
**Does not authorize implementation by itself** — BILL / nav / FAC slices still require Design → Document → Approve → Implement  
**Mission:** [V1.0 Implementation Mission](./v1-0-implementation-mission.md)  
**Billing package:** [BILL-001](../100-bill-001-saas-subscription-billing/README.md) (extend; do not fork)  
**Facility design:** [FAC-002](../114-fac-002-facility-operations-v1/README.md)  
**Policy:** [Implementation Gate](./implementation-gate.md)

---

## 1. Platform law

M.P.A. is **one platform**:

| Must | Must not |
|------|----------|
| One application | Multiple applications |
| One codebase | Duplicate products per vertical |
| One authentication system | Separate logins per module |
| One database (multi-tenant) | Separate DBs per module |
| One user experience (Canopy) | Second design language |
| Modules unlocked by licensing | Greyed “upgrade” clutter in nav |

Customers unlock functionality through **subscription modules**. Every module must be independently enabled or disabled through licensing. **No duplicate code** for the same capability.

---

## 2. Foundation — Core Platform

Every customer receives the **Core Platform**.

| Rule | Meaning |
|------|---------|
| Core is **not** sold alone | Commercial SKUs always include Core **plus** ≥1 operational module |
| Core powers every module | Shared services below |
| Core alone ≠ usable product | Org without Property or Facility ops module is not a valid V1.0 commercial configuration |

### Core Platform includes

- Authentication  
- Organization Management  
- User Management  
- Roles & Permissions  
- Dashboard Framework  
- Reporting Engine  
- Notifications  
- Document Management  
- Security  
- Audit Logs  
- Settings  
- Mobile Support  
- Desktop Support  

These services **power** Property Operations and Facility Operations. They are not a substitute for an operational module.

---

## 3. Module 1 — Property Operations

**Purpose:** Rental / portfolio operations.

| Included | Module tag |
|----------|------------|
| Property Management | Property |
| Building Management | Property |
| Unit Management | Property |
| Tenant Management | Property |
| Owner Management | Property |
| Lease Management | Property |
| Tenant Portal | Property |
| Owner Portal | Property |
| Rent Collection | Property |
| ACH / Credit Cards / Stripe (resident money-in) | Property |
| Owner Payouts | Property |
| Communication Center (resident/owner-centric) | Property* |
| Property Reports | Property |

\*Internal staff messaging primitives may live in Core; **resident/owner communication product surfaces** are Property-tagged for licensing/nav.

**Depends on Core.** Does **not** require Facility Operations.

---

## 4. Module 2 — Facility Operations

**Purpose:** Maintenance / facility operations.

| Included | Module tag |
|----------|------------|
| Facility Technician Dashboard | Facility |
| Work Orders | Facility |
| Preventive Maintenance | Facility |
| Building Asset Management | Facility |
| Facility Inventory | Facility |
| Vendor Directory | Facility |
| Vendor SMS / Email / Workflow | Facility |
| Inspections | Facility |
| Receipts (ops/maintenance-linked) | Facility* |
| Expense Tracking (ops-linked) | Facility* |
| Calendar / Scheduling (ops) | Facility |
| Technician Reports | Facility |
| Monthly Building Reports | Facility |
| Asset Reports | Facility |

\*General ledger / SaaS billing remain Core or separate financial packages; **maintenance receipts/expenses** are Facility-tagged when surfaced from WO/vendor flows.

### Independence law (binding)

Facility Operations **must operate independently of Property Operations**.

Organizations that do **not** manage tenants (schools, hospitals, hotels, churches, manufacturing, municipal maintenance, facility-only companies, etc.) must still use **every** Facility feature without:

- Requiring leases, tenants, rent collection, or owner portal  
- Seeing Property-only nav  
- Blocking WO/PM/inventory/assets/calendar because “no units occupied”

**Shared physical places:** A “property” / building record in the data model may still represent a site. That does **not** imply rental Property Operations. Facility-only orgs use site/building records as **places of work**, not as landlord portfolios.

**Depends on Core.** Does **not** require Property Operations.

---

## 5. Supported customer types (examples)

| Customer | Typical modules |
|----------|-----------------|
| Property management companies | Core + Property (± Facility) |
| Apartment communities | Core + Property (± Facility) |
| HOAs | Core + Property (± Facility) |
| Commercial buildings (landlord) | Core + Property (± Facility) |
| Schools / hospitals / hotels / churches | Core + Facility (± Property if they also rent) |
| Manufacturing / municipal maintenance | Core + Facility |
| Facility management companies | Core + Facility (± Property) |

Each customer should **only see modules included in their subscription**.

---

## 6. Commercial SKUs (V1.0)

| SKU | Contents |
|-----|----------|
| Core + Property Operations | Rental ops |
| Core + Facility Operations | Maintenance ops |
| Core + Property + Facility | Both |
| Professional Bundle | All modules (positioning) |
| Enterprise | Extends all modules with advanced capabilities (future detail) |

**Invalid V1.0 SKU:** Core alone.

---

## 7. UI requirement (binding)

| Do | Do not |
|----|--------|
| Hide every feature the customer has not subscribed to | Show disabled menu items |
| Nav/search/command palette omit unlicensed destinations | Show upgrade clutter in primary nav |
| Feel custom-built for subscribed modules | Force every customer into the full product IA |

Deep links to unlicensed routes → friendly **not available** / redirect home — not a sales interstitial wall in day-to-day ops chrome.

---

## 8. Development requirement (binding)

Every new feature must belong to **exactly one** of:

1. **Core Platform**  
2. **Property Operations**  
3. **Facility Operations**  

Before implementing any feature, answer:

1. Which module owns it?  
2. Should it function if the other ops module is off?  
3. Does another module depend on it?  
4. Does licensing affect visibility?  
5. Does reporting include it?  
6. Does permissions include it?  

**No feature without a module owner.** Shared infrastructure stays in Core; product surfaces inherit the module tag of the workflow they serve.

---

## 9. Feature → module matrix (V1.0 baseline)

| Feature / surface | Module | Independent if other ops module off? |
|-------------------|--------|--------------------------------------|
| Login / session / org switch | Core | Yes |
| Team / roles / settings / appearance | Core | Yes |
| Ops shell / dashboard framework | Core | Yes (widgets module-filtered) |
| Reporting engine | Core | Yes (catalog filtered by modules) |
| Notifications infrastructure | Core | Yes (events filtered by modules) |
| Document vault infrastructure | Core | Yes (entity types filtered) |
| Properties / units as **sites** | Core place model* | Yes for Facility-only |
| Tenants / leases / rent / owner portal | Property | N/A if Facility-only |
| Resident payments / owner payouts | Property | N/A if Facility-only |
| Work orders / vendors / PM / inventory / assets / inspections / facility calendar | Facility | Yes without Property |
| FAC-001 records / timeline | Facility | Yes without Property |

\*If today’s `properties` table is the place SoT, Facility-only orgs still create properties as **buildings/sites** without enabling Property nav (tenants, leases, portals, rent). A future rename to “Site” is optional UX — not required to split databases.

---

## 10. Entitlements model (target)

```
Auth (session)
  → AuthZ (membership + capabilities)
    → Module entitlements (subscribed modules)
      → Nav + route + command palette + report catalog
        → Domain mutation
```

| Entitlement key (proposed) | Unlocks |
|----------------------------|---------|
| `module:core` | Always on for paying SKUs (implicit with any ops module) |
| `module:property_operations` | Property module surfaces |
| `module:facility_operations` | Facility module surfaces |

Implement via BILL-001 entitlement snapshots / `assertEntitled` — **extend BILL-001**, do not create a second billing stack. Hard nav hide is a **product requirement** for V1.0; Phase timing follows BILL Authorize slices.

Master Admin / impersonation may see all modules for support — audited.

---

## 11. Navigation rules

1. Build nav from **subscribed modules only**.  
2. Facility-only → Facility hub, maintenance, vendors, inventory, PM, calendar, facility reports — **no** tenants/leases/owner/tenant portals/rent.  
3. Property-only → portfolio/leasing/portals/rent/owner — **no** facility inventory/PM/tech dashboard (unless shared WO is decided Property+Facility; **default:** WO is Facility-tagged — Property-only orgs that need WO must add Facility module).  
4. Both → union of nav, still one shell.

### Work orders ownership (binding default)

**Work Orders are Facility Operations.**  
Property-only customers who need maintenance must subscribe to Facility (or Professional). Do not maintain a second WO product under Property.

---

## 12. Long-term objective

One scalable platform: customers purchase only the operational modules they need while sharing the same secure infrastructure, UX, and codebase. Software adapts to each customer’s business — customers are not forced into one product experience.

---

## 13. Implications for current work

| Workstream | Implication |
|------------|-------------|
| OWNER-001 / Slice A | Property module — correct |
| FAC-002 | Must satisfy **Facility independence** before Approve — see FAC-002 amendments |
| BILL-001 | Must grow module entitlements + SKU rules (Core not alone) |
| Nav / shell | Future slice: hide unlicensed items (no clutter) |
| Other agent AUTH/OPS/COM | Core / commercial — do not collide; module tags still apply |

---

## 14. Approval / next phrases

This document is **Product Owner direction**. Material changes restart documentation update.

Suggested follow-ons (separate Authorize):

- ✅ `APPROVE FAC-002` recorded 2026-07-25  
- Next: `AUTHORIZE FAC-002 SLICE A`  
- Later: BILL / nav entitlements slice for hard module hide  

---

## 15. Change control

Conflicts with package docs: **this file + V1.0 mission win** for module boundaries until an ADR amends them.

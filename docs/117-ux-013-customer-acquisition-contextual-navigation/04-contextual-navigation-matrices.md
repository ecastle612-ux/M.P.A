# 04 — Contextual Navigation Matrices

**Package:** UX-013  
**Status:** Draft — Ready for Approval  
**Related:** [UX-012 §05 Navigation](../112-ux-012-platform-experience-design-system/05-navigation-architecture.md) · [UX-012 §08 Roles](../112-ux-012-platform-experience-design-system/08-role-based-experiences.md) · `apps/web/src/components/shell/navigation-config.ts` (current Ops SoT — **not** authority until Approve)

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **One matrix per surface** | Org Admin, Property Ops, Facility Ops, Tenant, Owner, Technician, Vendor each have an approved primary nav set |
| **Triple filter** | Item visible only if **role surface** allows it **and** org/user **capability** allows it **and** **licensed module** (when required) is entitled |
| **Hide, don’t tease** | Unentitled or unauthorized destinations are omitted — not shown as locked dead-ends in primary nav |
| **Same destinations** | Deep links and nav agree; no duplicate labels for one place |
| **Reuse entitlements** | Module keys align with AUTH/BILL capability matrix (`property_operations`, `facility_operations`, `leasing`, …) |
| **Canopy / UX-012** | Visual chrome and density follow approved experience SoT; this doc owns **IA contents** |

---

## Filter model (binding)

```
visible = in_surface_matrix
        ∧ has_required_capability (if any)
        ∧ has_required_module (if any)
```

| Filter | Source of truth |
|--------|-----------------|
| Role / surface | AUTH dashboard / portal assignment |
| Org permissions | Capability / permission plane |
| Licensed modules | Entitlement snapshot (`entitledModules` / features) |

---

## Matrix A — Organization Administrator (ops shell)

**Job:** Workspace ownership — people, plan, risk, cross-module oversight.

| Order | Label | Destination (semantic) | Capability (typical) | Module |
|------:|-------|------------------------|----------------------|--------|
| 1 | Command Center | Ops home | — | — |
| 2 | Ops Inbox | Unified inbox | — | messaging-capable org |
| 3 | Properties | Portfolio | property read | `property_operations` |
| 4 | Maintenance | Work orders | maintenance read | `maintenance` |
| 5 | Facility | Facility hub | `facility:dashboard` | `facility_operations` |
| 6 | Leases | Lease ops | lease read | `leasing` |
| 7 | Financials | Money ops | financial read | `financials` |
| 8 | Team / People | Memberships | membership/invite read | — |
| 9 | Subscription | SaaS billing | `saas:read` | — |
| 10 | Settings | Settings IA (UX-012 A09) | per Settings capabilities | — |

**Notes:** Org Admin may see **both** Property and Facility entries when entitled. Items without entitlement are omitted. Settings tabs follow [UX-012 A09](../112-ux-012-platform-experience-design-system/36-amendment-a09-settings-ia-consolidation.md).

---

## Matrix B — Property Operations (ops shell)

**Job:** Daily property management — portfolio, residents, leasing, maintenance, vendors.

| Order | Label | Destination | Module (primary) |
|------:|-------|-------------|------------------|
| 1 | Command Center | Ops home | — |
| 2 | Ops Inbox | Inbox | messaging |
| 3 | Properties | Properties | `property_operations` |
| 4 | Units | Units | `property_operations` |
| 5 | Tenants | Tenants | `property_operations` |
| 6 | Applicants | Screening queue | `screening` |
| 7 | Leases | Leases | `leasing` |
| 8 | Move in / out | Resident lifecycle | `leasing` |
| 9 | Maintenance | Work orders | `maintenance` |
| 10 | Vendors | Vendor jobs | `maintenance` |
| 11 | Communications | Announcements | `messaging` |
| 12 | Documents | Vault (if entitled) | `documents` |
| 13 | Settings | Preferences / limited admin | capability-filtered |

**Hide when not entitled:** Facility hub and Facility-only tools stay out of this matrix unless selection was `both` **and** user has Facility capabilities.

---

## Matrix C — Facility Operations (ops shell)

**Job:** Facility floor — jobs, PM, inventory, inspections, technician coordination.

| Order | Label | Destination | Capability (typical) | Module |
|------:|-------|-------------|----------------------|--------|
| 1 | Command Center | Ops / facility-aware home | — | — |
| 2 | Facility | Facility hub | `facility:dashboard` | `facility_operations` |
| 3 | Inventory | Inventory | `facility:inventory:read` | `facility_operations` |
| 4 | Preventive | PM schedules | `facility:pm:read` | `facility_operations` |
| 5 | Calendar | Facility calendar | `facility:calendar:read` | `facility_operations` |
| 6 | Inspections | Inspections | `facility:inspection:read` | `facility_operations` |
| 7 | Facility reports | Reports | `facility:report:read` | `facility_operations` |
| 8 | Maintenance | Cross-link WO if dual-entitled | maintenance | `maintenance` |
| 9 | Ops Inbox | Inbox | — | messaging |
| 10 | Settings | Preferences | capability-filtered | — |

**Hide:** Property portfolio / leasing / tenants primary items unless `both` + Property capabilities.

---

## Matrix D — Tenant portal

**Surface:** `/portal/tenant/*` (DPX / existing tenant IA).

| Order | Label | Destination |
|------:|-------|-------------|
| 1 | Home | Tenant home |
| 2 | Rent | Payments |
| 3 | Messages | Messages |
| 4 | Maintenance | Maintenance |
| 5 | Documents | Documents (desktop; More on mobile) |
| 6 | More | Announcements, notifications, community, preferences, profile |

**Filters:** Portal role assignment; org must license resident-facing modules as applicable. No Ops shell items.

---

## Matrix E — Owner portal

**Surface:** `/portal/owner/*` (OWNER-001).

| Order | Label | Destination |
|------:|-------|-------------|
| 1 | Dashboard | Owner home |
| 2 | Properties | Owner properties |
| 3 | Financials | Owner financials |
| 4 | Documents | Documents |
| 5 | Messages | Messages |
| 6 | Reports | Reports |
| 7 | Settings | Owner settings / preferences |

**Mobile bottom:** Home · Properties · Financials · Messages · More (existing OWNER amendment).

**Filters:** Owner portal entitlement (`owner_portal` / org allowlist); no Ops admin destinations.

---

## Matrix F — Technician

**Surface:** Facility technician experience (field-first). May be Facility ops routes with technician role **or** a dedicated technician portal if AUTH assigns one — Implement must follow AUTH dashboard assignment, not invent a third shell.

| Order | Label | Job |
|------:|-------|-----|
| 1 | Today / Assigned | Active jobs |
| 2 | Schedule | Calendar / due work |
| 3 | Job detail actions | Arrive, document, complete (in-job, not all in rail) |
| 4 | Inventory (if permitted) | Parts / tools lookup |
| 5 | Messages / Inbox (limited) | Job-related comms |
| 6 | Profile / Preferences | Personal only |

**Density:** Touch-first, large controls (UX-012 Facility Technician brief). Omit Org Admin / Billing / leasing.

---

## Matrix G — Vendor

**Surface:** Vendor work experience (VENDOR-001 tokenized / portal patterns as approved).

| Order | Label | Job |
|------:|-------|-----|
| 1 | Jobs / Offers | Accept / schedule |
| 2 | Today | Active work |
| 3 | Invoices / Pay status | Get paid (approved flows only) |
| 4 | Messages | Job communication |
| 5 | Profile | Identity / prefs |

**Product decision:** Whether “Vendor Portal” remains a first-class product vs tokenized WO access only is **OQ-06**. Until resolved, this matrix describes **required jobs**, not a mandate to revive a retired product surface.

---

## Cross-cutting rules

| Rule | Detail |
|------|--------|
| Master Admin | Remains ADMIN-003 HQ chrome — **out of scope** for these customer matrices |
| Mobile | Ops: bottom 3–5 + More; portals: existing bottom patterns |
| Search | OPS Unified Search accelerates destinations already allowed by the matrix |
| Settings IA | UX-012 A09 capability-filtered Settings — do not duplicate Appearance/Notifications tabs |

---

## Acceptance (nav)

| ID | Criterion |
|----|-----------|
| NAV-01 | Seven matrices documented and approved |
| NAV-02 | Triple filter defined and testable |
| NAV-03 | Property-only vs Facility-only orgs never show the other family’s primary rail items |
| NAV-04 | Tenant / Owner portals do not show Ops shell items |
| NAV-05 | Implement cites this doc + UX-012; no ad-hoc nav groups without amendment |

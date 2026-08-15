# 127 — Complete Delegated Operations / Member Operating Scope

**Title:** COMPLETE DELEGATED OPERATIONS  
**Status:** Approved  
**Date:** 2026-08-15  
**Approved:** 2026-08-15 — Product Owner `APPROVE docs/127`  
**Program:** Complete Delegated Operations  
**Gate:** Design → Document → Approve → **Implement (authorized)**  
**ADR:** [ADR-033 Accepted](../18-decision-log/adr-033-member-operating-scope.md)  
**Related:** [ADR-015](../18-decision-log/adr-015-three-commercial-products-master-admin.md) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) · [docs/24](../24-product-architecture/index.md) · [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) (FIN-OPS audit; remains blocked)  
**This package:** Approved design. Implementation authorized in-repo (ADR-033). Production application release is certified in [docs/134](../134-complete-delegated-operations-production-release-certification/index.md). **No billing/Stripe change. No FIN-OPS schema.**

---

## Verdict

**Approved.** Product Owner accepted the binding formula:

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role / module permission
  ∩ action
```

Implementation is authorized for this contract only. docs/126 remains blocked. No new SKU, role, organization, or Stripe change.

Complete is already the **organization-level entitlement union**. It cannot distinguish “this manager operates Property Operations” from “this manager operates Facility Operations.” That gap is architectural, not a missing SKU.

This package adds a **member operating scope** under the purchased product:

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role / module permission
  ∩ action (assignment, lease, vendor, work_surface)
```

Canonical scope values: `property_operations` | `facility_operations` | `both`.

Customer-facing name: **Operational responsibility**.  
Internal name: **member operating scope**.  
Not a SKU. Not billing. Not a second organization. Not an OPS-001 “workspace” document.

**Role decision:** keep existing RBAC roles. Do **not** add `facility_manager`. Distinguish Property vs Facility with operating scope (Option B).

**docs/126** remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**. This package does **not** approve any FIN-OPS remediation option. The eventual FIN-OPS design **must** consume member operating scope so a FACILITY-only Complete manager cannot inherit PM finance.

---

## What this package does not do

- Does not write Production or apply the repo migration there
- Does not change Stripe, SKUs, prices, or commercial flow
- Does not split Complete into two products or two subscriptions
- Does not add `facility_manager` or revive `facility_technician` as a `USER_ROLES` value
- Does not approve docs/126 Options A/B/C
- Does not create `financial_*` tables or replay FIN-OPS S0/S1/S2
- Does not alter FAC-003 data or FAC-002 `work_surface` meaning

---

## Product Owner vision (binding)

M.P.A. Complete is **one subscription** containing:

1. Property Operations
2. Facility Operations

A Complete customer chooses an operating model **inside one organization**:

**Model A — Owner / Admin operates both**

```
Complete
└── Organization Admin (scope: both)
    ├── Property Operations
    └── Facility Operations
```

**Model B — Delegated management**

```
Complete
└── Organization Admin (scope: both)
    ├── Property Operations Manager (scope: property_operations)
    └── Facility Operations Manager (scope: facility_operations)
```

The Organization Admin may retain **both** while delegating either or both operational surfaces. Additional employees are assigned to the appropriate surface.

This must **not** require two subscriptions, two organizations, duplicate customers, separate Complete SKUs, buying PM + FO independently, or duplicating modules.

Complete remains the entitlement union at the **organization / product** level.  
Delegation determines **which people** may operate each portion of that union.

---

## 1. Current Complete authorization audit (read-only)

### 1.1 Live pipeline (ADR-026)

```
Authentication
  → Organization (membership or portal plane)
  → Role / plane
  → SKU entitlement (entitlementsForSku(org.sku))
  → Module permission (RBAC capability)
  → Action (surface, assignment, lease, vendor)
```

Implemented in `requireAuthorizedAction`. Entitlements are computed from the **organization subscription only**. Membership is `organization_memberships.roles[]`. There is **no member-level product-surface column**.

### 1.2 Roles that actually exist

`USER_ROLES`: `organization_admin`, `property_manager`, `leasing_agent`, `maintenance_technician`, `property_owner`, `tenant`, `vendor`.

There is **no** canonical `facility_manager` role.  
`facility_technician` is a leftover Production grant/UAT label, not a `USER_ROLES` value (PLAT-001 L4 / PLAT-006).

FO-only invitations **relabel** `property_manager` → “Facility Manager” and `maintenance_technician` → “Facility Technician” (`toInviteRoleLabel`). Permissions are unchanged.

`FACILITY_MANAGER_ROLES` = `organization_admin` + `property_manager`. Any Complete member with those roles is a Facility manager **and** a Property manager wherever SKU entitlements allow.

### 1.3 What Complete grants today (org-level)

`entitlementsForSku("mpa_complete_platform")` = platform entitlements ∪ **all** PM entitlements ∪ **all** FO entitlements.

`orgAllowsWorkSurface(Complete, residential)` = true  
`orgAllowsWorkSurface(Complete, facility)` = true

Work-order RLS (ADR-026): Complete is the **union** of both `work_surface` values. Member role does not narrow that union.

### 1.4 Role × Complete behavior today

| Role | Complete org entitlements | What they can reach | Cannot distinguish |
|------|---------------------------|---------------------|--------------------|
| `organization_admin` | PM ∪ FO ∪ platform | Launcher, both Mission Controls, PM finance (capability), FAC-002/003, tenant comms (staff), org admin | Cannot be “admin of Complete but operator of only one half” |
| `property_manager` | PM ∪ FO ∪ platform | **Both** product nav families (`STAFF_NAV_HREFS_BY_ROLE.property_manager = "all"`), both Mission Controls, PM finance, FAC manager APIs, reports `?persona=facility_manager` | **This is the Sarah/Mike collision.** Same role is FO manager on FO-only and PM+FO manager on Complete |
| `leasing_agent` | PM ∪ FO | PM leasing/residents/properties; not FAC manager write; reports PM-shaped; no `pm.finance:reports.read` | FO surfaces still appear in Complete SKU nav unless role filter hides them (leasing list is PM-only — already narrower) |
| `maintenance_technician` | PM ∪ FO | PM maintenance **and** FO operations/assets/inventory nav; Complete home is `/pm/maintenance` (SKU-biased); tenant comms **denied** (ADR-026); shared reports FO-shaped | Cannot be “residential tech only” vs “facility tech only” |
| `property_owner` | portal | `/portal/owner`; owner finance API still staff-entitled | Portal plane — out of staff delegation |
| `tenant` | portal | `/portal/tenant` | Out of staff delegation |
| `vendor` | portal | `/portal/vendor` | Out of staff delegation |

### 1.5 Exact leak points (Complete union → both surfaces)

These are the places a generic Complete `property_manager` / `organization_admin` sees **both** products because entitlement is org-wide:

| Layer | Location | Leak |
|-------|----------|------|
| Entitlement resolution | `entitlementsForSku` + `requireAuthorizedAction` | Member inherits full Complete union |
| Page middleware | `requiredEntitlementForPath` | `/pm/*` and `/facility/*` both allowed on Complete |
| API middleware | `requiredEntitlementForApiPath` | `/api/finance/*`, `/api/pm/*`, `/api/facility/*` all allowed on Complete |
| Nav | `STAFF_NAV_HREFS_BY_ROLE` + `modulesForSku` | Managers see every SKU-entitled href |
| Launcher | `workspaceLauncherItemsForSku(Complete)` | Both product workspaces |
| Post-auth home | `resolvePostAuthHome` | Complete admin/manager → `/launcher` (correct for BOTH; wrong for delegated Sarah/Mike) |
| Technician home | `defaultHomeForRole` + Complete | Always `/pm/maintenance`, even if they only do facility work |
| Reports | `resolveAuthorizedReportShape` | Complete manager allowed personas `property_manager` **and** `facility_manager`; admin gets PM ∪ FO |
| Work orders | `orgAllowsWorkSurface` / SQL helper | Complete sees residential **and** facility rows |
| FAC-003 | `FACILITY_MANAGER_ROLES` | Complete `property_manager` may manage assets/inventory |
| Finance | `requireFinancePermission` | Complete + `property_manager` has `pm.financial_operations` **and** `pm.finance:*` — Mike-as-`property_manager` would pass staff finance after FIN-OPS schema exists |
| COM-002 | `staffHasTenantCommsEntitlement` | Complete grants `pm.portal_tenant`; any comms staff role on Complete gets the tenant desk |
| OPS-001 | `platform.documents` / `platform` entitlements | Shared; connections are not member-surface-scoped |
| Invitations | `launchInviteRolesForSku(Complete)` | Same as PM: “Property Manager” with no operational-responsibility control |
| Guided Setup | Complete copy | Lands in launcher; no “who operates which half” question |
| Invite labels | Complete uses PM labels | Cannot invite a “Facility Operations Manager” without using the FO-only relabel path |

### 1.6 What already works (do not break)

| Rule | Today |
|------|--------|
| FO-only SKU denies PM pages/APIs/finance | SKU entitlement fail-closed (ADR-026 / PLAT-006) |
| PM-only SKU denies FO pages/APIs/FAC-003 | Same |
| Tenant comms denied to technicians on all SKUs | ADR-026 / ADR-024 |
| Portal roles are not staff reporters | ADR-032 |
| `?persona=` / `?area=` cannot expand report authority | ADR-032 |
| Complete is one Stripe product / one org subscription | ADR-015 / ADR-019 |
| FO-only “Facility Manager” is still `property_manager` | Label-only; keep |

### 1.7 Why a new SKU or second org is forbidden

That would violate the Product Owner vision, ADR-015 (three products), and ADR-019 (Complete is a product, not PM+FO checkout). Delegation is **authorization scope**, not commerce.

---

## 2. Member operating scope (design)

### 2.1 Extended pipeline

```
Authentication
  → Organization
  → Role / plane
  → SKU entitlement          (what the organization purchased)
  → MEMBER OPERATING SCOPE   (which purchased surfaces this person may use)
  → Module permission
  → Action
```

### 2.2 Canonical values

| Key | Customer label | Meaning |
|-----|----------------|---------|
| `property_operations` | Property Operations | Property Manager product surfaces only |
| `facility_operations` | Facility Operations | Facility Operations product surfaces only |
| `both` | Both | Union of the two, still bounded by SKU |

Do **not** use “workspace” as the stored name. OPS-001 already owns “Operational Workspace” (documents/tables). Do **not** use SKU codes in UI.

### 2.3 What it is / is not

| Is | Is not |
|----|--------|
| Authorization scope on a membership (and pending invitation) | A SKU |
| Under the org’s purchased product | Billing / Stripe |
| One row (or column) per membership | A second organization membership |
| Intersection with SKU | A way to grant FO to a PM-only org |
| Auditable | Impersonation / Master Admin plane |

### 2.4 Effective-access formula (binding)

```
sku_surfaces(sku) =
  PM  if sku ∈ {mpa_property_manager, mpa_complete_platform}
  FO  if sku ∈ {mpa_facility_operations, mpa_complete_platform}

scope_surfaces(scope) =
  PM  if scope ∈ {property_operations, both}
  FO  if scope ∈ {facility_operations, both}

effective_surfaces = sku_surfaces ∩ scope_surfaces

effective_entitlements =
  entitlementsForSku(sku)
  filtered to keys whose product family ⊆ effective_surfaces
  ∪ platform entitlements (org/setup/billing/search/docs/tables)
    except product-family keys already classified as PM or FO
```

Classification of entitlement families:

| Family | Surface |
|--------|---------|
| `pm.*` | Property Operations |
| `facility.*` | Facility Operations |
| `platform.*` | Shared platform — **not** a grant of the other product. Connected **data** still respects `effective_surfaces` |

Then existing role capability and action checks apply **inside** `effective_entitlements`.

**SKU always wins.** A PM-only org with a member scope of `facility_operations` or `both` still has `effective_surfaces = {PM}`. An FO-only org with scope `property_operations` or `both` still has `effective_surfaces = {FO}`. Scope cannot expand a SKU.

### 2.5 Where the new gate lives

Add the intersection in **`requireAuthorizedAction`** after SKU load, by resolving **member-effective entitlements** (not raw `entitlementsForSku`).

Domain wrappers (`requireFinancePermission`, `requirePropertyPermission`, `requireFacilityOperation`, comms, reports) keep calling that helper. They must not re-read org SKU entitlements and skip scope.

Also apply the same effective entitlements in:

- page / API path entitlement evaluators
- nav / launcher / modules
- `resolveAuthorizedReportShape` (new `operatingScope` input)
- `resolvePostAuthHome` (new `operatingScope` input)
- `orgAllowsWorkSurface` → `memberAllowsWorkSurface(sku, scope, surface)`
- SQL helpers that today map SKU → `work_surface` (Complete union becomes Complete ∩ member scope)

RLS that only sees org SKU will otherwise re-open Mike’s facility work orders to Sarah and Sarah’s residential WOs to Mike.

---

## 3. Complete scenarios

### Scenario A — Erick, Organization Admin, scope `both`

| Surface | Result |
|---------|--------|
| Property Operations | Yes |
| Facility Operations | Yes |
| Complete launcher | Yes — post-auth `/launcher` |
| Organization administration | Yes (billing, team, settings, last-admin) |
| PM finance | Yes, according to `pm.finance:*` (schema still blocked per docs/126) |

### Scenario B — Delegated Sarah / Mike

Organization Admin remains `both`.

**Sarah** — role `property_manager`, scope `property_operations`

| Allowed | Denied |
|---------|--------|
| `/pm/mission-control`, residents, leases, residential maintenance, tenant communications, PM reports, Property-side OPS connections | `/facility/*`, FAC-003, FAC-002 facility registry, facility work_surface rows, FO report personas/areas |
| PM finance **according to role/capability**, after a future FIN-OPS remediation that also consumes this contract | Staff finance must not be reachable via Complete union alone if she lacked finance capability (unchanged) |

Sarah must **not** receive Facility Operations because the organization owns Complete.

**Mike** — role `property_manager` (same RBAC role), scope `facility_operations`

| Allowed | Denied |
|---------|--------|
| `/facility/mission-control`, facility work orders, assets, inventory, facility vendors/workflows, FAC-002 reports, Facility-side OPS connections | `/pm/*` product homes, residents, leases, tenant communications, PM finance, PM report personas/areas, `pm.financial_operations` |

Mike must **not** receive Property Operations or PM finance because Complete contains those entitlements **and** `property_manager` holds `pm.finance:*`.

**Admin** — both.

---

## 4. Role model

### Options

| Option | Summary |
|--------|---------|
| **A** | Add canonical `facility_manager` |
| **B** | Keep existing manager roles; distinguish with operating scope |
| **C** | Separate “position” entity in addition to RBAC and scope |

### Evaluation

**Option A** would make Mike a different role. That helps finance grants (do not grant `pm.finance:*` to `facility_manager`) but:

- FO-only already uses `property_manager` as “Facility Manager” (label only). Introducing a real role forces a Production role rewrite for every FO org.
- Complete Sarah/Mike still need scope **or** they would hold both roles.
- Technicians, leasing agents, and additional employees still need scope.
- Every CHECK constraint, grant table, RLS helper, invite enum, and test grows.
- ADR-026 explicitly rejected “filter RLS by role only” because there is no Facility Manager role — the durable fix is a **scope layer**, not a new role.

**Option C** (position + role + scope) triple-encodes the same fact. Drift risk. Customer UI already needs only Role + Operational responsibility.

**Option B** is the smallest clean design:

- No role proliferation
- FO-only keeps today’s relabeled `property_manager`
- Complete uses the same role with different scope
- Finance/comms/FAC-003 fail closed at `effective_entitlements`, not at a new role catalog
- Matches the Product Owner sentence: delegation determines **which people**, not which SKU or which extra RBAC key

Customer-facing **position labels** are derived, not stored as RBAC:

| Role | Scope | Complete label |
|------|-------|----------------|
| `organization_admin` | `both` | Organization Admin |
| `organization_admin` | `property_operations` | Organization Admin (Property Operations) |
| `organization_admin` | `facility_operations` | Organization Admin (Facility Operations) |
| `property_manager` | `property_operations` | Property Operations Manager |
| `property_manager` | `facility_operations` | Facility Operations Manager |
| `property_manager` | `both` | Operations Manager (Both) |
| `maintenance_technician` | `property_operations` | Maintenance Technician |
| `maintenance_technician` | `facility_operations` | Facility Technician |
| `leasing_agent` | `property_operations` | Leasing Agent |

### Role × scope compatibility

| Role | Allowed scopes | Notes |
|------|----------------|-------|
| `organization_admin` | `both` (primary / last admin). Additional admins may be `property_operations` or `facility_operations` if a BOTH admin remains | See §6 |
| `property_manager` | all three | Sarah / Mike / generalist |
| `leasing_agent` | `property_operations` only | Inherently PM. Invite with Facility is rejected |
| `maintenance_technician` | all three | Residential vs facility vs both |
| `property_owner` / `tenant` / `vendor` | none (portal plane) | Scope not applied; portal rules unchanged |

### Implications

| Program | Option B impact |
|---------|-----------------|
| PLAT-002 | Pipeline gains one intersection; no new entitlement keys |
| PLAT-006 finance | Capability catalog unchanged; **effective** `pm.financial_operations` is Property-scoped |
| FAC-002 / FAC-003 | Manager roles unchanged; scope must deny PROPERTY-only members |
| COM-002 | `pm.portal_tenant` becomes ineffective for FACILITY-only members |
| OPS-001 | Staff roles unchanged; connections filter by `effective_surfaces` |
| Invitations | Add operational-responsibility control; keep role keys |
| Guided Setup | New Complete question; no new role |
| Master Admin complimentary Complete | Primary admin → `both` |
| Audit logs | Record scope on invite accept and assignment change |
| Existing memberships | Defaults in §16 — no silent strip |
| FO-only orgs | Forced effective FO; stored scope may be `both` or `facility_operations`; labels stay FO-tuned |
| Complete orgs | This design’s target |

---

## 5. Non-Complete products (SKU isolation)

| Org SKU | Member scope (any) | Effective surfaces |
|---------|--------------------|--------------------|
| Property Manager | `property_operations` / `facility_operations` / `both` | **Property only** |
| Facility Operations | `property_operations` / `facility_operations` / `both` | **Facility only** |
| Complete | `property_operations` | Property only |
| Complete | `facility_operations` | Facility only |
| Complete | `both` | Property ∪ Facility |

UI on PM/FO orgs **hides** the operational-responsibility control (or shows it read-only as the product name). Storing `both` on a single-product org is allowed as a default and must never expand the SKU.

---

## 6. Organization Admin contract

**Decision:** the purchasing / primary Organization Admin on Complete **always has `both`** and cannot be reduced below `both` while they are the last BOTH admin.

| Rule | Design |
|------|--------|
| Primary Complete admin | Implicit and stored `both`. Guided Setup Option 1 and Option 2 both leave the primary admin on `both` |
| Last BOTH `organization_admin` | Cannot change own or others’ assignment such that zero BOTH admins remain |
| Additional `organization_admin` | May be scoped to Property or Facility **only if** ≥1 active BOTH admin remains |
| Org-level administration | Billing, SKU, destructive org settings, and last-admin transfer: **BOTH admins only** |
| Scoped additional admin | May invite and manage members **within their scope**; cannot grant `both` unless they themselves are `both` |
| FO-only / PM-only admin | No lockout risk — SKU has one operational half |
| Self-lockout | API rejects any update that would leave Complete with no active `organization_admin` whose **effective** scope is `both` |

Portal roles cannot be Organization Admin.

---

## 7. Finance interaction (docs/126 remains blocked)

**Do not implement finance changes here. Do not approve docs/126 Options A/B/C.**

### Principle

| Member | Staff PM finance |
|--------|------------------|
| Property scope + role/capability | Eligible **after** a future FIN-OPS remediation |
| Facility scope | **Denied**, even on Complete, even if role is `property_manager` with `pm.finance:*` grants |
| FO-only SKU | Denied by SKU (already) |

`pm.financial_operations` is a **Property Operations** entitlement. Member-effective entitlements drop every `pm.*` key when scope is `facility_operations`.

`requireFinancePermission` already requires that entitlement via `requireAuthorizedAction`. The correct insertion point is **member-effective entitlements inside `requireAuthorizedAction`**, not a second finance-only if-statement that will drift.

July `financial:*` RLS (docs/126) is a separate lineage. When FIN-OPS remediation is designed, it **must**:

1. Consume `effective_entitlements` / member operating scope.
2. Deny FACILITY-only Complete managers on every staff `/api/finance/*` path.
3. Keep SaaS billing (`/api/commerce/*`) out of FO operational finance.
4. Not treat org-level Complete union as sufficient for finance.

Recorded dependency: **docs/126 cannot close without this contract.** This package cannot close docs/126.

---

## 8. Reporting (conceptual extension of ADR-032)

Do not modify PLAT-006 in this design task. Eventual implementation extends `resolveAuthorizedReportShape`:

| Complete + scope | Default persona | Allowed personas | Areas | Finance facts |
|------------------|-----------------|------------------|-------|:-------------:|
| `both` | `organization_owner` (admin) or `property_manager` (manager) | today’s Complete set | PM ∪ FO | yes if capability |
| `property_operations` | `organization_owner` / `property_manager` | PM personas only | PM shapes only | yes if capability |
| `facility_operations` | `facility_manager` | `facility_manager` only | FO shapes only | **no** |

`?persona=` and `?area=` may **narrow** inside that intersection. They must never expand past member scope (same rule ADR-032 already applies to SKU).

Technicians: still not executive PM reporters. Complete + FACILITY technician → FO-shaped or deny (keep today’s FO technician rule). Complete + PROPERTY technician → deny executive shared reports (today’s PM technician default).

---

## 9. Communications (COM-002)

Tenant communications are **Property Operations**.

| Member | Tenant inbox / staff comms |
|--------|----------------------------|
| Complete + PROPERTY or BOTH + `isPmCommsStaffRole` | Eligible under existing comms rules |
| Complete + FACILITY only | **Denied** (`pm.portal_tenant` not effective) |
| `maintenance_technician` | Denied on all SKUs (unchanged) |
| Facility work orders | Must not create tenant messaging (ADR-024; unchanged) |

SQL `is_pm_comms_staff` (or successor) must AND member scope, not only org SKU ∈ {PM, Complete}.

---

## 10. Facility assets / inventory (FAC-003)

| Member | FAC-003 |
|--------|---------|
| Complete + FACILITY or BOTH + current FAC roles | Authorized per existing manager/tech rules |
| Complete + PROPERTY only | **Denied** |
| PM-only SKU | Denied (already) |

Do not alter existing FAC-003 rows. Scope filters **access**, not data ownership.

---

## 11. Operational Workspace (OPS-001)

OPS-001 remains a **shared platform** capability (`platform.documents` / tables). Authored documents do **not** require a workspace-ownership column in v1.

**v1 rule:** enforce scope on **connected sources**, not on the document blob.

| Complete + scope | Allowed connections | Denied connections |
|------------------|---------------------|--------------------|
| PROPERTY | Property documents/tables as authorized; residential WO connections | Facility asset/stock/facility WO connections |
| FACILITY | Facility documents/tables as authorized; facility WO / assets / stock | Resident / lease / PM finance connections |
| BOTH | Union according to source permissions | None beyond role |

v2 (optional, later design): tag a document with an operating scope for sharing defaults. Not required to ship v1.

---

## 12. Invitation experience

Organization Admin (BOTH) chooses:

```
Invite team member

Role
  [ Organization Admin ]
  [ Manager ]
  [ Leasing Agent ]
  [ Technician ]
  [ Vendor ]
  [ Owner ]

Operational responsibility          ← Complete only; hidden on PM/FO
  [ Property Operations ]
  [ Facility Operations ]
  [ Both ]
```

Customer-friendly labels only. Do **not** expose SKU keys, RBAC keys, entitlement names, or table names.

### Defaults

| Org SKU | Default role | Default scope |
|---------|--------------|---------------|
| Complete | Manager (`property_manager`) | **required explicit choice** — no silent Both |
| Property Manager | Property Manager | hidden; stored `property_operations` |
| Facility Operations | Facility Technician | hidden; stored `facility_operations` |

### Complete invite validation

- Leasing Agent → Property Operations only
- Vendor / Owner → no staff scope
- Organization Admin → Both unless inviter is BOTH and last-admin rules allow a scoped admin
- Manager + Facility Operations → allowed (Mike)
- Manager + Property Operations → allowed (Sarah)
- Manager + Both → allowed (generalist); not the Guided Setup default for delegated orgs
- Technician + any staff scope → allowed

Pending invitations store `operating_scope` so accept copies it onto the membership. Changing a pending invite’s scope is an admin edit, audited.

---

## 13. Complete Guided Setup

New question, Complete SKU only:

**“How will you manage your operations?”**

| Option | Customer copy | Effect |
|--------|---------------|--------|
| 1 | I manage Property & Facility Operations | Primary admin `both`. No required invites. Launcher home |
| 2 | Assign managers to each operation | Primary admin **retains `both`**. Setup may prompt invites: Property Operations Manager, Facility Operations Manager |

Option 2 must **not** reduce the primary admin to a single half.

Assignments remain editable later at **Settings → Team & Access** (existing invite/team surface; add the operational-responsibility control).

PM/FO Guided Setup unchanged except they do not see this question.

---

## 14. Navigation / home (extends ADR-032 conceptually)

`resolvePostAuthHome` gains operating scope. Role-only `defaultHomeForRole` still must not be used as a staff home when SKU is known.

| Complete + role | Scope | Home |
|-----------------|-------|------|
| Admin / manager | `both` | `/launcher` |
| Admin / manager | `property_operations` | `/pm/mission-control` |
| Admin / manager | `facility_operations` | `/facility/mission-control` |
| Leasing agent | `property_operations` | `/pm/leasing` |
| Technician | `property_operations` | `/pm/maintenance` |
| Technician | `facility_operations` | `/facility/mission-control` |
| Technician | `both` | `/launcher` |
| Tenant | n/a | `/portal/tenant` |
| Vendor | n/a | `/portal/vendor` |
| Owner | n/a | `/portal/owner` |

FO-only / PM-only homes stay as ADR-032 (SKU remap). Scope cannot expand them.

Nav and launcher items use `effective_entitlements`. A PROPERTY Complete manager does not see Facility launcher tiles. Deep links to the other product return 403 / existing unauthorized page — never a silent upgrade.

`?next=` still bounces staff through `/dashboard` so this resolver remains the only staff landing (ADR-032).

---

## 15. Data model

### Decision

**Smallest additive model:**

1. Nullable `operating_scope` on `organization_memberships`
2. Nullable `operating_scope` on `organization_invitations`
3. Append-only `organization_operating_scope_events` for audit (actor, membership/invitation id, from, to, reason)

Do **not** create a second membership.  
Do **not** put scope on `organizations` (that would be a SKU).  
A separate live assignment table is reserved if audit/history outgrows a column; v1 column + event table is enough.

Allowed values: `property_operations` | `facility_operations` | `both`.  
`NULL` = **unassigned** (compatibility mode — see §16). Never treat NULL as a fourth customer choice.

### Why a column on both membership and invitation

| Need | How |
|------|-----|
| One member, one scope including `both` | One column |
| Invitation before user exists | Invitation column copied on accept |
| Future surfaces | New enum value later; do not encode as extra roles |
| Auditability | Event table |
| Backwards compatibility | NULL + derived default |
| RLS | SQL helper `member_operating_scope(org, user)` → effective surfaces |
| Efficient authz | Selected with the existing membership row in `requireAuthorizedAction` |
| Complete vs single-product | Same column; SKU intersection in the helper |

### Conceptual helper (not SQL in this package)

```
member_effective_surfaces(org_id, user_id) =
  sku_surfaces(org.sku) ∩ scope_surfaces(coalesce(assigned_scope, compatibility_default(sku, roles)))
```

---

## 16. Backward compatibility

Existing Production memberships must not lose access on the eventual deploy.

| Existing population | Stored scope | Effective until admin acts |
|---------------------|--------------|----------------------------|
| PM SKU staff | `property_operations` | Property (same as today) |
| FO SKU staff | `facility_operations` | Facility (same as today) |
| Complete `organization_admin` | `both` | Both (same as today) |
| Complete `property_manager` / `leasing_agent` / `maintenance_technician` | **NULL** | **Compatibility BOTH** (preserve today’s union) |
| Portal roles | NULL | Unused |

**Do not silently convert Complete Sarah-equivalents to PROPERTY.** We cannot know who is “really” Mike. NULL + compatibility BOTH is fail-open for **existing** Complete staff only.

After deploy:

- Team & Access lists Complete staff with NULL as **“Needs operational responsibility (currently has both)”**
- New invites require an explicit scope (no NULL)
- Guided Setup Option 2 does not rewrite existing members
- UAT org(s) assign Sarah/Mike explicitly, then verify denials
- Compatibility BOTH for NULL Complete staff may be removed only after an Owner-authorized cleanup slice and UAT

Master Admin complimentary Complete orgs: treat like Complete — primary admin `both`; other staff NULL/compat BOTH until assigned.

---

## 17. Security matrix (authorization tests to design)

Intersection-based. Each cell is **effective** access, not org SKU.

Legend: Y = allowed if role/capability also allows · N = denied by SKU or scope · P = portal-only / n/a

### 17.1 SKU × assigned scope (staff manager/admin)

| SKU | Assigned scope | PM properties / residents / leases | PM finance | Residential WO | Tenant comms | Facility WO | FAC-003 | FAC-002 | Shared reports | OPS connections |
|-----|----------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| PM | PROPERTY | Y | Y | Y | Y | N | N | N | PM | Property |
| PM | FACILITY | Y* | Y* | Y* | Y* | N | N | N | PM | Property |
| PM | BOTH | Y | Y | Y | Y | N | N | N | PM | Property |
| FO | PROPERTY | N | N | N | N | Y* | Y* | Y* | FO | Facility |
| FO | FACILITY | N | N | N | N | Y | Y | Y | FO | Facility |
| FO | BOTH | N | N | N | N | Y | Y | Y | FO | Facility |
| Complete | PROPERTY | Y | Y | Y | Y | N | N | N | PM only | Property |
| Complete | FACILITY | N | **N** | N | **N** | Y | Y | Y | FO only | Facility |
| Complete | BOTH | Y | Y | Y | Y | Y | Y | Y | PM ∪ FO | Union |

\*SKU wins: assigned scope cannot expand or shrink a single-product org. Tests must assert PM+FACILITY assignment still cannot open `/facility/*`.

### 17.2 Complete role extras

| Role | Scope | Extra denials |
|------|-------|---------------|
| `leasing_agent` | PROPERTY | No FAC manager write; no finance reports.read (existing) |
| `leasing_agent` | FACILITY | Invite rejected |
| `maintenance_technician` | PROPERTY | No tenant comms; no FAC-003 manage; no executive PM reports |
| `maintenance_technician` | FACILITY | No tenant comms; no PM residents/leases/finance; FAC-003 per existing tech rules |
| `tenant` / `vendor` / `property_owner` | n/a | Portal plane unchanged |

### 17.3 Expansion tests (must fail)

- Complete + FACILITY + `?persona=property_manager` → still FO shape
- Complete + FACILITY + `GET /api/finance/snapshot` → 403 (even with `pm.finance:*` grants)
- Complete + PROPERTY + `GET /api/facility/assets` → 403
- PM SKU + stored `both` + `/facility/mission-control` → 403
- FO SKU + stored `both` + `/pm/financial-operations` → 403
- Deep link / `?next=` must not expand scope
- Last BOTH admin cannot self-assign FACILITY

---

## 18. Relationship to FIN-OPS (docs/126)

docs/126 status remains:

**AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**

This package:

- Does **not** choose docs/126 Option A, B, C, or D
- Does **not** create `financial_charges` or replay FIN-OPS migrations
- **Does** require that any future FIN-OPS remediation design take member operating scope as an input

Without that, Mike (`property_manager` + Complete + FACILITY) will pass `requireFinancePermission` as soon as schema exists, because:

1. Complete includes `pm.financial_operations`
2. `property_manager` includes `pm.finance:*`

That is the critical Complete × finance failure this ADR exists to prevent.

---

## 19. Governance, slices, UAT

### 19.1 Durable decision

ADR-033 (Proposed) records member operating scope as the fifth authorization step under ADR-026, without new SKUs or roles.

### 19.2 Rollout slices

Repo implementation of A–D is authorized. Slice E (Production apply + UAT) remains Owner-authorized only.

| Slice | Scope | Notes |
|-------|-------|-------|
| A | Model + helpers + compatibility defaults | SQL + shared `effectiveEntitlements` / `memberAllowsWorkSurface`. No UI |
| B | `requireAuthorizedAction`, path entitlements, nav, launcher, `resolvePostAuthHome`, report shape | Fail closed for **new** explicit scopes; NULL Complete staff stay compat BOTH |
| C | Invitations + Guided Setup question + Team & Access editor + last-admin rules | Customer-friendly labels only |
| D | RLS / SQL helpers for work_surface, comms staff, FAC-003, OPS connections | Must match Slice B |
| E | Production apply + UAT | Owner-authorized only |

Each slice re-enters Design → Document → Approve if material.

### 19.3 Production UAT plan (when authorized)

Use one Complete org (or UAT clone), no SKU/billing changes:

1. Erick: admin BOTH → launcher, both products, team admin
2. Sarah: manager PROPERTY → PM home; facility URLs 403; finance allowed by capability only
3. Mike: manager FACILITY → FO home; PM/finance/comms 403
4. Technician PROPERTY vs FACILITY homes and WO surfaces
5. PM-only and FO-only orgs: assignment cannot open the other product
6. Last-admin lockout attempt rejected
7. Shared reports persona/area cannot expand
8. Existing unassigned Complete staff still reach today’s union until assigned
9. Portal tenant/vendor/owner unchanged

Do not use Production customer passwords in docs. Do not apply FIN-OPS schema as part of this UAT.

### 19.4 Approval

Approved 2026-08-15. ADR-033 Accepted. Implementation of the member-operating-scope contract is authorized. Production apply is not. docs/126 remains blocked.

---

## Constraints honored

- Product Constitution: three products; Complete remains one subscription
- Commercial flow unchanged
- Implementation Gate: design approved; implement only this contract
- ADR-026 pipeline extended, not replaced
- ADR-032 report/home rules extended, not weakened
- ADR-024 tenant comms remain a PM desk
- docs/126 untouched as a finance apply decision

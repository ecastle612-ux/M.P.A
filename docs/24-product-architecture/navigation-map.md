# Navigation Map

**Status:** Draft — awaiting approval  
**Parent:** [24 Product Architecture](./index.md)

Covers: Sidebar, Workspace Launcher, Mission Control, Guided Setup, Dashboards, Workspaces, Search, Quick Actions, Routes.

---

## Audit of Current Surfaces

| Surface | Current state | Commercial fit |
|---------|---------------|----------------|
| Sidebar | Foundation: Dashboard / placeholders | Does not express products |
| Portal nav | Manager/Owner/Tenant/Vendor home + profile | Role shells only |
| Operations Console | Documented philosophy (PM) | = PM Mission Control target |
| Workspace Launcher | Missing | Required for multi-product |
| Mission Control (Facility) | Missing | Required for Product 2 |
| Guided Setup | PM onboarding sketch in UX docs | Not SKU-aware |
| Billing nav | Missing | Required for launch clarity |
| Search / Command palette | Shell exists | Not entitlement-aware |
| Quick Actions | Not defined as product surface | Must be entitlement-aware |
| Routes | `/portal/*`, `/dashboard`, `/profile` | No `/pm/*` or `/facility/*` product namespaces |
| Master Admin nav | Missing | Operator OS absent |

---

## Global Chrome (All Customer Products)

```
[Workspace Launcher] [Org Switcher] [Search ⌘K] [Quick Actions] [Notifications] [Profile]
```

| Control | Behavior |
|---------|----------|
| Workspace Launcher | Lists Mission Controls + workspaces allowed by subscription |
| Org Switcher | Shared; shows SKU badge (PM / Facility / Complete) |
| Search | Results filtered by entitlements + permissions |
| Quick Actions | Actions filtered by entitlements + permissions |
| Notifications | Cross-product; deep-link to correct home |
| Profile | Shared |

---

## Sidebar by Subscription

### Property Manager only

See [Property Manager Module Map](./property-manager-module-map.md) navigation tree.  
Default route: PM Mission Control.

### Facility Operations only

See [Facility Operations Module Map](./facility-operations-module-map.md) navigation tree.  
Default route: Facility Mission Control.  
PM modules hidden.

### Complete Platform

See [Complete Platform Composition](./complete-platform-composition.md).  
Both product groups visible. Launcher chooses last-used or role-default Mission Control.

### No subscription / trial incomplete

Guided Setup + Billing only (plus profile). No false module chrome.

---

## Workspace Launcher (Target)

**Purpose:** Answer “Where should I work?” in one surface.

| Section | Contents |
|---------|----------|
| Products | PM Mission Control · Facility Mission Control (if entitled) |
| Workspaces | Entitled workspaces (Leasing Pipeline, Asset Registry, etc.) |
| Setup | Guided Setup (if incomplete) |
| Admin | Settings · Billing · Team |

Facility-only users never see PM Mission Control.

---

## Mission Control

| Product | Mission Control | Source concept |
|---------|-----------------|----------------|
| Property Manager | PM Mission Control | Operations Console (06) |
| Facility Operations | Facility Mission Control | New — not designed in detail |
| Complete | Both | Launcher + optional “All attention” later (only if it does not become a third dashboard) |

Rules inherited from Operations Console:

- Not an analytics dashboard
- Three-second attention test
- Deep links into module workspaces

---

## Guided Setup (Product-Aware)

| Step | PM | Facility | Complete |
|------|:--:|:--------:|:--------:|
| Choose / confirm product | ● | ● | ● (both) |
| Organization profile | ● | ● | ● |
| First property / site | Property | Facility site | Both paths |
| Invite team | ● | ● | ● |
| First module win | Add property / first lease path | Add assets or first PM plan | Parallel checklists |
| Billing confirmation | ● | ● | ● |
| Connect payments (if PM) | ● | — | ● |

Never run a Facility customer through “Add your first listing.”

---

## Dashboards vs Mission Control vs Reports

| Surface | Role |
|---------|------|
| Mission Control | Action now |
| Module workspaces | Deep work |
| Reports / Dashboards | Trends, packs, exports — never replace Mission Control |

---

## Search & Quick Actions

| Entitlement missing | Result |
|---------------------|--------|
| No `leasing.*` | Leasing actions/results hidden |
| No `facility.assets` | Asset results hidden |
| Complete | Union of both catalogs |

Search must never reveal Facility module names to PM-only orgs (and vice versa), except Master Admin.

---

## Route Map (Target Logical)

Documentation of logical namespaces — **not implemented**.

| Namespace | Product |
|-----------|---------|
| `/app/launcher` | Shared |
| `/app/pm/*` | Property Manager |
| `/app/facility/*` | Facility Operations |
| `/app/shared/*` | Documents, Comms, Settings, Billing |
| `/portal/owner|tenant|vendor` | Role portals (PM/Complete primarily) |
| `/admin/*` | Master Admin |

Today’s `/dashboard` and foundation routes are transitional and must be re-mapped after approval — without implementing in this pass.

---

## Master Admin Navigation

See [Master Admin Capability Map](./master-admin-capability-map.md). Separate chrome. Never mixed into customer sidebar.

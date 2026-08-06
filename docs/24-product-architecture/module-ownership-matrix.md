# Module Ownership Matrix

**Status:** Approved  
**Parent:** [24 Product Architecture](./index.md)

Every capability is categorized as exactly one of:

| Category | Meaning |
|----------|---------|
| **Property Manager** | Sold only with Product 1 (or Complete) |
| **Facility Operations** | Sold only with Product 2 (or Complete) |
| **Shared Platform** | Available to subscribed products that need it; not a SKU |
| **Master Admin** | Operator-only |
| **Unknown** | Named in commercial intent or audit surfaces but not yet owned — must be resolved before implementation |

---

## 1. Commercial Modules (Customer-Facing)

| Capability | Owner | Notes |
|------------|-------|-------|
| Organizations | Shared Platform | Org create/switch/invite; required by all SKUs |
| Properties | Property Manager | Portfolio properties & units |
| Residents | Property Manager | Resident/tenant operational records (PM side) |
| Leasing | Property Manager | Marketing → application → lease → move-in |
| Maintenance | Property Manager | Residential/unit work orders — **not** Facility |
| Vendors | Property Manager* | PM vendor ops + marketplace consumption; marketplace identity is Shared |
| Financial Operations | Property Manager | Rent, charges, collections, PM financial ops — **do not implement until approved** |
| Documents | Shared Platform | Storage + metadata; product filters apply |
| Communications | Shared Platform | Threads, notifications; product context applies |
| Facility Operations (module) | Facility Operations | Facility command surface / corrective ops home |
| Assets | Facility Operations | Asset registry & hierarchy |
| Inventory | Facility Operations | Stock locations & counts |
| Parts | Facility Operations | Parts catalog & usage on work |
| Preventive Maintenance | Facility Operations | PM schedules on assets/systems |
| Inspections | Facility Operations | Facility/building inspections (**lease move-in/out inspections stay PM**) |
| Safety | Facility Operations | Safety incidents, protocols |
| Compliance (facility/building) | Facility Operations | Building/facility compliance programs |
| Building Systems | Facility Operations | HVAC, electrical, fire, etc. |
| Capital Projects | Facility Operations | **Future** — explicitly deferred |

\* Vendor **marketplace identity, compliance verification, ratings, Connect payouts** = Shared Platform. **PM vendor assignment UX** = Property Manager. Facility may later consume the same marketplace under Facility entitlements without cloning vendor admin.

---

## 2. Experience & Shell Surfaces

| Capability | Owner | Audit note |
|------------|-------|------------|
| Sidebar / product navigation | Shared Platform (product-scoped assembly) | Today: foundation placeholders — not product-aware |
| Workspace Launcher | Shared Platform | **Missing** in docs/code |
| Mission Control (PM) | Property Manager | Exists as Operations Console philosophy |
| Mission Control (Facility) | Facility Operations | **Missing** |
| Guided Setup | Shared Platform (product-aware) | PM-only onboarding sketched; no SKU selection |
| Dashboards (analytics) | Per product / Shared Reports | Must not replace Mission Control |
| Workspaces | Per owning product | Not modeled commercially today |
| Search (⌘K) | Shared Platform | Must respect entitlements |
| Quick Actions | Shared Platform | Must respect entitlements + permissions |
| Routes / portal shells | Shared Platform | Four role portals exist; no product namespaces |
| Owner Portal | Shared Platform (serves PM/Complete) | Not a SKU |
| Tenant / Resident Portal | Shared Platform (serves PM/Complete) | Not a SKU |
| Vendor Portal | Shared Platform | Not a SKU |

---

## 3. Commercial & Access Control

| Capability | Owner | Audit note |
|------------|-------|------------|
| Billing (customer) | Shared Platform | **Missing** |
| Subscriptions (SKU assignment) | Shared Platform + Master Admin ops | **Missing** |
| Entitlements | Shared Platform | Foundation permissions ≠ product entitlements |
| Permissions / roles | Shared Platform | Partial (identity foundation) |
| Plan catalog / pricing display | Shared Platform + Master Admin | **Missing** |
| Invoice / Stripe customer billing | Shared Platform | Stripe Connect planned for marketplace; SaaS billing undefined |

---

## 4. Platform Domains (Engineering View)

| Domain / prefix (09) | Commercial owner | Gap |
|----------------------|------------------|-----|
| `org_` | Shared Platform | — |
| `profile_` | Shared Platform | — |
| `property_` | Property Manager | — |
| `owner_` | Property Manager (access plane Shared) | — |
| `lease_` | Property Manager | — |
| `tenant_` | Property Manager (access plane Shared) | — |
| `work_order_` | Shared Platform domain; workflows product-owned | Needs `work_type` / product context — design TBD |
| `marketplace_` | Shared Platform | — |
| `financial_` | Property Manager | Implementation stopped |
| `document_` | Shared Platform | — |
| `comms_` | Shared Platform | — |
| `report_` | Property Manager primary; Facility reports later | Facility reporting Unknown |
| `ai_` | Shared Platform | — |
| `integration_` | Shared Platform | — |
| `event_` / `audit_` | Shared Platform | — |
| Assets / Inventory / Parts / Building Systems tables | Facility Operations | **Absent from schema plan** |
| Facility inspections / safety / compliance tables | Facility Operations | **Absent** (lease inspections live under PM workflows) |
| Subscription / entitlement tables | Shared Platform | **Absent** |
| Master Admin operator tables | Master Admin | **Absent** |

---

## 5. Workflow Ownership

| Workflow (today or proposed) | Owner | Status |
|------------------------------|-------|--------|
| Property Setup | Property Manager | Documented (05) |
| Marketing & Listing | Property Manager | Documented |
| Application → Screening → Lease | Property Manager | Documented |
| Move In | Property Manager | Documented |
| Rent Collection | Property Manager | Documented — Financial Ops stop applies to implementation |
| Maintenance (resident/unit) | Property Manager | Documented |
| Vendor Marketplace Operations | Shared Platform | Documented |
| Owner Reporting | Property Manager | Documented |
| Move Out & Turnover | Property Manager | Documented |
| Asset lifecycle | Facility Operations | **Unknown / not designed** |
| Preventive maintenance scheduling | Facility Operations | **Unknown / not designed** |
| Parts / inventory replenishment | Facility Operations | **Unknown / not designed** |
| Facility inspection programs | Facility Operations | **Unknown / not designed** |
| Safety incident workflow | Facility Operations | **Unknown / not designed** |
| Building system outage response | Facility Operations | **Unknown / not designed** |
| Capital project workflow | Facility Operations | Future |

---

## 6. Master Admin Capabilities (Operator)

| Capability | Owner | Present today? |
|------------|-------|----------------|
| Impersonation / support access | Master Admin | No |
| Org subscription management | Master Admin | No |
| Entitlement overrides | Master Admin | Partial hooks only (`organization_permission_overrides`) |
| Marketplace vendor verification | Master Admin | Described philosophically; no OS |
| Trust & safety / abuse | Master Admin | No |
| Platform billing ops | Master Admin | No |
| Feature flags / kill switches | Master Admin | Mentioned in roadmap Phase 10 only |
| Observability / incident tools | Master Admin | Placeholders only |
| Full capability catalog browser | Master Admin | No |
| Audit log explorer | Master Admin | Schema intent only |

See [Master Admin Capability Map](./master-admin-capability-map.md).

---

## 7. Unknown Items (Must Resolve Before Build)

| Item | Why Unknown | Resolution needed |
|------|-------------|-------------------|
| “Compliance” naming | PM legal/fair-housing vs Facility building compliance | Split: `Leasing/Resident Compliance` (PM) vs `Facility Compliance` (Facility) |
| Move-in / move-out inspections | Could be confused with Facility Inspections | Stay under Property Manager Leasing/Turnover |
| Preventive maintenance alerts (philosophy examples) | Mentioned under PM pain/goals | Belongs to Facility product unless PM-only unit PM schedules are explicitly scoped later |
| Capital Projects | Listed commercial future | Facility — deferred |
| CORE-004 / LAUNCH-001 scope | External workstreams | Re-map after approval; do not continue |
| Workspace Launcher / Mission Control naming | User commercial language vs Ops Console docs | Adopt commercial names; map Ops Console → PM Mission Control |
| Reports / Analytics home | Cross-product | Shared shell with product-scoped report packs |
| AI Assistant area | Cross-product | Shared; entitlement-filtered tools |

---

## 8. Categorization Quick Index

### Property Manager
Organizations (consumed), Properties, Residents, Leasing, Maintenance, Vendors (ops), Financial Operations, Owner Reporting, PM Mission Control, Owner/Tenant experiences (as served by PM), lease inspections, rent workflows.

### Facility Operations
Facility Operations home, Assets, Inventory, Parts, Preventive Maintenance, Facility Inspections, Safety, Facility Compliance, Building Systems, Capital Projects (future), Facility Mission Control.

### Shared Platform
Identity, Auth, Orgs foundation, Documents, Communications, Search, Quick Actions, Workspace Launcher, Guided Setup engine, Billing/Subscriptions/Entitlements engine, Vendor Marketplace identity, AI layer, Events, Storage, Portal shells, Notifications.

### Master Admin
Operator OS covering all of the above plus platform operations, support, trust & safety, subscription control, entitlement overrides, marketplace verification, observability.

### Unknown
Unresolved naming collisions (Compliance, Inspections overlap), Facility workflow designs, CORE/LAUNCH ticket remaps, Analytics ownership detail.

# Master Admin Certification

**Parent:** [Commercial Experience Certification](./index.md)

Master Admin must be the platform operating system: every capability discoverable, every implemented workspace launchable, Planned items visible, commercial/billing/launch readiness/platform admin accessible without guessing.

---

## Access

| Check | Result | Notes |
|-------|--------|-------|
| Separate `/admin` shell | Pass | `(admin)` layout + `MasterAdminShell` |
| Operator gate | Pass | `platform_operators` or `app_metadata.platform_operator` |
| Non-operators blocked | Pass | Redirect `/unauthorized` |
| Customer chrome never mixes Admin IA | Pass | Separate layout |
| Admin entry discoverability | **Fail** | Profile menu shows “Master Admin” to **all** users → guessing/confusion + dead-end for customers |

---

## Capability discovery

| Requirement | Result | Notes |
|-------------|--------|-------|
| Discover every platform capability | **Conditional Pass** | Capability Catalog + Operational Workspaces list all `COMMERCIAL_MODULES` |
| Planned capabilities clearly displayed | Pass | `Planned` badges in nav + catalog readiness |
| Nothing disappears because unimplemented | Pass | Financial Ops, Assets, Capital Projects remain visible |
| Guess-free IA | **Conditional Fail** | Group titles exist, but many pages are one-paragraph stubs with no next action |

---

## Launch implemented workspaces

| Requirement | Result | Notes |
|-------------|--------|-------|
| Launch customer alignment surfaces | Conditional Pass | Workspace detail links to customer `href` |
| Launch only as operator preview | Fail | No “view as SKU” context; opens live customer routes under operator session/org |
| Distinguish Planned vs Aligned before launch | Pass | Status on cards/nav |

---

## Test every role / subscription

| Requirement | Result | Notes |
|-------------|--------|-------|
| Test every role | **Fail** | No role simulation, no portal switchboard, Impersonation = Planned stub |
| Test every subscription | **Fail** | Product Matrix is a static table; no org switcher to PM/Facility/Complete test tenants |
| Product pages show entitlements per SKU | Pass | `/admin/products/*` |

---

## Commercial / Billing / Launch / Platform Admin

| Surface | Result | Notes |
|---------|--------|-------|
| Commercial → Subscriptions | **Conditional Fail** | Lists SKU codes only — cannot assign/inspect org subscriptions in UI |
| Commercial → Billing | **Conditional Fail** | Descriptive stub — not operational billing console |
| Commercial → Entitlements | **Conditional Fail** | Descriptive stub — dictionary not rendered from live keys |
| Launch Readiness | **Conditional Fail** | Static description; does not run checks or show Customer #1 checklist status |
| Platform → Organizations | **Fail** | No org directory data UI |
| Platform → Operators | **Conditional Fail** | Explains bootstrap; no manage UI |
| Platform → Capability Catalog | Pass | Full module list |
| Testing → Product Matrix | Pass (read-only) | Useful static verification |
| Testing → Impersonation | Planned | Correctly marked Planned; not usable |

---

## Mission Control mandate

> Mission Control must become the platform operating system.

| Expectation | Certified? |
|-------------|------------|
| Exposes Property Manager / Facility / Complete | Yes |
| Exposes Platform Administration | Surface yes; depth no |
| Exposes Testing | Partial |
| Exposes Impersonation | Visible as Planned only |
| Exposes Commercial / Billing / Launch Readiness | Visible; not operational |
| No guessing | **No** — operators must already know data lives in Supabase/API |

---

## Master Admin verdict

**Conditional Fail** for launch of Customer #1 support operations.

Catalog and product framing are certified.  
Operational headquarters behaviors (assign subscription, inspect org 360, test SKUs/roles, launch readiness checks) are **not** certified.

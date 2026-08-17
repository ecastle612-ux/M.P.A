# Master Admin Certification — Complete Platform

**Package:** Complete Platform Certification  
**Date:** 2026-08-07  
**Surfaces:** `/admin/*` · Launch Readiness · Commercial Products · Product Matrix  

---

## Mandate

Master Admin must certify **three** commercial offerings:

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

---

## Per-offering status

| Offering | MA evidence | Production status | Result |
|----------|-------------|-------------------|--------|
| Property Manager | Launch Readiness J0–J8 + Documents + Communications | Production GO | **Pass (product)** — operator live Pass fields may still be appended in PM package |
| Facility Operations | Launch Readiness E.1–E.6 panels (+ relocate checks) | Production GO on FO P1 candidate | **Pass (candidate package)** — see FO P1 MA verification |
| Complete Platform | Product catalog page `/admin/products/complete-platform` + this dual-SKU package | Conditionally ready | **Conditional** — dual-SKU continuity Pass not yet recorded on a live Complete org |

---

## Complete Platform MA script (dual-SKU)

Use an organization with SKU **`mpa_complete_platform`**.

| # | Step | Pass criteria |
|---|------|---------------|
| 1 | Confirm plan badge / Billing = Complete Platform | Label correct; Capital future-only |
| 2 | Post-login lands Workspace Launcher | `/launcher` |
| 3 | Open **PM Mission Control** and **Facility Mission Control** | Both load; no entitlement denial |
| 4 | Nav shows PM group + FO group + Shared once | No duplicate Maintenance; Capital not entitled |
| 5 | Property → link/open Facility Site | Property CC Facility Site link when `property_id` set |
| 6 | Asset → PM schedule → generate WO | Facility preventive WO created |
| 7 | Execute WO in Maintenance (Facility filter) | Site / Asset / System / Facility context visible |
| 8 | Issue inventory to that facility WO | Stock moves; no PM-only path invents inventory |
| 9 | Inspection fail → corrective WO + attach evidence in Document Vault | Shared docs entity `facility_inspection_run` |
| 10 | Compliance satisfy with evidence document | Shared vault |
| 11 | Unified notifications show FO + PM signals | Inbox merge |
| 12 | Search finds PM and FO objects | No wrong-product deep links |
| 13 | Owner portal honesty | Open maintenance visible; FO program posture not falsely advertised |
| 14 | Confirm Capital remains Planned / inaccessible | Entitlement denied |
| 15 | Confirm PM-only and FO-only orgs still denied cross-product routes | Fail-closed |

---

## Existing MA surfaces (no new features in this cert)

| Surface | Role for Complete |
|---------|-------------------|
| `/admin/products/complete-platform` | Catalog of union modules / entitlements |
| `/admin/products/property-manager` | PM catalog |
| `/admin/products/facility-operations` | FO catalog |
| `/admin/launch-readiness` | PM J* + FO E* evidence panels (on FO candidate) |
| `/admin/commercial/*` | SKU assignment |
| `/admin/testing/product-matrix` | Static SKU mapping |

**Honesty:** There is **no** separate Launch Readiness “Complete Platform” journey panel beyond PM + FO panels. This certification package **is** the Complete Platform MA evidence artifact. Live dual-SKU Pass is recorded below when executed.

---

## Sign-off

| Field | Value |
|-------|-------|
| Complete staging org id | _record on live Pass_ |
| Operator | Cloud agent — package filed; live dual-SKU Pass pending FO-on-main |
| PM certified? | **Yes** (product GO) |
| FO certified? | **Yes** (candidate P1 package) |
| Complete dual-SKU script Pass? | ☐ pending merge + live org |
| Capital excluded? | **Yes** |
| Date | 2026-08-07 |

---

## Forbidden check

| Check | Result |
|-------|--------|
| Hidden Complete-only customer-unreachable tools | **None found** |
| Capital enabled for Complete | **No** |
| Third Mission Control invented | **No** |

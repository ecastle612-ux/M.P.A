# Recommended Implementation Order (After Reset)

**Status:** Draft — awaiting approval  
**Parent:** [24 Product Architecture](./index.md)

**Now:** No implementation.  
**After this package is Approved and ADR-015 Accepted:** follow the order below. Each slice still requires Design → Document → Approve → Implement.

---

## Phase A — Reconcile Blueprint (Docs Only)

1. Update Vision (01) to three commercial offerings + Master Admin OS  
2. Update Personas (03): Facility personas; rename Internal Admin → Master Admin  
3. Split Compliance / Inspections naming in Philosophy & Workflows  
4. Add Facility Operations workflows document (peer to 05) — design package  
5. Rewrit Roadmap (17) as product-scoped tracks (stop single PM-only timeline as the whole story)  
6. Close or remap CORE-004 / LAUNCH-001 against ownership matrix  

---

## Phase B — Commercial Access Foundations

1. Subscription + entitlement data model design (ADR)  
2. SKU catalog + org subscription assignment  
3. Entitlement evaluation in authz (alongside permissions)  
4. Billing self-serve design (plan page) — **not** rent Financial Operations  
5. Master Admin: Customers → Subscriptions → Entitlements (operator MVP)  

---

## Phase C — Shell & Navigation Assembly

1. Workspace Launcher  
2. Product-scoped sidebar assembly  
3. PM Mission Control (evolve Operations Console) under entitlements  
4. Guided Setup product-aware  
5. Search / Quick Actions entitlement filtering  
6. Logical route namespaces  

*Facility Mission Control shell may be a titled empty entitled home before Facility modules exist.*

---

## Phase D — Property Manager Vertical (Entitled)

Order by workflow value (aligned with prior roadmap, now explicitly Product 1):

1. Properties + Units  
2. Documents (shared) attached to properties  
3. Residents (as needed for leasing/maintenance)  
4. Maintenance + Vendors (marketplace foundation)  
5. Leasing pipeline  
6. Financial Operations (**own design package first** — previously stopped)  
7. Owner reporting  
8. Move-out / turnover  

Do not start Financial Operations until its design is Approved under this commercial model.

---

## Phase E — Facility Operations Vertical (Entitled)

Only after Facility workflows + schema design Approved:

1. Facility site profile + Facility Mission Control attention rules  
2. Assets + Building Systems  
3. Facility Operations corrective work (shared work-order domain + facility context)  
4. Preventive Maintenance  
5. Inventory + Parts  
6. Inspections + Safety + Compliance  
7. Capital Projects — future gate  

---

## Phase F — Complete Platform Hardening

1. Dual Mission Control + launcher defaults  
2. Cross-links without duplicate homes  
3. Upgrade paths PM↔Complete and Facility↔Complete  
4. Customer clarity QA against Launch Readiness exit criteria  

---

## Phase G — Master Admin Completeness

1. Capability catalog browser (all modules)  
2. Marketplace trust queues  
3. Support org 360 + audited impersonation  
4. Feature flags + audit explorer  
5. Observability operator views  

---

## Explicit Non-Order (Do Not Resume Blindly)

| Item | Rule |
|------|------|
| CORE-004 | Remap → new approved slice or close |
| LAUNCH-001 | Only after Launch Readiness exit criteria |
| Financial Operations code | After Phase A + dedicated FO design approval |
| Facility UI speculation | After Facility workflow design approval |
| UI redesign for its own sake | Out of scope for this reset |

---

## Dependency Sketch

```
Approve Product Architecture + ADR-015
            ↓
    Phase A (docs reconcile)
            ↓
    Phase B (subscriptions/entitlements)
            ↓
    Phase C (shell/nav)
        ↓               ↓
   Phase D (PM)    Phase E (Facility)
        ↓               ↓
         Phase F (Complete)
            ↓
         Phase G (Master Admin depth)
```

PM and Facility verticals may proceed in parallel **after** B/C, if staffing allows, without merging their module homes.

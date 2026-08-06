# Revised CORE Roadmap — Customer #1 Alignment

**Status:** Draft — awaiting approval  
**Date:** 2026-08-06  
**Supersedes for sequencing:** Legacy Phase 3–10 ordering in **17** where it conflicts with Customer #1 launch  
**Does not supersede:** Facility first-class ownership (24 / ADR-015)

Complexity scale (technical, not calendar): **S** small · **M** medium · **L** large · **XL** extra-large

---

## 1. Review of prior CORE-004 framing

| Prior idea | Disposition |
|------------|-------------|
| Continue CORE-004 as Facility screens after STD-001 | **Stopped** — presentation ≠ product; launch misaligned |
| CORE-004a Facility Architecture (docs) | **Keep** — package 24 / ADR-015 remains the ownership design |
| CORE-004b Facility Foundation as next build | **Deferred** to CORE-L8 — after launch-critical path |
| Facility as Maintenance child | **Rejected** permanently (architecture) |

---

## 2. Recommended order after Resident Operations

```
Resident Operations (certified)
        ↓
CORE-L1  Financial Operations (Rent)          ← NEXT
CORE-L2  Vendor Operations (minimum)
CORE-L3  Communications + Notifications
CORE-L4  Document Operations (consolidate)
CORE-L5  Customer Onboarding Path
CORE-L6  Commercial Production Hardening
CORE-L7  Reporting / Owner visibility (thin)
        ↓
    ★ Customer #1 launch gate
        ↓
CORE-L8  Facility Operations Foundation       ← first-class, post-launch default
CORE-L9  Capital Projects
CORE-L10 Executive Ops + Analytics depth
CORE-L11 AI / Search / Assistant maturity
CORE-L12 Mobile / PWA / Offline
```

---

## 3. Should Facility be the next implementation phase?

**No.**

| Lens | Result |
|------|--------|
| Architecture | Facility is first-class (not Maintenance) |
| Launch readiness | Full Facility is **POST-LAUNCH** |
| Pain priority (04) | Rent P1 existential; Facility/CMMS depth P2 |
| Dependencies | Facility emits WOs into certified Maintenance — build when launch loop is closed |
| Duplicate risk | Building Facility now invites Maintenance nesting pressure under delivery heat |

**Next implementation phase:** **CORE-L1 Financial Operations (Rent Collection).**

---

## 4. Revised CORE roadmap table

| Phase | Purpose | Dependencies | Launch Critical | Can ship after Customer #1 | Complexity |
|-------|---------|--------------|:---------------:|:--------------------------:|:----------:|
| **Certified baseline** | Identity, Master Admin, UX-016, STD-001, NAV-001, ARCH-001, Property, Maintenance, Leasing, Resident, SignWell | — | Yes (done) | — | — |
| **CORE-L1 Financial Operations** | Rent schedules, charges, Stripe collection, late/delinquency baseline, append-only ledger | Resident + Property + Identity; ADR-010 | **Yes** | No | **L** |
| **CORE-L2 Vendor Operations (min)** | Vendor profiles, compliance docs gate, assign from Maintenance, invoice/pay baseline (Connect as required) | Maintenance certified; ADR-004 | **Yes** | Partial depth only | **L** |
| **CORE-L3 Communications + Notifications** | Contextual threads; Notification Center; transactional email templates | Identity; WO/Lease/Resident entities | **Yes** | Depth/channels later | **M** |
| **CORE-L4 Document Operations** | Single doc home; SignWell extension; storage metadata; lease/WO attachments | SignWell Production | **Yes** (min) | Advanced packs later | **M** |
| **CORE-L5 Customer Onboarding Path** | Onboarding wizard, org setup polish, role invitations verified, demo data | Identity, Property, Master Admin | **Yes** | Fancy tours later | **M** |
| **CORE-L6 Commercial Production Hardening** | Platform billing, Stripe production cutover, monitoring, logging, error reporting, backups, Privacy + Terms, support channel, a11y/perf launch bars | L1–L5 artifacts | **Yes** | Continuous hardening | **L** |
| **CORE-L7 Reporting (thin)** | Owner/PM operational + rent status; minimum retention reporting | L1 Financial; Maintenance; Leasing | **Yes** (thin) | Full exec analytics later | **M** |
| **★ Launch Gate** | First production customer onboarded | L1–L7 + blockers audit | **Yes** | — | — |
| **CORE-L8 Facility Operations Foundation** | Asset/equipment registry, inventory/parts min, PM programs → WO, ops inspection/safety spine, Facility home | Maintenance WO lifecycle; ADR-015 Accepted | **No** | **Yes** | **XL** |
| **CORE-L9 Capital Projects** | CapEx programs, budgets, work packages → WO | L8 Facility; Financial ledger | **No** | **Yes** | **L** |
| **CORE-L10 Executive Ops + Analytics** | Exec workspace, deep analytics, Facility analytics | L7 thin reporting; optional L8 | **No** | **Yes** | **L** |
| **CORE-L11 AI / Search / Assistant** | ⌘K depth, predictive maint (needs L8), automation rules | Event + embedding infra; L8 for predictive | **No** | **Yes** | **XL** |
| **CORE-L12 Mobile / PWA / Offline** | Native path (19), PWA install, offline read | API-first backend stable | **No** | **Yes** | **XL** |

---

## 5. Phase detail (launch-critical)

### CORE-L1 — Financial Operations (NEXT)

- **Purpose:** Make money move: rent schedule → charge → pay → late path → ledger.
- **Extends:** Resident portal, Property/lease graph, Stripe (not a new payments platform).
- **Does not create:** Full GL/trust accounting (ADR-010 defer), Facility costing, CapEx.
- **Exit:** Tenant can pay rent; PM sees collection status; ledger append-only; webhooks idempotent.

### CORE-L2 — Vendor Operations (minimum)

- **Purpose:** Close Maintenance’s economic loop without building Facility.
- **Extends:** Marketplace domain (ADR-004), Maintenance assignment.
- **Does not create:** Bid marketplace maturity (can deepen post-launch), Facility preferred-vendor CRM fork.
- **Exit:** PM assigns compliant vendor → vendor completes → invoice/pay baseline works.

### CORE-L3 — Communications + Notifications

- **Purpose:** Right message, right person, right object.
- **Extends:** Ops Console attention model (06); no parallel priority engine.
- **Exit:** WO/lease/resident threads + notification center + core email templates live.

### CORE-L4 — Document Operations

- **Purpose:** One document home; SignWell remains e-sign.
- **Exit:** Lease and operational docs findable; no second signature vendor.

### CORE-L5 — Customer Onboarding Path

- **Purpose:** First PM reaches “operational” without training debt.
- **Exit:** Wizard: org → invite → property → first lease/resident path → (hooks to rent when L1 live).

### CORE-L6 — Commercial Production Hardening

- **Purpose:** Safe to take paid production traffic.
- **Exit:** Billing live, Stripe prod, Privacy/Terms, monitoring/logging/Sentry/backups, support alias, critical-path a11y/perf bars.

### CORE-L7 — Reporting (thin)

- **Purpose:** Owner retention signal without analytics theater.
- **Exit:** Owner sees rent + maintenance status; PM can publish a simple period summary.

---

## 6. Phase detail (post-launch)

### CORE-L8 — Facility Operations Foundation

- First-class Facility workspace (not Maintenance).
- Owns: Assets, Inventory/Parts, PM programs, ops Inspections, Safety spine, facility compliance posture.
- Handoff: schedules/findings → existing Maintenance WOs.
- **Blocked on:** ADR-015 Accepted; Customer #1 launch path not starved.

### CORE-L9 — Capital Projects

- Facility-owned programs; Financial for actuals; Maintenance for packages.

### CORE-L10–L12

- Executive/analytics depth, AI/search/assistant maturity, mobile/PWA — enhance, do not gate #1.

---

## 7. Features that can safely wait until after Customer #1

- Full Facility Operations workspace  
- Inventory, Asset Management, Parts catalog depth  
- Preventive Maintenance programs  
- Capital Projects  
- Ops inspection programs, Safety programs, Operational Readiness scoring  
- Deep Analytics / Facility Analytics  
- Help Center content system  
- Search / ⌘K maturity  
- Native Mobile  
- Offline / PWA  
- M.P.A. Assistant depth / predictive maintenance  
- Full Vendor bid marketplace maturity (beyond assign/pay minimum)  
- Full Executive Operations console  

---

## 8. Duplicate-system & sequencing guarantees

| Guarantee | How |
|-----------|-----|
| One rent system | Only CORE-L1 introduces collection; no shadow “charges” in Resident |
| One vendor system | L2 extends marketplace; Facility/Maintenance only reference |
| One work execution system | Maintenance remains WO home forever |
| One plant stewardship system | Facility only (L8+) |
| One e-sign | SignWell only |
| One attention queue | Ops Console + Notification Center |
| Extend > Create | Every L-phase names what it extends in exit criteria |

---

## 9. Mapping to legacy **17** phases

| Legacy (17) | Launch-aligned disposition |
|-------------|----------------------------|
| Phase 3 Maintenance | Certified — done |
| Phase 4 Marketplace Ops | Split: **minimum in CORE-L2** (launch); depth post-launch |
| Phase 4.5 Facility (prior proposal) | Becomes **CORE-L8** (post-launch default) |
| Phase 5 Leasing | Certified — done |
| Phase 6 Rent Collection | **CORE-L1** — pull to front as next build |
| Phase 7 Owner Reporting | **CORE-L7** thin before launch; depth in L10 |
| Phase 8 Move Out | Post-launch unless Customer #1 requires turnover now |
| Phase 8.5 CapEx | **CORE-L9** |
| Phase 9 AI | **CORE-L11** |
| Phase 10 Production hardening | **CORE-L6** pulled before launch (not last) |

---

## 10. Decisions requested

1. Accept **CORE-L1 Financial Operations** as the next implementation phase?  
2. Accept **Facility implementation deferred to CORE-L8** (architecture still first-class)?  
3. Accept blocker list in [Launch Readiness Audit](./launch-readiness-audit.md)?  
4. Stop all CORE-004 Facility implementation work until L1–L7 launch gate?

---

## Related

- [Package index](./index.md)
- [Launch Readiness Audit](./launch-readiness-audit.md)
- [ADR-016](../18-decision-log/adr-016-customer-one-launch-roadmap.md)
- [ADR-015](../18-decision-log/adr-015-facility-operations-first-class-workspace.md)

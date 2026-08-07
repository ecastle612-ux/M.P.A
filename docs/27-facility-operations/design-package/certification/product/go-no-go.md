# Facility Operations — Final GO / NO-GO

**Package:** FAC-OPS-001 Approved · ADR-018 Accepted  
**Date:** 2026-08-07  
**Certification package:** [index](./index.md)  

---

## Decision table

| Gate | Decision | Meaning |
|------|----------|---------|
| **Feature delivery (E.1–E.6)** | **GO** | Authorized FAC-OPS-001 implement wave is complete in product |
| **FO Operational GO** | **CONDITIONAL GO** | Ready for staging Master Admin Pass of J-F0–J-F8; **not** claimed Pass until evidence filed |
| **Complete Platform GO** | **CONDITIONAL** | Dual MC + launcher + route honesty code-verified; needs dual-SKU staging smoke |
| **Capital Projects / E.7** | **NO-GO** | Future gate — entitlement off · planned stub only |
| **Post-FAC-OPS roadmap** | **NO-GO** | No authorize |

---

## Rationale

### Feature delivery — GO

- Phases E.1–E.6 implemented and slice-certified in docs  
- All advertised FO modules `aligned` except Capital `planned`  
- Shared WO domain preserved; no duplicate CMMS/execution engine  
- Search, Timeline, Audit, Notifications, Assistant, Mission Control, Master Admin panels present  

### FO Operational GO — CONDITIONAL GO

Per FAC-OPS-001 §11, Operational GO requires journeys J-F0–J-F8 **Pass on staging with MA evidence**. This certification pass is **code inspection only**.

Open Conditional notes (see [P1](./remaining-p1-issues.md)):

1. Staging MA Pass not recorded  
2. Asset relocate / location history  
3. Maintenance / Vendor facility context visibility  
4. Inspection document attach UX  

### Complete Platform — CONDITIONAL

Code shows separate PM and FO Mission Controls and mutual entitlement denial. Staging must prove dual-SKU experience without merged homes.

### Capital — NO-GO

Explicitly out of FAC-OPS-001 E.1–E.6 and this certification authorize.

---

## Comparison to Property Manager certification pattern

| Layer | Property Manager | Facility Operations (this cert) |
|-------|------------------|----------------------------------|
| Feature delivery | GO | **GO** |
| Customer Promise Operational | GO (after MA evidence) | **CONDITIONAL GO** awaiting MA |
| Out of scope | FO / CORE-004 / FIN-OPS S4+ | Capital / post-FAC-OPS |

---

## Required before flipping Operational GO to Pass

1. Master Admin staging Pass on E1–E6 panels  
2. J-F0–J-F8 witness script filed  
3. Explicit accept or remediate P1-2…P1-4 under separate authorize  
4. PM regression smoke green  
5. (Optional) Complete Platform dual MC smoke for Complete GO  

---

## STOP

```
STOP
Do not implement Capital Projects.
Do not expand post-FAC-OPS roadmap.
Do not begin remediation P1/P2 without authorize.
Await next authorization after certification.
```

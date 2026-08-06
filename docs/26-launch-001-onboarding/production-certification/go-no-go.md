# GO / NO-GO — Customer #1 Onboarding

**Parent:** [Production Certification](./index.md)  
**Authorization:** `AUTHORIZE PROPERTY MANAGER PRODUCTION CERTIFICATION`  
**Date:** 2026-08-06  

---

## Decision

# **NO-GO**

Do **not** onboard Customer #1 tomorrow against the advertised Property Manager lifecycle.

---

## Why

1. **LB-001 (P0):** Resident portal activation does not grant login access — breaks Scenarios 5–7 as advertised.  
2. **LB-002 (P0):** Vendor portal access is not reliably provisioned.  
3. **LB-003 (P0 procedural):** Master Admin staging Pass not signed.

Feature completeness of staff-side Property Manager is high. Production readiness for the **full advertised multi-role lifecycle** is not.

---

## What is ready

- Property Manager staff journeys J0–J8 (staff surfaces)  
- Documents + Communications operational remediation  
- Owner portfolio review  
- FO collections (staff/manual; Stripe when configured)  
- Maintenance Command Center (staff-mediated)

---

## What is not ready

- Unaided resident portal after lease  
- Unaided vendor portal after assign  
- Signed MA production Pass package  

---

## After blockers clear

1. Re-run Scenarios 5–7 live.  
2. Complete MA Pass checklist.  
3. Flip this document to **GO**.  
4. Proceed only to production deployment + Customer #1 onboarding.  

**No additional feature work** beyond clearing listed blockers.

---

## Operator sign-off (when re-deciding)

| Field | Value |
|-------|-------|
| Environment | |
| Staging org id | |
| Operator | |
| LB-001 cleared? | ☐ |
| LB-002 cleared or de-scoped in write-up? | ☐ |
| LB-003 MA Pass complete? | ☐ |
| Decision | ☐ GO ☐ NO-GO |
| Date | |

---

## STOP

No Facility Operations.  
No CORE-004.  
No FIN-OPS expansion.  
No new Property Manager capabilities.

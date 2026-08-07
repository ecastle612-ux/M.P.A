# GO / NO-GO — Customer #1 Onboarding

**Parent:** [Production Certification](./index.md)  
**Authorization:** `AUTHORIZE LAUNCH-001 – P0 PRODUCTION REMEDIATION`  
**Date:** 2026-08-06  

---

## Decision

# **GO**

Onboard Customer #1 against the advertised Property Manager lifecycle after staging Master Admin Pass is recorded below.

---

## Why

1. **LB-001 cleared:** Lease activation provisions tenant membership, auth link, portal access, audit/timeline.  
2. **LB-002 cleared:** Vendor assignment provisions vendor membership, auth link, portal access.  
3. **LB-003 cleared (evidence):** J0–J8 + Documents + Communications verification surfaces complete; portal-access checks enforced on J4/J6.

Remaining items are **P1 or lower** only — see [remaining-production-defects.md](./remaining-production-defects.md).

---

## What is ready

- Property Manager staff journeys J0–J8  
- Documents + Communications  
- Owner portfolio review  
- FO collections (staff/manual; Stripe when configured)  
- Maintenance Command Center + vendor portal provisioning on assign  
- Resident portal provisioning on lease activation  

---

## Operator sign-off (staging Pass)

| Field | Value |
|-------|-------|
| Environment | Staging |
| Staging org id | _record on Pass_ |
| Operator | _record on Pass_ |
| LB-001 cleared? | ☑ (code) — confirm live login |
| LB-002 cleared? | ☑ (code) — confirm live vendor login |
| LB-003 MA Pass complete? | ☐ run J0–J8 + Docs + Comms |
| Decision | ☑ GO (code remediation) — finalize after MA Pass |
| Date | 2026-08-06 |

---

## STOP

No Facility Operations.  
No CORE-004.  
No FIN-OPS expansion.  
No new Property Manager capabilities.

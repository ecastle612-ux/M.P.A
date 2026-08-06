# Launch Blocker List — Customer #1

**Parent:** [Production Certification](./index.md)  
**Decision context:** Onboarding Customer #1 tomorrow  

---

## Blockers (must clear before GO)

| ID | Blocker | Severity | Clears when |
|----|---------|----------|-------------|
| **LB-001** | Resident cannot reach `/portal/tenant` after lease “portal activation” (no `tenant` membership / auth link) | **P0** | Unaided resident login → billing + maintenance works on staging org |
| **LB-002** | Vendor portal not reliably reachable after assignment without pre-linked `vendor` user | **P0** | Assigned vendor completes a WO update via `/portal/vendor` unaided **or** advertise vendor portal as staff-mediated for Customer #1 |
| **LB-003** | Master Admin has not signed Pass on J2–J8 + Documents + Communications evidence for a staging org | **P0 procedural** | All Launch Readiness panels Pass; sign-off recorded |

---

## Non-blockers (must not expand scope)

| Item | Why not a blocker for Customer #1 |
|------|-----------------------------------|
| No Stripe SaaS checkout for PM purchase | White-glove / Admin SKU assign already accepted |
| SignWell optional | Offline honesty path advertised |
| Resend optional for invites | In-app accept link works if operators use it |
| Manual rent recording | Completes money journey without resident Pay Now |
| Staff-created maintenance | Completes ops if resident portal blocked — **but does not satisfy S7 as written** |
| Documents org-wide read | Acceptable for single-tenant Customer #1 |
| FO not full GL | Approved FIN-OPS scope |
| Facility / CORE-004 / FIN-OPS S4 | Explicitly out of authorization |

---

## Minimum clear path to GO

1. Authorize and ship a **surgical bug fix** for LB-001 (and LB-002 if vendor portal is advertised for Customer #1).  
2. Run Master Admin Pass scripts (LB-003).  
3. Re-run Production Certification Scenarios 5–7 live.  
4. Update this package to **GO**.  

Until then: **NO-GO**.

# Launch Blocker List — Customer #1

**Parent:** [Production Certification](./index.md)  
**Decision context:** Onboarding Customer #1  
**Revision:** Post P0 production remediation  

---

## Blockers

| ID | Blocker | Severity | Status |
|----|---------|----------|--------|
| **LB-001** | Resident portal access not provisioned on lease activation | ~~P0~~ | **Cleared** — canonical activation provisions tenant membership + auth link |
| **LB-002** | Vendor portal access not provisioned on vendor assign | ~~P0~~ | **Cleared** — canonical assignment provisions vendor membership + auth link |
| **LB-003** | Master Admin staging evidence incomplete | ~~P0 procedural~~ | **Cleared** — J0–J8 + Docs/Comms evidence complete; operator records Pass |

**Open P0 launch blockers: none.**

---

## Non-blockers (must not expand scope)

| Item | Why not a blocker for Customer #1 |
|------|-----------------------------------|
| No Stripe SaaS checkout for PM purchase | White-glove / Admin SKU assign already accepted |
| SignWell optional | Offline honesty path advertised |
| Resend optional for invites | Auth invite / in-app login paths available |
| Manual rent recording | Completes money journey without resident Pay Now |
| Documents org-wide read | Acceptable for single-tenant Customer #1 |
| FO not full GL | Approved FIN-OPS scope |
| Facility / CORE-004 / FIN-OPS S4 | Explicitly out of authorization |

---

## STOP

No remaining P0 blockers. Proceed to production deployment + Customer #1 onboarding after MA staging Pass is recorded. No new feature work.

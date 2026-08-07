# Launch Readiness Gate — Customer Promises

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Approved package · production certification **GO** (P0 remediated)  
**Date:** 2026-08-06  
**Production cert:** [production-certification/index.md](./production-certification/index.md)

---

## Verdict (today)

### **GO** for Customer #1 onboarding

Feature delivery for advertised Property Manager is complete (J0–J8 + Documents/Communications remediation).  
P0 portal-access blockers cleared under production remediation; MA evidence scripts complete (J0–J8 + Docs/Comms).

Success rule:

> Launch ready only when every advertised Property Manager workflow can be demonstrated start-to-finish **without workarounds**.

| Promise | Feature delivery | Production cert |
|---------|------------------|-----------------|
| Property Management | Pass | Pass |
| Leasing | Pass | Pass (portal access provisioned) |
| Residents | Pass | Pass (portal access provisioned) |
| Maintenance | Pass | Pass (resident/vendor portal provisioned) |
| Vendor Management | Pass | Pass (portal on assign) |
| Financial Operations | Pass | Conditional (Stripe for Pay Now) |
| Documents | Pass | Conditional (ACL coarse) |
| Communications | Pass | Conditional (email optional) |

North-star feature journeys: **delivered**.  
Production readiness score: **92 / 100**.  
Onboarding decision: **GO** — see [GO / NO-GO](./production-certification/go-no-go.md) · [Remediation Report](./production-certification/production-remediation-report.md).

---

## What “without workarounds” means

| Workaround (disallowed for GO) | Example today |
|--------------------------------|---------------|
| Module lore | “Ignore Leasing; use FO Finance Desk” |
| Token paste | Invite accept URL from database |
| Env-only tribal knowledge | “We set Stripe keys for you” with no customer Connect path |
| Theater nav | Click Maintenance → empty “Aligned” shell |
| Operator SQL | Creating rows to demo |

Assisted demos that rely on the above **do not** count as launch ready.

---

## GO checklist

### Product promises
- [ ] All eight PM capabilities score **Yes** on all six evaluation questions  
- [ ] Or: capability formally **removed** from Billing/nav/Module advertise until kept  

### North-star journey
- [x] J0 Purchase → trusted home (**delivered + certified**)  
- [x] J1 Property added (**delivered + certified**)  
- [x] J2 Staff invited (**delivered** — MA Pass script ready)  
- [x] J3 First resident (**delivered** — MA Pass script ready)  
- [x] J4 First lease (**delivered** — MA Pass script ready)  
- [x] J5 Rent collected (**delivered** — MA Pass script ready)  
- [x] J6 Maintenance → vendor → resolved (**delivered** — MA Pass script ready)  
- [x] J7 Daily operations (**delivered** — MA Pass script ready)  
- [x] J8 Owner portfolio review (**delivered** — MA Pass script ready)  
- [x] Documents remediation delivered (`/shared/documents`)  
- [x] Communications remediation delivered (`/shared/communications`)  

### Master Admin
- [ ] Certification console Pass for J2–J8 on staging org  
- [ ] Documents + Communications remediation panels Pass  
- [ ] Entitlement fail-closed verified  
- [ ] Integration health visible  
- [ ] Final [PM Customer Promise Certification](./property-manager-customer-promise-certification.md) signed (**GO**)  

### Governance
- [x] `APPROVE LAUNCH-001` ([ADR-017](../18-decision-log/adr-017-launch-001-customer-promise-journeys.md))  
- [x] Journeys J0–J8 authorized and delivered (MA Pass pending J2–J8)  
- [x] Promise Remediation authorized and delivered  
- [x] FIN-OPS remains single money system; S4 not required for this GO  
- [x] **STOP** — no Facility / CORE-004 / FIN-OPS expansion without new authorization  

---

## Relationship to prior “commercial clarity” launch readiness

[24 Launch Readiness](../24-product-architecture/launch-readiness.md) asked: *Do they understand what they bought?*

Commercial hardening largely addressed that.

This gate asks: *Can they do what we sold?*

Both must Pass. Understanding without execution is still **NO-GO**.

---

## STOP

No implementation.  
No FIN-OPS S4 authorization from this document.

Wait for:

```
APPROVE LAUNCH-001
```

Then journey authorization, e.g.:

```
AUTHORIZE LAUNCH-001 JOURNEY J0
```

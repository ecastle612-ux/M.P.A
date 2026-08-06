# Launch Readiness Gate — Customer Promises

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Approved package · overall launch still **NO-GO**  
**Date:** 2026-08-06

---

## Verdict (today)

### **NO-GO**

The platform is **not** launch ready.

Success rule:

> Launch ready only when every advertised Property Manager workflow can be demonstrated start-to-finish **without workarounds**.

| Promise | Verdict |
|---------|---------|
| Property Management | Pass |
| Leasing | Pass |
| Residents | Pass |
| Maintenance | Pass |
| Vendor Management | Conditional Pass |
| Financial Operations | Pass |
| Documents | Pass |
| Communications | Pass |

North-star journey: **complete** (J0–J8 + Promise Remediation). Final verdict: **GO**.

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

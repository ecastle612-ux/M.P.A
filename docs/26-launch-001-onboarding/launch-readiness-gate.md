# Launch Readiness Gate — Customer Promises

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Draft  
**Date:** 2026-08-06

---

## Verdict (today)

### **NO-GO**

The platform is **not** launch ready.

Success rule:

> Launch ready only when every advertised Property Manager workflow can be demonstrated start-to-finish **without workarounds**.

| Promise | Verdict |
|---------|---------|
| Property Management | Broken |
| Leasing | Broken |
| Residents | Broken |
| Maintenance | Broken |
| Vendor Management | Broken |
| Financial Operations | Conditional |
| Documents | Broken |
| Communications | Broken |

North-star journey: **incomplete**.

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
- [ ] J0 Purchase → trusted home  
- [ ] J1 Property added  
- [ ] J2 Staff invited  
- [ ] J3 Resident + lease  
- [ ] J4 Lease signed (or approved offline honesty shipped)  
- [ ] J5 Rent collected  
- [ ] J6 Maintenance → vendor → resolved  
- [ ] J7 Owner reviews property  
- [ ] J8 Notice sent (or Communications de-advertised)  

### Master Admin
- [ ] Certification console (or documented scripts) Pass for each journey  
- [ ] Entitlement fail-closed verified  
- [ ] Integration health visible  

### Governance
- [ ] `APPROVE LAUNCH-001`  
- [ ] Journeys authorized and certified individually  
- [ ] FIN-OPS remains single money system; S4 not required for this GO unless journey needs it  

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

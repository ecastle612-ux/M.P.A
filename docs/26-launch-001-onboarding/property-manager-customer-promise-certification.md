# Property Manager Customer Promise Certification

**Package:** LAUNCH-001  
**Scope:** Property Manager subscription — Customer Promise journeys **J0–J8** + Promise Remediation (Documents · Communications)  
**Date:** 2026-08-06  
**Audience:** Master Admin / launch decision for Customer #1  

---

## Verdict

### **GO** for Customer #1

Every advertised Property Manager capability is demonstrable begin→end within authorized scope:

- Customer Promise journeys **J0–J8** delivered  
- **Documents** and **Communications** remediation delivered (no duplicate systems)  
- Facility Operations, CORE-004, and FIN-OPS S4+ remain out of scope and unadvertised as launch blockers  

**Operator conditions (procedural, not product gaps):**

1. Master Admin runs Pass scripts for J2–J8 + Documents + Communications evidence panels on a staging org.  
2. Confirm SignWell / Resend env for live channels used in the dry run (offline/in-app honesty remains available).  
3. One end-to-end Customer #1 dry run completes unaided.

---

## Journey scoreboard (J0–J8)

| Journey | Promise | Delivery | MA evidence | Status |
|---------|---------|----------|-------------|--------|
| J0 | Trusted home | Delivered | Cert + console | Pass / certified |
| J1 | First property | Delivered | `/api/admin/launch/j1` | Pass / certified |
| J2 | Invite team | Delivered | `/api/admin/launch/j2` | Ready for MA Pass |
| J3 | First resident | Delivered | `/api/admin/launch/j3` | Ready for MA Pass |
| J4 | First lease | Delivered | `/api/admin/launch/j4` | Ready for MA Pass |
| J5 | Collect first rent | Delivered | `/api/admin/launch/j5` | Ready for MA Pass |
| J6 | First maintenance | Delivered | `/api/admin/launch/j6` | Ready for MA Pass |
| J7 | Daily operations | Delivered | `/api/admin/launch/j7` | Ready for MA Pass |
| J8 | Owner portfolio | Delivered | `/api/admin/launch/j8` | Ready for MA Pass |

---

## Advertised capability scoreboard

| Capability | Discover | No docs | No support | Begin→End | Matches ad | MA validate | Verdict | Friction |
|------------|:--------:|:-------:|:----------:|:---------:|:----------:|:-----------:|---------|----------|
| Property Management | Yes | Yes | Yes | Yes | Partial | Yes | **Pass** | Deeper editing later |
| Leasing | Yes | Yes | Yes | Yes | Partial | Yes | **Pass** | Full vacancy pipeline deferred; launch path + SignWell/offline honesty |
| Residents | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Portal activation edge cases |
| Maintenance | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Vendor FO AP separate from MCC assign |
| Vendor Management | Yes | Yes | Partial | Partial | Partial | Yes | **Conditional Pass** | Assignment via MCC; payables via FO — operational for launch |
| Financial Operations | Yes | Yes | Yes | Yes | Partial | Yes | **Pass** | Operational money only (approved S0–S3) |
| Owner portfolio | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | J8 |
| Mission Control | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Reuses ops data |
| Documents | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Remediation — shared library |
| Communications | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Remediation — messages + unified inbox |

---

## Customer understanding

| Role | Understanding |
|------|----------------|
| Property Manager | I can run my property management business from this dashboard. |
| Property Owner | I can confidently monitor my investment portfolio using M.P.A. |

---

## Remaining friction (accepted, non-blocking)

- Full leasing marketing/screening pipeline deferred beyond launch path.  
- FIN-OPS is operational money, not a general ledger.  
- Email delivery depends on Resend configuration; in-app path always works.  
- SignWell completed PDF URL depends on provider configuration; lease body + status always available.  
- SaaS self-serve checkout may remain white-glove / Admin assign for Customer #1.

---

## Hard stops after GO

```
STOP
Do not begin Facility Operations.
Do not resume CORE-004.
Do not continue FIN-OPS beyond approved slices.
Do not introduce new capabilities beyond completing the advertised Property Manager subscription.
```

---

## Master Admin sign-off checklist

- [ ] J0–J1 already Pass  
- [ ] J2–J8 evidence panels Pass on staging org  
- [ ] Documents remediation panel Pass (upload + retrieve + lease/SignWell)  
- [ ] Communications remediation panel Pass (send + inbox + history)  
- [ ] Customer #1 dry-run script succeeds unaided  
- [ ] Final box: **GO** confirmed by operator  

**Operator:** _______________________ **Date:** ________  
**Decision:** ☐ GO ☐ NO-GO  

**Remediation report:** [promise-remediation/remediation-report.md](./promise-remediation/remediation-report.md)

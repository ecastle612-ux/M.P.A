# Property Manager Customer Promise Certification

**Package:** LAUNCH-001  
**Scope:** Property Manager subscription — Customer Promise journeys **J0–J8**  
**Date:** 2026-08-06  
**Audience:** Master Admin / launch decision for Customer #1  

---

## Verdict

### **CONDITIONAL GO** for Customer #1

Customer Promise journeys **J0–J8** are delivered and ready for Master Admin Pass scripts. The north-star path (purchase → property → team → resident → lease → rent → maintenance → daily ops → owner portfolio) completes without workarounds inside authorized scope.

**Conditions before white-glove go-live:**

1. Master Admin runs Pass scripts for **J2–J8** evidence panels (J0–J1 already certified).  
2. **Documents** and **Communications** remain **de-advertised** / honesty-scoped (not part of J0–J8 operational promise).  
3. No Facility Operations; no FIN-OPS beyond approved S0–S3 slices.  
4. Operator confirms one end-to-end dry run on a staging org with live Stripe/SignWell (or documented offline honesty) as used in J4/J5.

If Documents or Communications are still marketed as full product modules without honesty, treat as **NO-GO** until advertise copy is corrected.

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
| Vendor Management | Yes | Yes | Partial | Partial | Partial | Yes | **Conditional** | Assignment via MCC; payables via FO |
| Financial Operations | Yes | Yes | Yes | Yes | Partial | Yes | **Pass** | S0–S3 operational money only; not full accounting |
| Owner portfolio (FO/Owner) | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | J8 operational insight |
| Mission Control | Yes | Yes | Yes | Yes | Yes | Yes | **Pass** | Reuses ops data; no second dashboard |
| Documents | Yes | No | No | No | No | Partial | **Fail / de-advertise** | Honesty empty state on owner portfolio |
| Communications | Yes | No | No | No | No | No | **Fail / de-advertise** | Out of authorized launch sequence |

---

## Customer understanding (must be true after J8)

| Role | Understanding |
|------|----------------|
| Property Manager | I can run my property management business from this dashboard. |
| Property Owner | I can confidently monitor my investment portfolio using M.P.A. |

---

## Remaining friction (accepted for launch)

- Document Vault not enabled — show honesty, do not fake documents.  
- Communications / notices not in J0–J8 — do not advertise as ready.  
- Full leasing marketing/screening pipeline not required for Customer Promise path.  
- FIN-OPS remains operational money (collections, payables, owner summary) — not general ledger.  
- SaaS self-serve checkout may remain white-glove / Admin assign for Customer #1.

---

## Hard stops after certification

```
STOP
Do not begin new platform capabilities.
Do not begin Facility Operations.
Do not continue FIN-OPS beyond approved slices.
```

---

## Master Admin sign-off checklist

- [ ] J0–J1 already Pass  
- [ ] J2–J8 evidence panels Pass on staging org  
- [ ] Owner login + portfolio + drill-down observed  
- [ ] Advertise copy excludes full Documents / Communications (or honesty present)  
- [ ] Customer #1 dry-run script succeeds unaided  
- [ ] Final box: **CONDITIONAL GO** confirmed by operator  

**Operator:** _______________________ **Date:** ________  
**Decision:** ☐ CONDITIONAL GO ☐ NO-GO  

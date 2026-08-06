# 5 — Customer #1 Readiness Assessment

**Status:** Draft  
**Parent:** [LAUNCH-001](./index.md)  
**Date:** 2026-08-06  
**Question:** Can a brand-new Property Manager customer become operational without assistance?

---

## Verdict

### **NO-GO for unaided operational launch**

| Dimension | Verdict |
|-----------|---------|
| Commercial clarity (what they bought) | **Conditional GO** — hardening Pass; purchase still simulated |
| Guided Setup (commercial) | **GO** — org / billing / home |
| Guided Setup (operational) | **NO-GO** — stops before property/team/payments/ops |
| First dashboard / recommended action | **NO-GO** — Mission Control stub |
| Money loop (if FO discovered) | **Conditional GO** — FO S0–S3 certified |
| Team invites | **NO-GO** — no email / no link UX |
| Maintenance → vendor daily ops | **NO-GO** — stubs |
| Overall unaided Customer #1 | **NO-GO** |

Financial Operations S0–S3 is **sufficient for launch planning and assisted money demos**.  
It is **not** sufficient as the entire onboarding system.

---

## Scorecard

| Capability | Ready? | Notes |
|------------|:------:|-------|
| Know plan / inclusions | Yes | `/billing`, entitlements |
| Create organization | Yes | Guided Setup |
| Fail-closed nav | Yes | Hardening |
| Create first property (obvious path) | No | Buried in FO desk |
| Invite teammate unaided | No | Email/link gap |
| Configure rent payments (Connect) | No | Env/operator dependent |
| SignWell lease send | No | Absent |
| Add resident + lease (obvious path) | No | FO-only / module stubs |
| Collect rent | Yes* | *If guided to FO + Stripe env |
| Submit maintenance | No | Stub |
| Assign vendor to work | No | Stub |
| Daily Mission Control | No | Stub |
| Owner financial visibility | Yes | FO S3 portal summary |
| Facility operational onboarding | No | Deferred by design |

---

## Journey GO/NO-GO

```
Purchase              NO-GO (simulated)
Org created           GO
Guided Setup          CONDITIONAL (commercial only)
Property created      NO-GO (discoverability)
Users invited         NO-GO
Roles assigned        CONDITIONAL
Stripe configured     NO-GO (Connect UI)
SignWell configured   NO-GO / scope
Resident + lease      NO-GO (IA)
Rent collected        CONDITIONAL (FO)
Maintenance           NO-GO
Vendor assigned       NO-GO
Daily operations      NO-GO
```

---

## What “assisted demo” can show today

With an operator who knows the product:

1. Admin assigns Property Manager SKU (or create org with SKU)  
2. Open `/pm/financial-operations`  
3. Create property → lease/resident → post rent → collect  
4. Show delinquency / vendor AP / Command Center / owner summary  

This is **not** the Customer #1 unaided path.

---

## Exit criteria for Customer #1 GO

All must be true:

- [ ] LAUNCH-001 package **Approved**
- [ ] Slices **L0–L4** delivered and certified (L5 scoped)
- [ ] Unaided walkthrough Pass (L6)
- [ ] Invites work without token pasting
- [ ] Mission Control presents next action and daily attention
- [ ] Property / lease create paths are obvious
- [ ] Payments readiness explained (Connect or manual)
- [ ] Maintenance → vendor MVP works
- [ ] Module readiness labels are honest
- [ ] FIN-OPS remains the single money system (no ERP drift)

---

## Recommendations to leadership

1. **Approve** this LAUNCH-001 package after review (docs only today).  
2. **Keep FIN-OPS paused** at S3 — do not start S4 until onboarding path is authorized and sequenced.  
3. **Authorize L0** first after Approve — Mission Control + Setup honesty unlocks everything else.  
4. Decide **L5 Branch A vs B** (SignWell + purchase) before promising lease e-sign or self-serve buy.  
5. Treat Customer #1 as **Property Manager**; do not block on Facility features.

---

## STOP

Do **not** implement onboarding code.  
Do **not** authorize FIN-OPS-001 Slice S4 from this assessment.

Wait for:

```
APPROVE LAUNCH-001
```

Then slice authorization:

```
AUTHORIZE LAUNCH-001 SLICE L0
```

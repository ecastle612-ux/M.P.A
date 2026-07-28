# 09 — Reactivation Workflows

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Return a Suspended or Cancelled customer to a healthy Active (or Trial) commercial state with valid subscription, entitlements, and Org Admin access — without creating a duplicate organization when restore is intended.

---

## Reactivation types

| Type | From | Typical path |
|------|------|--------------|
| **Billing restore** | Past Due / Grace / Suspended (unpaid) | Update payment → Active |
| **Compliance restore** | Suspended (non-billing) | Master Admin clears hold → Active |
| **Win-back** | Cancelled (within retention) | New/restored subscription → reactivate same org |
| **True re-buy** | Archived / retention expired | New COM-001 lifecycle → **new** org (preferred) |

---

## Billing restore (happy path)

```
Org Admin updates payment method
  → Invoice paid
  → BILL-001 Active
  → AUTH org Active (or prior productive state)
  → Sessions allowed
  → CS courtesy check-in
```

---

## Win-back (Cancelled → Active)

| Step | Owner |
|------|-------|
| 1. Validate legal/commercial eligibility | CS + Finance |
| 2. Confirm same organization restore vs new org | CS |
| 3. Create/restore SaaS subscription | Billing (BILL-001) |
| 4. Re-bind plan/modules/limits | System |
| 5. Re-enable Org Admin + required memberships | Auth/Provisioning |
| 6. Force password reset if risk warrants | Master Admin policy |
| 7. CS kickoff / mini check-in | CS |

**Do not** invent a second Organization for the same buyer when win-back restore is intended — unless Archived or explicitly requested new workspace.

---

## Compliance restore

| Step | Owner |
|------|-------|
| Investigate | Technical + Master Admin |
| Document clearance reason | Master Admin |
| Lift Suspended | Master Admin |
| Confirm billing still Active | Billing |
| Notify Org Admin + recovery contact | System |

---

## What reactivation is not

- Silent undelete of Archived without legal review  
- Recreating day-to-day users by M.P.A. staff (Org Admin remains owner)  
- Skipping Payment Successful for a net-new commercial relationship  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| REA-01 | Billing restore path defined |
| REA-02 | Win-back prefers same org within retention |
| REA-03 | Compliance restore requires Master Admin audit |
| REA-04 | Archived defaults to new customer lifecycle |

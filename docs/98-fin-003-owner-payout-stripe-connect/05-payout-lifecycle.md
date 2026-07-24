# 05 — Payout Lifecycle

**Package:** FIN-003  
**Status:** ✅ **Approved**

This document is the authoritative stage catalog for FIN-003. Implementation (later) must not invent undocumented stages without restarting Design → Document → Approve.

---

## End-to-end stage map

```
Owner onboarding
  → Stripe Connect onboarding
  → Identity verification
  → Bank account connection
  → Eligibility
  → (Org settlement ready)
  → Allocation for period
  → Scheduled / Pending payout
  → Transfer execution (in transit)
  → Completed (paid) | Failed | Returned
  → Retry / Manual intervention
  → Audit history + Notifications
```

---

## 1. Owner onboarding (product)

| Item | Detail |
|------|--------|
| Entry | Owner Portal Settings / Financials / payout CTA |
| Preconditions | Authenticated `property_owner`; active org |
| States shown | Not connected · Onboarding · Verification required · Pending review · Eligible · Action required |
| Data | Link Owner identity ↔ future OwnerConnectAccount |
| Notifications | Optional “Finish connecting payouts” |

---

## 2. Stripe Connect onboarding

| Item | Detail |
|------|--------|
| Mechanism | Stripe Account Link / embedded onboarding |
| Actor | Owner (self) or PM-assisted invite (if Approve allows) |
| Platform action | `ConnectProvider.createExpressAccount` + Account Link URL |
| Return URLs | Owner Portal deep links (success / refresh) |
| Failure | Return to Action required with Stripe reason codes mirrored |

Org settlement onboarding is a **parallel** track for PM admins (Workflow A in [01](./01-business-workflows.md)).

---

## 3. Identity verification

| Item | Detail |
|------|--------|
| Custodian | Stripe (KYC) |
| M.P.A. role | Surface `requirements.currently_due` / `past_due`; never store ID images |
| States | Pending verification · Restricted · Cleared |
| Webhook | `account.updated` |
| Owner UX | “Verification required” + Continue to Stripe |

---

## 4. Bank account connection

| Item | Detail |
|------|--------|
| Custodian | Stripe external accounts on Express |
| M.P.A. role | Reflect payout destination ready / missing |
| Multi-bank | Open Question — v1 assume **one** default bank |
| Failure | Action required (update bank in Stripe) |

---

## 5. Eligibility

An owner is **Eligible** for transfers when:

1. OwnerConnectAccount status = `eligible`  
2. Stripe capabilities allow transfers/payouts  
3. No blocking requirements  
4. Org settlement can fund transfers  
5. Owner has property interest in the allocation set  

**Ineligible** reasons must be user-readable: verification, bank, restricted, org not ready, no ownership share.

---

## 6. Scheduled payouts

| Item | Detail |
|------|--------|
| Trigger | Cron / schedule config (e.g. monthly after period close) |
| Job | `payout.schedule.tick` → create `PayoutRun` |
| Guard | Skip owners/properties failing eligibility; mark partial |
| Owner UX | **Scheduled** with expected date/amount when known |
| PM UX | Upcoming run preview |

Exact schedule cadence is product config (Open Question defaults to monthly).

---

## 7. Pending payouts

| Item | Detail |
|------|--------|
| Meaning | Allocation computed; transfer not yet succeeded |
| Includes | Queued run items, awaiting balance, awaiting eligibility |
| Owner Portal | Dashboard **Pending payout** widget (replace placeholder) |
| Honesty | Never show fabricated “Paid” |

---

## 8. Completed payouts (paid)

| Item | Detail |
|------|--------|
| Meaning | Transfer succeeded; Stripe payout to bank may still be in flight or settled — product copy must distinguish **paid to Stripe balance** vs **paid to bank** if both shown |
| Owner UX | History list: period, property, net, date, status Paid |
| Artifacts | Optional remittance in Document Vault |
| Reporting | May appear on owner statement lines (FIN-001 consume) |

---

## 9. Failed payouts

| Item | Detail |
|------|--------|
| Causes | Insufficient settlement balance, Stripe errors, account restricted mid-flight, validation failures |
| Status | `failed` |
| Notify | Owner + PM (role-appropriate detail) |
| Next | Retry policy or Action required |

---

## 10. Returned payouts

| Item | Detail |
|------|--------|
| Meaning | Bank return / Stripe reversal after initiation |
| Status | `returned` |
| Funds | Remain/return per Stripe to settlement — **still not held by M.P.A. as a float product** |
| Next | Fix bank/KYC → retry as new attempt |

---

## 11. Retry rules

| Class | Policy (draft for Approve) |
|-------|----------------------------|
| Transient Stripe/network | Auto-retry with backoff; max N attempts (propose 3) |
| Insufficient balance | Hold `pending`; re-check on next schedule; alert PM |
| Account restricted / disabled | No auto-retry; Action required |
| Idempotent replay | Same idempotency key must not double-pay |
| Manual retry | PM with capability + audit reason |

See [08](./08-failure-recovery.md).

---

## 12. Manual intervention

Allowed interventions (capability-gated, audited):

| Action | Actor |
|--------|-------|
| Create ad-hoc payout run | PM admin |
| Retry failed attempt | PM admin |
| Cancel scheduled item (before transfer) | PM admin |
| Adjust allocation input correction | PM admin — **new adjustment record**, not silent rewrite of paid |
| Force re-onboarding link | System/PM |

**Forbidden:** Editing a `paid` record’s amount in place; moving funds outside ConnectProvider.

---

## 13. Audit history

Every transition records:

- `organization_id`, actor, timestamp  
- From/to status  
- Stripe object IDs (`acct`, `tr`, `po`, `evt`)  
- Idempotency key  
- Human reason for manual actions  

Retention follows platform audit standards.

---

## 14. Notification events (catalog)

| Event key (conceptual) | Audience | When |
|------------------------|----------|------|
| `owner_payout.onboarding_required` | Owner | Not connected / requirements due |
| `owner_payout.eligible` | Owner | Became eligible |
| `owner_payout.scheduled` | Owner | Upcoming distribution |
| `owner_payout.paid` | Owner | Paid |
| `owner_payout.failed` | Owner + PM | Failed |
| `owner_payout.returned` | Owner + PM | Returned |
| `owner_payout.action_required` | Owner | Restricted / bank / KYC |
| `org_payout.run_partial` | PM | Run finished with failures |

Deliver via existing Notification Service (+ email/push per prefs). No new notification platform.

---

## State machine (OwnerPayout)

```
scheduled → pending → in_transit → paid
                ↘ failed → (retry) → pending|in_transit
                ↘ action_required
in_transit → returned → (retry) → pending
any pre-paid → canceled (manual, audited)
```

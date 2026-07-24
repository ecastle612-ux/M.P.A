# 01 — Business Workflows

**Package:** FIN-003  
**Status:** ✅ **Approved**

---

## Workflow A — Organization settlement readiness

```
PM org admin
  → Starts org Connect Express onboarding (Account Link / embedded)
  → Completes Stripe identity & bank requirements
  → Org settlement account becomes charges_enabled / payouts_enabled as required
  → Destination charges from resident rent can settle to org Express account
```

**Preconditions:** API-005 rent collection live; Stripe platform configured for Connect.  
**Outcome:** Org can receive destination charges; application fees accrue to platform.  
**M.P.A. never** receives rent into a platform “float” balance for redistribution.

---

## Workflow B — Owner Connect onboarding

```
Owner (Owner Portal)
  → Sees “Not connected” / “Action required”
  → Starts Owner Express onboarding
  → Stripe hosts KYC + identity verification
  → Owner connects bank account (Stripe)
  → Requirements clear → Eligible (or Pending review)
  → Owner can receive Connect transfers from org settlement
```

**Preconditions:** Owner has `property_owner` access for at least one property; org settlement ready for live transfers.  
**Outcome:** Owner Express account linked to M.P.A. owner identity (conceptual `connect_accounts` / owner mapping — design only).

---

## Workflow C — Period close → allocation → payout run

```
Resident rent collected (API-005)
  → Settles to org Express (destination charge + app fee)
  → Property accounting / ledger remains SoR for charges & payments
  → At schedule (or PM trigger): OwnerPayoutService computes allocation
       property net − reserves − fees − adjustments → owner split amounts
  → Creates payout run (idempotent)
  → Creates transfer intents per eligible owner
  → ConnectProvider executes transfers settlement → owner Express
  → Stripe pays out to owner bank per Connect payout settings
  → Webhooks update internal statuses
  → Owner Portal + notifications update
```

---

## Workflow D — Pending vs completed visibility

| Audience | Pending | Completed |
|----------|---------|-----------|
| Owner | Amount/status for next expected distribution (authorized properties) | Paid history with period, property, fees (as disclosed) |
| PM | Run queue, blocked owners, insufficient balance | Run history, transfer IDs (ops), failure reasons |

Placeholders from OWNER-001 are replaced in Phase D — **no new portal IA**.

---

## Workflow E — Failed / returned / retry

```
Transfer or payout fails / returns
  → Status → Failed or Returned
  → Owner + PM notified (existing Notification Service)
  → Auto-retry if rule allows (transient)
  → Else Action required (owner bank / KYC / PM manual)
  → Manual intervention logged with actor + reason
  → Successful retry → Paid
```

---

## Workflow F — Restricted / disabled Connect account

```
Stripe account.updated → restricted / disabled
  → Eligibility → Action required / Ineligible
  → Future transfers blocked
  → Existing in-flight items follow failure/return rules
  → Owner guided to Stripe remediation Account Link
```

---

## Workflow G — Audit & support

Every sensitive action (onboarding start, run create, retry, manual override, webhook apply) emits:

- Domain event / audit record (org-scoped)  
- Correlation IDs to Stripe object IDs  
- Actor (user / system / webhook)

Master Admin may inspect diagnostics; **cannot** silently move funds without audited override path defined at Approve.

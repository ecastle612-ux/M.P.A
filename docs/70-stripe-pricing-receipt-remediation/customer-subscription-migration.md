# Legacy $99 → $59 PM subscription migration (Owner-authorized only)

Status: **Documented — NOT executed**

This note records the exact live migration required for the forensic subscription that renewed on the superseded provisional Professional Price. It must not be run without explicit Product Owner authorization.

## Target subscription (read-only snapshot)

| Field | Value |
|---|---|
| Subscription | `sub_1Ty47r8jGrZYUXDtQjOJGs14` |
| Status | `active` |
| `cancel_at_period_end` | `false` |
| Subscription item | `si_Uy08bTeQO1mlXy` |
| Current Price | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` (legacy provisional M.P.A. Professional, $99/mo) |
| Current period start | `2026-08-11T06:04:24Z` |
| Current period end | `2026-09-11T06:04:24Z` |
| Replacement Price | Production env `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` (official $59/mo; metadata `mpa_replaces_price` points at the $99 Price). Prefer confirming it matches Production `STRIPE_PRICE_PM_BASE_MONTHLY` if that is the unit-volume PM base. |

## Billing policy for this remediation

- Historical `$99` invoice `in_1U38oG8jGrZYUXDtbo9ywO9C` stays intact.
- No automatic refund, credit, proration, or immediate re-charge.
- Owner decides separately how to handle the completed `$99` period.
- Goal after authorized migration: **future renewals** use the current `$59` PM monthly Price.

## Exact Stripe operation (do not run until authorized)

Replace the existing subscription item Price (do not add a second item). Disable proration:

```bash
stripe subscription_items update si_Uy08bTeQO1mlXy \
  --price "<PRODUCTION_STRIPE_PRICE_PM_MONTHLY_59>" \
  --proration-behavior none
```

Equivalent API shape:

```http
POST /v1/subscription_items/si_Uy08bTeQO1mlXy
price=<PRODUCTION_STRIPE_PRICE_PM_MONTHLY_59>
proration_behavior=none
```

## Safety checklist before execution

1. Confirm replacement Price id is the current official `$59` PM monthly Price (not the superseded `$99` id).
2. Confirm subscription remains `active` and `cancel_at_period_end=false`.
3. Confirm no additional subscription items need changing.
4. Do not create a new Stripe Price.
5. Do not modify the historical invoice.
6. Do not send a test receipt email as part of the migration.
7. After migration, verify next invoice preview shows `$59` with period after `2026-09-11`.

## LIVE MIGRATION EXECUTED

**NO** (this remediation ships code + documentation only).

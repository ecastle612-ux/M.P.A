# 02 — Blocker 1 Live Rent Certification Record

**Package:** CORE-002  
**Status:** **PASS** (with documented webhook-race remediation)  
**Date:** 2026-07-22 / 2026-07-23 UTC

---

## Verdict

Live **$1.00** Stripe Checkout payment for `RC-CORE002-LIVE-001` succeeded end-to-end on production Stripe (`livemode=true`). Rent charge cleared, attempt settled, receipt/ledger/activity/notification/audit evidence captured. Concurrent Stripe success webhooks initially created triplicate settlement side effects; production-safe idempotency fix committed + deployed, duplicate operational rows remediated, append-only ledger compensated.

---

## Environment

| Check | Result |
|-------|--------|
| `PAYMENT_PROVIDER` | `stripe` |
| `STRIPE_MODE` | `live` |
| `STRIPE_ALLOW_SIMULATE` | `false` |
| Secret key | `sk_live_…` |
| Stripe account | `acct_1Tv5Lj8jGrZYUXDt` (`charges_enabled=true`) |
| Payments webhook | `we_1Tv82j8jGrZYUXDtnLXnfgrQ` → `/api/webhooks/payments/stripe` |
| Production host | `https://www.my-property-assistant.com` |

Production was briefly `noop`/`sandbox` before cert; corrected to live Stripe and redeployed before card payment.

---

## Operator approval

```
Approve live rent cert charge: YES
Amount: $1.00
Charge ID: RC-CORE002-LIVE-001
Method: Stripe Checkout using a real payment card.
```

---

## Stripe evidence (single live charge)

| Artifact | Value |
|----------|-------|
| Checkout Session ID | `cs_live_a1TCwpsrns1erDrCzmX74KcBjAgafri8BzWvvXFhPf9OzlQUS3YIq7wRfM` |
| Payment Intent ID | `pi_3TwBXf8jGrZYUXDt0izmkObV` |
| Stripe Charge / Payment ID | `py_3TwBXf8jGrZYUXDt04IsbdEt` |
| Amount | $1.00 (`amount_received=100`) |
| Description | `CORE-002 commercial certification payment — RC-CORE002-LIVE-001 ($1.00)` |
| Receipt (Stripe) | `https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFUdjVMajhqR3JaWVVYRHQo4-CF0wYyBoG-QRSobjosFvQiq_MNpJzde-FCK9bjx5HyUgfCb217vRtwLKpLn_PMXDI_zYNPI7vnV24` |
| Duplicate Stripe charges | **None** (one PI / one paid session) |

---

## MPA settlement evidence (canonical after remediation)

| Artifact | Value |
|----------|-------|
| Attempt | `17806f30-3f16-46f0-b36e-1bb7334909dd` / `PA-20260723-79f83d` → `succeeded` |
| Rent charge | `dc6aeed1-a834-4f56-bc02-331c4bf09c86` / `RC-CORE002-LIVE-001` → `paid`, outstanding `$0.00`, `amount_paid=$1.00` |
| Payment | `1c047e5e-d7b9-4a49-8b0d-0284d90aa80d` / `PAY-20260723-f92cba` / `$1.00` |
| MPA Receipt | `a602c6cf-bb6e-46fd-83dc-b5ea6bb9a3e7` / `RCPT-MRWUB646-BD75` |
| Resident + property ledger (payment) | `88e68604-aa98-4953-a5e7-3a3b9e59a08b` · tenant `caf3630d-…` · property `760a2b43-…` |
| Resident + property ledger (receipt) | `cdd1ccc4-9685-4c8a-8689-a2ac233d8e78` |
| Financial activity | `payment_received` `64be0d57-…` · `receipt_issued` `d4bc99ca-…` |
| Notification | `08630473-…` · “Rent payment received” · body includes `RCPT-MRWUB646-BD75` |
| Audit | `billing.payment.succeeded` + `billing.receipt.issued` on `billing_audit_events` (canonical receipt `a602c6cf-…`) |
| Owner payout triggered | **No** (`owner_payouts` relation absent / none created) |
| Vendor payment triggered | **No** (`vendor_payments` relation absent / none created) |

### Reporting

Canonical payment `PAY-20260723-f92cba` is the sole completed payment row for attempt `PA-20260723-79f83d` after remediation; charge status `paid` feeds portfolio/resident AR reporting.

---

## Chain checklist

| Step | Status |
|------|--------|
| Resident / cert Checkout created | **PASS** (live) |
| Stripe live card payment | **PASS** |
| Webhook settlement | **PASS** (after idempotency fix) |
| Ledger updated | **PASS** (canonical + compensating adjustments) |
| Property ledger updated | **PASS** (`property_id` set on entries) |
| Resident ledger updated | **PASS** (`tenant_id` set) |
| Financial activity recorded | **PASS** |
| Notifications generated | **PASS** |
| Receipt generated | **PASS** |
| Reporting updated | **PASS** |
| Audit recorded | **PASS** |
| No duplicate Stripe charges | **PASS** |
| Webhook idempotency | **PASS** (fix deployed; see below) |
| No unexpected accounting net | **PASS** after compensating adjustments |
| No owner payout | **PASS** |
| No vendor payment | **PASS** |

---

## Webhook race (found during cert) + fix

Stripe delivered **three** distinct `succeeded` webhook events for the same PI within ~500ms (`checkout.session.completed`, `payment_intent.succeeded`, and historically `charge.succeeded`). Event-id dedupe alone was insufficient → 3 payments / 3 receipts / 3 ledger payment rows.

### Production-safe fixes

1. Atomic settlement claim on `payment_attempts.reconciled_at IS NULL` before creating payments/receipts/side effects.
2. Map `charge.succeeded` → `ignored` (PaymentIntent / Checkout remain settlement sources).
3. Receipt issue short-circuits when a receipt already exists for the attempt.

### Remediation applied to cert data

- Kept canonical payment `PAY-20260723-f92cba` + receipt `RCPT-MRWUB646-BD75`.
- Deleted raced duplicate payments/receipts/activity rows.
- Appended compensating ledger adjustments (`LE-CORE002-REV-PAY`, `LE-CORE002-REV-RCPT`) because `billing_ledger_entries` are append-only.

---

## Commit / deployment

| Item | Value |
|------|-------|
| Checkout support commit | `7721040063b8cfc247b7cd066a8981595b173912` |
| Idempotency fix commit | *(this cert commit)* |
| Deployment (live env pickup) | `dpl_7W1EotevcBFB5YBF7uZKrBrSkRAe` |
| Deployment (idempotency fix) | *(post-commit deploy)* |

---

## PASS criteria note

PASS requires: one real live card payment, charge labeled as certification, full downstream reflection, no second Stripe charge, idempotent webhook handling going forward, no owner/vendor payout side effects. Met after remediation + fix deploy.

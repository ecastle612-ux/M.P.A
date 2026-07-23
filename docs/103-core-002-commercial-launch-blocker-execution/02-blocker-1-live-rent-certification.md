# 02 — Blocker 1 Live Rent Certification Record

**Package:** CORE-002  
**Status:** **IN PROGRESS** — awaiting operator live-charge approval  
**Date:** 2026-07-22

---

## Environment (verified)

| Check | Result |
|-------|--------|
| `PAYMENT_PROVIDER` | `stripe` |
| `STRIPE_MODE` | `live` |
| `STRIPE_ALLOW_SIMULATE` | `false` |
| Secret key prefix | `sk_live` |
| Production host | `https://www.my-property-assistant.com` |

## Prepared cert charge (do not use $1650 deposit)

| Field | Value |
|-------|-------|
| Charge id | `dc6aeed1-a834-4f56-bc02-331c4bf09c86` |
| Charge number | `RC-CORE002-LIVE-001` |
| Amount | **$1.00** USD |
| Org | `f88ee244-5343-4ddf-be48-15e96b9380ee` |
| Lease | `6a620af4-03de-4292-9b83-acec48d7573c` |
| Tenant | `caf3630d-8f86-4087-82da-6c9a68b2e62c` |
| Property | `760a2b43-eb87-4b88-b237-285f72ff6fd0` |

Alternate existing EP-016 charges (large — **do not** use for cert):

- `52a14035-…` Security deposit **$1650** overdue  
- `7166a312-…` Monthly rent **$1650** overdue  

## Chain checklist (open)

| Step | Status |
|------|--------|
| Resident initiates pay | Pending operator session / Checkout |
| Stripe live succeeds | **Blocked** — need Approve reply |
| Ledger payment + attempt | Pending |
| Property attribution | Pending |
| Notifications | Pending |
| Receipt | Pending |
| Reporting / transactions | Pending |

## Operator approval (required)

Reply exactly:

```
Approve live rent cert charge: YES
Amount: $1.00
Charge: RC-CORE002-LIVE-001
Method: Checkout with real card
```

Or specify a saved `payment_method` id if one exists for the cert tenant.

**No live charge will be created until this reply.**

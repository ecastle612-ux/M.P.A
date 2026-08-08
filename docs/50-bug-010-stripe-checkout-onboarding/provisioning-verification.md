# BUG-010 — Provisioning Verification Report

## Designed path (COM-002 Slice D)

```
checkout.session.completed
  → POST /api/commerce/webhooks/stripe
  → handleSaasStripeEvent
  → startOrAdvanceProvisioningFromCheckoutSession
  → checkpoints: received → customer_linked → org_created → entitled → owner_pending
  → claim email → /commerce/continue → sign_up → POST /api/commerce/provision/claim
  → owner_bound → welcome_sent → ready → /setup → /pm/mission-control
```

## Code verification (static)

| Checkpoint | Implementation |
|------------|----------------|
| Webhook verify | `constructEvent` + `STRIPE_SAAS_WEBHOOK_SECRET` |
| Idempotency | Stripe event id + purchase/idempotency stores |
| Org / customer / subscription | `run-provisioning.ts` + Supabase migrations Slice C–E |
| Claim | `/api/commerce/provision/claim` → `nextPath: "/setup"` |
| Guided Setup | `/(app)/setup` → Mission Control `/pm/mission-control` |
| Compensation / retries | Checkpoint machine in shared `provisioning.ts` + job store |

## Runtime status

| Item | Status |
|------|--------|
| End-to-end paid Checkout → provisioned org | **Blocked** until Production Checkout returns a session URL |
| Soft-start from success page | Present (`/api/commerce/checkout/session`) |
| Master Admin consoles | Routes exist under `/admin/commercial/*` (checkout, provisioning, subscriptions, lifecycle) |

## Next verification after price env deploy

1. Complete a **test card** live Checkout for Property Manager Monthly (or use Stripe test clock / live $0 coupon if available — prefer smallest real charge and refund).  
2. Confirm webhook delivery on `we_1Tw3Cg…` (Dashboard → destination → attempts).  
3. Confirm provisioning job advances to `ready`.  
4. Claim account → email verify → Guided Setup → Mission Control.  
5. Confirm Master Admin lists purchase + job + subscription.

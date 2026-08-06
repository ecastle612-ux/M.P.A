# S1 Stripe Verification

## In scope

| Capability | Status |
|------------|--------|
| Resident Checkout Sessions | Implemented (`/api/finance/checkout`) |
| Webhook signature verify | Implemented (`/api/finance/webhooks/stripe`) |
| Payment success posting | `checkout.session.completed` → ledger + receipt |
| Payment failure posting | `checkout.session.expired` / `payment_intent.payment_failed` |
| Idempotency | `financial_stripe_webhook_events.stripe_event_id` unique |
| Receipts | Generated on success |
| Audit + timeline events | Emitted on pending/success/failure |

## Out of scope (verified excluded)

- Owner distributions  
- Vendor payments / Connect payouts  
- Refund workflows  
- Saved payment methods / autopay  
- Stripe Tax  

## Configuration

Env (optional until online pay is required):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Without keys: manual payments still work; Pay Now returns 503 with clear message.

## Rules followed

- Checkout Sessions for on-session pay  
- No `payment_method_types` (dynamic methods)  
- No raw card data in M.P.A.  
- Webhook is payment truth  

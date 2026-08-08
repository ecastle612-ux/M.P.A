# Security Verification — Slice C

| Control | Implementation |
|---------|----------------|
| Webhook signature | Required; invalid → 400 |
| Replay / duplicate events | `stripe_event_id` unique memory + DB unique |
| Idempotent Checkout create | Stripe idempotency keys |
| Metadata validation | `mpa_money_domain=saas_billing` required for SaaS handling |
| Offer validation | `validateSaasCheckoutRequest` |
| Price validation | Env Price must match offer |
| Plan validation | Pro/Business only; Enterprise blocked |
| Environment validation | `isSaasCheckoutReady` / server env schema |
| Audit | Purchase + webhook event records |
| No FIN-OPS crossover | Dedicated route + money-domain check |

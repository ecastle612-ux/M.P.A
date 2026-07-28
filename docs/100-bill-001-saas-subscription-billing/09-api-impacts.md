# 09 — API Impacts

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Service

`SubscriptionService` — sole write path for SaaS subscription mutations.

```
SubscriptionService
  → SaasBillingProvider
      → StripeBillingAdapter | NoopSaasBillingAdapter
```

---

## Routes (shipped shape)

Monolithic `GET|POST /api/saas` (Phase B). Illustrative split routes below remain conceptual.

| Route / action | Role |
|----------------|------|
| `GET /api/saas` | Org SaaS snapshot (plan, usage, invoices, catalog) |
| `POST /api/saas` `action: "checkout"` | Create Checkout Session |
| `POST /api/saas` `action: "portal"` | Customer Portal session |
| `POST /api/saas` `action: "cancel"` | **In-app** cancel at period end → `requestSaasCancelAtPeriodEnd` ([21](./21-amendment-in-app-cancel-at-period-end.md)) |
| `POST /api/saas` `action: "mirror_sandbox"` | Dev/sandbox mirror only |
| `GET /api/master-admin/saas/metrics` | MRR etc. (Master Admin only; Phase D) |
| `POST /api/webhooks/saas/[provider]` | Webhooks |

### Cancel action contract

- **Auth:** `saas:manage` on active org  
- **Effect:** Stripe `cancel_at_period_end=true`; local mirror + audit  
- **Response modes:** `cancel_at_period_end` \| `already_canceling` \| `already_canceled` \| `no_subscription`  
- **Non-goals:** immediate cancel, refunds, in-app reactivate

---

## Provider contract (conceptual)

```typescript
interface SaasBillingProvider {
  id: "stripe" | "noop";
  ensureCustomer(input): Promise<{ externalCustomerId: string }>;
  createCheckoutSession(input): Promise<{ url: string; sessionId: string }>;
  createPortalSession(input): Promise<{ url: string }>;
  getSubscription(externalSubscriptionId): Promise<NormalizedSubscription>;
  parseWebhook(payload, headers): Promise<NormalizedSaasEvent[]>;
}
```

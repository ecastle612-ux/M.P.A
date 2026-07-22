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

## Routes (illustrative)

| Route | Role |
|-------|------|
| `GET /api/saas/subscription` | Current plan, usage, renewal |
| `POST /api/saas/checkout` | Create Checkout Session |
| `POST /api/saas/portal` | Customer Portal session |
| `GET /api/saas/invoices` | Billing history |
| `POST /api/saas/change-plan` | Upgrade/downgrade (or portal-only v1) |
| `POST /api/saas/cancel` | Cancel at period end |
| `GET /api/master-admin/saas/metrics` | MRR etc. (Master Admin only) |
| `POST /api/webhooks/saas/[provider]` | Webhooks |

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

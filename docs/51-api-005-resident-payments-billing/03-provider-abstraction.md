# 03 — Provider Abstraction

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Invariant

```
Business modules
  → BillingService
    → PaymentProvider
      → StripeProvider | PlaidAchProvider | FinixProvider | DwollaProvider | AuthorizeNetProvider | NoopProvider
```

No resident portal, lease, Ops, or Command Center module imports Stripe / Plaid / Finix SDKs.

---

## BillingService (domain)

Sole public write path for billing mutations. Responsibilities:

| Responsibility | Notes |
|----------------|-------|
| Authz | `financial:*` + finer `billing:*` if introduced after Approve |
| Schedules & charges | Generate, publish, waive, cancel |
| Checkout | Create payment attempts for selected charges |
| AutoPay | Enroll / disable / run |
| Methods | Attach/detach tokenized methods via provider |
| Refunds / credits | Provider + ledger / ledger-only |
| Late fees | Policy assessment |
| Webhook apply | Normalize provider events |
| Receipts | Issue immutable artifacts |
| Ledger | Append-only entries |
| Notifications | Via NotificationService (API-001) |
| Timeline | Domain events |

---

## PaymentProvider (interface)

Conceptual contract (TypeScript-shaped; not implementation):

```typescript
interface PaymentProvider {
  readonly id: string; // "stripe" | "plaid_ach" | "finix" | "dwolla" | "authorizenet" | "noop"

  createCustomer(input: CreateCustomerInput): Promise<CustomerRef>;
  attachPaymentMethod(input: AttachMethodInput): Promise<PaymentMethodRef>;
  detachPaymentMethod(ref: PaymentMethodRef): Promise<void>;

  createPaymentAttempt(input: CreatePaymentAttemptInput): Promise<PaymentAttemptRef>;
  getPaymentAttempt(ref: PaymentAttemptRef): Promise<PaymentAttemptStatus>;
  cancelPaymentAttempt(ref: PaymentAttemptRef): Promise<void>;
  refund(input: RefundInput): Promise<RefundRef>;

  /** Verify webhook authenticity + map to internal events */
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedPaymentEvent[]>;
}
```

### NormalizedPaymentEvent

| Field | Purpose |
|-------|---------|
| `externalEventId` | Idempotency key |
| `externalPaymentId` | Provider payment/intent ID |
| `type` | `processing` / `succeeded` / `failed` / `requires_action` / `refunded` / `dispute` / … |
| `amount` / `currency` | Money (decimal-safe types in persistence) |
| `occurredAt` | Provider timestamp |
| `failureCode` / `message` | Resident-friendly mapping upstream |
| `payloadDigest` | Audit hash (not raw card data) |

---

## Registry

```
PAYMENT_PROVIDER=noop|stripe|plaid_ach|finix|dwolla|authorizenet
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=          # client Elements only via controlled bootstrap
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_MODE=platform|connect
STRIPE_MODE=sandbox|production
```

Org settings may override env default.

**Client note:** Publishable keys may appear in browser **only** for Stripe Elements / Payment Element bootstrapping through an M.P.A.-owned loader. Secret keys never leave server/Edge.

---

## Stripe (Phase 1 adapter)

| Concern | Design |
|---------|--------|
| Product | Stripe Payments + optional Connect for multi-merchant orgs |
| Methods | Payment Element / SetupIntent → PaymentMethod tokens |
| ACH | Stripe ACH / Financial Connections where available; Plaid as future specialist |
| Webhooks | `payment_intent.*`, `charge.*`, `setup_intent.*`, disputes |
| Sandbox | Test mode keys + noop for CI without network |
| Mapping | Stripe statuses → normalized events |

Vendor payouts (marketplace) may use Connect; resident rent collection is the Phase 1 focus of API-005.

---

## Future adapters

| Provider | Role |
|----------|------|
| Plaid ACH | Bank verify + ACH origination specialist (INT-102/103) |
| Finix | Alternate merchant acquiring |
| Dwolla | ACH-centric |
| Authorize.net | Legacy PM preference |

Each implements `PaymentProvider`. Fee schedules stay provider-specific; M.P.A. stores fee metadata when known but does not invent settlement math.

---

## Noop provider

Local/CI: fake customers/methods/attempts; simulate webhooks via authenticated sandbox endpoint. Never contacts external network.

---

## Webhook ingress

```
Provider → Edge Function /api/webhooks/payments/[provider]
  → verify signature (e.g. Stripe-Signature)
  → persist to integrations_webhook_events
  → BillingService.applyProviderEvent (idempotent)
  → update payment/charge/ledger/receipt
  → notifications + timeline + Ops metrics
```

---

## Error & retry

| Class | Behavior |
|-------|----------|
| Transient | Backoff; Ops “Payment Processing Health” |
| Hard decline / NSF | `failed` + resident recovery UX |
| Webhook verify fail | 401; do not apply |
| Duplicate event | No-op success |

**Provider failover** is out of scope for Phase 1.

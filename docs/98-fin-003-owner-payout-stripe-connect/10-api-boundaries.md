# 10 — API Boundaries

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Note:** Conceptual contracts for Approve. **No routes, handlers, or SDKs are implemented by this documentation task.**

---

## Service boundaries

| Service | Responsibility | Must not |
|---------|----------------|----------|
| `OwnerPayoutService` | Authz, allocation orchestration, run lifecycle, owner projections | Call Stripe SDK |
| `ConnectProvider` | Express accounts, Account Links, transfers, payout retrieve, webhook parse | Contain business split rules |
| Financial module (existing) | Provide payment/charge/summary facts | Own Connect transfers |
| Notification Service (existing) | Deliver events | Compute allocations |
| ReportingService (existing) | Statements/PDFs | Execute payouts |

---

## Conceptual owner APIs (future)

| Method | Path (illustrative) | Purpose |
|--------|---------------------|---------|
| GET | `/api/owner/payouts/status` | Onboarding + eligibility summary |
| POST | `/api/owner/payouts/onboarding-link` | Create Account Link for self |
| GET | `/api/owner/payouts` | List pending/history (property-scoped) |
| GET | `/api/owner/payouts/[id]` | Detail |

All owner routes: session auth + owner ACL (`resolveOwnerPropertyScope`).

---

## Conceptual PM APIs (future)

| Method | Path (illustrative) | Purpose |
|--------|---------------------|---------|
| GET/POST | `/api/payouts/org/onboarding-link` | Org settlement onboarding |
| GET/PUT | `/api/payouts/schedules` | Schedule config |
| POST | `/api/payouts/runs` | Create/execute run |
| POST | `/api/payouts/attempts/[id]/retry` | Manual retry |
| GET | `/api/payouts/runs` | Run monitoring |

Capabilities: `payout:manage` (name TBD at Approve).

---

## Webhook API (future)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/webhooks/connect/stripe` | Connect event ingress |

No user session; signature validation only.

---

## Provider interface (conceptual TypeScript shape)

```typescript
interface ConnectProvider {
  readonly id: "stripe_connect";

  createExpressAccount(input: CreateConnectAccountInput): Promise<ConnectAccountRef>;
  createAccountLink(input: AccountLinkInput): Promise<{ url: string }>;
  getAccount(ref: ConnectAccountRef): Promise<ConnectAccountStatus>;

  createTransfer(input: CreateTransferInput): Promise<TransferRef>;
  getTransfer(ref: TransferRef): Promise<TransferStatus>;
  getPayout(ref: PayoutRef): Promise<PayoutStatus>;

  parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedConnectEvent[]>;
}
```

---

## Data access rules

| Reader | Scope |
|--------|-------|
| Owner | Own user + authorized properties only |
| PM | Organization |
| Webhook worker | System; org inferred from Connect account mapping |
| Master Admin | Support diagnostics per existing MA rules |

---

## Explicit non-APIs

- No public unauthenticated payout status  
- No client-supplied Stripe secret usage  
- No shared handler with `/api/webhooks/saas` or payments  
- No schema migration authored in this Draft package stage (schema design may be specified later at Approve as a follow-on doc if required — still no migration files until Implement)  

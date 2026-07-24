# 02 — System Architecture

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Rule:** Compose existing systems — **do not redesign**.

---

## Layering invariant

```
UI (Owner Portal / PM financial surfaces)
  → OwnerPayoutService (domain)
    → ConnectProvider (integration port)
      → Stripe Connect adapter (only place Stripe SDK may live)
  → Financial module / ledger reads (API-005 SoR)
  → Notification Service
  → Audit Log
  → Background Jobs
```

Business modules **must not** import Stripe SDK directly (mirrors API-005 `PaymentProvider` pattern).

---

## Integration map

| Existing system | FIN-003 use | Must not |
|-----------------|-------------|----------|
| **Financial Module / API-005** | Read collected payments, charges, property financial facts for allocation inputs | Rewrite rent checkout; hold funds on platform |
| **Owner Portal (OWNER-001)** | Wire pending/completed/onboarding states into existing placeholders | Redesign nav/IA |
| **Notification Service** | Payout paid / failed / action required | New notification product |
| **Reporting Engine (FIN-001)** | Optional statement line / report consume of payout facts | Parallel PDF engine |
| **Document Vault** | Optional store payout receipts / remittance PDFs if Approve requires | Bypass vault ACL |
| **RBAC** | `financial:*` / future `payout:*` capabilities; owner property scope | Grant owners ledger mutate |
| **Audit Log** | Sensitive payout & Connect events | Silent money moves |
| **Background Jobs** | Scheduled runs, retries, webhook follow-ups | Synchronous long Stripe calls in RSC without jobs |
| **BILL-001 SaaS** | None | Shared customers/webhooks/Connect accounts |

---

## Fund-flow architecture (custody)

```
Resident → Stripe Payment (API-005)
         → Destination charge to Org Settlement Express
         → Application fee → M.P.A. platform account
Org Settlement Express balance
         → Connect Transfer → Owner Express account
Owner Express
         → Stripe Payout → Owner bank
```

**Property accounting / operational ledger** records what was owed, paid, and allocated.  
**Stripe** is the settlement rail.  
**M.P.A.** does not operate a pooled rent depository.

---

## Owner Portal integration points (as-built)

| Surface | Current | FIN-003 target |
|---------|---------|----------------|
| Dashboard pending payout widget | Non-executing placeholder | Live pending amount/status |
| Financials completed payouts | Placeholder | History list |
| Settings / notifications | Prefs exist | Category events for payouts |
| `resolveOwnerPropertyScope` | ACL | Scope all owner payout reads |

---

## PM surfaces

Reuse existing PM financial / settings areas for:

- Org Connect onboarding status  
- Payout schedule configuration (post-Approve UI location)  
- Run monitoring & manual retry  

Do not invent a second PM financial console.

---

## Provider boundary

Conceptual port (design only):

```
ConnectProvider
  createExpressAccount / createAccountLink
  getAccountStatus
  createTransfer
  getTransfer / getPayout
  parseWebhook(payload, headers) → NormalizedConnectEvent[]
```

`OwnerPayoutService` owns authorization, allocation rules, idempotency keys, and persistence orchestration (when schema is later Approved).

---

## Background processing

| Job class | Responsibility |
|-----------|----------------|
| `payout.schedule.tick` | Discover due periods/runs |
| `payout.run.execute` | Create transfers for a run |
| `payout.retry` | Apply retry policy |
| `connect.webhook.apply` | Persist normalized events idempotently |

Jobs must be idempotent and org-scoped.

---

## Explicit non-architecture

- No new Owner Portal shell  
- No merging BILL-001 Billing webhooks with Connect  
- No Custom Connect accounts in v1  
- No in-house ACH bank integration  
- No full GL chart of accounts in this package  

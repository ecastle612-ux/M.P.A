# 07 — Webhook Processing

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Scope:** Expected behavior only — **no implementation**.

---

## Endpoint (conceptual)

`POST /api/webhooks/connect/[provider]`  
Dedicated Connect rail — **not** payments or SaaS webhooks.

---

## Processing pipeline (design)

```
Receive → verify signature → dedupe event.id
  → normalize to NormalizedConnectEvent
  → apply to domain mirrors (account / transfer / payout)
  → emit notifications if status transition warrants
  → audit summary
  → 200 OK
```

On handler uncertainty: prefer **safe retry** (2xx only after durable apply) with idempotent upserts.

---

## Event catalog (minimum)

| Stripe-style event | Domain effect |
|--------------------|---------------|
| `account.updated` | Refresh OwnerConnectAccount / OrgSettlement capabilities & requirements; may flip Eligible ↔ Action required / Restricted / Disabled |
| `account.application.deauthorized` (if used) | Mark disconnected; block transfers |
| Capability / verification changes (via `account.updated`) | Update verification + bank readiness flags |
| Transfer created / updated / failed (Connect transfers) | Update TransferIntent / OwnerPayout (`pending` · `in_transit` · `failed`) |
| `payout.created` | Mirror payout created on Express account |
| `payout.paid` | Mark bank payout paid (owner UX “Paid” / “Deposited” per copy rules) |
| `payout.failed` | Mark failed; notify; open retry/action path |
| `payout.canceled` | Mark canceled; audit |
| Account restricted (requirements / `account.updated`) | Eligibility → Action required; block new transfers |
| Account disabled / rejected | Eligibility → Disabled; block transfers; notify |

Exact Stripe event names must be confirmed against Connect version at implement time; this catalog is the **product contract**.

---

## Account updates

- Always re-read authoritative account status via provider when applying `account.updated` if payload incomplete.  
- Map `requirements.currently_due` → Verification required / Action required.  
- Never trust client-reported KYC completion without webhook or account retrieve.

---

## Verification changes

| Signal | Owner state |
|--------|-------------|
| Pending | Pending review / Verification required |
| Cleared + payouts enabled | Eligible (if bank present) |
| Past due requirements | Action required |

---

## Payout created / paid / failed

Distinguish:

| Layer | Object |
|-------|--------|
| Platform→Owner | Connect **Transfer** (settlement → owner Express) |
| Owner→Bank | Stripe **Payout** on owner Express |

Owner UX should not say “deposited to bank” until payout.paid (or Approve-defined equivalent).

---

## Restricted / disabled

- Immediately stop new TransferIntents for that account.  
- In-flight attempts follow failure/return rules.  
- Provide Stripe Account Link for remediation.  
- PM run reports show blocked owners.

---

## Notification coupling

Webhooks **may** trigger Notification Service events listed in [05](./05-payout-lifecycle.md) §14 after durable status change — never before dedupe.

---

## Non-goals for webhooks

- No SaaS invoice handling  
- No resident PaymentIntent handling  
- No synchronous PDF generation in webhook request path (enqueue job if needed)

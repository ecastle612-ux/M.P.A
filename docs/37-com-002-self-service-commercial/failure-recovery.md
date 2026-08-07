# COM-002 — Failure Recovery

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Principles

1. Prefer automatic retry with idempotency.  
2. Fail closed on entitlements when payment state is bad.  
3. Never leave silent half-provisioned orgs without an alert.  
4. Customer messaging stays calm and actionable.

---

## Payment failures

| Event | Customer experience | System |
|-------|---------------------|--------|
| Card declined at Checkout | Stripe error; remain on Checkout | No org created |
| `invoice.payment_failed` | Email + Billing banner: update payment method | `past_due`; **grace period** (e.g. 3–7 days — Approve) |
| Grace exhausted | Access revoked; data retained | `unpaid` / canceled per policy |
| Payment recovered | Access restored | Entitlements on |

---

## Provisioning failures

| Failure | Recovery |
|---------|----------|
| Webhook timeout | Stripe retry + our idempotent consumer |
| Org create conflict | Deterministic merge on session id |
| Email send fail | Queue retry; provisioning still succeeds |
| Auth bind fail | Org exists; magic link reissue from success page |
| Poison message | Dead-letter + pager for commerce on-call |

**Customer-visible recovery page:** “We’re finishing your workspace” with polling + support contact after N minutes.

---

## Webhook / Stripe outage

| Condition | Behavior |
|-----------|----------|
| Stripe API down during Checkout create | Show retry; no local fake success |
| Webhooks delayed | Success page polls subscription status; reconciler backup |
| Duplicate events | Idempotent no-op |

---

## Demo failures

| Failure | Recovery |
|---------|----------|
| Snapshot hydrate fail | Serve error + Restart; alert demo ops |
| Session store down | Refuse new demos (fail closed); marketing CTAs still work |
| Abuse spike | Rate limit / CAPTCHA; do not touch production |

---

## Upgrade / downgrade failures

| Failure | Recovery |
|---------|----------|
| Stripe update fails | Keep prior entitlements; show error |
| Entitlement apply fails after Stripe success | Reconciler repairs; alert |

---

## Cancellation edge cases

| Case | Behavior |
|------|----------|
| Cancel then resubscribe same period | Restore entitlements; new subscription ids |
| Downgrade scheduled then upgrade | Cancel schedule; apply upgrade |

---

## Support runbooks (docs-level)

1. **Paid but no org** — run reconciler by `checkout_session_id`; verify audit.  
2. **Double org** — mark duplicate suspended; keep entitled org; refund policy case-by-case.  
3. **Enterprise stuck in self-serve** — convert lead; cancel Checkout subscription if needed; operator provision.

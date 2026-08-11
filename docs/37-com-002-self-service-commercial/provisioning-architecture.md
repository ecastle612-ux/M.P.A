# COM-002 — Provisioning Architecture (A5)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A2, A5  

---

## Goal

After successful self-serve Checkout, create an entitled organization **recoverably** — checkpointed, compensatable, observable. Not fire-and-forget.

---

## Checkpoint state machine (binding)

```
received
  → customer_linked
  → org_created
  → entitled
  → owner_pending      (welcome/bind email possible)
  → owner_bound         (email verified + membership)
  → welcome_sent
  → ready
```

Terminal failure states: `failed_retryable`, `failed_dead`, `suspended_unclaimed`.

Idempotency: `provision:org:{checkout_session_id}`.

---

## Pipeline

```
Webhook: checkout.session.completed (saas_billing, selfServeEligible offer)
  1. received — persist event, validate metadata/allowlist
  2. customer_linked — upsert saas_customers
  3. org_created — create Organization (unique on session id)
  4. entitled — write subscription + unit-capacity authorization fields + PM entitlements
  5. owner_pending — issue bind token; send claim email
  6. owner_bound — on verified claim (Identity Binding)
  7. welcome_sent — welcome + next-step email
  8. ready — continue page allows Guided Setup entry
```

**Module UI access requires `owner_bound`.** Entitlements exist earlier but sessions are blocked.

---

## Compensation / rollback (binding)

| Failed after | Compensation |
|--------------|--------------|
| `customer_linked` only | Retry; no org |
| `org_created`, entitle fails | Retry entitle; **do not** create second org |
| `entitled`, email fails | Keep org; retry email; support resend |
| Permanent org create failure after pay | Sev-1 alert; reconciler; support tool — Stripe remains source of payment truth |
| Wrong/missing metadata | `failed_dead`; fail closed; no guess |
| Unclaimed > 7 days | `suspended_unclaimed`; entitlements off |
| Duplicate webhook | No-op at current checkpoint |

There is no destructive “delete paid org” automatic rollback that orphans Stripe — prefer **forward repair**.

---

## Retry & monitoring

| Concern | Design |
|---------|--------|
| Retry | Exponential backoff on `failed_retryable` |
| Poison | Dead-letter + page commerce on-call |
| Metrics | Checkpoint lag, fail rate, unclaimed count, time-to-owner_bound |
| Customer UX | “Preparing your workspace” polling by session id |
| Audit | Every checkpoint transition → `subscription_events` / provisioning audit |

---

## Organization defaults

| Field | Source |
|-------|--------|
| Name | Checkout business name or “{email} Organization” |
| SKU | `mpa_property_manager` (v1 self-serve) |
| Plan tier / cycle | From offer |
| Unit capacity | From [Commercial Defaults](./commercial-defaults.md) (managed units / Additional Unit Capacity; no seat/property caps) |
| setupComplete | false until Guided Setup done |
| Timezone | Default `America/New_York` until customer sets (or browser hint at bind) |
| Currency | USD |

---

## Module activation (A1)

- v1 self-serve: Property Manager entitlements only.  
- FO/Complete: Enterprise operator path (shared entitle apply code) or future FO-READY self-serve.

---

## Guided Setup handoff

| Item | State after provision |
|------|----------------------|
| Organization | Pre-satisfied |
| Plan | Read-only purchased plan |
| Billing | Link to Billing |
| First property / team | Customer-driven within limits |
| Mission Control confirm | Customer-driven |

Active customers who skip Setup still see MC with Setup banner.

---

## Enterprise provisioning

Operator path shares `entitled` apply logic; skips Checkout webhooks; full audit; may set custom limits.

---

## Notifications

| Checkpoint | Notify |
|------------|--------|
| owner_pending | Claim workspace email |
| owner_bound | Welcome |
| failed_dead / suspended | Ops + customer as appropriate |
| dispute_hold | Owner + ops |

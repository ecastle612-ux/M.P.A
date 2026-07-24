# 03 — Payment Routing

**Package:** PAY-001  
**Status:** 📝 Draft (amended post [10](./10-architecture-review.md) · see [11](./11-architecture-amendments.md))  
**Binding model:** [FIN-003 §31](../98-fin-003-owner-payout-stripe-connect/31-settlement-funding-review.md) · [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)

---

## Binding routing model (locked)

**Commercial path = destination charges only.**

| Element | Binding value |
|---------|----------------|
| Charge type | **Destination charge** |
| Charge locus | PaymentIntent / Checkout Session created on the **M.P.A. platform** Stripe account (API-005 `PaymentProvider`) |
| Destination | Organization settlement Connect Express `acct_…` (`purpose = org_settlement`) |
| Platform revenue | `application_fee_amount` on the same PaymentIntent / Checkout (platform balance) |
| Currency | **USD** (US-first; FIN-003 D6 unless a later Approve expands) |

### Forbidden routing (never ship)

```
Resident → Platform balance (rent corpus) → later transfer to owners
Resident → Platform balance → sweep / transfer to org settlement (primary model)
Separate charges + transfer-from-platform as the commercial path
Vague “destination or equivalent” without this locked shape
```

Rejected by ADR-023. No alternate Connect charge type is in scope for PAY-001 v1.

---

## Stripe API shape (binding)

### Create (PaymentIntent or Checkout Session line items → PI)

Server-side `PaymentProvider` **must** set:

| Parameter | Required | Rule |
|-----------|----------|------|
| `transfer_data[destination]` | **Yes** | Org settlement Express `acct_…` resolved **server-side** for `organization_id` |
| `application_fee_amount` | **Yes** (when fee > 0) | Integer cents; from fee policy ([§ Application fee policy](#application-fee-policy-binding)); `0` only if policy yields zero |
| `currency` | **Yes** | `usd` |
| `metadata.organization_id` | **Yes** | Org UUID |
| `metadata.settlement_account_id` | **Yes** | Same `acct_…` as destination |
| `metadata.mpa_rail` | **Yes** | Constant `resident_rent` |
| `metadata.funding_mode` | **Yes** | `destination` |
| `metadata.payment_attempt_id` (or equivalent) | **Yes** when known | Links to M.P.A. attempt |
| `metadata.property_id` | **Yes** when known | Property-scoped books (pooled cash still at org) |

### Forbidden create parameters / patterns

| Forbidden | Why |
|-----------|-----|
| Omitting `transfer_data[destination]` while claiming destination mode | Platform rent float |
| Creating PI on the connected account as v1 primary path | Out of locked model |
| `on_behalf_of` as a substitute for destination funding | Not the locked model; do not invent |
| Client-supplied destination account id | Cross-org injection risk — server resolves only |
| Charging to platform then Connect transfer to settlement as primary | Rejected sweep model |
| Using `/api/webhooks/saas/*` or BILL-001 customers | ADR-024 |

### Idempotency

- Checkout / PI create must use a **stable idempotency key** derived from payment attempt (or schedule run) id.  
- AutoPay retries must not create duplicate successful destination charges for the same attempt key.  
- Webhook settle is idempotent on external event id (existing API-005 pattern).

---

## Create-charge algorithm (binding)

1. Resolve `organization_id` for the lease/charge (**server-side only**).  
2. Evaluate **enrollment + kill switches** ([§ Kill switch & coexistence](#kill-switch--coexistence-binding)).  
3. If org is **destination-enrolled** and funding disabled or not ready → **hard block** (no legacy fallback).  
4. Load org settlement Connect account (`purpose = org_settlement`).  
5. Evaluate **destination readiness matrix** ([§ Settlement readiness matrix](#settlement-readiness-matrix-binding)). If fail → **hard block**.  
6. Compute `application_fee_amount` from fee policy.  
7. Create Checkout/PI with locked API shape.  
8. Persist **charge→settlement mapping** at attempt create (and confirm on settle).  
9. Settle via **payments** webhook rail only (`/api/webhooks/payments/[provider]`).

---

## Settlement readiness matrix (binding)

Org settlement is **destination-ready** only when **all** checks pass:

| # | Check | Required |
|---|-------|----------|
| S1 | `connect_accounts` row for org + `purpose = org_settlement` | Yes |
| S2 | `external_account_id` present (`acct_…`) | Yes |
| S3 | Mirror status not `disabled` / not fatally restricted for charges | Yes |
| S4 | Stripe account `charges_enabled = true` (retrieve or fresh mirror) | Yes |
| S5 | Account can receive destination charges (no outstanding requirements that block charges) | Yes |
| S6 | PAY-001 env funding kill switch **on** | Yes |
| S7 | PAY-001 org funding enable **on** (destination-enrolled) | Yes |
| S8 | Destination `acct_…` equals the org’s settlement account (never another org) | Yes |

**Not required for money-in readiness:** `payouts_enabled` (owner/org bank payouts are FIN-003 / Stripe payout concerns, not PAY-001 charge create).

### Refresh cadence

| Source | Role |
|--------|------|
| FIN-003 Connect webhooks (`/api/webhooks/connect/[provider]`) | Refresh account mirror / requirements (readiness inputs) |
| PAY-001 pre-checkout retrieve (optional but recommended when mirror stale) | Confirm S4–S5 before create |
| Checkout create time | Re-check S1–S8; fail closed |

Readiness is a **runtime per-org gate**, not a package-level “all orgs certified” assumption.

---

## Application fee policy (binding)

| Rule | Binding |
|------|---------|
| What it is | Disclosed **platform revenue** on the destination charge (`application_fee_amount`) |
| What it is not | BILL-001 SaaS subscription; owner corpus; trust reserve |
| Schedule (v1) | **Per-org configuration**: basis points of charge amount and/or flat cents, stored in org/plan config (exact commercial rates set by Finance at Approve / ops config — not hard-coded in this design) |
| Floor / ceil | Fee cents = `min(charge_amount, max(0, round(bps) + flat))`; never negative; never exceed charge |
| When computed | At PaymentIntent / Checkout **create** (server) |
| When ledger emits fee fact | On **payment succeeded** settle (webhook), using Stripe-confirmed amounts when available; else create-time fee with reconcile note |
| Disclosure | Resident/PM commercial copy must disclose platform application fee before/at payment (Approve commercial copy) |
| Refunds | Application fee refunded per Stripe destination-charge refund behavior; ledger posts fee reversal facts |

---

## Charge → settlement mapping

Every destination-routed payment attempt must durable-store at least:

| Field | Purpose |
|-------|---------|
| `organization_id` | Tenant isolation |
| `property_id` | Property-scoped books (optional null only if truly unknown) |
| `settlement_external_account_id` | Stripe Connect `acct_…` |
| `provider` | e.g. `stripe` |
| `external_payment_intent_id` / charge id | Retrieve |
| `funding_mode` | `destination` (or `legacy_platform` only for non-enrolled legacy) |
| `application_fee_amount_cents` | Fee at create/settle |
| Timestamps | Audit |

Mapping is required for refunds, disputes, and ops reconcile ([05](./05-refunds-disputes.md)).

---

## Settlement balance vs ledger (binding)

| Question | Source of truth |
|----------|-----------------|
| How much **cash** can later be transferred to owners? | **Stripe available balance** on org settlement Express |
| How much was **collected / owed / reversed** on books? | Operational ledger (API-005) |
| May ledger alone authorize FIN-003 transfers? | **No** |
| May M.P.A. persist a “settlement cash balance” table without Stripe retrieve? | **No** — forbidden dual fiction |

Gross − fee may appear in **derived reports** only ([04](./04-ledger-integration.md)) — never as transferable cash.

---

## Kill switch & coexistence (binding)

### Enrollment

| Org state | Meaning |
|-----------|---------|
| **Destination-enrolled** | Org funding enable on (or env forces enrollment); commercial path is destination charges |
| **Not enrolled** | Legacy platform charges may continue until enrolled (migration window) |

### Production policy

| Situation | Behavior |
|-----------|----------|
| Destination-enrolled + funding **on** + ready | Destination charge (locked shape) |
| Destination-enrolled + funding **on** + **not** ready | **Hard block** checkout / AutoPay — clear error; **no** platform fallback |
| Destination-enrolled + funding **off** | **Hard block** — **no** legacy platform fallback |
| Not enrolled | Legacy platform charge allowed **only** as transitional coexistence |
| `funding_mode = legacy_platform` | **Never** FIN-003-transferable; never counted as org Express settlement cash |
| FIN-003 transfer kill switch | **Independent**; PAY-001 must not enable it |

### Historical platform float (Q1 closed for design)

| Rule | Binding |
|------|---------|
| Disposition | **Leave on platform** — no automatic sweep to org Express or owners |
| Owner transfers | FIN-003 **must not** transfer platform rent float |
| Monitoring | When an org is destination-enrolled and funding on, **new** successful charges with `funding_mode=legacy_platform` or missing destination are an **ops alert / FAIL** for verification |
| One-time migration | Only under explicit Finance Approve amendment — not default |

### Freeze-funding vs in-flight Checkout

- Turning funding **off** blocks **new** creates immediately.  
- In-flight Checkout sessions: do not extend; prefer expire/cancel where API-005 already supports; if a session completes after freeze, settle mapping honestly and alert ops (do not silently treat as success path for new enrollment).

---

## Rails

| Endpoint | Rail | PAY-001 role |
|----------|------|----------------|
| `/api/webhooks/payments/[provider]` | Resident payments | **Authoritative** for PI/charge success, failure, refund, dispute, ACH return signals used by PAY-001 |
| `/api/webhooks/connect/[provider]` | Connect accounts | Readiness mirror only (FIN-003); **not** dispute/refund authority for rent charges |
| `/api/webhooks/saas/[provider]` | SaaS | **Never** |

---

## Operational reconciliation (money-in)

### Retrieve objects (minimum)

| Object | Use |
|--------|-----|
| PaymentIntent / Charge | Confirm destination, fee, amount |
| Balance Transaction(s) | Fee / net / available timing |
| Balance (Connect account) | Available vs pending cash SoT |
| Mapping row | Org + settlement `acct_…` + attempt ids |

### Rules

- On-demand reconcile by payment attempt / Stripe id (ops).  
- Scheduled reconcile optional later — not required for design completeness.  
- **Read** mapping/ledger vs Stripe: `financial:*` / ops.  
- **Apply** corrective ledger entries only with audit (`funding.reconcile.apply`) and **never** invent Stripe cash.  
- **Pooled balance:** org Express cash is **not** partitioned by property at Stripe; property correctness is ledger-side. Ops must not claim “Property X Stripe sub-balance.” Future FIN-003 preflight uses org available balance + ledger property nets (shared contract).

---

## Sandbox note

Sandbox may use test clocks / test accounts. Production policies above are binding for commercial verification. Sandbox shortcuts must not weaken production acceptance ([07](./07-acceptance-criteria.md)).

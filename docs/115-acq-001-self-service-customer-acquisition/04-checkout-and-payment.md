# 04 — Checkout & Payment

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval  
**Integrates:** [BILL-001](../100-bill-001-saas-subscription-billing/README.md)

---

## Checkout entry

### Self-serve eligible plans

| `plan_code` | Self-serve Checkout |
|-------------|---------------------|
| `trial` | Yes (if Trial retained — see open questions) |
| `professional` | Yes |
| `business` | Yes |
| `enterprise` | **No** |
| `founder` | **No** (Master Admin grant) |

### Entry points

| Source | Action |
|--------|--------|
| `/pricing` plan CTA | `POST` create Checkout Session via existing SaaS subscription service |
| Tour “See pricing” | Navigate to `/pricing` |
| Resume / canceled page | Restart Checkout with last plan+interval |
| Logged-in upgrade | Settings → Billing (existing) — not public ACQ |

### Buyer metadata (required on Session)

Reuse existing COM/AUTH provision hints where already supported:

| Field | Purpose |
|-------|---------|
| Company / organization name | Org display name |
| Buyer contact email | Credential delivery + Stripe customer email |
| Plan code + interval | Price selection |
| Organization type | Default `property_manager` unless chosen |
| Correlation / opportunity id | Optional if sales link or prior lead |
| Success / cancel URLs | ACQ return routes |

**Minimal data entry:** Prefer Stripe Checkout collected email + short pre-Checkout fields (company name) over multi-page forms. Exact field set: [18 — Open questions](./18-open-questions.md).

### Invariants

- One open SaaS subscription per organization (BILL-001)  
- No second Checkout for org that already has open sub — redirect to Billing  
- Public Checkout creates **new** org only after payment success (COM activation), not before  

---

## Stripe Checkout

| Responsibility | Owner |
|----------------|-------|
| Session create / Portal | BILL-001 `SubscriptionService` / provider |
| Hosted payment UI | Stripe |
| Webhook ingress | BILL-001 |
| Price IDs | Env / catalog (BILL-001) |

ACQ-001 does **not** call Stripe SDK from UI components beyond invoking M.P.A. APIs.

### Trial Checkout

If Trial uses Stripe `trial_period_days`:

- Status mirrors `trialing`  
- Entitlements bind to `trial` plan  
- Convert path uses existing billing upgrade / COM trial convert  

If Trial is $0 without card — decide in open questions (default: card collected for Trial via Stripe Trial).

---

## Payment success

### Return UX (`/acquire/success`)

1. Confirm “Payment received — preparing your workspace”  
2. Poll or wait for provision completion (idempotent ledger)  
3. States:  
   - `provisioning` — spinner + “This usually takes under a minute”  
   - `ready` — “Check your email for login credentials” + link to `/login` / first-login  
   - `delayed` — “Still working — refresh or contact support” + support CTA  
   - `failed` — error recovery (see [09](./09-error-handling.md))  

### Server side (existing)

`checkout.session.completed` → mirror subscription → activate opportunity / provision org → bind entitlements → welcome credential delivery → SaaS audit + notifications.

ACQ success page **must not** re-implement provision; it only reflects status.

---

## Payment failure

| Where | Behavior |
|-------|----------|
| Inside Stripe Checkout | Stripe handles decline messaging; user retries |
| After return with unpaid | No org; message + retry CTA |
| `invoice.payment_failed` post-active | Existing past_due + entitlement create blocks (Phase C) — not ACQ public path |

---

## Checkout cancellation

`/acquire/canceled`:

- Calm message: no charge  
- CTA: Return to pricing (preselect plan if known)  
- Secondary: Take the tour / Contact sales  

---

## Abandoned / expired session

| Event | Behavior |
|-------|----------|
| Abandoned | No org; optional Stripe/email recovery later |
| Expired session on return | Explain expiry; new Checkout button |
| Idempotency | Provision ledger keys prevent double org on webhook retries |

---

## Upgrade prompts (public → product)

Public pricing may show “Already a customer? Log in to upgrade.”  
In-product upgrade prompts remain Settings → Billing + entitlement limit messages (Phase C).

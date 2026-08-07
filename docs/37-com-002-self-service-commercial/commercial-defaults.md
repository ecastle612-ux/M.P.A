# COM-002 — Commercial Defaults (Binding — A7)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft (binding upon Approve)  
**Amendment:** A7  

These defaults are **authoritative architecture**. Dollar prices remain a commercial publish step before Slice C go-live but do not block Approve.

---

## 1. Seat limits (included seats per organization)

| Plan tier | Included seats | Overage |
|-----------|----------------|---------|
| Professional | **5** | Upgrade to Business |
| Business | **25** | Request Enterprise |
| Enterprise | **Custom** (contract) | Contract change |

**Seat definition:** Billable organization members with login (excludes resident/owner/vendor portal-only personas).

**Enforcement:** Fail closed on invite when at cap (API + UI).

**Model:** Flat included seats — **not** Stripe metered quantity in v1 (O5 closed).

---

## 2. Property limits

| Plan tier | Max properties | Overage |
|-----------|----------------|---------|
| Professional | **25** | Upgrade to Business |
| Business | **150** | Request Enterprise |
| Enterprise | **Custom** | Contract |

**Enforcement:** Fail closed on property create when at cap.

Facility Operations “sites/buildings” mapping (when FO-READY): counts toward the same property/site cap unless Enterprise customizes — detail in FO readiness package; until FO-READY, FO is not self-serve.

---

## 3. Billing timing

| Rule | Default |
|------|---------|
| Collection | Stripe automatic collection on subscription |
| Cycle | Monthly or Annual Price |
| Proration on upgrade | **Immediate** (Stripe default proration) |
| Downgrade effective | **At period end** (subscription schedule) |
| Cancel effective | **At period end** (`cancel_at_period_end=true`) |
| Past-due grace | **7 days** from first `invoice.payment_failed` |
| After grace | Entitlements off; data retained |

---

## 4. Account creation timing

| Rule | Default |
|------|---------|
| Sequence | **Pay (Checkout) → provision org → create/bind account → verify email → access** |
| Workspace access before verify | **Forbidden** |
| Auth methods | Email + password and/or magic link (implementation choice within Slice D) |

See [Identity Binding](./identity-binding.md).

---

## 5. Organization creation timing

| Rule | Default |
|------|---------|
| Trigger | SaaS webhook `checkout.session.completed` (mode subscription, `mpa_money_domain=saas_billing`) |
| Not created on | Checkout abandon, expired session, Enterprise form submit |
| Idempotency | Unique on `checkout_session_id` |

---

## 6. Module activation timing

| Rule | Default |
|------|---------|
| Entitlement grant written | Provisioning checkpoint `entitled` |
| Customer can use modules | Only after checkpoint `owner_bound` **and** email verified |
| Self-serve SKU at launch | **`mpa_property_manager` only** (A1) |
| FO / Complete activation | Enterprise operator **or** post–**FO-READY** self-serve flag |

---

## 7. Trial policy

| Rule | Default |
|------|---------|
| Self-serve card trials | **None in COM-002 v1** |
| Try-before-buy | **Live Demo** (no payment, no account) |
| Enterprise temporary access | Sales/ops exception only (audited) |

Rationale: Demo replaces trial; removes trial abuse and Stripe trial complexity from Slice C/D.

---

## 8. Pause policy

| Rule | Default |
|------|---------|
| Customer self-serve pause | **Not offered in v1** |
| Stripe `paused` | Not used for self-serve |
| Need to stop billing | Cancel at period end |

---

## 9. Other binding defaults

| Topic | Default |
|-------|---------|
| Currency (self-serve v1) | **USD** |
| Stripe Tax | **On** for self-serve go-live |
| Customer Portal plan switching | **Off** — plan changes in-app only |
| Demo host | **`demo.` subdomain** (or equivalent host separation) |
| SaaS webhooks | **Dedicated endpoint** separate from FIN-OPS |
| Unclaimed org TTL | **7 days** then suspend entitlements; retain data 90 days minimum |
| Dunning emails | Day 0, Day 3, Day 6 (grace end), suspended notice |

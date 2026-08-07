# COM-002 — Identity Binding (A2)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved (binding)  
**Amendment:** A2  
**Related defaults:** [Commercial Defaults](./commercial-defaults.md)  

---

## Goal

A paying customer always proves control of the Checkout email before any workspace session. Webhooks and redirects may arrive in any order without creating duplicate orgs or open access holes.

---

## Identity objects

| Object | Role |
|--------|------|
| Checkout email | Collected by Stripe Checkout; source of truth for intended owner |
| Stripe Customer | Created/linked by Checkout; stored on `saas_customers` |
| Organization | Created by provisioner; status includes `owner_pending` |
| Auth user | Platform identity (Supabase Auth or equivalent) |
| Membership | Owner/admin bind after verification |
| Bind token | Signed, single-use, short TTL; correlates `checkout_session_id` |

---

## Authoritative sequence

```
1. Customer completes Stripe Checkout (subscription)
2. Stripe sends checkout.session.completed (and/or customer.subscription.created)
3. Provisioner runs checkpoints → org entitled, owner_pending
4. Success URL lands on /commerce/continue?session_id=… (signed)
5. App shows “Create your account” / “Sign in to claim”
6. Email ownership proven (magic link or verified password signup for that email)
7. Bind owner membership → owner_bound
8. Guided Setup → Mission Control
```

**Workspace module access before step 7: forbidden.**

---

## Checkout identity

- Checkout Session metadata must include: `mpa_money_domain=saas_billing`, `mpa_product_sku`, `mpa_plan_tier`, `mpa_billing_cycle`, `mpa_catalog_offer_id`.  
- Client cannot choose arbitrary Price ids — server allowlist only.  
- Enterprise offers never appear in Checkout Session create (A6).

---

## Email ownership

| Case | Behavior |
|------|----------|
| New email | Signup/magic link for exact Checkout email only |
| Existing auth user same email | Sign in; then claim org |
| Existing auth user different email | Reject claim; support path |
| Email mismatch attempt | Deny; audit |

---

## Redirect vs webhook ordering

| Order | Behavior |
|-------|----------|
| Webhook first | Org exists `owner_pending`; continue page polls until ready; then bind UI |
| Redirect first | Continue page polls provisioning status by `session_id` (max ~2 min UX); show preparing state |
| Both delayed | Reconciler + support; never invent success |

Polling is read-only status; it does not provision.

---

## Duplicate submissions

| Event | Control |
|-------|---------|
| Double webhook | Idempotency key + unique `checkout_session_id` |
| Double success refresh | Bind token single-use |
| Two Checkouts same email | **Allowed** → second org (multi-org). Cap: warn at 3 owned orgs; soft block at 5 without support |
| Replay bind token | Reject |

---

## Abandoned Checkout recovery

| State | Behavior |
|-------|----------|
| Checkout started, not paid | No org; session expires (Stripe) |
| `checkout.session.expired` | Cleanup incomplete commerce rows; analytics |
| Paid, never claimed | Email reminders Day 0/2/5; suspend at Day 7 (defaults) |
| Customer returns later with receipt email | Claim via verified email + session/subscription lookup |

---

## Idempotency keys (binding)

| Key | Scope |
|-----|-------|
| `stripe:evt:{event_id}` | Webhook processing |
| `provision:org:{checkout_session_id}` | Org pipeline |
| `bind:owner:{checkout_session_id}` | Owner membership |
| `stripe:checkout_create:{idempotency_key}` | API create session retries |

---

## Security requirements

1. Separate SaaS webhook endpoint from FIN-OPS.  
2. Verify Stripe signatures.  
3. Signed continue URLs (TTL ≤ 2 hours).  
4. No entitled session cookies until `owner_bound`.  
5. Rate-limit bind attempts.  

---

## Explicit non-goals

- Converting Demo sessions into production identities  
- Password sharing across orgs  
- Auto-login from Stripe without verification  

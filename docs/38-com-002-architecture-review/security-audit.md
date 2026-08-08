# Security Audit — COM-002

## Strong controls (keep)

- Stripe-hosted Checkout (no PAN).  
- Webhook signature verification.  
- Server-side Price allowlist.  
- Fail-closed entitlements.  
- Demo secret separation intent.  
- Carded trials (recommended).

---

## Findings

### S1 — Account takeover via Checkout email bind (High) — A2

If org is entitled before the human proves control of the Checkout email, an attacker who can start Checkout with a victim email (or intercept success URL) may attempt bind.

**Required:**

1. Entitled org remains `owner_pending` with **no session access** until email verification / magic link tied to `checkout.session.id`.  
2. Success URL tokens signed, single-use, short TTL.  
3. Existing-account bind requires login as that email.

### S2 — Duplicate payments / double provision (Medium)

Idempotency stated; require DB uniqueness on `checkout_session_id` and `stripe_subscription_id`.

### S3 — Trial / subscription abuse (Medium)

Carded trials help; add: Radar, velocity limits per card/email/IP, block disposable email domains (policy), one trial per customer fingerprint.

### S4 — Demo scraping & credential stuffing adjacent (Medium)

Public interactive demo is a scrape target. Caps, bot score, disable export/upload, watermark synthetic data.

### S5 — Webhook endpoint confusion with FIN-OPS (High if mishandled)

Prefer **separate webhook endpoints** for `saas_billing` vs resident payments, not only metadata switches in one handler.

### S6 — Fraudulent Enterprise lead spam (Low–Med)

Rate-limit Request Enterprise; spam filtering.

### S7 — Operator over-provision (Med)

Master Admin Enterprise provision must remain audited; dual-control for entitlement expansion optional at scale.

### S8 — Soft email verify window (Med)

Package allows “soft verify” — reject for full module access; allow only bind page until verified.

---

## Rate limits (minimum to specify)

| Surface | Limit guidance |
|---------|----------------|
| Demo session create | Per IP / ASN |
| Demo reset | Per session cooldown |
| Checkout session create | Per IP + authenticated ops |
| Account bind attempts | Per token |
| Enterprise lead form | Per IP / email |

---

## Verdict

Security baseline is incomplete for Approve-as-is. **A2 and separate SaaS webhook endpoint are blocking amendments.**

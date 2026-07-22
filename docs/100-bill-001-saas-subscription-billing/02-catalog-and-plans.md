# 02 — Catalog & Plans

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Stripe objects

| Object | Role |
|--------|------|
| Product | One Product per commercial tier (or one Product + multiple Prices) |
| Price | Monthly and annual recurring Prices per plan |
| Coupon / Promotion code | Founder discounts, launch trials |
| Subscription | One per organization |
| Invoice | SaaS invoices only |

---

## Plan codes

| `plan_code` | Audience | Billing | Notes |
|-------------|----------|---------|-------|
| `trial` | New orgs | Free trial period | Converts to paid or cancels |
| `founder` | Invite-only | Special price / 100% coupon | Master Admin grant + audit |
| `professional` | SMB | Monthly + Annual | Default paid |
| `business` | Growing portfolios | Monthly + Annual | Higher limits |
| `enterprise` | Large / custom | Monthly + Annual (or custom) | Sales-assisted OK |

Exact dollar amounts are commercial ops (Stripe Dashboard / env price ids) — not hard-coded in app logic beyond `STRIPE_PRICE_*` env maps.

---

## Entitlement sketch (limits TBD at Approve/Implement)

| Capability | Trial | Founder | Pro | Business | Enterprise |
|------------|-------|---------|-----|----------|------------|
| Properties | Low | Mid | Mid | High | Custom |
| Users / seats | Low | Mid | Mid | High | Custom |
| AI features | Limited | Full | Full | Full | Full |
| Priority support | — | ✓ | — | ✓ | ✓ |

Final numeric caps are set in Phase C with Product sign-off.

---

## Free trial

- Stripe `trial_period_days` on Checkout / Subscription create
- Status mirrored as `trialing`
- On trial end: become `active` (if PM attached) or cancel per Stripe settings

# 12 — Certification Plan

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

**PASS only when** a PM company can subscribe and renew via Stripe Billing **without affecting** tenant payments or owner payouts.

---

## P0 scenarios

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S01 | New subscription | Checkout → `active`/`trialing` mirrored; entitlements on |
| S02 | Free trial | Trialing; trial end date; converts or cancels cleanly |
| S03 | Upgrade | Plan/price updated; proration per policy; access expands |
| S04 | Downgrade | Scheduled or applied; limits update at correct time |
| S05 | Cancellation | Cancel at period end; access until end; then revoked |
| S06 | Failed payment | `past_due`; notify; grace; no rent/Connect side effects |
| S07 | Card update | Via Customer Portal; next invoice succeeds |
| S08 | Invoice generation | Invoice listed in Billing history; PDF/URL works |
| S09 | Webhook processing | Signature verify; idempotent; duplicate safe |
| S10 | Customer Portal | Opens; returns; local state syncs |
| S11 | One-sub-per-org | Second active Checkout blocked |
| S12 | Rail isolation | SaaS webhook never writes `payments` / Connect payout tables |

---

## Isolation regression (mandatory)

| Check | Pass |
|-------|------|
| Resident pay still uses `/api/webhooks/payments/stripe` | ✓ |
| Connect still uses `/api/webhooks/connect/*` | ✓ |
| SaaS uses `/api/webhooks/saas/*` only | ✓ |
| Distinct Stripe Customer for org SaaS vs tenant | ✓ |

---

## Quality gate before deploy claim

- `pnpm typecheck` green  
- Production build (`pnpm --filter @mpa/web build` or repo equivalent) green  

---

## Evidence

Commit hash, deployment id, sandbox Customer/Subscription/Invoice ids (non-secret), screenshots of Company Admin + Master Admin metrics.

# 17 — Phase A Certification

**Package:** BILL-001  
**Phase:** A — Foundation  
**Status:** Commercial certification attempted — **FAIL (incomplete)**  
See [19-phase-a-commercial-certification.md](./19-phase-a-commercial-certification.md). Phase B remains blocked.

---

## Exit criteria (design)

> Sandbox Checkout creates mirrored `saas_subscriptions`.

---

## Delivered

| Item | Path / note |
|------|-------------|
| Migration | `supabase/migrations/20260722120000_bill001_saas_subscription_foundation.sql` |
| Provider contracts | `apps/web/src/lib/integrations/saas-billing/` |
| SubscriptionService | `apps/web/src/lib/saas/server.ts` |
| Org API | `GET/POST /api/saas` |
| Webhooks | `POST /api/webhooks/saas/[provider]` |
| Isolation | Does not import `billing/server` or Connect apply paths |
| Capabilities | `saas:read`, `saas:manage`, `saas:admin` |

---

## Automated checks

| Check | Result |
|-------|--------|
| Unit tests (`saas-billing`, `saas/contracts`) | ✔ 9 passed |
| `pnpm typecheck` | ✔ |
| `pnpm --filter @mpa/web build` | ✔ |

---

## Operator checklist (sandbox)

| ID | Step | Pass? |
|----|------|-------|
| A01 | Apply migration | ✔ |
| A02 | Set `SAAS_BILLING_PROVIDER=stripe` + keys + price ids | ✔ (live only; no `sk_test`) |
| A03 | Register Stripe webhook → `/api/webhooks/saas/stripe` with Billing events | ✔ |
| A04 | Real Checkout completes | ✖ hosted Checkout not completed / no sandbox key |
| A05 | Mirror customer → subscription → entitlements → audit | ✔ |
| A06 | Customer Portal | ✔ (core; card entry not completed) |
| A07 | Webhook sync + idempotency + isolation | ✔ |

---

## Explicitly not claimed

- Phase B Company Admin Billing UI  
- Phase C hard entitlement enforcement  
- Phase D Master Admin MRR/ARR  
- Commercial PASS (Phase E / S01–S12)

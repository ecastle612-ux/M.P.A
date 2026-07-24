# 21 — Phase A Verification

**Package:** FIN-003  
**Phase:** A — Connect foundation  
**Date:** 2026-07-23  
**Kickoff:** `BEGIN FIN-003 PHASE A IMPLEMENTATION`  
**Plan:** [19](./19-phase-a-implementation-plan.md) · Readiness: [20](./20-phase-a-engineering-readiness.md)

---

## Scope attestation

| Included | Done |
|----------|------|
| Stripe Connect onboarding (Account Links) | ☑ |
| Connect account create/link persistence | ☑ |
| Verification status mirror | ☑ |
| Eligibility status | ☑ |
| Read-only payout/onboarding status UI | ☑ |

| Excluded (must remain absent) | Confirmed |
|-------------------------------|-----------|
| Money movement / transfers | ☑ No `createTransfer` / payout create in Phase A code |
| Scheduled payouts | ☑ |
| Reserve / split / allocation math | ☑ |
| Phases B–E | ☑ Locked |

---

## Success criteria ([17](./17-phase-a-readiness.md))

| ID | Criterion | Evidence |
|----|-----------|----------|
| A-S1 | Org can start/complete Express settlement onboarding in test | `/settings/payouts` + `/api/payouts/org/onboarding-link` + noop/stripe ConnectProvider |
| A-S2 | Owner can start/complete Express onboarding from Owner Portal | Financials Connect card + `/api/owner/payouts/onboarding-link` |
| A-S3 | Verification / eligibility states display honestly | `eligibility.ts` + status badges; pending money copy honesty |
| A-S4 | No transfer / payout / schedule code paths | ConnectProvider Phase A surface only |
| A-S5 | Connect webhook updates account status only; idempotent | `/api/webhooks/connect/[provider]` + `connect_webhook_events` |
| A-S6 | Typecheck + build; no BILL-001 / payments webhook coupling | Separate route + `STRIPE_CONNECT_WEBHOOK_SECRET` |
| A-S7 | Audit records for onboarding link creation | `connect_audit_events` via OwnerPayoutService |

---

## Regression checklist

| Check | Result |
|-------|--------|
| API-005 rent checkout / webhooks unchanged | ☑ Not modified |
| BILL-001 SaaS billing unchanged | ☑ Not modified |
| OWNER-001 nav/IA unchanged | ☑ Financials/dashboard composition only |
| No transfer/payout create symbols in Phase A | ☑ |
| Typecheck / ESLint / production build | See § Quality gates below |

---

## Quality gates

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests (Connect + return URL) | ✅ PASS | 13 tests |
| Typecheck | ✅ PASS | `apps/web` tsc |
| ESLint | ✅ PASS | Scoped Phase A paths |
| Production build | ✅ PASS | `next build` |
| Security review | ✅ Documented | [22](./22-phase-a-completion.md) |

---

## Env configuration (no secrets committed)

| Variable | Purpose |
|----------|---------|
| `FIN003_PHASE_A_ENABLED` | Feature flag (`false` disables; production requires explicit `true`) |
| `CONNECT_PROVIDER` | `noop` (default) or `stripe` |
| `STRIPE_SECRET_KEY` | Shared Stripe platform key (REST); Connect adapter only |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | **Connect rail only** — never payments/SaaS secrets |
| `STRIPE_MODE` | `sandbox` / `test` for local without live calls |

Payments continue to use `PAYMENT_PROVIDER` + `STRIPE_WEBHOOK_SECRET`. SaaS continues on its own webhook secret.

---

## Migration

`supabase/migrations/20260723120000_fin003_phase_a_connect_foundation.sql`

- `connect_accounts`, `connect_audit_events`, `connect_webhook_events`
- Capabilities `payout:onboard`, `payout:manage` + role grants

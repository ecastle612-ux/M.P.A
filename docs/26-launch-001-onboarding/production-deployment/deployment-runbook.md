# Deployment Runbook

**Parent:** [Production Deployment Support](./index.md)  
**Audience:** Operator + deploy engineer  
**Rule:** Follow in order. Do not skip verification steps to “save time.”

---

## Preconditions

- [ ] Launch decision **GO** ([go-no-go.md](../production-certification/go-no-go.md))  
- [ ] Staging Master Admin Pass recorded (J0–J8 + Docs + Comms) — DEF-003  
- [ ] DR-C1…C5 verified on staging (role login, membership, MC CTAs, portal handoffs)  
- [ ] Feature freeze confirmed (no FO / FIN-OPS expansion / redesign in the deploy branch)  
- [ ] Deploy branch = certified release (merge of `cursor/product-architecture-reset-5922` or tagged equivalent)

---

## Phase A — Environment

Complete [Environment Verification](./environment-verification.md).

Blockers if missing:

| Missing | Impact |
|---------|--------|
| Required Supabase + session vars | App will not boot correctly |
| `SUPABASE_SERVICE_ROLE_KEY` | Resident/vendor portal provisioning fails |
| `RESEND_*` when email invites claimed | Invites degrade to in-app accept link only — disclose to customer |
| Stripe / SignWell when claimed live | Must stay on honesty path or configure before claiming |

---

## Phase B — Backups

Complete [Backup Verification](./backup-verification.md) **before** applying production migrations.

---

## Phase C — Deploy

1. Confirm CI green on the release commit (lint, typecheck, build, unit tests).  
2. Apply Supabase migrations to **production** project in chronological order (`supabase/migrations/*.sql`).  
3. Confirm migration history matches local migration set (15 files through LAUNCH-001 promise remediation).  
4. Deploy `apps/web` to Vercel **Production** with verified env.  
5. Confirm production URL matches `NEXT_PUBLIC_APP_URL`.  
6. Register / confirm webhooks only for integrations that are live:

| Integration | Endpoint | Secret / note |
|-------------|----------|---------------|
| Stripe | `/api/finance/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` |
| SignWell | `/api/leasing/webhooks/signwell` | `SIGNWELL_WEBHOOK_ID` / hash verify |

7. Do **not** enable live payment or e-sign channels unless keys + webhooks are verified.

---

## Phase D — Validate

Complete [Deployment Validation](./deployment-validation.md).  
**Fail closed:** if smoke fails, roll back or fix under [Bug-Fix Protocol](./production-bugfix-protocol.md) before Customer #1.

---

## Phase E — Monitor

Open [Monitoring, Logging & Error Reporting](./monitoring-logging-errors.md) watch window (minimum first 24 hours of Customer #1 use, denser in first 2 hours post-deploy).

---

## Phase F — Onboard

Execute [Customer #1 Onboarding Support](./customer-1-onboarding-support.md).

---

## Rollback (minimum)

| Layer | Action |
|-------|--------|
| App | Redeploy previous Vercel production deployment |
| Schema | Do **not** invent reverse migrations under freeze; restore from Supabase backup/PITR only if a migration is destructive and approved by operator |
| Config | Revert env var mistakes; redeploy if `NEXT_PUBLIC_*` changed |

Record rollback reason in [Sign-off](./sign-off.md).

---

## Completion

Record outcomes in [Sign-off](./sign-off.md) → **STOP**.

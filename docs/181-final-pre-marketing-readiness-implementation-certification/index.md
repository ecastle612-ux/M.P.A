# Final Pre-Marketing Readiness — Implementation Certification

**Status:** Implemented / certified in-repo. **Not deployed. Migration not applied to Production.**  
**Date:** 2026-08-17  
**Authority:** Owner approval of [docs/180](../180-final-pre-marketing-readiness/index.md)  
**Scope:** P1-08 Privacy/Terms · P1-09 per-quote SaaS Price env gate · P1-10 additive `maintenance_notifications`  
**Branch SHA (implement):** `9860d481`

**Not done:** Production deploy · Production migration apply · Stripe Price create/change · tenant rent/card pay · M5 · FIN-OPS money · July reopen · customer email · Production invitations or work orders

P1-01 through P1-07 remain **CLOSED**.

---

## 1. P1-08 status

**IMPLEMENTED** in-repo. Local Production build serves unauthenticated `/privacy` and `/terms` as **200**. Production www still **404** (not deployed).

Owner decisions used: service identity “My Property Assistant (M.P.A.)”; no invented entity or address; contact `enterprise@my-property-assistant.com`; governing law Minnesota, United States (no county/court); effective date August 17, 2026; conservative retention; no certification claims; cancellation matches current SaaS flow including established no-refund product copy; no cookie banner; Confirm Plan links only (no checkbox).

A formal corporation/LLC name was **not** required to publish these pages under the Owner-approved service identity. None was invented.

## 2. P1-09 status

**IMPLEMENTED** in-repo. Customer Checkout uses `unitVolumeCheckoutGateForQuote`. FO/Complete no longer depend on PM Price env vars. Unit-block env is required only when `additional_blocks > 0`. Missing config fail-closes with the env **name** only.

## 3. P1-10 status

**IMPLEMENTED** in-repo as an additive migration. **Not applied to Production.** Production `maintenance_notifications` remains **ABSENT**. Runtime still soft-skips in-app WO rows until Owner/ops apply.

## 4. Legal pages implemented

| Route | Local `next start` | Production www |
|-------|--------------------|----------------|
| `/privacy` | **200** | **404** (not deployed) |
| `/terms` | **200** | **404** (not deployed) |

Chrome: `MarketingChrome` footer, Auth chrome footer, Confirm Plan text links. No new checkbox. Stripe Checkout consent unchanged.

## 5. Stripe gate behavior

Required for a quote:

1. `STRIPE_SECRET_KEY`
2. Selected product + cycle base Price env
3. `STRIPE_PRICE_UNIT_BLOCK_*` only if `additional_blocks > 0`

| Quote | Required Price env |
|-------|--------------------|
| FO monthly, 0 blocks | `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` |
| Complete annual, 0 blocks | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` |
| PM monthly, 0 blocks | `STRIPE_PRICE_PM_BASE_MONTHLY` |
| FO monthly, blocks > 0 | FO monthly + `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` |

503 body includes `missingEnvKey` (name only). No secret values. Prices unchanged: PM $59 / FO $59 / Complete $109 monthly; approved 20% annual.

## 6. Maintenance notification migration

Additive only. Does **not** replay J6 work-order DDL.

- Table + STAB-007 email columns
- Indexes: user, org+user
- RLS: select own / manager; insert manager or self; update-own
- Grants: `authenticated` select/insert/update; revoke anon/public
- No `comms_notifications` reuse, no fourth domain, no `in_app_notifications` revival
- Email preference and “email failure does not roll back WO” behavior unchanged
- In-app duplicate protection remains the designed insert (no new unique); email keeps `maintenance:{key}:{userId}:{workOrderId}`

Scratch apply: `scripts/scratch-docs-180-maintenance-notifications/run.sh` → `CERTIFIED_APPLY_COMMITTED` + idempotent re-apply + `SCRATCH_DOCS_180_VERIFY_PASS` (own-row allow; cross-user deny; cross-org deny).

## 7. Tests

| Check | Result |
|-------|--------|
| `@mpa/shared` unit-volume Stripe (16) + public purchase motion | PASS |
| Legal copy + footer/Auth/Confirm Plan links | PASS |
| Checkout 503 names missing env key | PASS |
| Lifecycle missing-table soft-skip | PASS |
| FAC-003 WO mutation when table absent | PASS |
| Inbox maps maintenance rows; email failure does not throw | PASS |
| Scratch apply + RLS isolation | PASS |
| `@mpa/web` lint | PASS |
| `@mpa/shared` + `@mpa/web` typecheck | PASS |
| Production `next build` (`VERCEL_ENV=production`) | PASS — 176 routes including `/privacy` and `/terms` |
| Local unauthenticated `/privacy` `/terms` `/login` `/checkout` | **200** with legal links |

## 8. Migration filename + SHA-256

`supabase/migrations/20260817120000_docs_180_maintenance_notifications.sql`

`678d35a75cea668bb69c2915d1a207e7850cd3ac88bbc242662223e3921b523e`

## 9. Production unchanged proof

Read-only 2026-08-17 after this package:

| Signal | Result |
|--------|--------|
| `maintenance_notifications` | **ABSENT** |
| `maintenance_work_orders` | 33 rows (unchanged) |
| `comms_notifications` | 6 rows |
| `financial_notifications` | 1 row |
| www `/privacy` `/terms` | **404** |

No Production SQL apply. No Production deploy. No customer email. No Stripe Price mutation.

## 10. Remaining pre-marketing blocker

In-repo P1-08/P1-09/P1-10 work is done. Public legal pages and the Checkout gate are **not live** until this package is deployed. In-app work-order inbox stays empty until the certified migration is applied in Production (separate Owner/ops step).

`STRIPE_PRICE_UNIT_BLOCK_MONTHLY` / `ANNUAL` remain **NOT VERIFIED** in Production (not in the public catalog). Quotes with `additional_blocks = 0` do not need them.

## 11. Exact next gate

1. Merge this package.  
2. Deploy the application to Production (legal pages + per-quote gate).  
3. Separately apply `20260817120000_docs_180_maintenance_notifications.sql` to Production — Owner/ops only; not this turn.

**STOP.** Do not deploy. Do not apply Production.

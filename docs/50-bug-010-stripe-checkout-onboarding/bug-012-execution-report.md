# BUG-012 Execution Report

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Date | 2026-08-09 |
| Branch / PR | `cursor/bug-012-complete-automated-onboarding-cf8a` / [#68](https://github.com/ecastle612-ux/M.P.A/pull/68) |
| Tip SHA (fixes) | `fb8c71d5280b6ea8bd1601fea391297ecbb28253` |
| Production deployment SHA | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` (pre-fix `main`) |
| Production deploy id | `dpl_7jHkUnv6YjVsgd8SqxhpNMabCorz` |
| Production DB schema version | `20260808230241` (`com_002_slice_e_lifecycle`) |
| Unit tests | `run-provisioning.test.ts` — **7/7 PASS** |

## 1. PASS / FAIL

**FAIL** — first-time customer cannot reach Mission Control on Production with zero employee involvement. Fixes are implemented on PR #68 but **not deployed** to Production. Preview deploy for the PR is **Error** / SSO-protected.

## 2. Production deployment SHA

`cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` (`dpl_7jHkUnv6YjVsgd8SqxhpNMabCorz`)

## 3. Production database schema version

`20260808230241` — `com_002_slice_e_lifecycle` (Slice D/E + BILL-001 recon present)

## 4. Customer onboarding certification

| Step | Status | Evidence |
|------|--------|----------|
| Landing | PASS | `screenshots/01-landing.webp` |
| Pricing | PASS | `screenshots/02-pricing.webp` |
| Confirm Plan (Property Manager) | PASS | `screenshots/03-confirm-plan.webp` |
| App Stripe Checkout + `BUG010E2E` | PASS (promo) / BLOCKED ($0 complete) | App uses `payment_method_collection=always` — card still required at $0 (`04`/`05`) |
| Payment (API `if_required` $0 session) | PASS | Session `cs_live_a1dNuP4a5KzWfrnk9XG1UXzMgrc1PPbn2zJlsf7oALb4vSY3eqUTzCSf4V` paid; `08-payment-success.webp` |
| Provisioning → `owner_pending` (warm instance) | PASS (warm) | Continue UI showed org + checkpoint; status API returned job |
| Claim account / password | **FAIL** | Sign-up notice then **Invalid login credentials** (`11`–`13`); `/api/commerce/provision/claim-password` → **404** on Production |
| Cold-start status | **FAIL** | Later poll → “Provisioning status unavailable” (`14`) — job not hydrated from DB on Production code |
| Email verification | **FAIL** | Not completed (auth login blocked) |
| Guided Setup | **FAIL** | Not reached |
| Mission Control | **FAIL** | Not reached |
| Zero employee involvement E2E | **FAIL** | Blocked at claim |

Cert customer: `bug012.cert.1786233238@mpa-e2e.test`  
Org id (from status API): `c824092e-9992-4ee2-bee8-c0753cd68266`

## 5. Lifecycle certification

| Item | Status |
|------|--------|
| Event generation code (purchase → activated) | Implemented on branch |
| Production rows for cert session | **0 rows** in `saas_lifecycle_events` for this checkout (expected — Production lacks writers) |

## 6. Master Admin verification

| Item | Status |
|------|--------|
| Consoles read jobs/events from DB | Implemented on branch |
| Production UI | **Not certified** — `/admin` login wall only (`16-admin-login-wall.webp`); no operator credentials in agent |

## 7. Screenshot evidence

Artifacts: `/opt/cursor/artifacts/bug-012/screenshots/`

1. Landing → 16. Admin login wall (see table above). Full claim → Guided Setup → Mission Control screenshots **not available** until Production serves BUG-012.

## 8. Remaining blockers

1. **Merge PR #68 + Production redeploy** of `m-p-a-web` (primary).
2. Vercel Preview for this PR is **Error**; Preview SSO also blocks agent E2E against preview.
3. App Checkout still uses `payment_method_collection=always` (out of scope to change) — UI $0 promo still asks for a card; cert used Stripe API `if_required` session.
4. Master Admin operator credentials not available to this agent.

## Fixes on branch (ready to deploy)

- Hydrate jobs/purchases from Postgres + Stripe across cold starts
- Await job persistence (fixes `entitled` DB stall race)
- Claim-password + commerce sign-up path for pre-created auth users
- Auto-claim on continue when authenticated
- Status route advances stuck pre-`owner_pending` jobs
- Claim verification email always includes bind token
- Lifecycle event writes for onboarding milestones
- Master Admin DB-backed job/event lists

## Success criteria

Not met until a first-time customer reaches Mission Control on Production with zero employee involvement after this deploy.

**STOP.** Await Owner Acceptance. Do not begin Production Polish, Master Admin Command Center, Slice F, or Capital Projects.

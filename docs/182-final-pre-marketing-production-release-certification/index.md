# 182 — Final Pre-Marketing Production Release Certification

**Title:** FINAL PRE-MARKETING PRODUCTION RELEASE CERTIFICATION  
**Status:** **READY FOR FINAL SUBSCRIPTION UAT**  
**Date:** 2026-08-17  
**Authority:** Owner authorization to release the certified docs/181 package · [docs/181](../181-final-pre-marketing-readiness-implementation-certification/index.md) · [docs/180](../180-final-pre-marketing-readiness/index.md) · [docs/179](../179-pre-marketing-p1-cleanup/index.md) · docs/178  
**Target application:** Vercel Production `m-p-a-web` · `https://www.my-property-assistant.com`  
**Target database:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Certified migration source:** `supabase/migrations/20260817120000_docs_180_maintenance_notifications.sql`  
**Certified source SHA-256:** `678d35a75cea668bb69c2915d1a207e7850cd3ac88bbc242662223e3921b523e`  
**This package:** Merge + Production application deploy of P1-01–P1-10, then apply the certified `maintenance_notifications` SQL. **No Stripe Price mutation. No tenant Stripe payment execution. No M5. No July reopen. No FIN-OPS money mutation. No customer invitations, work orders, or email. No test-card subscription purchases. No test subscribers.**

---

## Verdict

**READY FOR FINAL SUBSCRIPTION UAT**

M.P.A. is technically ready for the final controlled Property Manager / Facility Operations / Complete Platform subscription UAT. Public legal pages are live. The per-quote SaaS Checkout gate is deployed. Required Production Stripe SaaS env names are PRESENT. `maintenance_notifications` is live under platform stamp `20260817041817`. July remains frozen. Tenant Stripe execution remains off. M5 remains unauthorized. Existing FIN-OPS money is unchanged.

**STOP.** Do not perform PM / FO / Complete test-card purchases in this record. Do not create test subscribers from this record.

---

## What this package did not do

- Did not change Stripe Prices
- Did not enable tenant Stripe payment execution
- Did not enable M5
- Did not reopen July
- Did not mutate historical FIN-OPS data
- Did not create customer invitations or work orders
- Did not send customer email
- Did not implement native apps or Web Push
- Did not perform subscription purchases or create test subscribers
- Did not replay unused `20260817120000`

---

## 1. Production SHA / deployment

| Item | Value |
|------|--------|
| Merge SHA (`origin/main`) | `564aaf252615a595e0b08b6504eb2ce90ff1e8b6` |
| Production SHA | `564aaf252615a595e0b08b6504eb2ce90ff1e8b6` |
| Vercel deployment ID | `dpl_D3q7kwNpTfJH5XLCs9xEx3UPJpRE` |
| Deployment created | 2026-08-17T04:14:42Z |
| GitHub Production deployment | `5938871813` · success 2026-08-17T04:15:49Z |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com` |
| Merge commit | `Merge certified pre-marketing P1-01 through P1-10 release.` |

Pre-release www `/privacy` and `/terms` were **404**. After this deploy they are **200**.

---

## 2. P1-01 through P1-10 Production status

| ID | Production status |
|----|-------------------|
| P1-01 Tenant Pay now honesty | **LIVE** — Pay now hidden unless occupancy + `stripe_payment_execution_enabled`. Checkout Confirm Plan has no “Pay now”. |
| P1-02 Staff Record payment | **LIVE** — finance desk / command center / lease money use Record payment. |
| P1-03 M5 mutation controls | **LIVE** — `isFinanceM5Authorized()` remains `false`; collections kinds hard-stop `finance_m5_not_authorized`. |
| P1-04 SaaS claim UX | **LIVE** — Guided Setup tells the buyer to check email. |
| P1-05 Commerce-backed Guided Setup SKU | **LIVE** — purchased SKU retained (docs/179 contract on this SHA). |
| P1-06 Team Deactivate | **LIVE** — Deactivate present for authorized admin. |
| P1-07 Honest Billing & Plan | **LIVE** — copy on this SHA. |
| P1-08 Privacy / Terms | **LIVE** — see §3. |
| P1-09 Per-quote Checkout env gate | **LIVE** — see §6. |
| P1-10 `maintenance_notifications` | **LIVE** — see §4. |

---

## 3. Privacy / Terms status

| Route | Pre-release | Post-deploy |
|-------|-------------|-------------|
| `GET /privacy` | 404 | **200** |
| `GET /terms` | 404 | **200** |

Live copy matches Owner-approved fields: service identity “My Property Assistant (M.P.A.)”; contact `enterprise@my-property-assistant.com`; governing law Minnesota, United States (Terms); effective date August 17, 2026. No invented LLC/address. No cookie banner. No “I agree” checkbox on Confirm Plan.

Legal links verified live:

- Public footer (landing, pricing, get-started, modules)
- Auth chrome (`/login`)
- Confirm Plan (`/checkout`)

---

## 4. Maintenance notification migration — actual Production stamp

| Item | Value |
|------|--------|
| Certified filename | `20260817120000_docs_180_maintenance_notifications.sql` |
| Certified SHA-256 | `678d35a75cea668bb69c2915d1a207e7850cd3ac88bbc242662223e3921b523e` (3,633 bytes) |
| **Actual Production stamp** | **`20260817041817`** / `docs_180_maintenance_notifications` |
| Repo twin | `supabase/migrations/20260817041817_docs_180_maintenance_notifications.sql` |
| Predecessor | `20260816094933` / `docs_166_tenant_lifecycle` |
| `20260817120000` on Production | **absent — do not later replay** |
| J6 work-order DDL | **not replayed** |
| Table rows after apply | **0** (no customer work order created) |

Contract verification (non-mutating):

- Table exists with designed columns, including STAB-007 email fields
- Indexes: `maintenance_notifications_user_idx`, `maintenance_notifications_org_user_idx`, primary key
- RLS enabled; policies `select_own` / `insert` / `update_own` use `auth.uid()` or `is_maintenance_manager(organization_id)`
- `anon` / `public` have no grants; `authenticated` has designed SELECT/INSERT/UPDATE (platform default privileges also list extra table rights for `authenticated` / `service_role`, unchanged pattern)
- Check constraints and FKs to `organizations`, `auth.users`, `maintenance_work_orders` match certified source
- Notification Center already maps `source: "maintenance"` from `maintenance_notifications` (`communications-service.ts`)
- `maintenance_work_orders` 33 / updates 43 unchanged
- `comms_notifications` 6 and `financial_notifications` 1 unchanged

Org isolation and recipient isolation are enforced by the live RLS expressions (own `user_id` or org maintenance manager). No Production row was inserted to prove that path.

---

## 5. Stripe SaaS env PRESENT / MISSING matrix

Read-only Vercel Production names. **Values not printed.**

| Env name | Production |
|----------|------------|
| `STRIPE_SECRET_KEY` | **PRESENT** |
| `STRIPE_PRICE_PM_BASE_MONTHLY` | **PRESENT** |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | **PRESENT** |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | **PRESENT** |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | **PRESENT** |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | **PRESENT** |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | **PRESENT** |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | **PRESENT** |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | **PRESENT** |
| `STRIPE_SAAS_WEBHOOK_SECRET` | **PRESENT** |

No environment variables were added or changed in this package.

---

## 6. PM / FO / Complete Checkout gate status

Deployed `requiredUnitVolumePriceEnvKeysForQuote` / `unitVolumeCheckoutGateForQuote` on SHA `564aaf25`.

| Quote | Required Price env | Cross-product keys |
|-------|--------------------|--------------------|
| PM monthly, 0 blocks | `STRIPE_PRICE_PM_BASE_MONTHLY` | FO/Complete **not** required |
| FO monthly, 0 blocks | `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | PM **not** required |
| Complete annual, 0 blocks | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | PM **not** required |
| Any product, `additional_blocks > 0` | selected base + `STRIPE_PRICE_UNIT_BLOCK_*` | unit-block only when blocks > 0 |

Live public catalog (`/api/commerce/catalog-prices`) status **ready**:

- Property Manager monthly **$59**
- Facility Operations monthly **$59**
- Complete Platform monthly **$109**
- Annual amounts $566.40 / $566.40 / $1,046.40 (approved 20%)

No Stripe Price create/change this package.

---

## 7. Production smoke

Read-only / non-destructive. No email sent. No authenticated customer session.

| Surface | Result |
|---------|--------|
| Landing `/` | 200 · PM / FO / Complete · footer Privacy/Terms |
| Pricing `/pricing` | 200 · same |
| Privacy `/privacy` | 200 |
| Terms `/terms` | 200 |
| Login `/login` | 200 · Privacy/Terms links |
| Checkout `/checkout` | 200 · Privacy/Terms links · no agree checkbox · no Pay now |
| Get Started + SKU entries | 200 |
| Modules | 200 |
| PM Mission Control `/pm/mission-control` | 307 → `/login` (no 500) |
| Facility Mission Control `/facility/mission-control` | 307 → `/login` |
| Complete launcher `/launcher` | 307 → `/login` |
| Tenant Portal `/portal`, `/portal/tenant` | 307 → `/login` |
| Billing `/billing` | 307 → `/login` |
| Notification Center API | 401 Unauthenticated (route live; no session) |
| PWA `manifest.webmanifest` | 200 · standalone · theme `#0F6B56` · 10 icons · `start_url` `/dashboard` |
| Service worker `/sw.js` | 200 |
| Apple touch + Android marks | 200 (`/icons/mpa-apple-touch.png`, 192/512) |
| Email lockup `/branding/logo-email-lockup.png` | 200 |
| Gmail dark mode | already Owner-verified PASS (docs/177) — not re-sent |

Security (no evidence of regression from this release):

- Application change did not alter PM/FO entitlement helpers
- Occupancy / tenant-lifecycle objects were not migrated
- FIN-OPS RLS / write-guard objects were not migrated
- New table is a third notification domain; finance and comms tables unchanged

---

## 8. Finance / July / Stripe / M5 safety

Compared to the pre-release recheck (same-day docs/180–181 baseline).

| Control | After release |
|---------|----------------|
| July freeze | `july_freeze_enabled = true` · `updated_at` still `2026-08-16 07:52:09.009771+00` |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` |
| Tenant Stripe execution | **false** on **6/6** `financial_module_settings` |
| M5 | still unauthorized in deployed code |
| Charges | 18 / sum 24708.16 |
| Payments | 11 / 11111.00 |
| Allocations | 11 |
| Ledger | 42 |
| Receipts | 1 |
| Dual-write | none — WO in-app path writes `maintenance_notifications` only |
| Stripe Prices | unchanged (catalog still $59 / $59 / $109) |

No unexplained money drift.

---

## 9. Remaining blocker

**None** for this Production release package.

Out of scope and still not authorized: tenant Stripe payment execution, M5, July reopen, native apps, Web Push, customer invitations, customer work orders, marketing email blasts.

Authenticated interior walkthrough of Mission Control / Billing / Notification Center was not performed here (no test subscriber, no customer login). Subscription UAT is the next controlled session.

---

## 10. Exact next gate

**Owner-controlled PM / FO / Complete Stripe Checkout subscription UAT** (test cards only), one product at a time, after Confirm Plan.

Do not enable tenant rent/card pay. Do not enable M5. Do not reopen July. Do not change Stripe Prices unless a separate Approve says so.

**STOP.**

# 232 — PARTNER-001 Partner Program Foundation

**Title:** PARTNER-001 PARTNER PROGRAM FOUNDATION + PUBLIC `/partners` — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-001 PARTNER PROGRAM FOUNDATION IMPLEMENTED**  
**Date:** 2026-08-24  
**Authority:** Owner implementation authorization for PARTNER-001. Design: [docs/231](../231-partner-001-partner-program-foundation/index.md). ADR: [ADR-038](../18-decision-log/adr-038-partner-program-foundation.md).  
**Production deploy:** **NO** (historical in-repo PASS only)  
**Production migration:** **NO** (historical in-repo PASS only)  
**Production-live record:** [docs/233](../233-partner-001-production-certification/index.md)  
**STOP:** This file remains the in-repo implementation PASS. Do not start PARTNER-002.

---

## Current verdict

**PASS — PARTNER-001 PARTNER PROGRAM FOUNDATION IMPLEMENTED**

The Partner Program foundation and public `/partners` page are implemented in-repo. Commissions are tracked only. Money does not move. `/request/{partner}` is not live.

---

## 1. Certification path

`docs/232-partner-001-implementation-certification/index.md`

## 2. Implementation SHA

`c9452c75bda0ac082585aeb6152ce40fbc8d5d38` (`c9452c75`)

Preceding implementation commit: `837db15dcd87701ecc9f22ef08a2783bfa46d451` (feature landing).  
This certification commit follows `c9452c75`.

Branch: `cursor/partner-001-foundation-6821`.

## 3. Migrations

**File:** `supabase/migrations/20260824200000_docs_231_partner_001_foundation.sql`  
**Applied to Production:** **NO**

Tables (service-role writes; RLS on; operator SELECT only):

- `platform_partners`
- `platform_partner_referrals` (unique `organization_id`, first-wins)
- `platform_partner_commissions` (idempotent on Stripe event/invoice ids)
- `platform_partner_events`

Anonymous INSERT/UPDATE/DELETE is denied. No `financial_*` mutation.

## 4. `/partners` page

`https://www.my-property-assistant.com/partners` route exists as `apps/web/src/app/(marketing)/partners/page.tsx`.

Public. In marketing nav and footer. Sitemap + robots allow `/partners`.

Headline: **Grow Your Property Service Business With M.P.A.**  
Support: **You handle the physical work. M.P.A. powers the software behind it.**

Production build lists `ƒ /partners`.

## 5. Mobile result

Page uses the existing marketing chrome, `max-w-3xl`, responsive grid (`md:grid-cols-2`), and stacked CTAs. Automated desktop/mobile viewport walkthrough was not run in this Cloud environment (no browser executor). Layout tokens match other public marketing pages.

## 6. Partner application

`POST /api/partners/apply` captures the authorized fields. M.P.A. subscription is not required. Honeypot `company_fax` returns generic success and does not persist.

## 7. Partner data model

Single `platform_partners` table for applications and approved partners. Referrals, commissions, and audit events are separate platform tables — not tenant financial ledgers.

## 8. Partner types / statuses

Types: Referral / Certified Service / Strategic (`referral`, `certified_service`, `strategic`). Public page uses labels only.

Statuses: `applied` · `approved` · `active` · `suspended` · `rejected`.

## 9. Public slug

Normalized, unique, case-safe, reserved-route blocked (`request`, `admin`, `partners`, …). Proposed on apply; Master Admin can edit before activation. Example: `northstar-property-services`. Internal IDs are not used as slugs.

## 10. Referral attribution

Canonical path: `/get-started?ref=<slug>`. Cookie `mpa_partner_ref` (first-wins). Checkout reads the cookie server-side and appends `mpa_partner_ref` to Stripe session/subscription **metadata only** after `buildUnitVolumeCheckoutMetadata`. Does not change quote, price, plan, entitlements, complimentary grants, or Stripe amounts. First organization attribution wins. Invalid/suspended partners are ignored.

## 11. 20% commission configuration

`FOUNDING_PARTNER_COMMISSION_PERCENT = 20` / `2000` bps in `packages/shared/src/partners/config.ts`. Example $109 → $21.80 → $261.60 uses `exampleFoundingCommission()`. Partner-level `commission_bps` is admin-configurable without source changes. Historical rows snapshot bps.

## 12. 12-month qualification

`FOUNDING_PARTNER_QUALIFYING_MONTHS = 12`. New cash commission rows stop after 12 non-void qualifying months per referred organization.

## 13. Complimentary handling

Attribution may be stored on complimentary claim when a valid ref cookie exists. Cash commission is not created while `complimentaryOnly` is true or collected amount is 0. `MASTER_ADMIN_GRANT` is unchanged.

## 14. Refund handling

`charge.refunded` voids matching ledger rows. If status was `paid`, row becomes `void` with `offset_required`. No negative Stripe transactions.

## 15. Commission ledger

Tracking only: partner, organization, payment/event refs, eligible cents, snapshot bps, calculated cents, qualifying month index, `pending|earned|paid|void`. Failed payments (`amount_paid` 0) create no row.

## 16. Master Admin

`/admin/commercial/partners` + `GET/PATCH /api/admin/partners`. Gate: `isPlatformOperatorUser` (401 / 403). Organization managers are not operators. Actions: approve, reject, activate, suspend, edit slug/type/rate, view referrals/accruals/audit, mark earned → PAID, clear pending flags.

## 17. Partner-facing capability

**Deferred to PARTNER-003.** No authenticated Partner Dashboard in this package.

## 18. Security

- No anonymous client DB writes (service role only)
- Client `organization_id` / `user_id` rejected on apply
- Server validation + 16KB payload cap
- Operator gate on admin API
- Referral metadata cannot grant access
- Existing `/request/[token]` facility intake unchanged

## 19. Rate limiting

Apply and ref-cookie endpoints use `consumeRateLimit({ class: "PUBLIC" })`. Stripe / SignWell webhooks remain exempt (`docs/226` regression still PASS).

## 20. Stripe / money-movement result

**No money movement.** No Stripe Connect, transfers, Checkout amount changes, AutoPay, FIN-OPS, customer payment, M5, or July-freeze changes. Commission PAID is a ledger status only.

## 21. SEC-001 regression

`docs-226-security-regression.test.ts` PASS. Leaked-password / operator TOTP remain deferred per docs/229. Not modified.

## 22. REC-001 regression

No MEDIA / receipt / attachment / `financial_receipts` changes.

## 23. Tests

| Suite | Result |
|-------|--------|
| Shared partners + Master Admin nav | PASS |
| Partner service (attribution, 20%, snapshot, 12-month cap, complimentary skip, refund void, PAID auth) | PASS |
| Public apply (success, invalid, oversized, honeypot, rate limit) | PASS |
| Admin partners (operator 200, non-operator 403, approve) | PASS |
| Cookie first-wins | PASS |
| apply-lifecycle / SaaS webhook / complimentary admin / SEC-001 / Wave B3 | PASS |

## 24. Typecheck

`pnpm --filter @mpa/shared typecheck` PASS  
`pnpm --filter @mpa/web typecheck` PASS

## 25. Lint

Changed-source eslint PASS.

## 26. Build

`pnpm --filter @mpa/web build` PASS. `/partners`, `/api/partners/apply`, `/api/admin/partners`, `/admin/commercial/partners` present. No `/request/{partner}` product route.

## 27. P0 / P1 / P2

| Severity | Item | Disposition |
|----------|------|-------------|
| P2 | Authenticated partner dashboard | Deferred (PARTNER-003) |
| P2 | Browser desktop/mobile visual pass | Not run in this Cloud agent; page is responsive marketing chrome |
| P2 | Pre-existing `tenant-portal-billing-copy.test.ts` | Unrelated; not modified |
| — | docs/229 leaked-password / TOTP | Remains Owner-deferred |

No P0/P1 blockers for this in-repo package.

## 28. Production deployment status

**NOT DEPLOYED.** Migration **not applied**. Return to Owner for a separate Production authorization.

## 29. Final verdict

**PASS — PARTNER-001 PARTNER PROGRAM FOUNDATION IMPLEMENTED**

---

## STOP

Control returns to the Owner. Do not:

- deploy to Production
- apply `20260824200000_docs_231_partner_001_foundation.sql`
- build `/request/{partner}`
- automate partner payouts
- modify Stripe Connect
- build a service marketplace
- change pricing
- execute M5 / unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings
- start PARTNER-002

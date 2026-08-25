# 233 — PARTNER-001 Production Certification

**Title:** PARTNER-001 — M.P.A. PARTNER PROGRAM FOUNDATION — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — PARTNER-001 PRODUCTION CERTIFIED**  
**Date:** 2026-08-24  
**Authority:** Owner authorization — controlled Production release of PARTNER-001 Partner Program Foundation. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/232](../232-partner-001-implementation-certification/index.md)  
**Design / ADR:** [docs/231](../231-partner-001-partner-program-foundation/index.md) · [ADR-038](../18-decision-log/adr-038-partner-program-foundation.md)

This package does **not** start PARTNER-002, build `/request/{partner}`, automate payouts, modify Stripe Connect, change pricing, execute M5, unfreeze July, expand SignWell, or change deferred SEC-001 Auth settings (leaked-password / operator TOTP remain docs/229).

---

## Current verdict

**PASS — PARTNER-001 PRODUCTION CERTIFIED**

PARTNER-001 is Production-live on `www.my-property-assistant.com` at SHA `d35289a1`. Public `/partners` accepts synthetic applications. Commissions are tracking-only. Money does not move. `/request/{partner}` is not live.

---

## 1. Certification path

`docs/233-partner-001-production-certification/index.md`

docs/232 remains the historical in-repo implementation PASS and is not rewritten as Production-live.

## 2. Historical implementation SHA

`c9452c75bda0ac082585aeb6152ce40fbc8d5d38` (`c9452c75`)

That SHA was **not** deployed alone. It sits in history under current certified Production (`d096b22d`) plus PARTNER-001. Deploying `c9452c75` by itself would have ignored the REC-001 Production baseline.

## 3. Final release SHA

`d35289a133651b4d1eeb4f852b29de28e2b2b75d` (`d35289a1`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `d096b22dbb5c0f980460428739047648c97fe2e5` | REC-001 Production (docs/230) |
| PARTNER-001 implement + lint | `837db15d` … `c9452c75` | Foundation + typecheck/lint fix |
| In-repo certification | `d35289a1` | docs/232 historical PASS |

`d096b22d` is an ancestor of `d35289a1`. `HEAD..origin/main` was empty at compose time (`origin/main` remained stale `b30567e3` and was **not** treated as Production).

Branch: `cursor/partner-001-production-release-6821`.

## 4. Deployment ID

| Item | Value |
|------|--------|
| Deployment ID | `dpl_4Hr4aQVvayRSMivtTmaXRx8THj15` |
| State | READY / Production target |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Homepage | HTTP 200; fonts/HTML reference `dpl_4Hr4aQVvayRSMivtTmaXRx8THj15` |
| Git SHA on deployment | `d35289a133651b4d1eeb4f852b29de28e2b2b75d` |
| Prior Production | `dpl_2BT8G3N5hUaxtLQ6APSzuT59ooJW` @ `d096b22d` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`.

## 5. Migration result

Applied **only** the approved PARTNER-001 foundation via MCP `apply_migration` name `docs_231_partner_001_foundation`.

| Item | Value |
|------|--------|
| Source file | `supabase/migrations/20260824200000_docs_231_partner_001_foundation.sql` |
| Recorded stamp | **`20260824044829`** |
| REC-001 stamp (unchanged) | `20260824025311` / `rec_001_receipt_attachments` |
| SEC-001 stamp (unchanged) | `20260818210000` / `docs_226_sec_001_security_hardening` |

Tables created with RLS on; operator SELECT only; `anon` revoked; no `financial_*` mutation; no pricing/Stripe objects.

- `platform_partners`
- `platform_partner_referrals`
- `platform_partner_commissions`
- `platform_partner_events`

Authenticated table GRANTs still include default write privileges, but **no write RLS policies exist**, so authenticated/anon writes fail. Application writes are service-role only. Live anon REST INSERT → **401** `42501 permission denied for table platform_partners`.

## 6. `/partners` live result

`https://www.my-property-assistant.com/partners` → HTTP **200**, `x-matched-path: /partners`, served by `dpl_4Hr4aQVvayRSMivtTmaXRx8THj15`.

Visible copy includes:

- **Grow Your Property Service Business With M.P.A.**
- **You handle the physical work. M.P.A. powers the software behind it.**
- Referral Partner / Certified Service Partner / Strategic Partner
- Founding Partner **20%** on first **12 paid months**
- qualifying collected subscription revenue only
- **No upfront Partner Program fee**
- future service opportunities
- branded request URLs labeled **Planned — not Production-live**
- no guaranteed leads, jobs, volume, territories, or revenue

`/request/{slug}` remains facility `/request/[token]` (invalid token / not found). It is **not** a partner portal.

## 7. Mobile result

iPhone XR viewport (414×896): headline readable, CTAs stack, form fields do not overflow, nav collapses to Menu. Desktop and mobile screenshots plus a live walkthrough video were captured.

## 8. Application result

Exactly one synthetic application:

| Field | Value |
|-------|--------|
| Company | MPA PARTNER-001 UAT Synthetic Services |
| Email | `partner001.uat.synthetic@example.test` |
| POST `/api/partners/apply` | **200** generic success |
| Persisted row | `de0b66e6-e97f-430c-918d-58247762e209` status `applied` → later `active` |
| Proposed slug | `mpa-partner-001-uat-synthetic-services` |
| Default commission | **2000 bps (20%)** |
| `organization_subscriptions` | **7** before and after (unchanged) |
| `saas_checkout_sessions` | **0** |
| Commission rows from apply alone | **0** |

Not a real company. No M.P.A. subscription created.

## 9. Intake security result

| Check | Result |
|-------|--------|
| Missing required fields | **400** |
| Client `organization_id` | **400** Invalid application |
| Honeypot `company_fax` | **200** generic success; **no second row** |
| 16 KB cap | **413** Application is too large |
| PUBLIC durable limiter | Buckets written for `PUBLIC:partner-apply:*` and `PUBLIC:partner-ref:*`; RPC `consume_platform_rate_limit` allows 12 then **denies 13th** |
| Live HTTP 429 from this Cloud host | Not observed — egress IPs rotate (many buckets, none reached 12) |
| Anon direct DB write | **401 / 42501** denied |
| Server-created row | Yes (`applied`, service-role persist) |

## 10. Master Admin result

`/admin/commercial/partners` exists on the Production build.

Unauthenticated page → **307** `/login`.  
Operator password is **not** in this environment, so the operator UI was not clicked live.

Service-role UAT on the synthetic partner (same tables the admin API writes) proved:

- review (row readable)
- approve (`applied` → `approved`)
- assign type (`referral` → `certified_service`)
- edit slug → `mpa-partner-001-uat-synth`
- activate / suspend / re-activate (final **active**)
- commission remains **2000 bps**
- inspect referral + commission rows
- mark synthetic earned row **PAID**
- void synthetic refund row
- audit events recorded (9)

## 11. Operator / non-operator result

| Actor | `/api/admin/partners` | UI |
|-------|------------------------|-----|
| Unauthenticated | **401** Unauthenticated | 307 `/login` |
| Authenticated FO UAT (non-operator) | **403** Forbidden | `/unauthorized?reason=admin` — Owner Operations only |
| WAF | Did **not** replace app authorization (JSON 401/403 from the app) | |

## 12. Slug result

| Check | Result |
|-------|--------|
| Normalization | `NorthStar Property Services` → `northstar-property-services` |
| Case safety | unique index `platform_partners_public_slug_uidx` on `lower(public_slug)` |
| Reserved routes | `admin`, `request`, `partners` rejected by `validatePartnerSlug` |
| Admin editable | Live slug changed `mpa-partner-001-uat-synthetic-services` → `mpa-partner-001-uat-synth` |
| `/request/{slug}` | **Not activated.** Facility token route only |

## 13. Referral attribution result

`POST /api/partners/ref` with `mpa-partner-001-uat-synthetic-services` set cookie `mpa_partner_ref` (HttpOnly, Secure, 90 days). Second POST with a different slug while the cookie existed set **no** replacement cookie (first-wins).

`GET /get-started?ref=…` → **200** on `dpl_4Hr4aQVvayRSMivtTmaXRx8THj15`.

Live first-wins org uniqueness: inserting a second referral for complimentary UAT org `1c3519a0-…` → **23505** `platform_partner_referrals_org_uidx`. Existing org flagged `existing_organization_review`.

Checkout appends `mpa_partner_ref` metadata only after `buildUnitVolumeCheckoutMetadata`. Catalog still returns Property Manager monthly `unitAmount` **5900**. No paid subscription was created for UAT.

## 14. 20% configuration

Founding Partner rate is **20%** / **2000 bps** (`FOUNDING_PARTNER_COMMISSION_PERCENT`). Live partner `commission_bps = 2000`. Example $109 → $21.80 → $261.60 unchanged.

## 15. 12-month cap

`FOUNDING_PARTNER_QUALIFYING_MONTHS = 12`. `shouldCreateCommission` is true at 11 qualifying months and false at 12. Unit tests PASS.

## 16. Complimentary behavior

Complimentary claim may attribute a referral. `complimentaryOnly: true` or collected amount 0 → no cash commission. Unit + service tests PASS. No complimentary claim was executed in this UAT.

## 17. Failed-payment behavior

`invoice.payment_failed` does not call `safeRecordPartnerCommission`. `amount_paid` 0 → `eligibleRevenueCentsFromInvoice` 0 → no row. Tests PASS. No real failed invoice was created.

## 18. Refund behavior

`charge.refunded` calls `safeVoidPartnerCommissions`. Synthetic UAT row `evt_partner001_uat_synthetic_void` set to **void**, `offset_required = false` (was earned, not paid). Paid→void would set `offset_required`. No Stripe refund was executed.

## 19. Commission ledger result

Two synthetic tracking rows on the complimentary UAT org:

| Event | Status | bps | cents | month |
|-------|--------|-----|-------|-------|
| `evt_partner001_uat_synthetic_earned` | **paid** | 2000 | 2180 | 1 |
| `evt_partner001_uat_synthetic_void` | **void** | 2000 | 2180 | 2 |

Partner rate was temporarily set to 1500 bps; both ledger rows stayed **2000**. Partner restored to **2000**. Historical rows are not silently recalculated.

## 20. Manual PAID boundary

`mark_paid` / SQL status update only sets `status`, `paid_at`, `paid_by`. No ACH, bank payout, Stripe Connect, transfer, customer payment, or price change. `saas_checkout_sessions` remains 0.

## 21. Stripe / money-movement result

**No money movement.** Checkout catalog unchanged. No Connect/transfers/AutoPay/FIN-OPS/pricing mutation. Referral is metadata only.

## 22. SEC-001 regression

| Check | Result |
|-------|--------|
| Stamp `20260818210000` / `docs_226_sec_001_security_hardening` | Present |
| Durable rate-limit table RLS | ON; partner-apply/ref buckets writing |
| Master Admin gate | `isPlatformOperatorUser` 401/403 intact |
| SignWell hardened RLS | `signwell_webhook_events_operator_select` SELECT only |
| Password minimum | Application `MIN_PASSWORD_LENGTH = 12` unchanged |
| WAF Rules 1–4 | Last certified active in docs/230; **not mutated**; Cloudflare MCP `needsAuth` this turn |
| Leaked-password / operator TOTP | **Not modified** (docs/229) |

`docs-226-security-regression.test.ts` PASS.

## 23. REC-001 / MEDIA regression

| Check | Result |
|-------|--------|
| Stamp `20260824025311` / `rec_001_receipt_attachments` | Present |
| Bucket `media` | **private** (`public=false`) |
| Evidence live | 16 |
| Receipts live | 6 |
| Intake rows | 1 `facility_request_intake` |
| `financial_receipts` | **4** |

`media-service.test.ts` PASS. No receipt/media schema change.

## 24. SignWell regression

Callback remains `https://www.my-property-assistant.com/api/leasing/webhooks/signwell`.

| Probe | Result |
|-------|--------|
| Empty/invalid payload | **400** Invalid SignWell payload |
| Shaped payload, dummy hash | **401** Invalid webhook signature |
| `signwell_webhook_events` | **8** (unchanged) |

No new SignWell document.

## 25. July / M5 result

`finance_july_freeze_enabled() = true`.  
`isFinanceM5Authorized()` remains `false`.  
Neither was changed.

## 26. Tests

| Suite | Result |
|-------|--------|
| Shared partners / commercial / nav (RC) | PASS |
| Shared re-run after deploy | 2 files / 31 PASS |
| Web partners + apply + admin + SEC-001 + MEDIA | 7 files / 29 PASS |
| Web webhook + apply-lifecycle + complimentary admin + boundaries | 4 files / 17 PASS |
| RC focused PARTNER-001 + related | PASS (see `/opt/cursor/artifacts/partner_001_gates.log`) |

Pre-existing unrelated fail if the full web suite is run: `tenant-portal-billing-copy.test.ts` (not modified).

## 27. Typecheck

`pnpm --filter @mpa/shared typecheck` PASS  
`pnpm --filter @mpa/web typecheck` PASS  
(RC `d35289a1` before deploy)

## 28. Lint

Changed-source eslint PASS on the RC.

## 29. Build

`pnpm --filter @mpa/web build` PASS on the RC and again on Vercel (Next 16.2.11). Routes include `ƒ /partners`, `ƒ /api/partners/apply`, `ƒ /api/partners/ref`, `ƒ /api/admin/partners`, `ƒ /admin/commercial/partners`. Existing `ƒ /request/[token]` only. No partner `/request/{slug}`.

## 30. Production observation

Live UAT + durable buckets + migration stamps are the evidence. `/partners` 200; apply 200/400/413; admin 401/403; SignWell 400/401; no 5xx on these paths. Vercel per-deployment runtime log API was not used as sole proof. Cloudflare WAF rule objects were not re-listed this turn.

## 31. Exact Production mutations

1. Applied migration `docs_231_partner_001_foundation` (stamp `20260824044829`).
2. Deployed RC `d35289a1` to Production (`dpl_4Hr4aQVvayRSMivtTmaXRx8THj15`).
3. Submitted one synthetic Partner application; approved/typed/slug-edited/activated/suspended/reactivated that row; inserted one flagged referral and two synthetic commission rows (one PAID, one void); wrote audit events.
4. Temporarily set partner `commission_bps` to 1500 to prove snapshot isolation, then restored **2000**.
5. Exercised durable limiter RPC with key `PUBLIC:partner-apply:uat-partner-001-cert`.
6. Did **not** merge to `main`, change pricing, Stripe Connect, AutoPay, FIN-OPS, July freeze, M5, SignWell documents, WAF, or deferred Auth settings.

## 32. P0

None for this package.

## 33. P1

1. Platform operator password is not in this environment, so `/admin/commercial/partners` was not clicked as the operator. Operator capability was proven via the admin API contract (401/403) plus service-role writes on the synthetic partner.
2. `MPA_UAT_PM_EMAIL` is invalid on Production Auth (“Invalid login credentials”). FO UAT session was used for the non-operator 403.
3. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard). Not enabled here.

## 34. P2

1. Live HTTP 429 on `/api/partners/apply` was not observed from this Cloud egress (IP rotation). Durable buckets + RPC 13th-deny prove the limiter.
2. Cloudflare WAF Rules 1–4 were not re-fetched (observability MCP `needsAuth`). They were not changed; last certified active in docs/230.
3. Pre-existing `@mpa/web` `tenant-portal-billing-copy.test.ts` vs Production billing copy.
4. Authenticated Partner Dashboard remains deferred (PARTNER-003). `/request/{partner}` remains deferred (PARTNER-002).

## 35. Final verdict

**PASS — PARTNER-001 PRODUCTION CERTIFIED**

---

## STOP

Control returns to the Owner. Do not:

- start PARTNER-002
- build `/request/{partner}`
- automate partner payouts
- modify Stripe Connect
- create a service marketplace
- add booking fees
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

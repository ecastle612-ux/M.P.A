# 239 — PARTNER-003 Production Certification

**Title:** PARTNER-003 — PARTNER COMMAND CENTER — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — PARTNER-003 PRODUCTION COMMAND CENTER CERTIFIED**  
**Date:** 2026-08-24  
**Authority:** Owner authorization — controlled Production release of PARTNER-003 Partner Command Center. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/238](../238-partner-003-implementation-certification/index.md)  
**Design / ADR:** [docs/237](../237-partner-003-partner-command-center/index.md) · [ADR-040](../18-decision-log/adr-040-partner-command-center.md)  
**PARTNER-002 Production baseline:** [docs/236](../236-partner-002-production-certification/index.md)

This package does **not** start PARTNER-004, automate payouts, add Stripe Connect, collect service payments, build a marketplace, add booking fees, create property-specific partner URLs, change pricing, execute M5, unfreeze July, expand SignWell, or change deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-003 PRODUCTION COMMAND CENTER CERTIFIED**

PARTNER-003 is Production-live on `www.my-property-assistant.com/partner`. Authorized members of a bound receiving organization who satisfy normal M.P.A. Auth, membership, and `platform.partner_services` can manage their service portal, customer requests, referrals, tracked earnings, and public profile without Master Admin for ordinary operations. Money does not move.

---

## 1. Certification path

`docs/239-partner-003-production-certification/index.md`

docs/238 remains the historical in-repo implementation PASS and is not rewritten as Production-live.

## 2. Historical implementation SHA

`c5608b8b1f4f13191dd6cba24dbcc18bce90c944` (`c5608b8b`)

That SHA was **not** deployed alone. Deploying `c5608b8b` by itself would omit the docs/238 record. It sits in history under current certified Production plus PARTNER-003.

## 3. Final release SHA

`ad488856907b16b567c0c40eb2be51aa840b5632` (`ad488856`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `423205e038fb5134d2e245c1bba5fd3c6cf32862` | PARTNER-002 Production (docs/236) |
| PARTNER-002 cert record | `31302ed7` | docs/236 |
| PARTNER-003 design / ADR | `ca748811` | docs/237 + ADR-040 |
| PARTNER-003 implement | `7096231d` | Command Center |
| Lint follow-up | `c5608b8b` | Profile load-effect lint |
| In-repo certification | `ad488856` | docs/238 historical PASS — Production app deploy |

`423205e0` is an ancestor of `ad488856`. `origin/main` remained stale `b30567e3` and was **not** treated as Production.

Branch: `cursor/partner-003-production-release-6821`.

Vercel reports `githubCommitSha = ad488856907b16b567c0c40eb2be51aa840b5632`.

## 4. Deployment ID

| Item | Value |
|------|--------|
| Feature / release deploy | `dpl_2kpbaFP8wckVchTrfugWiwmhH5tX` @ `ad488856` — READY |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| `/partner` | HTTP **307** `/login` unauthenticated; `x-matched-path: /partner`; fonts/HTML reference `dpl_2kpbaFP8wckVchTrfugWiwmhH5tX` |
| Authenticated `/partner` | HTTP **200**, same deployment |
| Prior Production | `dpl_4D9TaQgWpiEahvYH79HjcBDmiTRn` @ `423205e0` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`.

## 5. Migration

Applied **only** the approved PARTNER-003 migration via MCP `apply_migration` name `docs_237_partner_003_command_center`.

| Item | Value |
|------|--------|
| Source file | `supabase/migrations/20260824230000_docs_237_partner_003_command_center.sql` |
| Recorded stamp | **`20260824190704`** |
| PARTNER-002 stamp (unchanged) | `20260824175254` / `docs_234_partner_002_service_portals` |
| PARTNER-001 stamp (unchanged) | `20260824044829` / `docs_231_partner_001_foundation` |
| REC-001 stamp (unchanged) | `20260824025311` / `rec_001_receipt_attachments` |
| SEC-001 stamp (unchanged) | `20260818210000` / `docs_226_sec_001_security_hardening` |

Additive only:

- `platform_partners.logo_media_id` → `media_attachments(id)` ON DELETE SET NULL + partial index
- `media_attachments.related_entity_type` extended with `partner_branding` (existing types kept, including `partner_service_request`)
- `media_attachments.attachment_category` extended with `partner_branding` (kept `evidence`, `receipt`)

Did **not** create a media bucket, alter commissions, alter partner status semantics, modify Stripe, modify customer finance, or modify work-order behavior.

Existing Production counts after apply and UAT: media **35 → 36** (one synthetic `partner_branding` logo); receipts **17** unchanged; evidence **18** unchanged; commissions **2** unchanged; requests **1** unchanged; partners **2** preserved; `organization_subscriptions` unchanged; July freeze still `true`.

A first apply attempt used an incorrect entity-type list and **rolled back** (`23514`). The approved file contents were then applied successfully. No unrelated pending migrations were applied.

## 6. `/partner` live result

Live for the authorized synthetic Partner user on Clinic Demo (Complete SKU).

Unauthenticated: **307** `/login`, `x-matched-path: /partner`, served by `dpl_2kpbaFP8wckVchTrfugWiwmhH5tX`.

Authenticated: **200**. Visible title **Partner Command Center**. Visible subtitle **Manage your service portal, customer requests, referrals and M.P.A. partnership.** Status **Active**. Partner type **Certified Service Partner**.

No partner UUID, organization UUID, or entitlement key is rendered in the Command Center chrome. The authorized dashboard JSON includes `partner.id` for the bound partner only (not shown in the UI).

Sidebar landing: **Shared Across Capabilities → Partners → Partner Command Center** → `/partner`. Public marketing `/partners` remains a separate page.

## 7. Access model

Proven:

```
Normal M.P.A. Auth
  → mpa_active_organization_id cookie
  → active organization_memberships
  → SKU entitlement platform.partner_services
  → pm.maintenance:read / :write
  → platform_partners.organization_id === authz.organizationId
```

- Unauthenticated dashboard: **401**
- Clinic Complete session + Clinic cookie: **200**, bound certified-service partner
- Same session + Property Demo cookie (not a member): **403**
- Same session without a Clinic cookie can resolve another membership (Canopy / EP-016) and receive **403** `code=entitlement` `required=platform.partner_services`
- Client `partner_id` / `partnerId`: **400** `partner_id is not an authorization parameter.`
- Random UUID as `partnerId`: **400**
- A partner row on Property Demo (temporary rebind of the referral-only control) did **not** grant the Clinic user Property access (**403**)
- Clinic Command Center continued to show only the certified-service partner after that rebind
- Property Demo UAT passwords in this environment are invalid; isolation used membership + entitlement + `partner_id` rejection rather than a second live Property login

A Partner Program row alone does not grant application access. Possession of a `partner_id` is never authorization. No second authentication system.

## 8. Overview metrics

Canonical cards from live records (not fabricated):

| Card | Live value |
|------|------------|
| New requests | **0** |
| Accepted | **0** |
| Converted | **1** |
| Declined | **0** |
| Referred organizations | **1** |
| Active qualifying referrals | **1** |
| Qualifying paid months | **1** |
| Tracked commissions | **$21.80** |
| Pending | **$0.00** |
| Earned | **$0.00** |
| Paid | **$21.80** |
| Voided / adjusted | **$21.80** |
| Requests this month | **1** |
| Conversion rate | **100%** |
| Service portal | **Active** |

## 9. Service-request metrics

New 0 / Accepted 0 / Converted 1 / Declined 0 from `platform_partner_service_requests` for the bound partner only. Recent row: `PSR-2026-00001`, synthetic requester, converted. Queue at `/partner/services` shows the same PARTNER-002 request. No second request engine and no new public submit during this package.

## 10. Referral metrics

1 attributed organization, 1 active qualifying referral, 1 qualifying paid month, $21.80 tracked. Matches PARTNER-001 referral + ledger (one paid month, one void).

## 11. Earnings metrics

Pending $0.00 / Earned $0.00 / Paid $21.80 / Voided $21.80. Server `summarizeCommissionLedger` only. Matches the two `platform_partner_commissions` rows (paid 2180¢ + void 2180¢).

## 12. Service portal card

Partner retrieves already-approved assets without Master Admin:

- Canonical display URL `my-property-assistant.com/request/mpa-partner-002-uat-synth`
- Absolute `https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth`
- Copy Link
- View Portal
- View My Service Portal
- QR Center
- Download QR
- Print
- **Powered by M.P.A.**
- Status Active

## 13. QR Center

QR SVG rendered from existing `buildPublicRequestQrSvg` / `qrcode` (no third-party paid QR service). Displayed URL is the canonical Production request URL. `assertSafePublicRequestUrl` rejects UUIDs and internal identifiers. QR payload is that URL only. Download and print controls are present. The SVG itself does not embed a partner UUID.

Practical decode: the QR is shown above the exact Production URL; the generator encodes only that URL. No UUID is present in `portalUrl` or `qrSvg`.

## 14. Service-request link

`/request/mpa-partner-002-uat-synth` — customers request physical property service.

## 15. Referral link

`https://www.my-property-assistant.com/get-started?ref=mpa-partner-002-uat-synth` — eligible new organizations sign up for M.P.A. `/get-started?ref=…` returns **200**.

## 16. Two-link distinction

Overview and Service Portal render two separate cards with distinct purpose copy:

- **Service Request Link** — “Their customers request physical property service.”
- **M.P.A. Referral Link** — “Property managers/facility operators sign up for M.P.A.”

Visible on desktop (side-by-side) and mobile (stacked). Distinction remains obvious.

## 17. Referral customer view

`/partner/referrals` and `GET /api/partners/referrals`:

| Field | Live |
|-------|------|
| Organization | ecastle612+complimentary-uat Organization |
| Referral date | 2026-08-24 |
| Status | Needs review |
| Qualifying months | 1 |
| Commission | Paid |

No payment methods, cards, banks, Stripe customer ids, or tenant billing details.

## 18. Earnings ledger

`/partner/earnings` titled **Partner Earnings** / “Tracked earnings from the Partner Program commission ledger.” Rows come only from the PARTNER-001 ledger:

| Month | Eligible | Rate | Commission | Status | Earned | Paid |
|-------|----------|------|------------|--------|--------|------|
| 1 | $109.00 | 20% | $21.80 | Paid | 2026-08-24 | 2026-08-24 |
| 2 | $109.00 | 20% | $21.80 | Void | 2026-08-24 | — |

Snapshotted rate, qualifying month, eligible revenue, commission amount, earned/paid dates. No client-invented balances.

## 19. Custom commission result

Synthetic partner was temporarily set to **1500 bps**. Dashboard showed **Partner Rate: 15%** with `founding: false` (not hard-coded 20%). Ledger snapshots remained **2000 bps**. Restored to **2000 bps** / **Founding Partner Rate: 20%**. Historical commission rows were not rewritten.

## 20. Payout-language result

UI uses **Tracked Earnings** / **Partner Earnings** and:

**M.P.A. tracks qualifying commissions here. Payout processing is currently handled separately.**

No Withdraw, Cash Out, Connect Bank, Stripe Connect, or ACH setup on Overview, Earnings, or portal surfaces.

## 21. Partner profile

Authorized partner viewed and edited only approved fields:

- description
- public phone
- public email
- website
- service area
- services
- logo

Live saved values (synthetic): description for PARTNER-003 UAT, `612-555-0100`, `uat-partner-003@example.test`, `https://example.test/partner-003-uat`, Twin Cities UAT only, synthetic HVAC/general service.

Read-only chrome: company name, partner type, status, portal slug, portal status. Copy: “Commission rate, partner type, approval, receiving organization, and payout status are managed by Master Admin.”

## 22. Protected-field enforcement

`PATCH /api/partners/profile` rejected all of:

`commissionBps`, `commissionPercentage`, `status`, `partnerType`, `organizationId`, `publicSlug`, `publicPortalEnabled`, `payoutStatus`

each with **400** “Those fields are managed by M.P.A. Master Admin.”

## 23. Partner-logo result

One synthetic 1×1 PNG (not a real company logo) uploaded through MEDIA:

- Image-only: PDF intent **400** “Partner logos must be an image.”
- Max 2 MB: oversized PNG **400** “File exceeds maximum size (2 MB).”
- Client `organizationId` / `partnerId` / `storagePath` **400** “Invalid request.”
- Server-derived org/partner association
- `related_entity_type = partner_branding`, `attachment_category = partner_branding`
- Private `media` bucket (`public = false`)
- Confirm bound `logo_media_id`
- Public logo **302** `/api/public/partners/mpa-partner-002-uat-synth/logo`
- Unauthorized Property cookie **403** on logo preview
- Receipts **17** and evidence **18** unchanged; media 35 → 36

## 24. Portal preview

**View My Service Portal** / **View Portal** open the canonical public route `/request/mpa-partner-002-uat-synth`. No second preview renderer. Live public page shows **Service Requests — MPA PARTNER-001 UAT Synthetic Services**, **Powered by M.P.A.**, and the intake form.

## 25. Partner-status result

| State | Display | Public portal |
|-------|---------|---------------|
| Restored certification | **Active** | 200 |
| Temporary `public_portal_enabled=false` | **Portal Disabled** | 404 |
| Temporary `status=suspended` | **Suspended** | 404 |
| Pending Approval | Code/tests: applied/approved/rejected → **Pending Approval** (not live-toggled; would break the synthetic partner) |

Synthetic partner restored to **active** + portal enabled.

## 26. Notification result

Existing `comms_notifications` only. Live rows: **7** `partner.service_request.submitted` from PARTNER-002. Header notification affordance is the existing inbox.

Code hook `notifyPartnerStaff` still writes `partner.{referral,commission,portal_disabled,partner_suspended}` through the existing table. This UAT used SQL toggles for status/rate, so those extra keys were not newly inserted. No second notification provider.

## 27. Mobile result

~390px walkthrough: title, stacked metric cards, both link cards with Copy/View, referral link, tracked-earnings language, recent request as a card (not a desktop-only table), in-page nav. Sidebar collapses to Menu. `documentElement.scrollWidth` measured 443 vs 390 because of app chrome; content cards stack and remain usable.

## 28. Cross-partner result

- Clinic authorized user sees only the certified-service partner bound to Clinic (latest `updated_at`)
- Temporary rebind of the referral-only partner to Property Demo: Clinic dashboard unchanged (still certified partner, PSR-2026-00001, $21.80 ledger)
- Property cookie on the Clinic user: **403** even while a partner row existed on Property
- Referral-only public API remains **404**
- Restored both synthetic partners to Clinic; certified partner kept as the latest bind

No Partner A / Partner B data leakage observed.

## 29. IDOR

`partner_id` / `partnerId` query parameters **400**. Random UUID **400**. Foreign-org cookie **403**. Logo confirm rejects a client-supplied `partnerId`. Public branding JSON has no partner UUID, org UUID, user id, or storage path.

## 30. Master Admin preservation

`/admin/commercial/partners` exists. Unauthenticated page **307** `/login`. `GET /api/admin/partners` **401** unauthenticated. Partner PATCH cannot change approval, status, type, commission, receiving org, slug, portal enable, or payout. Operator password is not in this environment, so the operator UI was not clicked. Master Admin remains authoritative.

## 31. PARTNER-001 regression

`/partners` **200** on the new deployment. Applications, referral attribution, 20% default (restored), 12-month copy, complimentary attributed org still visible, refund/void row preserved, tracking-only ledger. No automatic payout.

## 32. PARTNER-002 regression

- `/request/mpa-partner-002-uat-synth` **200**, `x-matched-path: /request/[token]`
- Public intake form live (not resubmitted)
- Queue readable by the authorized partner
- Existing request remains converted once (idempotent conversion already certified)
- Referral-only slug public API **404**
- QR / share link still slug-based
- No new request engine

## 33. REC-001 / MEDIA regression

REC-001 stamp present. Bucket `media` **private**. Receipts **17** and evidence **18** preserved. Partner logo uses distinct `partner_branding` purpose/type and did not alter receipt/evidence semantics.

## 34. SEC-001 regression

SEC-001 stamp `20260818210000` present. Durable limiter remains on public partner GET/POST. Master Admin still operator-gated. Password minimum **12** unchanged on sign-up. WAF assumptions unchanged (objects not re-listed). SignWell RLS/hardening untouched. Owner-deferred HIBP and operator TOTP were **not** modified.

## 35. SignWell regression

`POST /api/leasing/webhooks/signwell` empty body **400** `Invalid SignWell payload`. Dummy hash **401** `Invalid webhook signature`. Callback path remains `/api/leasing/webhooks/signwell`. No SignWell document was created.

## 36. Money-movement result

Read-only with respect to Partner commission money movement. No Stripe Connect accounts, transfers, service-customer charges, Checkout/AutoPay/FIN-OPS execution, or pricing changes. Command Center reads the existing ledger only.

## 37. July / M5

**July freeze ON** — `finance_july_freeze_enabled() = true`  
**M5 unauthorized** — `isFinanceM5Authorized()` remains `false`  
Neither was changed.

## 38. Tests

Release-candidate gates on `ad488856` before deploy:

| Suite | Result |
|-------|--------|
| Shared typecheck | PASS |
| Web typecheck | PASS |
| Shared partners + media + api-entitlements | PASS |
| Web PARTNER-003 / 002 / 001, command-center, media, receipt-authz, docs-226, SignWell, partner API routes | PASS |
| Changed-source eslint | PASS |
| `pnpm --filter @mpa/web build` | PASS — includes `ƒ /partner` and supporting partner routes |

Do-not-deploy-if-fail: the candidate was not deployed until those gates passed. Vercel Production build also PASS (Next 16.2.11).

## 39. Typecheck

`pnpm --filter @mpa/shared typecheck` — PASS  
`pnpm --filter @mpa/web typecheck` — PASS

## 40. Lint

Changed-source ESLint — PASS

## 41. Build

`pnpm --filter @mpa/web build` — PASS on the RC. Vercel Production build PASS. Routes include `ƒ /partner`, `ƒ /partner/services`, `ƒ /partner/referrals`, `ƒ /partner/earnings`, `ƒ /partner/portal`, `ƒ /partner/profile`, `ƒ /request/[token]`.

## 42. Production observation

Direct live UAT + API probes (not logs alone):

- `/partner` unauth 307 login; auth 200; no 5xx
- Authorization: 401 / 403 / 400 as designed
- Logo intent/confirm/public 200/302; unauthorized 403; PDF/size spoof 400
- Dashboard/referrals/commissions/profile/portal 200 for the bound org
- `/request/mpa-partner-002-uat-synth` remains 200 after deploy
- Referral-only public API 404
- SignWell 400/401
- Temporary disable/suspend returned public 404, then restored

Vercel runtime logs were not used as sole proof. Cloudflare WAF objects were not re-listed.

## 43. Exact Production mutations

1. Applied migration `docs_237_partner_003_command_center` (stamp `20260824190704`) after a rolled-back incorrect first attempt.
2. Deployed RC `ad488856` to Production (`dpl_2kpbaFP8wckVchTrfugWiwmhH5tX`).
3. Patched synthetic partner public profile fields (description, phone, email, website, service area, services).
4. Uploaded one synthetic partner logo via MEDIA `partner_branding` and bound `logo_media_id`.
5. Temporarily set synthetic `commission_bps` to 1500, verified 15% display, restored 2000. Ledger rows untouched.
6. Temporarily disabled the synthetic portal, verified **Portal Disabled** + public 404, restored.
7. Temporarily suspended the synthetic partner, verified **Suspended** + public 404, restored to active + portal on.
8. Temporarily rebound the referral-only synthetic partner to Property Demo, proved Clinic isolation, restored to Clinic, and refreshed certified `updated_at` so Clinic still binds the certified-service partner.
9. Did **not** merge to `main`, change pricing, Stripe Connect, AutoPay, FIN-OPS, July freeze, M5, SignWell documents, WAF, deferred Auth settings, or start PARTNER-004.

## 44. P0

None. Cross-partner leakage and IDOR probes did not grant Partner B data to Partner A.

## 45. P1

1. Two synthetic UAT partners share the Clinic receiving org. Command Center binds `getPartnerByOrganization` latest `updated_at`. This is a UAT-ops hazard, not a 1:1 real-partner bind. Certified partner was restored as the latest Clinic bind.
2. Platform operator password is not in this environment, so `/admin/commercial/partners` was not clicked as the operator. Preservation is 307/401 plus rejected partner PATCH of admin fields.
3. Property Demo UAT emails reject the passwords present in this environment. Isolation used Clinic membership + foreign-org 403 + `partner_id` 400 + temporary rebind.
4. Inherited PARTNER-002: `GET /api/partners/properties` can 400 (`property_properties.state` missing). Not required to complete PARTNER-003; no new conversion was executed.
5. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard). Not enabled here.

## 46. P2

1. `/partner` is enforced by the app layout and APIs; it is not in the middleware `matcher` / `isProtected` list. Unauthenticated still 307 `/login`.
2. Authorized dashboard JSON includes `partner.id`; the UI does not render it.
3. Referral-only `/request/<slug>` HTML shell is HTTP 200 then client “not available”; public API is 404 (same PARTNER-002 pattern).
4. Cloudflare WAF Rules 1–4 were not re-fetched (`needsAuth`). They were not changed.
5. Mobile `scrollWidth` 443 vs 390 from app chrome; content cards stack and remain usable.
6. Pending Approval was proven in code/tests, not by leaving the synthetic partner in `applied`.
7. Extra partner notification keys were not newly inserted because status toggles used SQL rather than Master Admin mutate.

## 47. Final verdict

**PASS — PARTNER-003 PRODUCTION COMMAND CENTER CERTIFIED**

---

## STOP

Control returns to the Owner. Do not:

- start PARTNER-004
- automate partner payouts
- add Stripe Connect
- collect service payments
- build a marketplace
- add booking fees
- create property-specific partner URLs
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

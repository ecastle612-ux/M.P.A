# 236 — PARTNER-002 Production Certification

**Title:** PARTNER-002 — BRANDED PARTNER SERVICE REQUEST PORTALS — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — PARTNER-002 PRODUCTION SERVICE PORTALS CERTIFIED**  
**Date:** 2026-08-24  
**Authority:** Owner authorization — controlled Production release of PARTNER-002 Branded Partner Service Request Portals. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/235](../235-partner-002-implementation-certification/index.md)  
**Design / ADR:** [docs/234](../234-partner-002-branded-service-request-portals/index.md) · [ADR-039](../18-decision-log/adr-039-partner-service-request-portals.md)  
**PARTNER-001 Production baseline:** [docs/233](../233-partner-001-production-certification/index.md)

This package does **not** start PARTNER-003, automate payouts, collect service payments, modify Stripe Connect, build a marketplace, add booking fees, implement property-specific partner URLs, change pricing, execute M5, unfreeze July, expand SignWell, or change deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-002 PRODUCTION SERVICE PORTALS CERTIFIED**

PARTNER-002 is Production-live on `www.my-property-assistant.com`. Approved Certified Service Partners can receive a dedicated customer service-request link and QR code powered by M.P.A. One synthetic public request was submitted, accepted, and converted once. Money does not move.

---

## 1. Certification path

`docs/236-partner-002-production-certification/index.md`

docs/235 remains the historical in-repo implementation PASS and is not rewritten as Production-live.

## 2. Historical implementation SHA

`b1e73e14ce178a24179ec5d8331521d7c37e829b` (`b1e73e14`)

That SHA was **not** deployed alone. It sits in history under current certified Production (`d35289a1`) plus PARTNER-002. Deploying `b1e73e14` by itself would have ignored the PARTNER-001 Production baseline.

## 3. Final release SHA

`423205e038fb5134d2e245c1bba5fd3c6cf32862` (`423205e0`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `d35289a133651b4d1eeb4f852b29de28e2b2b75d` | PARTNER-001 Production (docs/233) |
| PARTNER-001 Production cert record | `15eebf04` | docs/233 |
| PARTNER-002 implement + lint | `79fdc3c1` … `b1e73e14` | Portals + typecheck/lint fix |
| In-repo certification | `e073b03b` | docs/235 historical PASS — first Production app deploy |
| `/partners` live copy | `423205e0` | After the portal was proven live |

`d35289a1` is an ancestor of `423205e0`. `origin/main` remained stale `b30567e3` and was **not** treated as Production.

Branch: `cursor/partner-002-production-release-6821`.

## 4. Deployment ID

| Item | Value |
|------|--------|
| Feature deploy | `dpl_BBEXndk9AX7VFeSyG87JX1mwYTFD` @ `e073b03b` — READY |
| Final deploy | `dpl_4D9TaQgWpiEahvYH79HjcBDmiTRn` @ `423205e0` — READY |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Homepage / `/partners` | HTTP 200; fonts/HTML reference `dpl_4D9TaQgWpiEahvYH79HjcBDmiTRn` |
| Prior Production | `dpl_4Hr4aQVvayRSMivtTmaXRx8THj15` @ `d35289a1` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`.

## 5. Migration

Applied **only** the approved PARTNER-002 migration via MCP `apply_migration` name `docs_234_partner_002_service_portals`.

| Item | Value |
|------|--------|
| Source file | `supabase/migrations/20260824220000_docs_234_partner_002_service_portals.sql` |
| Recorded stamp | **`20260824175254`** |
| PARTNER-001 stamp (unchanged) | `20260824044829` / `docs_231_partner_001_foundation` |
| REC-001 stamp (unchanged) | `20260824025311` / `rec_001_receipt_attachments` |
| SEC-001 stamp (unchanged) | `20260818210000` / `docs_226_sec_001_security_hardening` |

Additive only. Preserves PARTNER-001, facility intake, PM/FO work orders, MEDIA-001, REC-001, and organization RLS.

- `platform_partners.organization_id`, `public_portal_enabled`, `portal_description`
- `platform_partner_service_requests` / `_events` / `_media_grants` / `_ref_counters`
- `increment_partner_request_ref` (service_role execute only)
- `media_attachments.related_entity_type` extended with `partner_service_request` (existing types kept)

RLS: SELECT for operator or receiving-org member. No write policies. `anon` INSERT denied live (`401` / `42501`). Authenticated table GRANTs still include default write privileges, but **no write RLS policies exist**, so client writes fail. Application writes are service-role only. No Stripe/payment/commission objects.

Existing Production records after apply: partner `de0b66e6-…` preserved; media **33** then **35** after UAT intents; financial receipts **4**; commissions **2**; SignWell events **8**; `organization_subscriptions` **7**.

## 6. Partner eligibility

Portal is live only when all are true: `active` + type `certified_service` or `strategic` + `public_portal_enabled` + receiving `organization_id` + `public_slug`.

Synthetic Certified Service Partner (existing PARTNER-001 UAT row, not a real partner):

| Field | Value |
|-------|--------|
| Company | MPA PARTNER-001 UAT Synthetic Services |
| Id | `de0b66e6-e97f-430c-918d-58247762e209` |
| Type / status | `certified_service` / `active` |
| Slug | `mpa-partner-002-uat-synth` |
| Receiving org | M.P.A. UAT Clinic Demo (`a11ce001-…c11c`, Complete SKU) |
| Portal | enabled |
| Commission | **2000 bps (20%)** unchanged |

Referral-only control partner `mpa-partner-002-uat-referral` with portal flag forced on still returns **404**. Suspend and disable each return **404** for new intake. Restored to the certification state afterward.

## 7. Live public portal

`https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth` → HTTP **200**, `x-matched-path: /request/[token]`, served by the PARTNER-002 Production deployment.

`GET /api/public/partners/mpa-partner-002-uat-synth` → **200** public branding only. No partner UUID, organization UUID, user IDs, or storage paths.

Works without authentication. Submit succeeded with no session cookies.

## 8. Branding

Visible:

- **Service Requests — MPA PARTNER-001 UAT Synthetic Services**
- **Powered by M.P.A.**

Confirmed by public HTML, public JSON (`title` / `poweredBy`), and mobile screenshot.

## 9. Mobile result

iPhone XR viewport (414×896): headline readable, large `min-h-12` / `min-h-14` fields, address/unit/category/urgency/description present, photo and video file/camera controls present, full-width Submit button, no horizontal overflow. Form was filled with UAT values and **not** submitted (one live request already existed). Success confirmation was proven on the API submit (`PSR-2026-00001`).

## 10. Public submission

Exactly one synthetic request:

| Field | Value |
|-------|--------|
| POST `/api/public/partners/mpa-partner-002-uat-synth` | **200** |
| Public ref | `PSR-2026-00001` |
| Status | `submitted` then accepted/converted |
| Partner | `de0b66e6-…` |
| Receiving org | Clinic Demo |
| Work order at submit | **none** |
| Auth user for requester email | **0** |
| Commission / checkout created | **0** |

## 11. Lifecycle

`submitted` → `accepted` → `converted`. Events: `submitted` (no actor), `accept` (authorized FO UAT actor), `convert` (same actor).

## 12. MEDIA

Safe synthetic intents only. Bucket `media` remains **private**.

| Check | Result |
|-------|--------|
| Image PNG intent | **200**, `fileType=image`, `related_entity_type=partner_service_request`, `attachment_category=evidence` |
| Short MP4 intent | **200**, `fileType=video`, same classification |
| PDF / text MIME | **400** |
| Image over 20 MB | **400** File exceeds maximum size (20 MB) |
| Client-supplied org/partner/path | **400** Invalid request |
| Signed URLs | Issued for upload; **not** written into this certification |

The live request was submitted without `mediaIds`, so those UAT objects stayed pending and unattached. Signed access is the only download path.

## 13. Public security

| Check | Result |
|-------|--------|
| Malformed JSON | **400** Invalid request |
| Oversized body | **413** Request is too large |
| Honeypot `company_fax` | **200** generic success; **no second row** |
| Client `organizationId` / `partnerId` / `userId` | **400** |
| Invalid slug | **404** This request link is not available |
| Disabled portal | **404** GET and POST |
| Suspended partner | **404** |
| Referral-only portal | **404** |
| Anon REST INSERT | **401 / 42501** |

## 14. Rate limiting

PUBLIC durable limiter exercised with key `PUBLIC:partner-portal-post:uat-partner-002-cert`: RPC `consume_platform_rate_limit` allows **12** then **denies 13th**. Live HTTP 429 from this Cloud host was not used as a blast. Public routes call `class: "PUBLIC"`.

## 15. Partner queue

Authorized Clinic Demo FO UAT session, `GET /api/partners/requests`:

- New: `PSR-2026-00001` / `submitted` / queue `new`
- Accepted / Converted / Declined tabs: empty before accept
- Unauthenticated queue: **401**; `/partner/services` → **307** `/login`

## 16. Request detail

Authorized GET returned contact, location, unit, category, urgency, description, timestamps, and `submitted` history. Media array empty on that request (see §12).

## 17. Cross-partner isolation

PM Property Demo session cannot read or accept the Clinic request (**403**). FO session with the Property Demo org cookie is **403**. PM queue does not list `PSR-2026-00001`. Treat any successful cross-org read as a blocker — none observed.

## 18. IDOR

| Probe | Result |
|-------|--------|
| Random UUID | **404** Request not found |
| Public status token as request id | **404** |
| Unauthenticated convert | **401** |

Public status token does not grant partner controls.

## 19. Acceptance

`PATCH` accept by authorized FO UAT: `submitted` → `accepted`. Audit event records the actor. No checkout, commission, or transfer row.

## 20. Work-order conversion

Convert with Clinic property `a11ce001-0002-4000-8000-00000000fac1` created **one** facility work order `b6ab7415-2b26-449f-bb83-6016a35cb15d`:

- Title carries category + address
- Category `plumbing`, priority `normal`, property linked
- Request `converted_work_order_id` / `converted_work_surface=facility` / converter / timestamp set

Clinic Demo is Complete (`mpa_complete_platform`); conversion used the existing facility engine (Complete prefers facility).

## 21. Duplicate conversion

Second convert returned the **same** work order id. No second work order in the last 30 minutes besides this one.

## 22. PM result

Automated `request-service.test.ts`: `pm.maintenance` only → **residential**. Live Property Demo remains `mpa_property_manager` with a residential property. No extra Production org was created.

## 23. FO result

Automated path plus Complete/FO entitlement → **facility**. Complimentary UAT org is `mpa_facility_operations` and was not used as a receiving org (no extra live request). Existing facility work-order tests passed.

## 24. Complete result

Live convert on the Complete Clinic org created a **facility** work order in `maintenance_work_orders`. No third work-order system.

## 25. Existing facility-intake regression

Dispatcher still uses `/request/[token]`. High-entropy unknown token → facility miss (`not found`; API **404** “This request link is no longer available.”), **not** partner branding. Partner slug resolves first. `public-request-service` / QR / token tests passed. The only Production facility form remains inactive; no new facility token was minted.

## 26. QR result

`GET /api/partners/portal` returns SVG. Decoded payload:

`https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth`

No internal UUID. No Vercel preview host. Generated with existing `qrcode` / `buildPublicRequestQrSvg`. No paid QR provider.

## 27. Copy Link result

`portalUrl` = `https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth`  
`displayUrl` = `my-property-assistant.com/request/mpa-partner-002-uat-synth`  
`NEXT_PUBLIC_APP_URL` = `https://www.my-property-assistant.com`

## 28. Notification result

Seven in-app `comms_notifications` rows: `partner.service_request.submitted`, title `New service request PSR-2026-00001`, href `/partner/services`, Clinic org managers only.

Operational email uses existing Resend helper to those UAT manager addresses when configured. No new provider. Requester was synthetic `@example.test`.

## 29. Master Admin result

`/admin/commercial/partners` exists. Unauthenticated page → **307** `/login`. `GET /api/admin/partners` → **401**. Operator password is not in this environment, so the operator UI was not clicked.

Service-role writes on the same columns the admin API updates proved:

- portal enabled / receiving organization / unique UAT slug
- canonical URL + QR via `/api/partners/portal`
- request count = 1
- immediate disable: new GET/POST **404**; historical `PSR-2026-00001` remained
- suspend: **404**
- restore to intended certification state

## 30. PARTNER-001 regression

`/partners` HTTP **200**. Applications, 20% / 2000 bps, 12 qualifying months, referral first-wins, and tracking-only ledger are unchanged. Service request created **no** referral commission. Commissions remain **2**. Sequential PARTNER-001 tests **14 passed**.

## 31. Commission / money result

**Zero money movement.** No Stripe Connect, transfers, service payments, Checkout, AutoPay, FIN-OPS, or payouts. `saas_checkout_sessions` **0**. Physical-service billing remains outside PARTNER-002.

## 32. REC-001 / MEDIA regression

REC-001 stamp present. Bucket private. `financial_receipts` **4**. Evidence/receipt distinction unchanged. No existing attachments lost (33 → 35 only from new UAT intents). MEDIA + receipt tests passed.

## 33. SEC-001 regression

SEC-001 stamp present. Durable limiter protected and exercised. Master Admin gate 401/403 intact. `MIN_PASSWORD_LENGTH = 12` unchanged. SignWell RLS still SELECT-only. WAF Rules 1–4 were **not mutated**; Cloudflare observability MCP `needsAuth` this turn (last certified active in docs/230). Leaked-password / operator TOTP **not modified**.

## 34. SignWell regression

Callback remains `https://www.my-property-assistant.com/api/leasing/webhooks/signwell`.

| Probe | Result |
|-------|--------|
| Empty payload | **400** Invalid SignWell payload |
| Shaped payload, dummy hash | **401** Invalid webhook signature |
| `signwell_webhook_events` | **8** (unchanged) |

No new SignWell document.

## 35. July / M5

`finance_july_freeze_enabled() = true`.  
`isFinanceM5Authorized()` remains `false`.  
Neither was changed.

## 36. `/partners` copy

Updated **after** the portal was proven live. Production now shows **Production-live** and:

**Approved Certified Service Partners can receive a dedicated customer service-request link and QR code powered by M.P.A.**

No guaranteed leads. Planned copy is gone. Follow-up deploy `dpl_4D9TaQgWpiEahvYH79HjcBDmiTRn` @ `423205e0`.

## 37. Tests

| Suite | Result |
|-------|--------|
| Shared typecheck RC | PASS |
| Web typecheck RC | PASS |
| PARTNER-002 focused | 4 files / 12 PASS |
| PARTNER-001 sequential | 5 files / 14 PASS |
| Shared partners | 5 PASS |
| Facility public intake + QR + token + rate limit | 4 files / 10 PASS |
| MEDIA + REC-001 | 2 files / 12 PASS |
| SEC-001 + durable limiter | 3 files / 17 PASS |
| FO/PM conversion engine + schemas | 11 PASS |
| Copy-follow-up boundaries test | PASS |

One PARTNER-001 slug-uniqueness assertion failed under file-parallel shared memory store (same-millisecond `createdAt` sort). Sequential re-run PASS. Pre-existing `tenant-portal-billing-copy.test.ts` remains out of scope.

## 38. Typecheck

`pnpm --filter @mpa/shared typecheck` PASS  
`pnpm --filter @mpa/web typecheck` PASS

## 39. Lint

Changed-source eslint PASS on the RC. Copy-change eslint PASS.

## 40. Build

`pnpm --filter @mpa/web build` PASS on the RC. Vercel Production builds PASS for both deploys (Next 16.2.11). Routes include `ƒ /request/[token]`, `ƒ /partner/services`, `ƒ /api/public/partners/[slug]`, `ƒ /api/partners/requests`.

## 41. Production observation

Live UAT + durable limiter + migration stamps are the evidence. Portal 200; invalid/disabled/suspended/referral 404; submit 200/400/413; queue 401/200; convert 200; SignWell 400/401; no 5xx on these paths. Vercel runtime logs were not used as sole proof. Cloudflare WAF objects were not re-listed.

## 42. Exact Production mutations

1. Applied migration `docs_234_partner_002_service_portals` (stamp `20260824175254`).
2. Deployed RC `e073b03b` to Production (`dpl_BBEXndk9AX7VFeSyG87JX1mwYTFD`).
3. Configured the existing synthetic partner: receiving Clinic org, portal on, slug `mpa-partner-002-uat-synth`.
4. Inserted one referral-only synthetic control partner for negative UAT.
5. Submitted one synthetic public request; created two MEDIA intents; wrote 7 in-app notifications; accepted and converted once.
6. Exercised durable limiter RPC with key `PUBLIC:partner-portal-post:uat-partner-002-cert`.
7. Disabled and suspended the UAT portal, then restored the intended certification state.
8. Deployed `/partners` copy `423205e0` (`dpl_4D9TaQgWpiEahvYH79HjcBDmiTRn`).
9. Did **not** merge to `main`, change pricing, Stripe Connect, AutoPay, FIN-OPS, July freeze, M5, SignWell documents, WAF, or deferred Auth settings.

## 43. P0

None for this package.

## 44. P1

1. Platform operator password is not in this environment, so `/admin/commercial/partners` was not clicked as the operator. Portal controls were proven via the admin API contract plus service-role writes on the synthetic partner.
2. `MPA_UAT_PM_PASSWORD` is invalid; `UAT_PM_PASSWORD` works for the PM UAT email. Used for cross-org 403 only.
3. `GET /api/partners/properties` returns 400 (`property_properties.state` missing). Conversion used a known Clinic property id and succeeded.
4. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard). Not enabled here.

## 45. P2

1. Live HTTP 429 on public partner routes was not observed from this Cloud egress. Durable RPC 13th-deny proves the limiter.
2. Cloudflare WAF Rules 1–4 were not re-fetched (`needsAuth`). They were not changed.
3. Mobile walkthrough did not click Submit (one live request already existed). Success confirmation is the API `PSR-2026-00001` response.
4. UAT MEDIA intents were not attached to the converted request (`mediaIds` omitted on submit).
5. Pre-existing `@mpa/web` `tenant-portal-billing-copy.test.ts` vs Production billing copy.

## 46. Final verdict

**PASS — PARTNER-002 PRODUCTION SERVICE PORTALS CERTIFIED**

---

## STOP

Control returns to the Owner. Do not:

- start PARTNER-003
- automate partner payouts
- collect service payments
- modify Stripe Connect
- build a marketplace
- add booking fees
- implement property-specific partner URLs
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

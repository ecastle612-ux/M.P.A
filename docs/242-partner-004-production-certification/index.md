# 242 — PARTNER-004 Production Certification

**Title:** PARTNER-004 — PROPERTY-SPECIFIC SERVICE PORTALS & QR CODES — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — PARTNER-004 PRODUCTION PROPERTY PORTALS CERTIFIED**  
**Date:** 2026-08-24  
**Authority:** Owner authorization — controlled Production release of PARTNER-004 Property-Specific Service Portals & QR Codes. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/241](../241-partner-004-implementation-certification/index.md)  
**Design / ADR:** [docs/240](../240-partner-004-property-specific-service-portals/index.md) · [ADR-041](../18-decision-log/adr-041-partner-property-portals.md)  
**PARTNER-003 Production baseline:** [docs/239](../239-partner-003-production-certification/index.md)

This package does **not** start PARTNER-005, automate partner payouts, add Stripe Connect, collect service payments, build marketplace bidding, add booking fees, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-004 PRODUCTION PROPERTY PORTALS CERTIFIED**

PARTNER-004 is Production-live. An authorized Certified Service Partner can link one canonical receiving-organization property, publish `/request/<partnerSlug>/<propertySlug>`, print a generated QR, and convert a property-portal request onto the stored facility work-order surface. Generic `/request/<partnerSlug>` remains live. Money does not move.

---

## 1. Certification path

`docs/242-partner-004-production-certification/index.md`

docs/241 remains the historical in-repo implementation PASS and is not rewritten as Production-live.

## 2. Historical implementation SHA

`52d831039cefea8351aac37240c1e033e82f57ff` (`52d83103`)

That SHA was **not** deployed alone. Deploying `52d83103` by itself would omit the docs/241 record and sit behind later Production-preserving history. It remains in history under current certified Production plus PARTNER-004.

## 3. Final release SHA

`f56746db9643d9c4129ee9874a21dc2556404d48` (`f56746db`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `ad488856907b16b567c0c40eb2be51aa840b5632` | PARTNER-003 Production app (docs/239) |
| PARTNER-003 cert record | `5d2acecb` | docs/239 (docs-only; not treated as Production app) |
| PARTNER-004 design / ADR | `eccd4f8f` | docs/240 + ADR-041 |
| Shared contracts + migration | `599f6da5` | property-portal helpers + SQL |
| Implementation | `0fb680b2` | stores, APIs, UI, conversion |
| Focused tests | `7cf52db9` | routing, isolation, QR, conversion |
| Typecheck / lint / FO convert follow-up | `52d83103` | historical implementation SHA |
| In-repo certification | `f56746db` | docs/241 historical PASS — Production app deploy |

`ad488856` is an ancestor of `f56746db`. `origin/main` remained stale `b30567e3` and was **not** treated as Production.

Branch: `cursor/partner-004-production-release-6821`.

Vercel reports `githubCommitSha = f56746db9643d9c4129ee9874a21dc2556404d48` on `githubCommitRef = cursor/partner-004-production-release-6821`.

This certification record is a later docs-only commit and was **not** redeployed.

## 4. Deployment ID

| Item | Value |
|------|--------|
| Feature / release deploy | `dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK` @ `f56746db` — READY |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Live HTML | `data-dpl-id="dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK"` on `/request/...`, `/partner`, `/pricing` |
| Prior Production | `dpl_2kpbaFP8wckVchTrfugWiwmhH5tX` @ `ad488856` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`.

## 5. Migration / stamp

Applied **only** the approved PARTNER-004 migration via MCP `apply_migration` name `docs_240_partner_004_property_portals`.

| Item | Value |
|------|--------|
| Source file | `supabase/migrations/20260824240000_docs_240_partner_004_property_portals.sql` |
| Recorded stamp | **`20260824225021`** |
| PARTNER-003 stamp (unchanged) | `20260824190704` / `docs_237_partner_003_command_center` |
| PARTNER-002 stamp (unchanged) | `20260824175254` / `docs_234_partner_002_service_portals` |
| PARTNER-001 stamp (unchanged) | `20260824044829` / `docs_231_partner_001_foundation` |
| REC-001 stamp (unchanged) | `20260824025311` / `rec_001_receipt_attachments` |
| SEC-001 stamp (unchanged) | `20260818210000` / `docs_226_sec_001_security_hardening` |

Additive only: `platform_partner_property_portals` (partner + receiving org + canonical `property_properties` + public slug + enabled) and three columns on existing requests (`property_portal_id`, `property_id`, `intake_source` default `generic_portal`). No property cloning, no second request system, no second MEDIA bucket, no commission / Stripe / finance mutation.

Pre-apply counts: partners **2**, requests **1**, commissions **2**, media **36**, receipts **17**, evidence **18**, partner branding **1**, work orders **39**, July freeze **true**. After apply, those counts were unchanged and the existing request backfilled as `generic_portal`.

## 6. Synthetic property portal

| Field | Value |
|-------|--------|
| Portal id | `1b1e771f-dfac-413a-89c1-d070218c4f80` |
| Partner | `de0b66e6-e97f-430c-918d-58247762e209` — MPA PARTNER-001 UAT Synthetic Services |
| Partner slug | `mpa-partner-002-uat-synth` |
| Public slug | `demo-clinic-facility` |
| Display name | Demo Clinic Facility |
| Enabled | true (restored after disable UAT) |

Created through authorized `POST /api/partners/property-portals` as the Clinic FO session. Not a real customer.

## 7. Canonical property association

| Field | Value |
|-------|--------|
| Property id | `a11ce001-0002-4000-8000-00000000fac1` |
| Name | Demo Clinic Facility |
| Address | 204 Clinic Demo Way, Austin, TX 78701 |
| Receiving org | `a11ce001-0001-4000-8000-00000000c11c` — M.P.A. UAT Clinic Demo (Complete) |

No Unit 101 / real tenant data was altered. No property row was cloned.

## 8. Property route

`https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth/demo-clinic-facility`

Unauthenticated HTTP **200**. Served by `dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK`. Public API `GET /api/public/partners/mpa-partner-002-uat-synth/demo-clinic-facility` **200**. No UUID in the public URL.

## 9. Generic route regression

`https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth` remains HTTP **200** with the PARTNER-002 address field present. Public API **200**. Both portal types coexist.

## 10. Branding

Live property page and API contain:

- **Service Requests — MPA PARTNER-001 UAT Synthetic Services**
- **Property: Demo Clinic Facility**
- **Powered by M.P.A.**

Partner logo preload `/api/public/partners/mpa-partner-002-uat-synth/logo` remains. No per-property logo.

## 11. Form

Property-specific form asks only for requester name, email, phone, unit/area, category, description, urgency, photos, and short video. The **Property or address** field is omitted when `propertySlug` is present. Server fills address from the canonical property.

## 12. Mobile

390×844 viewport: branding, property name, unit/area, category, urgency, media controls, Submit, and Powered by M.P.A. remain visible. No horizontal overflow observed.

## 13. QR

List/detail `qrPayload` is exactly:

`https://www.my-property-assistant.com/request/mpa-partner-002-uat-synth/demo-clinic-facility`

Independent OpenCV decode of the generated SVG matched that URL. No UUID, no Preview hostname, no internal token, no paid QR provider.

## 14. Printable QR

`/partner/properties/1b1e771f-dfac-413a-89c1-d070218c4f80/print` shows partner/company name, Demo Clinic Facility, QR, **Scan to Submit a Service Request**, the public URL, **Powered by M.P.A.**, and a Print control.

## 15. Public submission

Exactly one synthetic request:

| Field | Value |
|-------|--------|
| Request id | `c5577b68-9559-485f-a8c2-321705aa988e` |
| Public ref | `PSR-2026-00002` |
| Requester | Clinic UAT Requester |
| Unit | Reception |
| Category / urgency | plumbing / normal |

`POST /api/public/partners/.../demo-clinic-facility` returned **200**.

## 16. Authoritative request association

Persisted server-derived values:

- partner `de0b66e6-e97f-430c-918d-58247762e209`
- receiving org `a11ce001-0001-4000-8000-00000000c11c`
- canonical property `a11ce001-0002-4000-8000-00000000fac1`
- property portal `1b1e771f-dfac-413a-89c1-d070218c4f80`
- property slug `demo-clinic-facility`
- address `204 Clinic Demo Way, Austin, TX, 78701`

No client organization/property/partner override was accepted.

## 17. Source attribution

`intake_source = property_portal`. Historical generic request `PSR-2026-00001` remains `generic_portal`.

## 18. Request detail

Command Center / Services detail for `PSR-2026-00002`:

**Property QR / Property Portal**

Shows property/address, Reception, Clinic UAT Requester, plumbing, normal, description, submitted timestamp. `PSR-2026-00001` remains labeled **Partner portal**. Converted-tab UI is required because the default Services tab is New.

## 19. Acceptance

Events: `submitted` → `accept` → `convert`. Accept PATCH **200**. No money movement.

## 20. Conversion

Converted once without reselecting a property. Client `propertyId` of a foreign property was ignored. Resulting work order:

| Field | Value |
|-------|--------|
| Work-order id | `ba98ccb6-833c-4b7a-8cee-3a63571a9161` |
| Surface | `facility` |
| Property | `a11ce001-0002-4000-8000-00000000fac1` |
| Title | `plumbing — 204 Clinic Demo Way, Austin, TX, 78701` |

## 21. Duplicate conversion

Second convert PATCH **200** reused `ba98ccb6-833c-4b7a-8cee-3a63571a9161`. One `convert` event only. Work-order count increased by **1** total (39 → 40).

## 22. PM result

Automated: `property-portal-service.test.ts` converts a PM-only org to `residential:<stored property id>` and ignores a client property override. No extra Production PM request was created. Clinic is Complete, so the live convert exercised FO-first, not a residential work order.

## 23. FO result

Live Clinic convert created facility work order `ba98ccb6-…` on Demo Clinic Facility. Existing FO conversion tests passed.

## 24. Complete result

Clinic SKU is Complete. Live entitlements include `facility.operations` + `pm.maintenance`. Convert used FO-first and the stored canonical property. No third work-order engine.

## 25. Properties dashboard

`/partner/properties` authorized **200**. One linked property: Demo Clinic Facility, type **complete**, enabled, canonical URL, QR, request count **1**. Unauthorized list **401**.

## 26. Property analytics

Canonical metrics after convert: total **1**, this month **1**, accepted **0**, converted **1**, declined **0**, conversion rate **100**. Accepted is current-status (the row is `converted`, not `accepted`). Not fabricated.

## 27. Search

Authorized search by slug `demo-clinic-facility`, name `Demo Clinic`, and address `204 Clinic` each returns total **1**. Search `Maple Court` returns total **0**.

## 28. Pagination

`page=1&pageSize=25` returns `pageSize=25`. `pageSize=500` is clamped to **100**. Shared `PARTNER_PROPERTY_PORTAL_PAGE_SIZE = 25` / `MAX = 100`. No 100 Production properties were created.

## 29. Disable behavior

PATCH `enabled: false` → public page safe copy, API GET/POST **404** `This request link is not available.` Historical request and work order remained. Portal restored to enabled.

## 30. Suspended-partner behavior

Synthetic certified partner was temporarily set `status=suspended` and `public_portal_enabled=false`. Property API GET/POST **404** same safe error. Generic public API **404**. Restored immediately to `active` + portal on. Historical request/WO remained. Certified partner remains the latest Clinic `updated_at` bind.

## 31. Enumeration safety

Unknown partner, unknown property slug, disabled portal, and suspended partner all return the same public API error: **This request link is not available.** HTML shells use the same copy. Existence of a private property is not revealed.

## 32. Cross-partner

`GET /api/partners/property-portals/<referral-partner-id>` **404**. Create rejects `partnerId`. List is bound to the receiving-organization partner, not Partner B. Focused isolation tests passed.

## 33. Cross-property

Property A slug cannot resolve Property B (unknown slug **404**). PATCH with `propertyId` is **400 Invalid request.** Slug edits cannot rebind `property_id`.

## 34. Cross-org

Create with foreign property `a11ce002-0001-4000-8000-000000000101` → **404** `Select a property from your authorized list.` PM sessions using non-Clinic org cookies → **403**.

## 35. IDOR / client override

Rejected or ignored:

- create with `organizationId` / `partnerId` → **400**
- create with random property UUID → **404**
- public submit with `organization_id` / `property_id` / `partner_id` / `property_portal_id` → **400**
- convert with foreign `propertyId` → stored Clinic property used

Unauthenticated partner APIs **401**.

## 36. MEDIA

Reused `/api/public/partners/[slug]/media` (PARTNER-002 bucket `media`):

| Case | Result |
|------|--------|
| image/png intent | **200** |
| video/mp4 intent | **200** |
| application/pdf | **400** not allowed |
| 80 MB image | **400** exceeds 20 MB |

PNG intent rebound to the facility work order on convert (`related_entity_type=maintenance`). QR is generated, not stored as receipt/evidence. No second bucket.

## 37. Notifications

`comms_notifications.notification_key = partner.service_request.submitted`  
Title: **New service request — Demo Clinic Facility**  
Body names the partner, not requester PII.

## 38. Master Admin

`GET /api/admin/partners/property-portals` unauthenticated **401**. Clinic FO session **403 Forbidden**. `/admin/commercial/partners` unauthenticated redirects to login. Operator password is not in this environment, so the operator UI was not clicked. Admin route exists for linked property, slug, display name, enabled, URL, QR, and request count. Service-role/test evidence plus 401/403 preserve the boundary.

## 39. PARTNER-001 regression

`/partners` **200**. Dashboard still shows founding 20%, 12 qualifying months copy, commission ledger **2** rows / $21.80 tracked unchanged. No paid subscription was created.

## 40. PARTNER-002 regression

Generic portal 200. Existing `PSR-2026-00001` remains converted on facility WO `b6ab7415-…` with source **Partner portal**. Queue, Accept/Decline/convert paths unchanged. MEDIA reuse proven.

## 41. PARTNER-003 regression

Authenticated `/partner`, Overview, Services, Referrals, Earnings, Service Portal, Profile all **200** on `dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK`. Logo, generic QR, tracked earnings, and protected admin fields remain. Partner PATCH still cannot change approval/status/type/commission/org/slug/payout.

## 42. REC-001 / MEDIA regression

REC-001 stamp present. Anon storage list of `media` fails closed. Receipts **17** and partner branding **1** unchanged. Evidence **18 → 20** only from the two new partner-request intents. QR is generated.

## 43. SEC-001 regression

SEC-001 stamp `20260818210000` present. Durable limiter remains on public partner GET/POST. Master Admin operator-gated. Password minimum **12** unchanged. SignWell RLS/hardening untouched. Owner-deferred HIBP and operator TOTP were **not** modified.

## 44. SignWell regression

Callback remains `POST /api/leasing/webhooks/signwell`. Empty/invalid body **400** `Invalid SignWell payload`. Dummy hash **401** `Invalid webhook signature`. No SignWell document was created.

## 45. Stripe / money result

No Checkout, Connect, transfer, ACH, AutoPay, FIN-OPS execution, booking fee, or service payment. Commissions remain **2**. The service request did not create a commission.

## 46. July / M5 / pricing

**July freeze ON** — `finance_july_freeze_enabled() = true` after apply and after UAT.  
**M5 unauthorized** — `isFinanceM5Authorized()` remains `false`.  
**Pricing unchanged** — `/pricing` **200** on the new deploy; no Professional/Business SaaS tiers introduced. None were mutated.

## 47. Tests

Release-candidate gates on `f56746db` before deploy:

| Suite | Result |
|-------|--------|
| Shared package tests | PASS 71 files / 493 |
| PARTNER-004 + 003 + 002 + 001 focused web | PASS 12 files / 40 |
| MEDIA / REC / SEC / SignWell / partner request routes | PASS 10 files / 64 |
| PM / FO / Complete conversion (in focused partner suites) | PASS |

## 48. Typecheck

`pnpm --filter @mpa/shared typecheck` — PASS  
`pnpm --filter @mpa/web typecheck` — PASS

## 49. Lint

Changed-source ESLint (web + shared PARTNER-004 sources) — PASS

## 50. Build

`pnpm --filter @mpa/web build` — PASS. Vercel Production build PASS (Next 16.2.11). Routes include:

- `ƒ /request/[token]/[propertySlug]`
- `ƒ /partner/properties`
- `ƒ /partner/properties/[linkId]/print`
- `ƒ /api/public/partners/[slug]/[propertySlug]`
- `ƒ /api/partners/property-portals`
- `ƒ /api/partners/property-portals/[linkId]`
- `ƒ /api/admin/partners/property-portals`

## 51. Production observation

Direct live UAT + API + database (not logs alone):

- Property portal 200; generic portal 200; both on `dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK`
- Public submit 200; override 400; disabled/suspended/unknown 404 same copy
- `/partner/properties` 200 authorized; 401 unauthenticated
- QR decode exact canonical www URL
- Request detail source labels
- Accept + convert + duplicate convert
- SignWell 400/401
- No 5xx on these paths

Vercel runtime logs were not used as sole proof. Cloudflare WAF objects were not re-listed.

## 52. Exact Production mutations

1. Applied migration `docs_240_partner_004_property_portals` (stamp `20260824225021`).
2. Deployed RC `f56746db` to Production (`dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK`).
3. Created one synthetic property portal on Demo Clinic Facility / slug `demo-clinic-facility`.
4. Created PNG and MP4 MEDIA intents; submitted exactly one public property-portal request (`PSR-2026-00002`).
5. Accepted and converted that request once to facility WO `ba98ccb6-…`.
6. Temporarily disabled the property portal, verified public 404, restored.
7. Temporarily suspended the synthetic certified partner, verified public 404, restored to active + portal on (latest Clinic bind preserved).
8. Did **not** merge to `main`, change pricing, Stripe Connect, AutoPay, FIN-OPS, July freeze, M5, SignWell documents, WAF, deferred Auth settings, or start PARTNER-005.

## 53. P0

None. Cross-partner, cross-property, cross-org, and client-override probes did not leak or rebind canonical property/org/partner.

## 54. P1

1. Two synthetic UAT partners share the Clinic receiving org. Command Center binds latest `updated_at`. Certified partner was restored as the latest Clinic bind after suspend/restore.
2. Platform operator password is not in this environment, so `/admin/commercial/partners` was not clicked as the operator. Preservation is 401/403 plus existing admin route/tests.
3. Property Demo / foreign-org UAT used membership 403 + foreign property 404 rather than a second live customer login.
4. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard). Not enabled here.

## 55. P2

1. Services queue defaults to the New tab; converted property-portal requests are visible on the Converted tab.
2. Printable QR copy is client-rendered; unauthenticated HTML shell does not include the print sentences until JS loads.
3. Referral-only `/request/<slug>` HTML shell remains HTTP 200 then client “not available”; public API is 404 (PARTNER-002 pattern).
4. After convert, request-detail media can read “No media attached” because PARTNER-002 rebinds attached MEDIA onto the work order.
5. Cloudflare WAF Rules were not re-fetched (`needsAuth`). They were not changed.
6. Screen-recording save of the browser session timed out; still-image UAT artifacts were retained.

## 56. Final verdict

**PASS — PARTNER-004 PRODUCTION PROPERTY PORTALS CERTIFIED**

---

## STOP

Do not:

- start PARTNER-005
- automate partner payouts
- add Stripe Connect
- collect service payments
- build marketplace bidding
- add booking fees
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

Control returns to the Owner.

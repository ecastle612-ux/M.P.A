# 238 — PARTNER-003 Partner Command Center

**Title:** PARTNER-003 — PARTNER COMMAND CENTER — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-003 PARTNER COMMAND CENTER IMPLEMENTED**  
**Date:** 2026-08-24  
**Authority:** Owner implementation-only authorization for PARTNER-003. Design: [docs/237](../237-partner-003-partner-command-center/index.md). ADR: [ADR-040](../18-decision-log/adr-040-partner-command-center.md).  
**Foundation:** PARTNER-001 + PARTNER-002 Production-certified ([docs/236](../236-partner-002-production-certification/index.md)) @ `423205e038fb5134d2e245c1bba5fd3c6cf32862`  
**Production deploy:** **NO**  
**Production migration:** **NO**  
**STOP:** Do not deploy, automate payouts, add Stripe Connect, collect service payments, start PARTNER-004, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-003 PARTNER COMMAND CENTER IMPLEMENTED**

Approved partners who authenticate normally, belong to the bound receiving organization, and satisfy `platform.partner_services` can manage their service portal, customer requests, referrals, and tracked Partner Program earnings from `/partner` without Master Admin for ordinary operations. Nothing in this package is Production-live.

---

## 1. Certification path

`docs/238-partner-003-implementation-certification/index.md`

## 2. Implementation SHA

`c5608b8b1f4f13191dd6cba24dbcc18bce90c944` (`c5608b8b`)

Design/ADR: `ca748811`. Feature landing: `7096231d`. Lint follow-up: `c5608b8b`.  
This certification commit follows `c5608b8b`.

Branch: `cursor/partner-003-command-center-6821`.

## 3. Migration

**File:** `supabase/migrations/20260824230000_docs_237_partner_003_command_center.sql`  
**Applied to Production:** **NO**

Additive only. Does not duplicate PARTNER-001 or PARTNER-002 tables.

- `platform_partners.logo_media_id`
- `media_attachments.related_entity_type` extended with `partner_branding`
- `media_attachments.attachment_category` extended with `partner_branding`

Writes remain service-role. `anon` / `public` grants are unchanged.

## 4. `/partner` route

Canonical authenticated home: `/partner`  
Title: **Partner Command Center**  
Supporting copy: **Manage your service portal, customer requests, referrals and M.P.A. partnership.**

Supporting routes: `/partner/services`, `/partner/referrals`, `/partner/earnings`, `/partner/portal`, `/partner/profile`.

Production build lists `ƒ /partner` and the supporting partner pages.

## 5. Access model

```
Normal M.P.A. Auth
  → active organization cookie
  → active organization_memberships
  → SKU entitlement platform.partner_services
  → pm.maintenance:read / :write
  → platform_partners.organization_id === authz.organizationId
```

A Partner Program row alone does not grant application access. Possession of a `partner_id` is rejected (`400`) and is never used as authorization. No second authentication system. No Partner-only credentials.

## 6. Overview

Dashboard cards from canonical records only: service-request counts, referral counts, tracked earnings, portal status, two-link distinction, recent requests, and partner-safe activity labels.

## 7. Service-request metrics

New / Accepted / Converted / Declined, plus requests this month and conversion rate (`converted / (converted + declined)`). Derived from `platform_partner_service_requests` for the bound partner only.

## 8. Referral metrics

Total attributed organizations, active qualifying referrals (non-void months still under the 12-month cap), qualifying paid months, and total tracked commissions. All from PARTNER-001 referral + commission rows.

## 9. Earnings metrics

Pending / Earned / Paid / Voided-adjusted cents. Server-side `summarizeCommissionLedger`. No client-side balance invention. Language is **Tracked Earnings** / **Partner Earnings**.

## 10. Service portal card

**Your Service Portal** shows Active/Disabled, `my-property-assistant.com/request/<slug>`, Copy Link, View Portal, and **Powered by M.P.A.**

## 11. QR Center

`/partner/portal` reuses `buildPublicRequestQrSvg` / existing portal API. Preview, canonical URL, download SVG, print-friendly block, and placement guidance. No paid QR provider. No design studio.

## 12. Service-request link

`/request/<partnerSlug>` — customers request physical property service.

## 13. Referral link

`https://www.my-property-assistant.com/get-started?ref=<partnerSlug>` — property managers / facility operators sign up for M.P.A. Copy Referral Link + Open Link. Copy does not promise guaranteed earnings.

## 14. Two-link distinction

Overview and portal surfaces render the two URLs in separate cards with distinct purpose copy. Service request ≠ M.P.A. referral.

## 15. Earnings ledger

`/partner/earnings` and `GET /api/partners/commissions` read the PARTNER-001 ledger. Each row shows referred organization name (when lookup is available), qualifying month, eligible amount, snapshotted percentage, commission amount, status, earned date, and paid date.

## 16. Custom commission handling

Dashboards use `partner.commissionBps` / ledger snapshot. Founding 20% copy appears only when the configured/snapshotted rate is 2000 bps. A 15% partner displays **Partner Rate: 15%**.

## 17. Referral customers

`/partner/referrals` lists attributed organizations: business name, referral date, status, qualifying paid months, commission status. No payment methods, cards, banks, tenant PII, or unrelated organization data.

## 18. Partner profile

`/partner/profile` shows company name, partner type, service areas, services, public contact, portal slug, and portal status.

## 19. Editable fields

Safe self-service: portal description, public phone, public email, website, service area, services offered, company logo.

## 20. Protected fields

Rejected on PATCH: commission percentage, partner status, partner type, approval timestamps, receiving organization, public slug, portal enable flag, payout/paid fields, audit history.

## 21. Branding / logo

Optional `logo_media_id` + MEDIA `partner_branding`. Image-only MIME, 2 MB cap, server-derived org/partner association, authorized partner user only, private `media` bucket, signed download / public logo redirect. No second public bucket. Not mixed with receipt/evidence.

## 22. Portal preview

**View My Service Portal** opens the canonical `/request/<slug>` route. No second renderer.

## 23. Partner status

Human labels: Active, Pending Approval, Suspended, Portal Disabled. Suspended history remains readable; new intake stays off per PARTNER-002.

## 24. Notifications

Existing `comms_notifications` only. Events: new service request (PARTNER-002), referral attributed, commission earned, commission marked paid, portal disabled, partner suspended. Optional `notifyPartnerEvent` hook keeps unit tests isolated.

## 25. Navigation

Compact Partner nav: Overview · Service Requests · Referrals · Earnings · Service Portal · Profile. Sidebar landing item is **Partner Command Center** → `/partner`. PM/FO admin surfaces are not exposed merely because someone is a Partner.

## 26. Mobile result

Metric cards, large request/referral/earnings cards on narrow screens, Copy Link, QR, and request actions. Desktop tables remain at `md+`.

## 27. Cross-partner isolation

`getPartnerByOrganization(authz.organizationId)` is the only partner resolver. Partner A dashboard, referrals, commissions, profile, and logo bind cannot see Partner B. Proven in `command-center-service.test.ts`.

## 28. IDOR

Random UUID org IDs return unbound / null. Client `partner_id` / `partnerId` / storage paths are rejected. Request IDs continue to use the existing PARTNER-002 org-scoped request APIs.

## 29. Master Admin preservation

`/admin/commercial/partners` remains authoritative for approval, rejection, activation, suspension, type, commission rate, receiving organization, portal enable/disable, audit, and PAID marking.

## 30. PARTNER-001 regression

`service.test.ts` and `partner-001-boundaries.test.ts` pass: applications, attribution, 20% default, 12-month qualification, complimentary skip, refund void, ledger, manual PAID. No automatic payout.

## 31. PARTNER-002 regression

`request-service.test.ts`, public/admin partner route tests, and `partner-002-boundaries.test.ts` pass. Public portal, QR, intake, queue, Accept / Decline / Convert, and idempotent conversion remain the only request engine.

## 32. REC-001 / MEDIA regression

`media.test.ts`, `media-service.test.ts`, and `receipt-authz.test.ts` pass. Receipt/evidence semantics unchanged. Partner logos use a distinct purpose.

## 33. SEC-001 regression

`docs-226-security-regression.test.ts` passes. Durable rate limiting remains on public partner logo/intake. Password minimum 12, WAF assumptions, and deferred HIBP / operator TOTP are untouched.

## 34. SignWell regression

`signwell-isolation.test.ts` and `signwell-webhook.test.ts` pass. No SignWell document or callback change.

## 35. Stripe / money movement

Command Center **reads** commission rows only. No payouts, subscription changes, price changes, Connect, transfers, service-customer charges, Checkout/AutoPay/FIN-OPS execution. Boundary tests assert no `stripe.transfers`, Withdraw, Cash Out, Connect Bank, or ACH setup.

## 36. July / M5

July freeze remains ON. M5 remains unauthorized. This package does not modify either.

## 37. Tests

Authorization (bound partner, unrelated org, A vs B, non-partner org, random UUID), dashboard metrics, earnings statuses including custom snapshot and 12-month cap, profile allowed vs forbidden edits, logo bind, PM/FO/Complete entitlement on `/partner`, plus PARTNER-001/002/MEDIA/SEC/SignWell regressions.

## 38. Typecheck

`pnpm --filter @mpa/shared typecheck` — PASS  
`pnpm --filter @mpa/web typecheck` / `tsc --noEmit` — PASS

## 39. Lint

Changed-source ESLint — PASS

## 40. Build

`pnpm --filter @mpa/web build` — PASS

## 41. P0 / P1 / P2

| Severity | Finding |
|---|---|
| P0 | None. Cross-partner leakage tests passed. |
| P1 | None. |
| P2 | None blocking. Partner activity shows sanitized labels only; Master Admin retains raw audit. |

## 42. Production status

**NOT DEPLOYED.** Migration is **not** applied. Owner retains release control.

## 43. Final verdict

**PASS — PARTNER-003 PARTNER COMMAND CENTER IMPLEMENTED**

---

## STOP

Return control to the Owner. Do not deploy PARTNER-003, automate payouts, add Stripe Connect, collect service payments, create a service marketplace, implement booking fees, start PARTNER-004, implement property-specific QR portals, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

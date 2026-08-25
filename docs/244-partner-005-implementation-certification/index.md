# 244 — PARTNER-005 Partner Onboarding, Invitations & Activation

**Title:** PARTNER-005 — PARTNER ONBOARDING, INVITATIONS & ACTIVATION — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-005 PARTNER ONBOARDING & ACTIVATION IMPLEMENTED**  
**Date:** 2026-08-25  
**Authority:** Owner implementation-only authorization for PARTNER-005. Design: [docs/243](../243-partner-005-partner-onboarding-invitations-activation/index.md). ADR: [ADR-042](../18-decision-log/adr-042-partner-onboarding.md).  
**Foundation:** PARTNER-001 + PARTNER-002 + PARTNER-003 + PARTNER-004 Production-certified ([docs/242](../242-partner-004-production-certification/index.md)) @ `f56746db9643d9c4129ee9874a21dc2556404d48`  
**Production deploy:** **NO**  
**Production migration:** **NO**  
**STOP:** Do not deploy PARTNER-005. Do not start PARTNER-006. Do not automate payouts, add Stripe Connect, collect service payments, add booking fees, build marketplace bidding, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-005 PARTNER ONBOARDING & ACTIVATION IMPLEMENTED**

Partners can move from Interested → Approved → Invited → Account Created → Setup → Ready to Receive Requests through Path A (public application) or Path B (direct Master Admin invite). Invitation tokens are hashed, expiring, single-use, and email-bound. Onboarding and readiness are derived. Nothing in this package is Production-live.

---

## 1. Certification path

`docs/244-partner-005-implementation-certification/index.md`

## 2. Implementation SHA

`df2874bfea72186c4abe063461c6eb56b8cf1d8a` (`df2874bf`)

| Layer | SHA | Role |
|-------|-----|------|
| Design / ADR | `1a339023` | docs/243 + ADR-042 |
| Implementation | `5c76cf6f` | invitations, admin, `/partner/invite`, Partner Setup, migration |
| Typecheck / lint / boundary | `df2874bf` | ack types, invite copy, PARTNER-003 authz pipeline |

This certification commit follows `df2874bf`.

Branch: `cursor/partner-005-onboarding-6821`.

## 3. Migration

**File:** `supabase/migrations/20260825010000_docs_243_partner_005_onboarding.sql`  
**Applied to Production:** **NO**

Additive only. Canonical partner remains `platform_partners`.

- `platform_partner_invitations` (hashed token, partner + email bind, pending unique per partner/email)
- member SELECT on bound `platform_partners` rows (writes remain service-role)
- `partner.services:read` / `partner.services:write` capabilities for `organization_admin` and `property_manager`

## 4. Onboarding model

Commercial status stays on `platform_partners.status`. Invitation rows track sent/accepted. Checklist and readiness are derived from canonical profile, portal, property-portal count, and acknowledgement events. No second partner table. No cloned profile/property/portal/commission columns.

## 5. Public-application path

`/partners` apply → Master Admin review → `approve` → automatic invitation issue → account/setup → `/partner`. Applications remain `applied` until an operator approves.

## 6. Direct-invite path

`POST /api/admin/partners` creates an approved partner (or reuses the email match) and issues an invitation. No public application required.

## 7. Master Admin Invite Partner

`/admin/commercial/partners` **Invite Partner** fields: company name, contact name, email, partner type, optional phone/website/service area/services/internal note. Commission controls stay operator-only.

## 8. Approval control

Public applications are never auto-approved. Direct Invite records `invited_by` and timestamps. Path A approval is an explicit operator action.

## 9. Invitation security

24-byte base64url token, SHA-256 at rest, partner bind, email bind, server-side validation. Database UUIDs are not the credential. Client `partner_id` / `organization_id` / `user_id` are rejected.

## 10. Expiration

`PARTNER_INVITATION_TTL_MS` = 7 days (single constant). Expired copy: **This partner invitation has expired.** Expired views do not include company details.

## 11. Resend

**Resend Invitation** revokes the prior pending token, issues a new hash, preserves the partner and onboarding progress, and writes `partner.invitation_resent`.

## 12. Email

Resend operational notice. Subject: **You're invited to join M.P.A. Partners**. CTA: **Accept Partner Invitation**. No lead or income promises.

## 13. Invitation landing page

`/partner/invite/<token>` (public). Shows company, type, benefits, and expiration only for a valid pending token.

## 14. Existing-user flow

Existing Auth users sign in. Acceptance attaches partner membership only. Existing memberships and subscriptions are not overwritten.

## 15. New-user flow

Create account through existing `/login?mode=sign_up` with `next=/partner/invite/<token>`. Password minimum 12. No custom password storage.

## 16. Organization handling

If `platform_partners.organization_id` is already set, that org is reused. Otherwise a SKU-less organization is created. Existing organizations are not hijacked. Resend does not create another org.

## 17. Membership

Minimum membership: `organization_admin` on the partner organization. Existing memberships are left intact.

## 18. RBAC / capability

Additive `partner.services:read|write`. Partner APIs also accept legacy `pm.maintenance:*`. Partner-bound orgs receive `platform.partner_services` as an extra entitlement. No Master Admin, finance, or Stripe grants. No fourth product SKU.

## 19. First-login behavior

Successful accept sets the active-organization cookie and routes to `/partner`. Onboarding is prominent when incomplete. Other permitted Partner Command Center areas remain reachable.

## 20. Checklist

**Partner Setup** with `N of M complete`, percent, and next action. No gamification.

## 21. Referral checklist

Profile, referral link, understand tracked earnings, share referral link. No required service-portal / property / QR steps.

## 22. Certified Service checklist

Profile, logo, services & service area, generic portal, first property portal, first QR acknowledgement.

## 23. Strategic checklist

Same applicable service-partner steps as Certified Service (`partnerTypeAllowsPortal`).

## 24. Progress calculation

`completed / required * 100`, rounded. Next incomplete item label.

## 25. Profile

Reuses PARTNER-003 `/partner/profile` and `updatePartnerPublicProfile`.

## 26. Service portal

Reuses PARTNER-002 `/request/<slug>` and `/partner/portal`. Completion = enabled portal + slug + eligible type.

## 27. Property step

Routes to `/partner/properties`. First enabled property portal completes the step.

## 28. QR step

Download / print / acknowledgement writes `partner.qr_completed`. No QR MEDIA records.

## 29. Referral-link onboarding

Shows `/get-started?ref=<slug>` with copy + tracked-earnings explanation.

## 30. Onboarding status

`not_started` | `in_progress` | `complete` — derived, not a commercial status.

## 31. Operational readiness

`ready` | `not_ready`. Service partners require active + org + profile + services + live generic portal + ≥1 property portal. Referral partners require active + org + slug + complete referral checklist. Approved ≠ ready.

## 32. Master Admin onboarding view

Detail shows invitation status/dates, onboarding percent, account connected, profile, portal, property count, QR, readiness.

## 33. Filters

Applications, Invited, Onboarding, Ready, Active, Suspended — derived. Commercial statuses unchanged.

## 34. Setup reminder

**Send Setup Reminder** emails percent + next step + `/partner`. No commission PII.

## 35. Notifications

`comms_notifications` kinds: invitation accepted, onboarding completed, ready to receive requests.

## 36. Audit events

`partner.invited`, `partner.invitation_resent`, `partner.invitation_accepted`, `partner.onboarding_started`, `partner.profile_completed`, `partner.portal_configured`, `partner.property_added`, `partner.qr_completed`, `partner.onboarding_completed`, `partner.ready`.

## 37. Duplicate protection

Email match (case-insensitive) reuses the existing partner. Pending invite is idempotent. Resend is explicit. Company-name similarity is not a merge key.

## 38. Application reconciliation

Same email + existing application → approve (if applied) and invite that row. Documented in docs/243.

## 39. Multi-user readiness

`organization_memberships` already supports many users. PARTNER-005 implements the primary invitee. Architecture is not hard-coded to one lifetime user.

## 40. Token security

Expired / used / malformed / random tokens fail. Token for Partner A cannot claim Partner B. Resend invalidates the prior pending hash.

## 41. Email binding

Authenticated email must match the invitation email. Mismatch returns a safe explanation and does not attach.

## 42. Cross-org

Accept ignores client org/partner/user IDs. Membership is created only on the authorized partner organization.

## 43. Privilege escalation

Acceptance does not grant Master Admin, PM/FO SKUs, finance, or Stripe permissions. Partner APIs still require partner bind + partner or legacy maintenance capability.

## 44. Rate limiting

Inspect: durable `PUBLIC`. Accept: durable `AUTH`. No Redis/KV.

## 45. Privacy

Unknown, malformed, used, and expired pages do not leak emails, memberships, internal IDs, or unrelated company data.

## 46. Mobile

Invite page, checklist, profile, logo, referral, portal, property, and QR controls use stacked layouts, `min-h-10` / Button targets, and no required horizontal table for the setup card.

## 47. Accessibility

Labeled invite/admin fields, semantic `progressbar`, status text (not color alone), keyboard-accessible buttons, `role="alert"` / `role="status"`.

## 48. PARTNER-001 regression

Application, approve/activate/suspend, commission default, ledger, and operator gates remain. Focused PARTNER-001 tests passed.

## 49. PARTNER-002 regression

Generic portal public routes and request tests passed. No second portal engine.

## 50. PARTNER-003 regression

Command Center, profile, earnings tracking-only, and partner-id rejection remain. Boundary test updated only to the same authorization pipeline (`resolveAuthorizationContext` + `evaluatePermission`).

## 51. PARTNER-004 regression

Property portal service tests passed. QR still generated on demand.

## 52. Complimentary-access regression

Complimentary claim route and service tests passed. Partner invite does not call complimentary claim.

## 53. REC-001 / MEDIA regression

Receipt and media tests passed. No new bucket. QR is not stored as MEDIA.

## 54. SEC-001 regression

Password minimum 12 unchanged. Durable limiter reused. RLS additive. HIBP and operator TOTP untouched.

## 55. SignWell regression

No SignWell files changed.

## 56. Stripe / money

No Connect, payouts, transfers, Checkout, commission-formula, service-payment, or booking-fee changes. Tracked earnings remain PARTNER-001.

## 57. July / M5 / pricing

Untouched.

## 58. Tests

Shared: 48 passed (`partners.test`, `api-entitlements`, `post-auth-home`).  
Web focused + regression: 63 then 57 additional complimentary/MEDIA/invitation tests passed.

## 59. Typecheck

`pnpm --filter @mpa/shared exec tsc --noEmit` — pass  
`pnpm --filter @mpa/web exec tsc --noEmit` — pass

## 60. Lint

Changed-source ESLint — pass after invite-page entity escape.

## 61. Build

`pnpm --filter @mpa/web build` — pass. Routes include `ƒ /partner/invite/[token]` and `ƒ /api/partners/invite/[token]`.

## 62. P0 / P1 / P2

| Severity | Item |
|---|---|
| P0 | None |
| P1 | Pre-existing: more than one Clinic UAT partner can share one `organization_id`; `getPartnerByOrganization` still binds latest `updated_at`. This package does not add a unique org index. |
| P1 | Migration is in-repo only; Production cannot use invitations until a later Owner-authorized apply/deploy. |
| P2 | Setup reminder is operator-triggered only (no automation platform). |

## 63. Production status

**NOT DEPLOYED.** Migration **not** applied. Production remains PARTNER-004 certified @ `f56746db9643d9c4129ee9874a21dc2556404d48`.

## 64. Final verdict

**PASS — PARTNER-005 PARTNER ONBOARDING & ACTIVATION IMPLEMENTED**

---

**STOP.** Return control to the Owner.

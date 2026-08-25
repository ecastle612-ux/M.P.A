# 245 — PARTNER-005 Production Certification

**Title:** PARTNER-005 — PARTNER ONBOARDING, INVITATIONS & ACTIVATION — PRODUCTION APPLY, DEPLOY & CERTIFICATION  
**Status:** **PASS — PARTNER-005 PRODUCTION ONBOARDING CERTIFIED**  
**Date:** 2026-08-25  
**Authority:** Owner authorization — controlled Production release of PARTNER-005 Partner Onboarding, Invitations & Activation. **STOP after this record.**  
**In-repo implementation certification (unchanged):** [docs/244](../244-partner-005-implementation-certification/index.md)  
**Design / ADR:** [docs/243](../243-partner-005-partner-onboarding-invitations-activation/index.md) · [ADR-042](../18-decision-log/adr-042-partner-onboarding.md)  
**PARTNER-004 Production baseline:** [docs/242](../242-partner-004-production-certification/index.md)

This package does **not** start PARTNER-006, automate partner payouts, add Stripe Connect, collect service payments, add booking fees, build marketplace bidding, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-005 PRODUCTION ONBOARDING CERTIFIED**

PARTNER-005 is Production-live. Master Admin can issue a hashed, 7-day, email-bound, single-use invitation. Acceptance uses existing Auth, creates one SKU-less partner organization, and grants only `organization_admin` plus `platform.partner_services`. Onboarding and readiness stay derived and separate from commercial status. Approval alone does not make a partner ready. Money does not move.

---

## 1. Certification path

`docs/245-partner-005-production-certification/index.md`

docs/244 remains the historical in-repo implementation PASS and is not rewritten as Production-live.

## 2. Historical implementation SHA

`df2874bfea72186c4abe063461c6eb56b8cf1d8a` (`df2874bf`)

That SHA was **not** deployed alone. Deploying `df2874bf` by itself would omit the docs/244 record. It remains in history under current certified Production plus PARTNER-005.

## 3. Final release SHA

`cc59feaba0746dd5a97bd447ba0953efed7a9e5a` (`cc59feab`)

Constructed as:

| Layer | SHA | Role |
|-------|-----|------|
| Live Production before this package | `f56746db9643d9c4129ee9874a21dc2556404d48` | PARTNER-004 Production app (docs/241 / docs/242) |
| PARTNER-004 cert record | `faf41821` | docs/242 (docs-only; already live as Production history) |
| PARTNER-005 design / ADR | `1a339023` | docs/243 + ADR-042 |
| Implementation | `5c76cf6f` | invitations, `/partner/invite`, setup, migration |
| Typecheck / lint / authz | `df2874bf` | historical implementation SHA |
| In-repo certification | `cc59feab` | docs/244 historical PASS — Production app deploy |

`f56746db` is an ancestor of `cc59feab`. `origin/main` remained stale `b30567e3` and was **not** treated as Production.

Branch: `cursor/partner-005-production-release-6821`.

Vercel reports `githubCommitSha = cc59feaba0746dd5a97bd447ba0953efed7a9e5a` on `githubCommitRef = cursor/partner-005-production-release-6821`.

This certification record is a later docs-only commit and was **not** redeployed.

## 4. Deployment ID

| Item | Value |
|------|--------|
| Feature / release deploy | `dpl_8gPW1ZNzff7TB6Yho85L4xGYLCAD` @ `cc59feab` — READY |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Live HTML | `data-dpl-id="dpl_8gPW1ZNzff7TB6Yho85L4xGYLCAD"` on `/`, `/partners`, `/partner/invite/[token]`, `/pricing` |
| Prior Production | `dpl_3fKd44fHYAm1yvKJu77tBHpjQXXK` @ `f56746db` |

Vercel project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`). Root `apps/web`.

Live routes after deploy:

- `/partner` **307** → `/login` (`x-matched-path` later authorized **200**)
- `/partners` **200** `x-matched-path: /partners`
- `/partner/properties` **307** → `/login` (authorized **200**)
- `/partner/invite/test-token` **200** `x-matched-path: /partner/invite/[token]` (was `_not-found` on PARTNER-004)

## 5. Migration / stamp

Applied **only** the approved PARTNER-005 migration via MCP `apply_migration` name `docs_243_partner_005_onboarding`.

| Item | Value |
|------|--------|
| Source file | `supabase/migrations/20260825010000_docs_243_partner_005_onboarding.sql` |
| Recorded stamp | **`20260825045437`** |
| PARTNER-004 stamp (unchanged) | `20260824225021` / `docs_240_partner_004_property_portals` |
| PARTNER-003 stamp (unchanged) | `20260824190704` / `docs_237_partner_003_command_center` |
| PARTNER-002 stamp (unchanged) | `20260824175254` / `docs_234_partner_002_service_portals` |
| PARTNER-001 stamp (unchanged) | `20260824044829` / `docs_231_partner_001_foundation` |
| REC-001 stamp (unchanged) | `20260824025311` / `rec_001_receipt_attachments` |
| SEC-001 stamp (unchanged) | `20260818210000` / `docs_226_sec_001_security_hardening` |

Additive only: `platform_partner_invitations` (hashed token, partner + email bind, pending unique per partner/email), bound-member SELECT on `platform_partners`, and `partner.services:read|write` grants. No second partner table, no Auth/org/subscription/commission/Stripe mutation, no automatic approval.

Pre-apply counts: partners **2**, requests **2**, commissions **2**, property portals **1**, media_attachments **38**, organizations **22**, memberships **40**, saas_subscriptions **4**, July freeze **true**. After apply those counts were unchanged and invitations **0**.

## 6. Direct invite result

Master Admin `POST /api/admin/partners` as operator `ecastle612@gmail.com`:

| Field | Value |
|-------|--------|
| Partner id | `d077d5be-c1cd-467c-b54e-60b7137e1e00` |
| Company | MPA PARTNER-005 UAT Onboarding Synthetic Services |
| Type | `certified_service` |
| Email | `ecastle612+partner005-uat@gmail.com` |
| Status after invite | `approved` |
| Commission | **2000 bps (20%)** default preserved |
| Created | true |
| Invitation | `pending`, source `direct_invite` |
| Org at invite | null |

Not a real company. Repeat POST reused the same partner (`created: false`, `reused: true`). Client `organizationId` override **400**.

## 7. Public applicant result

`/partners` remains **200** with **Apply to become a partner**. No auto-approve copy. `POST /api/partners/apply` still uses the existing PUBLIC limiter and `submitPartnerApplication`. A second synthetic public application was **not** created. Path A remains Apply → Master Admin approval → invitation.

## 8. Token security

24-byte base64url token, SHA-256 at rest (`token_hash` length **64**). Raw token is not stored and is not recorded here.

- malformed / random inspect: `state=unavailable`, no company
- FO session accept: **403** `email_mismatch`
- client `organizationId` / `partnerId` / `userId`: **400** `invalid`
- resend revokes the prior pending hash
- revoked/used accept: **400** `unavailable`
- Partner A/B cross-claim covered by partner-bound hash lookup + focused tests

## 9. TTL

`PARTNER_INVITATION_TTL_MS` = 7 days. First invite `created_at` `2026-08-25 05:01:46+00` / `expires_at` `2026-09-01 05:01:46+00`. Resend reset expiry to `2026-09-01 05:02:41+00`. Email copy includes the UTC expiry.

## 10. Landing page

`/partner/invite/<token>` **200** on `dpl_8gPW1ZNzff7TB6Yho85L4xGYLCAD`. Valid inspect JSON (no internal UUIDs):

- company name
- Certified Service Partner
- expiresAt
- benefits
- Accept Invitation CTA (client-rendered)

Malformed token page: **You're invited to M.P.A. Partners** / **This partner invitation is not available.** No company, email, or partner UUID.

## 11. Existing-user result

Existing Clinic FO authenticated normally and could not claim the invitation (**403** email mismatch). Clinic memberships and the PARTNER-001/002 Clinic bind were not altered. A second existing multi-product user was **not** used as the invitee, to avoid attaching partner context to Clinic/complimentary accounts.

## 12. New-user result

New synthetic user `ecastle612+partner005-uat@gmail.com` created through existing Supabase Auth (`POST /auth/v1/admin/users`, `email_confirm: true`). Password login used the same Auth token endpoint. No custom password table.

Unauthenticated signup with an 11-character password: **422** `Password should be at least 12 characters.` Login form `minLength={MIN_PASSWORD_LENGTH}` remains **12**.

## 13. Email binding

P0 probe passed. Authenticated FO session cannot claim the invited email. Message: **This invitation is for a different account. Sign in with the invited email to continue.** Invitation was not transferred.

## 14. Organization handling

Accept created exactly one new organization:

| Field | Value |
|-------|--------|
| Org id | `df2f1e9f-8b09-4ea5-bb84-9de4e3eda4a8` |
| Name | MPA PARTNER-005 UAT Onboarding Synthetic Services |
| SKU | **none** |
| Subscription | **none** |

Organizations **22 → 23**. Clinic org `a11ce001-0001-4000-8000-00000000c11c` was not hijacked. Repeat accept did not create another org (`alreadyAccepted: true`).

## 15. Membership

One active membership: `organization_admin` on the new partner org. `operating_scope` null. Memberships **40 → 41**. Existing Clinic/PM memberships unchanged. No Master Admin grant.

## 16. Capability / RBAC

Partner APIs authorize via `resolveAuthorizationContext` + `evaluatePermission` + partner bind, with extra entitlement `platform.partner_services`. Partner user `GET /api/admin/partners` **403 Forbidden**. No finance, Stripe, PM, or FO SKU was assigned.

## 17. First login

Accept returns `nextPath: /partner` and sets `mpa_active_organization_id`. Authorized `/partner` **200**. At first dashboard load, Partner Setup was prominent: **Partner Setup — 17% Complete**, next **Complete company profile**. Other Command Center tabs remained reachable.

## 18. Checklist

Certified Service items: company profile, logo, services/service area, service portal, first property portal, first QR. Live card copy is `{N} of {M} complete · {progressLabel}` plus a semantic `progressbar`. Completion is labeled in text, not color alone.

## 19. Type-aware behavior

Referral PARTNER-002 remains `active` / `not_ready` with no property/QR requirement. Certified PARTNER-005 required the full six service-setup items. Strategic uses the same portal-capable checklist in shared contracts.

## 20. Progress

Observed live derived progress (not fabricated):

| Moment | Progress | Ready |
|--------|----------|-------|
| After accept | 17% (1 of 6 — services prefilled) | not_ready |
| After profile + logo + portal enable | 67% (4 of 6) | not_ready |
| After property portal | 83% (5 of 6) | **ready** |
| After QR ack | **Partner Setup — Complete** / 100% | **ready** |

## 21. QR completion

`POST /api/partners/onboarding/ack` `{ action: "partner.qr_completed" }` **200**. Event `partner.qr_completed` written. QR is not stored as MEDIA. New MEDIA on this org is **1** `partner_branding` logo only.

## 22. Onboarding complete

Derived `onboardingStatus=complete` after QR. Events: `partner.onboarding_started`, `partner.profile_completed`, `partner.portal_configured`, `partner.property_added`, `partner.qr_completed`, `partner.onboarding_completed`.

## 23. Readiness result

`approved` after invite = **not_ready**. After accept, commercial status became `active` and readiness stayed **not_ready** until profile + live portal + first property portal existed. **Ready to receive requests** became true only then. Approval alone did not make the partner ready.

## 24. Status separation

| Axis | Live values |
|------|-------------|
| Commercial | applied / approved / active / suspended / rejected — PARTNER-005 used approved → active |
| Onboarding | not_started / in_progress / complete — derived |
| Readiness | ready / not_ready — derived |

No overloaded single field.

## 25. Master Admin onboarding

Operator `GET /api/admin/partners` after complete:

- invitation status `accepted`
- sent `2026-08-25T05:02:41.101+00:00`
- accepted `2026-08-25T05:03:54.625+00:00`
- account connected true
- onboarding 100% / complete
- profile true, portal true, property count **1**, QR true
- readiness **ready**

## 26. Filters

Directory rows after UAT (filters are views over canonical state):

- Applications: none `applied`
- Invited: none remaining `pending`
- Onboarding: none remaining `in_progress`
- Ready: PARTNER-001 + PARTNER-005
- Active: PARTNER-001, PARTNER-002, PARTNER-005
- Suspended: none

## 27. Resend

`PATCH { action: resend_invitation }` **200**. Prior row `revoked`; new pending `source=resend`; partner id unchanged; onboarding progress preserved; event `partner.invitation_resent`; new email delivered. Old token inspect `unavailable` with no company.

## 28. Setup reminder

Existing operational email path. Before accept: **400** `Setup reminders are available after the invitation is accepted.` After complete: **400** `Onboarding is already complete.` Body template includes percent, next incomplete step, and `/partner`. A mid-setup reminder email was not sent because setup finished in the same UAT session.

## 29. Notifications

`comms_notifications` on the new partner org, existing table/provider:

| Key | Title |
|-----|--------|
| `partner.invitation_accepted` | Partner invitation accepted |
| `partner.onboarding_completed` | Partner onboarding completed |
| `partner.ready` | Ready to receive requests |

All `href=/partner`.

## 30. Audit

`platform_partner_events` for the synthetic partner includes invited, resent, accepted, onboarding started, profile completed, portal configured, property added, QR completed, onboarding completed, ready. No page-view noise.

## 31. Duplicate protection

Repeat Invite reused the same partner. Resend did not create another partner or org. Repeat accept returned `alreadyAccepted: true`. Company-name similarity is not a merge key.

## 32. Application reconciliation

Email-only match. Direct invite with the same email reused the row. No public applicant was merged by company-name similarity. Documented Path A reconcile remains approve-then-invite on the matched email.

## 33. Multi-user readiness

`organization_memberships` already supports many users. PARTNER-005 attached the primary invitee only. No unique one-user constraint was added.

## 34. Cross-org

Accept ignored client org/partner/user IDs. New org only. Clinic property portal create from the new partner session **404** `Select a property from your authorized list.` PARTNER-001/002 remain bound to Clinic. Partner dashboard cannot open `/api/admin/partners`.

## 35. Privilege escalation

No Master Admin, no PM/FO SKU, no finance/Stripe privileges, no other partner’s org. Founding 20% is display-only tracked earnings.

## 36. Rate limiting

Inspect uses durable `PUBLIC`; accept uses durable `AUTH`; public apply remains `PUBLIC`. No abusive Production load test. Several inspects did not 429.

## 37. Mobile

390×844: invitation unavailable page, `/partner`, properties, and portal remain usable. No major overflow observed.

## 38. Accessibility

Labeled invite/admin fields, semantic `progressbar`, `aria-live` progress text, `(complete)` / `(not started)` text, `role="status"` / `role="alert"`, keyboard-accessible buttons.

## 39. PARTNER-001 regression

`/partners` **200**. Default commission still **2000**. Existing commissions **2**. No automatic payout. Public apply path unchanged.

## 40. PARTNER-002 regression

Generic `/request/mpa-partner-002-uat-synth` **200**. Public API **200**. Requests remain **2**.

## 41. PARTNER-003 regression

Authorized Command Center, referrals, earnings (20% tracked), service portal, and profile live for the new partner. Existing Clinic partners unchanged.

## 42. PARTNER-004 regression

`/request/mpa-partner-002-uat-synth/demo-clinic-facility` **200**. Public property API **200**. Clinic property portal count preserved; a second portal exists only on the new partner org. Conversion/security boundaries unchanged.

## 43. Complimentary regression

`GET /api/complimentary/claim` still returns complimentary claim errors, not partner-invite codes. Partner accept does not call `claimComplimentaryAccess`. MASTER_ADMIN_GRANT / complimentary tables were not mutated.

## 44. REC / MEDIA regression

REC-001 stamp present. Logo used existing MEDIA intent + private bucket (`partner_branding`). media_attachments **38 → 39** (logo only). media_assets **17** unchanged. receipts **4** unchanged. QR is not MEDIA.

## 45. SEC-001 regression

Stamp `20260818210000` present. Password minimum remains **12** (live Auth 422). Public limiter intact. RLS additive. Master Admin gate intact (`401` unauthenticated, `403` partner). HIBP and operator TOTP were **not** changed.

## 46. SignWell regression

`POST /api/leasing/webhooks/signwell` empty body **400** `Invalid SignWell payload`. No SignWell document was created.

## 47. Stripe / money result

No Checkout, Connect, bank account, payout, transfer, commission-formula change, service payment, or booking fee. saas_subscriptions **4** unchanged. organization_subscriptions **7** unchanged. New partner org has no SKU.

## 48. July / M5 / pricing

**July freeze ON** — `finance_july_freeze_enabled() = true` after migrate and after UAT.  
**M5 unauthorized** — `isFinanceM5Authorized()` remains `false`.  
**Pricing unchanged** — `/pricing` **200**; catalog PM/FO **$59** / **$566.40**, Complete **$109** / **$1,046.40**.

## 49. Tests

Shared focused: **73** passed (`partners.test`, `api-entitlements`, `post-auth-home`, complimentary, media, authorization).  
Web focused + regression: **102** then **17** additional complimentary/SEC tests passed (PARTNER-001–005, invite routes, MEDIA/REC, SignWell isolation/webhook).

## 50. Typecheck

`pnpm --filter @mpa/shared exec tsc --noEmit` — PASS  
`pnpm --filter @mpa/web exec tsc --noEmit` — PASS

## 51. Lint

Changed-source ESLint — PASS.

## 52. Build

`pnpm --filter @mpa/web build` — PASS. Vercel Production build PASS (Next 16.2.11). Routes include `ƒ /partner/invite/[token]` and `ƒ /api/partners/invite/[token]`.

## 53. Production observation

Direct live UAT + API + database (not logs alone):

- Invite landing and APIs on `dpl_8gPW1ZNzff7TB6Yho85L4xGYLCAD`
- Operator Invite Partner created one synthetic Certified Service partner
- Invitation email delivered via existing Resend
- Email-binding and client-override rejects
- New Auth user accepted and landed on `/partner`
- Checklist 17% → 67% → 83% → Complete with Ready only after operational setup
- PARTNER-002/004 public portals still 200
- SignWell 400; complimentary claim still complimentary-scoped
- No 5xx on these paths

## 54. Exact Production mutations

1. Applied migration `docs_243_partner_005_onboarding` (stamp `20260825045437`).
2. Deployed RC `cc59feab` to Production (`dpl_8gPW1ZNzff7TB6Yho85L4xGYLCAD`).
3. Created one synthetic Certified Service partner and invitation via Master Admin Invite Partner.
4. Resent that invitation once (revoked prior token).
5. Created one synthetic Auth user for the invited email and accepted once.
6. Completed profile, MEDIA logo, operator portal enable, one synthetic property on the new partner org, one property portal, and QR acknowledgement.
7. Did **not** merge to `main`, change pricing, Stripe Connect, AutoPay, FIN-OPS, July freeze, M5, SignWell documents, WAF, deferred Auth settings, or start PARTNER-006.

## 55. P0

None. Email-binding, client-override, cross-org property, and admin-gate probes failed closed.

## 56. P1

1. Pre-existing: PARTNER-001 and PARTNER-002 still share Clinic `organization_id`; `getPartnerByOrganization` binds latest `updated_at`. This package created a **new** org for PARTNER-005 and did not add a unique org index.
2. A mid-setup reminder email was not captured because onboarding completed in the same session. Endpoint gates and the existing email template were verified.
3. Docs/229 leaked-password protection remains disabled (Owner-only Auth dashboard). Not enabled here.

## 57. P2

1. Valid invitation company/CTA are client-rendered; the first HTML shell does not include them until JS loads (same pattern as other public partner pages).
2. Setup reminder remains operator-triggered only.
3. Cloudflare WAF Rules were not re-fetched (`needsAuth`). They were not changed.

## 58. Final verdict

**PASS — PARTNER-005 PRODUCTION ONBOARDING CERTIFIED**

---

## STOP

Do not:

- start PARTNER-006
- automate partner payouts
- add Stripe Connect
- collect service payments
- add booking fees
- build marketplace bidding
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

Control returns to the Owner.

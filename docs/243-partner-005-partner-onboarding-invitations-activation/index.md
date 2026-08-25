# PARTNER-005 — Partner Onboarding, Invitations & Activation

**Status:** Approved  
**Date:** 2026-08-25  
**Owner authorization:** in-repo implementation only. Do not deploy to Production.  
**Foundation:** PARTNER-001 + PARTNER-002 + PARTNER-003 + PARTNER-004 Production-certified (`docs/242`, SHA `f56746db9643d9c4129ee9874a21dc2556404d48`)  
**ADR:** `docs/18-decision-log/adr-042-partner-onboarding.md`

## Purpose

Make it simple to move a partner from:

**Interested → Approved → Invited → Account Created → Setup → Ready to Receive Requests**

Two entry paths:

| Path | Flow |
|---|---|
| A — Public application | `/partners` apply → Master Admin review → Approval → Invitation → Account/setup → `/partner` onboarding |
| B — Direct Owner invitation | Master Admin Invite Partner → Invitation → Account/setup → `/partner` onboarding |

Direct invitation does not require a public application.

## Binding constraints

- In-repo implementation only. Do not deploy. Do not apply the migration to Production from this package.
- Canonical partner remains `platform_partners`. Do not create another partner table.
- Prefer derived completion. Do not duplicate profile, property, portal, or commission data.
- Commercial status, onboarding status, and operational readiness stay separate.
- Founding/default commission remains `DEFAULT_COMMISSION_BPS`. Do not hard-code a second rate. Invitation acceptance must not modify historical commission snapshots.
- Public applications are never auto-approved. Direct Invite may establish approved/invited because the Owner initiated it.
- Reuse Auth, organization membership, Resend operational email, `comms_notifications`, `platform_partner_events`, and the durable rate limiter.
- Partner invitation and complimentary customer access remain separate concepts.
- No Stripe Connect, payouts, transfers, Checkout changes, service payments, booking fees, marketplace bidding, July unfreeze, M5, SignWell expansion, or deferred SEC-001 Auth changes.

## Onboarding model

Invitation state lives in additive `platform_partner_invitations`:

- hashed token at rest (SHA-256)
- email binding
- partner binding
- expiration (7 days, single constant `PARTNER_INVITATION_TTL_MS`)
- single-use (`pending` → `accepted`)
- resend revokes the prior pending token
- invited-by actor and timestamps

Onboarding and readiness are derived:

| Concept | Values | Source |
|---|---|---|
| Commercial status | `applied` / `approved` / `active` / `suspended` / `rejected` | `platform_partners.status` |
| Onboarding | `not_started` / `in_progress` / `complete` | derived from applicable checklist |
| Readiness | `ready` / `not_ready` | derived operational minimum |

Approved is not fully configured. Ready is not a commercial status.

## Deterministic matching

Match on **case-insensitive email** only.

- Same email + existing partner → reuse that partner. Do not create another.
- Same email + pending invitation → return that invitation (Invite is idempotent). Resend is explicit.
- Same email + existing application → approve (if still applied) and invite that row.
- Do **not** merge unrelated companies because names are similar.
- Do **not** unique-index `organization_id` on `platform_partners` in this package (UAT already has two Clinic-bound partners). Intended real-partner rule remains 1:1; `getPartnerByOrganization` still binds latest `updated_at`.

## Invitation security

- 24-byte base64url token. Database UUID is not the credential.
- Hash at rest. Server-side validation only.
- Expired copy: **This partner invitation has expired.**
- Unknown / malformed / used tokens share a safe unavailable state.
- Expired, used, and unknown pages do not leak emails, org memberships, internal IDs, or unrelated company data.
- Authenticated email must match the invitation email. Wrong email does not attach.
- Client `partner_id` / `organization_id` / `user_id` are ignored.
- Public inspect/accept endpoints use the existing durable rate limiter (`PUBLIC` inspect, `AUTH` accept).

Landing route: `/partner/invite/<token>` (public; carved out of `/partner` entitlement).

## Organization and membership

- Existing Auth user: do not create another user. Preserve existing memberships and subscriptions. Do not overwrite their organization.
- New user: existing M.P.A. Auth. Password minimum 12. No custom password storage.
- Never silently hijack an existing organization.
- For a genuinely new invited company, create the minimum organization (no product SKU) and bind `platform_partners.organization_id`.
- Resend does not create another organization.
- Membership: `organization_admin` on the partner organization only. No Master Admin. No product SKU. No finance/Stripe grants.
- Capability: additive `partner.services:read` / `partner.services:write`. Partner APIs accept that **or** legacy `pm.maintenance:*` so existing receiving orgs keep working.
- Partner-only orgs receive `platform.partner_services` as an extra entitlement because they are bound to a partner — not because a fourth product SKU exists.

## Type-aware checklist

**Referral:** profile, referral link (`/get-started?ref=<slug>`), understand tracked earnings, share referral link. No service-portal / property / QR requirement.

**Certified Service / Strategic:** company profile, logo, services & service area, generic service portal, first property portal, first QR download/print/acknowledgement.

QR completion is an auditable `partner.qr_completed` event. Do not store generated QR images as MEDIA.

## Ready to receive requests

For service partners, ready only when all are true:

- partner `active`
- authorized organization attached
- profile sufficiently configured
- services and service area configured
- generic service portal enabled
- at least one property portal

Referral partners are ready to refer when active, organization attached, slug present, and referral onboarding complete. They are never forced through physical service-request setup.

## Master Admin

`/admin/commercial/partners` adds:

- **Invite Partner** (company, contact, email, type, optional phone/website/service area/services/note)
- **Resend Invitation**
- **Send Setup Reminder** (percent + next step + `/partner`; no commission PII)
- onboarding/invitation/readiness detail
- filters: Applications, Invited, Onboarding, Ready, Active, Suspended (derived; commercial statuses unchanged)

## Notifications and audit

Reuse `comms_notifications` and `platform_partner_events`. Meaningful events only:

`partner.invited`, `partner.invitation_resent`, `partner.invitation_accepted`, `partner.onboarding_started`, `partner.profile_completed`, `partner.portal_configured`, `partner.property_added`, `partner.qr_completed`, `partner.onboarding_completed`, `partner.ready`

## Certification

Immutable implementation certification: `docs/244-partner-005-implementation-certification/index.md`.

After certification: **STOP.** Do not deploy. Do not start PARTNER-006.

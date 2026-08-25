# ADR-042 — Partner Onboarding, Invitations & Activation

**Status:** Accepted  
**Date:** 2026-08-25  
**Package:** PARTNER-005  
**Supersedes:** none  
**Related:** ADR-038 Partner Program Foundation, ADR-039 Branded Service Request Portals, ADR-040 Partner Command Center, ADR-041 Partner Property Portals, ADR-019 Product Constitution, ADR-026 Authorization Hardening

## Context

PARTNER-001–004 are Production-certified. Partners can apply, receive branded portals, operate Command Center, and create property QR links. There is still no secure invitation from approval to a bound Auth user, no type-aware setup checklist, and no operational readiness distinct from commercial status.

Owner authorized PARTNER-005 implementation in-repo only on 2026-08-25. Design → Document → Approve is recorded here so implementation may proceed under ADR-012.

## Decision

1. Keep `platform_partners` as the only partner record. Add `platform_partner_invitations` for hashed, expiring, single-use, email-bound tokens. Derive onboarding and readiness instead of cloning profile/portal/property/commission columns.
2. Support Path A (public apply → Master Admin approve → invite) and Path B (Master Admin direct invite). Direct invite does not require a public application. Public applications are never auto-approved.
3. Reuse complimentary-style token hashing (24-byte base64url, SHA-256 at rest), Resend operational email, `comms_notifications`, and `platform_partner_events`. Do not reuse complimentary claim routes or team-invite plaintext UUIDs as the partner credential.
4. Existing users authenticate normally and attach only the authorized partner membership. New users use existing Auth (password minimum 12). Never hijack an existing organization. Create a SKU-less organization only for a genuinely new invited company.
5. Grant the minimum Partner capability: additive `partner.services:read|write`, plus `platform.partner_services` as an extra entitlement when the active org is partner-bound. Keep legacy `pm.maintenance:*` acceptance so certified receiving orgs continue to work. Do not invent a fourth product SKU. Do not grant Master Admin, finance, or Stripe permissions.
6. `/partner/invite/<token>` is public. Other `/partner` surfaces remain Partner Command Center.
7. Commercial status, onboarding progress, and ready/not-ready stay separate. Type-aware checklists omit irrelevant service-portal steps for Referral partners.

## Consequences

- Master Admin can invite recruited companies and see who is stuck in onboarding.
- Partner-only organizations can open `/partner` without a Property Manager, Facility Operations, or Complete subscription.
- Invitation acceptance does not move money, change commission math, or alter complimentary-access grants.
- This package is in-repo only and must not be deployed or applied to Production from the implement package.

## Alternatives considered

- Reuse `organization_invitations` plaintext UUIDs — rejected; weaker than hashed complimentary tokens.
- Reuse `/complimentary/claim` — rejected; complimentary customer access must remain a separate concept.
- Add a `mpa_partner_program` SKU — rejected; Product Constitution allows only three commercial products.
- Store onboarding checkboxes on `platform_partners` — rejected where canonical portal/profile/property state already exists.

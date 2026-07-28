# 42 — AUTH-001 Slice C Implementation Summary

**Package:** AUTH-001  
**Slice:** C — Invitations & credentials delivery  
**Authorization:** [41](./41-slice-c-authorization.md) · [CORE-003 §42](../113-core-003-implementation-master-plan/42-auth-001-slice-c-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([43](./43-slice-c-validation.md) · **PASS**)  
**Date:** 2026-07-24  

> Validation: [43 — Slice C Validation](./43-slice-c-validation.md).  
> Slices D–E **not** implemented.  
> Org Admin / Leasing Agent / Facility Technician **certification & surfaces** remain Slice D.  
> Recovery / emergency recovery / privileged audit remain Slice E.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** touched.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Welcome & credential delivery | `deliverOrgAdminWelcome` after Slice B provision (EML-001 `welcome_email`) |
| Invitation create / accept / activate | `createAndDeliverInvitation` · `acceptAndActivateInvitation` |
| Invitation resend / revoke / edit-email | Authorized org APIs |
| Temporary password TTL (72h) | Set on issue; enforced at `authenticate` |
| Contact email verification | Issue + confirm + middleware gate |
| EML-001 integration | `welcome_email` · `user_invitation` · verification via `general_notification` |
| Secret-free OPS events | Invite / delivery / contact verified catalog types |
| Invitation-only preserved | No public signup; invitees use MPA-generated usernames |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260724230000_auth001_slice_c_invitations_credentials.sql` | **Added** — delivery ledger, contact verification, invite columns, `must_verify_contact` |

### Identity / credentials

| Path | Change |
|------|--------|
| `apps/web/src/lib/auth/identity/adapter.ts` | TTL enforce · `issueTemporaryPassword` · `provisionInviteePrincipal` · `must_verify_contact` |
| `apps/web/src/lib/auth/identity/types.ts` | Slice C types + `TEMPORARY_PASSWORD_TTL_HOURS` |
| `apps/web/src/lib/auth/credentials/delivery.ts` | **Added** — welcome + invitation credential send |
| `apps/web/src/lib/auth/invitations/service.ts` | **Added** — invite lifecycle |
| `apps/web/src/lib/auth/contact-verification.ts` | **Added** — issue / confirm |
| `apps/web/src/lib/auth/login-actions.ts` | Post first-login → contact verify |
| `apps/web/src/lib/organization/provisioning.ts` | Hook welcome delivery after ledger complete |
| `apps/web/src/lib/ops/catalog.ts` | Slice C event types |
| `apps/web/src/middleware.ts` | Contact verification gate · `/verify-contact` |

### APIs / UI

| Path | Change |
|------|--------|
| `apps/web/src/app/api/organizations/.../invitations/route.ts` | Slice C create+deliver |
| `.../invitations/[invitationId]/resend/route.ts` | **Added** |
| `.../invitations/[invitationId]/revoke/route.ts` | **Added** |
| `.../invitations/[invitationId]/edit-email/route.ts` | **Added** |
| `apps/web/src/app/api/invitations/[token]/accept/route.ts` | Activate provisioned invitee |
| `apps/web/src/app/api/contact-verification/*` | Confirm + resend |
| `apps/web/src/app/(auth)/verify-contact/*` | Pending + token confirm pages |
| `apps/web/src/components/auth/accept-invitation-card.tsx` | Username-aware accept UX |
| `apps/web/src/components/auth/verify-contact-*.tsx` | **Added** |

### Docs

| Path | Change |
|------|--------|
| `docs/109-auth-001-…/42-slice-c-implementation.md` | **Added** — this summary |
| AUTH-001 / CORE-003 status boards | Slice C → Implemented |

**Applied on `mpa-prod`:** `auth001_slice_c_invitations_credentials`

---

## 3. Welcome flow

```
Slice B provision completes (ledger completed)
  → ensure auth.organization.provisioned
  → deliverOrgAdminWelcome
       · issueTemporaryPassword (72h TTL)
       · sendWorkflowEmail(templateKey=welcome_email) with username + temp password in body only
       · credential_deliveries ledger (idempotent; anti-spam)
       · emit auth.credentials.delivered | auth.credentials.delivery_failed (no secrets)
```

Retries of provision resume welcome if not yet `sent`.

---

## 4. Invitation lifecycle

```
Org Admin POST /api/organizations/:orgId/invitations
  → pending invite for same email? → resend credentials (no duplicate principal)
  → else provisionInviteePrincipal (MPA username)
  → insert organization_invitations (provisioned_user_id, username)
  → membership status=inactive
  → deliverInvitationCredentials (user_invitation template)
  → emit auth.user.invited

Invitee signs in with username + temporary password
  → first-login password change
  → contact verification
  → POST /api/invitations/:token/accept
       · activate membership (active)
       · invitation accepted + activated_at
       · emit auth.user.invitation_accepted
```

Also: `.../resend`, `.../revoke`, `.../edit-email` (typo fix + resend).

---

## 5. Verification flow

```
must_verify_contact=true at principal provision
  → after first-login password change → issueContactVerification email
  → /verify-contact pending page (resend supported)
  → /verify-contact/:token → confirm (token hash stored)
  → user_profiles.contact_email_verified_at set
  → must_verify_contact cleared
  → emit auth.contact_email.verified
```

Middleware blocks product routes until contact verified (after password gate).

---

## 6. Temporary credential lifecycle

| Rule | Implementation |
|------|----------------|
| System-generated | `issueTemporaryPassword` / provision path |
| TTL 72h | `temporary_password_expires_at` |
| Enforce at login | `authenticate` rejects expired temp |
| Single-consumption | First-login → `permanent_set` (Slice A) |
| Re-issue | Welcome/invite resend regenerates secret + TTL |
| Storage | Hash via provider only; plaintext only in send body |

Expired temp message directs invitee to Org Admin resend (Slice C path — not Slice E self-serve recovery).

---

## 7. EML-001 integration

| Template | Use |
|----------|-----|
| `welcome_email` | Org Admin welcome + temporary credentials |
| `user_invitation` | Invitee credentials + accept CTA |
| `general_notification` | Contact email verification link |

All sends go through `sendWorkflowEmail` (idempotency + audit). Secrets never placed on OPS payloads.

---

## 8. Event catalog additions

| Event type | When |
|------------|------|
| `auth.user.invited` | Invitation created |
| `auth.user.invitation_accepted` | Accept/activate |
| `auth.user.invitation_revoked` | Revoke |
| `auth.credentials.delivered` | Welcome/invite email sent |
| `auth.credentials.delivery_failed` | Delivery failure (ops-visible) |
| `auth.contact_email.verified` | Contact verified |

Payloads are status-only (ids / kinds) — no passwords.

---

## 8a. Team Settings invitation lifecycle UI (follow-on)

**Date:** 2026-07-27  
**Scope:** Wire Org Admin Team Settings to Slice C APIs already validated under AC-07.

| Surface | Actions |
|---------|---------|
| Settings → Team → Pending invitations | **Resend** · **Edit email** (save + resend) · **Revoke** |

| File | Change |
|------|--------|
| `apps/web/src/components/settings/team-settings-panel.tsx` | Invitation lifecycle controls |
| `apps/web/src/lib/auth/invitations/lifecycle.ts` | Client path/email/expiry helpers |
| `apps/web/src/lib/auth/invitations/lifecycle.test.ts` | Unit coverage |

Permissions unchanged: `invitation:create` (mutations) · `invitation:read` (list). No schema changes.

---

## 9. Remaining Slice D–E work

| Slice | Remaining |
|-------|-----------|
| **D** | Permission engine · Org Admin / Leasing / Facility Tech surfaces & certification · dashboard assignment |
| **E** | Org Admin recovery · emergency recovery · privileged audit · support escalation |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| Slice C implementation | ✅ **COMPLETE** |
| Slice C validation | ✅ **PASS** ([43](./43-slice-c-validation.md)) |
| Begin Slice D? | ❌ **NO** until `AUTHORIZE AUTH-001 SLICE D` |
| **Next** | Separate authorize session for Slice D (eligible) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ AUTH-001 Slice C **IMPLEMENTED** | 2026-07-24 |
| Validation | ✅ **PASS** · [43](./43-slice-c-validation.md) | 2026-07-24 |

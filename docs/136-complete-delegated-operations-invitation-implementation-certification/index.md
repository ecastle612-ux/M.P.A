# 136 — Complete Delegated Operations Invitation Remediation Implementation Certification

**Title:** COMPLETE DELEGATED OPERATIONS INVITATION & MEMBERSHIP ACCEPTANCE IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR PRODUCTION MIGRATION CERTIFICATION**  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations (invitation workflow only)  
**Authority:** [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) **Approved** · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) remains closed  
**Related:** [docs/127](../127-complete-delegated-operations/index.md) · [docs/134](../134-complete-delegated-operations-production-release-certification/index.md) · ADR-026 · ADR-031 · PLAT-005  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** **No Production migration apply. No Production deploy. No real invitations. No membership or scope mutations.**  
**Billing / Stripe / SKUs / subscriptions / roles / entitlement keys:** No changes  
**FIN-OPS:** Untouched. docs/126 remains blocked.

---

## Verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION.**

Slices A, B, C, and E are implemented in this branch. Additive technician CHECK compatibility from docs/135 is included in the same repo migration. **Do not apply `20260815220000` to Production. Do not deploy.**

No new ADR. The approved trust boundary (Option B) and ADR-033 authorization model did not change during implementation.

---

## Production state confirmation (read-only)

This package did **not** apply SQL, deploy, send invitations, reset passwords, or modify memberships/scopes.

| Layer | Value | Unchanged |
|-------|--------|-----------|
| Application SHA (live) | `9b92db375dac75d469ed859134c629d46af536e8` | Yes |
| Ledger tip | `20260815193129` / `adr_033_dataplane_member_scope` | Yes |
| `20260815220000` on Production | **absent** | Yes |
| `email_status` on Production invitations | **absent** | Yes |
| `delivery_status` on Production invitations | **present** | Yes |
| Forbidden unused stamps `20260815200000` / `20260815210000` | still unused as live versions | Yes |

---

## Exact files changed

| File | Slice |
|------|-------|
| `packages/shared/src/auth/operating-scope.ts` | C — last-BOTH `nextRoles` / `removed`; `inviterMayGrantInvitation` |
| `packages/shared/src/auth/operating-scope.test.ts` | E |
| `apps/web/src/lib/team/invitation-service.ts` | A, B, C |
| `apps/web/src/lib/team/invitation-service.test.ts` | E |
| `apps/web/src/app/api/organizations/[organizationId]/invitations/route.ts` | A, C |
| `apps/web/src/app/api/organizations/[organizationId]/invitations/invitations.route.test.ts` | E |
| `apps/web/src/app/api/organizations/[organizationId]/memberships/route.ts` | C — pass `nextRoles` into last-BOTH |
| `apps/web/src/app/api/invitations/[token]/accept/route.ts` | B |
| `apps/web/src/app/api/invitations/[token]/accept/accept.route.test.ts` | E |
| `apps/web/src/app/api/admin/support/resend-invitation/route.ts` | A |
| `apps/web/src/app/api/admin/support/resend-invitation/resend-invitation.route.test.ts` | E |
| `apps/web/src/app/api/admin/launch/j2/route.ts` | A |
| `apps/web/src/components/admin/j2-certification-panel.tsx` | A |
| `apps/web/src/components/team/team-invite-panel.tsx` | A |
| `apps/web/src/lib/auth/require-authorized-action.test.ts` | E — Erick / Sarah / Mike names |
| `apps/web/src/lib/auth/docs-135-rls.test.ts` | E / PLAT-005 |
| `packages/supabase/src/types.ts` | A — generated invitation contract |
| `supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql` | B, technician CHECK |
| `docs/135-complete-delegated-operations-invitation-remediation/index.md` | Approved status |
| `docs/README.md` | Index |

---

## Additive migration

**File:** `supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql`

| Change | Safety |
|--------|--------|
| `ADD COLUMN IF NOT EXISTS delivery_status` / `last_delivered_at` | No-op on Production (already live). Required for local J2 lineage. |
| Recreate `delivery_status` CHECK (`pending` \| `sent` \| `failed` \| NULL) | Matches live Production. No `skipped`. |
| Replace `invitations_update_authorized` | Only `invitation:create`. Removes jwt-email UPDATE. |
| Widen invitation + membership role CHECKs | Additive: `maintenance_technician` **and** `facility_technician`. No row rewrites. No RBAC inserts. |
| Unique index on `organization_operating_scope_events (invitation_id)` where `reason = 'invitation.accepted'` | Prevents duplicate acceptance events. |

**Not in the migration**

- No `email_status` column
- No rename/drop of `delivery_status`
- No invitee-self-insert membership policy
- No `CREATE FUNCTION` / no `GRANT EXECUTE` to `anon` or `authenticated`
- No Stripe / SKU / role catalog / `financial_*` / finance RLS

**Why no service_role-only SQL helper:** last-BOTH and grant-cap live in shared TypeScript (ADR-033). Unique `(organization_id, user_id)` plus conditional `status = pending` update serialize concurrency. Membership-present + invitation-still-pending is the designed recoverable retry path. A new SECURITY DEFINER function was not required and would have added privileged SQL surface.

---

## Trusted acceptance flow

```
POST /api/invitations/[token]/accept
  → authenticated cookie session (user id + email)
  → request body ignored
  → createServiceRoleClient()
  → acceptInvitation(service_role)
       load invitation by token
       revoked → 409
       expired → 410
       accepted by caller → 200 idempotent (no new membership / event)
       accepted by other → 409
       pending + wrong email → 403
       pending + last-BOTH overwrite risk → 409 (invitation stays pending)
       insert or update membership from persisted invitation roles + operating_scope
       UPDATE invitation SET accepted WHERE status = pending
       insert one invitation.accepted scope event if missing
       team event/audit once
```

Interactive clients still cannot INSERT `organization_memberships` unless they have `membership:update` or created the org.

---

## Transport-field remediation

| Intent | Persist | API notice |
|--------|---------|------------|
| Created / no Resend key | `delivery_status = pending`, `last_delivered_at` NULL | computed `skipped` |
| Provider accepted send | `sent` + `last_delivered_at` | `sent` — not inbox delivered |
| Provider rejected send | `failed` | `failed` |

Support resend calls `resendInvitationEmail` → existing `sendInvitationEmail`. It no longer only resets columns.

Team UI copy: “Email pending / sent / failed.” J2 `invitationEmailDelivered` is documented as provider acceptance, not inbox confirmation.

---

## Invitation UPDATE hardening

Live hole: jwt-email could UPDATE `roles` / `operating_scope` before accept.

Remediation: `invitations_update_authorized` requires `invitation:create` only. Invitee SELECT-by-email remains for preview. Accept writes via `service_role`.

---

## Inviter grant-cap

`inviterMayGrantInvitation` on create:

| Inviter | May grant |
|---------|-----------|
| Complete + effective `both` | Property, Facility, Both |
| Complete + Property | Property only |
| Complete + Facility | Facility only |
| Non-admin | Cannot invite `organization_admin` |
| PM / FO SKU | Implied SKU scope (no extra picker) |

Evaluated from the inviter’s membership, not the request’s self-description.

---

## Last-BOTH-admin enforcement

`wouldLeaveCompleteWithoutBothAdmin` now honors `nextRoles` and `removed`.

Used by:

- membership PATCH (scope, status, **role demotion**)
- invitation accept overwrite of an existing membership

Create of an *additional* scoped member is not a last-BOTH denial. Destructive live tests against existing Complete Gmail admins were **not** run.

---

## Idempotency / concurrency

- Unique pending invitation per org + email → 409
- Unique membership per org + user
- Conditional invitation accept (`status = pending`)
- Unique `invitation.accepted` scope-event index
- Retry after success → 200 `idempotent: true`
- Insert race (23505) reloads the existing membership
- Partial state (membership exists, invitation still pending) is completed on retry

---

## Technician CHECK compatibility

Included because technician invites would fail the live Production CHECK after Slice A.

- App role key remains `maintenance_technician`
- Live historical `facility_technician` values remain valid
- No `facility_manager`
- No membership rewrites
- No RBAC grant changes

---

## Automated test evidence

| Suite | Result |
|-------|--------|
| `@mpa/shared` `operating-scope.test.ts` (full shared package 326 tests) | **pass** |
| `invitation-service.test.ts` | **pass** |
| `invitations.route.test.ts` | **pass** |
| `accept.route.test.ts` | **pass** |
| `resend-invitation.route.test.ts` | **pass** |
| `docs-135-rls.test.ts` | **pass** |
| `require-authorized-action.test.ts` (Erick / Sarah / Mike + PLAT-002 pipeline) | **pass** |
| `plat-002-rls.test.ts` | **pass** |
| Targeted web set | **6 files / 54 tests pass** |

### Matrix coverage (docs/135 §16 / Owner list)

| # | Case | Evidence |
|---|------|----------|
| 1 | Complete Property create | invitation-service + invitations.route |
| 2 | Complete Facility create | invitation-service + invitations.route |
| 3 | Complete Both create when inviter authorized | invitations.route + grant-cap helper |
| 4–7 | Scoped inviter cannot grant opposite / Both | invitations.route + `inviterMayGrantInvitation` |
| 8–9 | Invitee cannot modify persisted role/scope | docs-135-rls (UPDATE policy) + accept route ignores body |
| 10–12 | Wrong email / expired / revoked | invitation-service |
| 13–14 | Idempotent retry / no duplicate membership | invitation-service |
| 15–16 | Accept copies persisted values + one scope event | invitation-service |
| 17 | Existing membership cannot violate last-BOTH | invitation-service |
| 18–19 | Role demotion / scope change last-BOTH | operating-scope.test + memberships PATCH `nextRoles` |
| 20–21 | PM / FO implied scope | invitation-service + invitations.route + helper |
| 22 | `delivery_status` behavior | invitation-service |
| 23 | Support resend uses sender | invitation-service + resend route |
| 24–25 | Anon / invitee cannot INSERT membership | docs-135-rls (no new INSERT policy) |
| 26 | Erick / Sarah / Mike authorization | require-authorized-action.test |
| 27 | PLAT-005 privileged RPC restrictions | docs-135-rls (no new client GRANT / no new function) |

---

## Lint / typecheck / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/shared typecheck` | pass |
| `pnpm --filter @mpa/web typecheck` | pass |
| `pnpm --filter @mpa/shared lint` | pass |
| `pnpm --filter @mpa/web lint` | pass |
| `pnpm --filter @mpa/web build` | pass (Next.js 16.2.10 compiled) |

---

## Migration safety analysis

| Risk | Mitigation |
|------|------------|
| Adding `delivery_status` on Production | `IF NOT EXISTS` — column already live |
| Tightening invitation UPDATE | Invitees lose self-UPDATE. Accept uses service_role. Admins with `invitation:create` unchanged. |
| Role CHECK widen | Additive only. Historical `facility_technician` rows remain valid. New app writes may use `maintenance_technician`. |
| Unique accepted-event index | Fails only if duplicate `invitation.accepted` events already exist for one invitation. docs/134 UAT inserted one accepted event per controlled invitation. Confirm during Production migration certification before apply. |
| No function / GRANT | PLAT-005 surface unchanged |

Rollback: revert the app deploy; leave widened CHECKs in place if any new `maintenance_technician` row exists. Do not roll back ADR-033 dataplane.

---

## Out of scope (honored)

- Production apply / deploy
- Real invitations, password resets, membership/scope mutations
- FIN-OPS / `financial_charges` / Stripe / billing / SKUs / prices / roles / entitlement keys
- Redesign of ADR-033
- New ADR
- Client-callable accept RPC
- Invitee membership INSERT policy

---

## Next Owner step

Production migration certification for `20260815220000` only. Then a separate apply authorization. Then a separate application deploy. Then the docs/135 later UAT matrix (not this package).

---

## Final verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION**

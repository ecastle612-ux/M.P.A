# 34 — AUTH-001 Slice A Implementation Summary

**Package:** AUTH-001  
**Slice:** A — Identity foundation  
**Authorization:** [33](./33-slice-a-authorization.md) · [CORE-003 §40](../113-core-003-implementation-master-plan/40-auth-001-slice-a-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([35](./35-slice-a-validation.md))  
**Date:** 2026-07-24  

> Slices B–E **not** implemented.  
> Deferred Slice D roles (Organization Administrator · Leasing Agent · Facility Technician) **not** implemented.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 **not** touched.  
> No new business workflows beyond Identity foundation plumbing.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Identity Adapter | `apps/web/src/lib/auth/identity/*` mediates commercial login / password-change against Supabase Auth |
| Username principal model | `identity_principals` + `username_registry` + resolve/register RPCs |
| Username login | Login UI + `signInAction` use username; provider email is internal only |
| Dual-run (Q10) | `auth_resolve_login_identifier` accepts email identifiers containing `@` during migration |
| First login | `/first-login` gate for `temporary_issued` / `reset_required` / `must_accept_terms` |
| Password change | Adapter `completePasswordChange` (min 12 chars, `permanent_set`, best-effort revoke other sessions) |
| Invitation-only hardening | Public signup UI/action removed; `?mode=sign_up` rejected; accept path requires auth + valid invite |
| Auth UI tokens | Login / first-login / reset / accept surfaces use UX-012 Slice A (`@mpa/ui/auth` + `--mpa-*`) |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260724200000_auth001_slice_a_identity_foundation.sql` | **Added** — username registry, identity principals, resolve/register RPCs, RLS, design-partner backfill |

### Identity Adapter

| Path | Change |
|------|--------|
| `apps/web/src/lib/auth/identity/types.ts` | Principal / password-state / authenticate types |
| `apps/web/src/lib/auth/identity/adapter.ts` | Resolve · authenticate · password change · session revoke · public-signup reject |
| `apps/web/src/lib/auth/identity/index.ts` | Public barrel |

### Login / first-login / password

| Path | Change |
|------|--------|
| `apps/web/src/lib/auth/login-actions.ts` | Username sign-in; signup reject; first-login + recovery password actions |
| `apps/web/src/components/shell/login-form.tsx` | Username field; invitation-only copy; no signup mode |
| `apps/web/src/app/(auth)/login/page.tsx` | Reject `mode=sign_up`; safe `next` return path |
| `apps/web/src/components/auth/first-login-form.tsx` | Force password + terms |
| `apps/web/src/app/(auth)/first-login/page.tsx` | Gate page (session + principal state) |
| `apps/web/src/components/auth/reset-password-form.tsx` | Recovery password change via Identity Adapter |
| `apps/web/src/middleware.ts` | First-login gate on product/home/login; `/first-login` matcher |

### Invitation entrypoint

| Path | Change |
|------|--------|
| `apps/web/src/app/(auth)/accept-invitation/[token]/page.tsx` | Auth required; invalid/expired invite rejected; first-login precedence |
| `apps/web/src/app/api/invitations/[token]/accept/route.ts` | Auth + first-login check; no account creation |

### QA helpers (login selectors)

| Path | Change |
|------|--------|
| `qa/e2e/src/pages/auth.page.ts` | `#username`; signup path asserts invitation-only |
| `qa/e2e/scripts/run-m0-reg-acl-001-prod.ts` | Relogin uses `#username` |

### Docs

| Path | Change |
|------|--------|
| `docs/109-auth-001-…/34-slice-a-implementation.md` | **Added** — this summary |
| `docs/109-auth-001-…/31-implementation-slices.md` | Slice A Implement ✅ |
| `docs/109-auth-001-…/33-slice-a-authorization.md` | Implementation status note |
| `docs/109-auth-001-…/README.md` | Status pointer |
| `docs/113-core-003-…/40-auth-001-slice-a-authorization.md` | Implementation status note |
| `docs/113-core-003-…/09-authorization-protocol.md` · `README.md` | Next-action → validate |

---

## 3. Identity Adapter architecture

```
UI (username + password)
  → login-actions.signInAction
  → identity.authenticate
       → auth_resolve_login_identifier (service role)
            · preferred: identity_principals.username
            · dual-run: auth.users / contact email when identifier contains '@'
       → supabase.auth.signInWithPassword({ email: providerEmail, password })
  → session cookies (existing Supabase SSR)
  → if temporary_issued | reset_required | must_accept_terms → /first-login
  → else assigned home (/dashboard or /master-admin)
```

**Boundary rules**

- Product identity = **username** (`IdentityPrincipal`).
- Provider email is an implementation detail and is not shown as login identity.
- Adapter owns password-state transitions and best-effort `admin.signOut(userId, "others")` after change.
- Public signup is fail-closed via `rejectPublicSignup()` / removed UI.

---

## 4. Username login flow

1. User submits username + password on `/login`.  
2. Adapter resolves principal → internal provider email.  
3. Provider authenticates with password.  
4. Disabled / locked / archived principals are rejected.  
5. Successful session: first-login gate or product home.  
6. Dual-run: email-shaped identifiers still resolve during migration (AUTH-001 Q10); UI copy presents username as the commercial path.

---

## 5. First login flow

1. Principal `password_state` in `{temporary_issued, reset_required}` **or** `must_accept_terms = true`.  
2. Middleware and `/first-login` page block product routes until complete.  
3. User sets permanent password (≥12), confirms, accepts Terms.  
4. `completePasswordChange` → provider password update → `permanent_set` + terms stamp → revoke other sessions.  
5. Redirect to assigned home.

---

## 6. Password change flow

| Path | Behavior |
|------|----------|
| First login | `firstLoginPasswordAction` → adapter (requires terms) |
| Recovery (`/reset-password`) | Session establish (existing recovery) → `authenticatedPasswordChangeAction` → adapter → sign out → `/login` |

Shared adapter guarantees: min length 12, `password_state = permanent_set`, other-session revoke (best-effort).

---

## 7. Invitation flow (Slice A hardening only)

| Step | Behavior |
|------|----------|
| Public signup | Disabled (`signUpAction` rejects; `?mode=sign_up` redirected with error) |
| `/accept-invitation/:token` | Requires authenticated user; validates pending/non-expired invite visible under RLS |
| Accept API | Authenticated only; blocks if first-login gate still required; **does not create accounts** |
| Full invite issuance / temp-password email / Org Admin provision | **Slice C / B** — out of scope |

Existing invitation accept membership upsert behavior is preserved for already-authenticated recipients.

---

## 8. Remaining Slice B–E work

| Slice | Remaining (not started) |
|-------|-------------------------|
| **B** | Organization provisioning · Org Admin provision · Subscription / capability assignment |
| **C** | Invitation system completion · Temporary password email delivery · Accept-invite UX beyond A hardening |
| **D** | Permission engine · Role management · Dashboard assignment · **Org Admin / Leasing Agent / Facility Technician** certification |
| **E** | Org Admin recovery policy · Emergency recovery · Privileged audit completion · Support escalation |

---

## 9. Acceptance mapping (implementation intent)

| ID | Implementation coverage |
|----|-------------------------|
| AA-01 | Identity Adapter mediates commercial login / password change |
| AA-02 | Username UI + resolve-by-username; email not product identity |
| AA-03 | `/first-login` + middleware gate |
| AA-04 | `permanent_set` + revoke other sessions on change |
| AA-05 | Signup removed / rejected |
| AA-06 | No passwords on OPS payloads (adapter does not emit secrets) |
| AA-07 | `auth_register_username` + registry tombstone constraints for issuance touched by A |
| AA-08 | No Slice D role surfaces |
| AA-09 | UX-012 tokens on touched auth UI |
| AA-10 | No email-as-identity commercial UI; no open signup |

Formal PASS/FAIL recorded in **[35 — Slice A Validation](./35-slice-a-validation.md)** · ✅ **PASS**.

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| Slice A implementation | ✅ **COMPLETE** |
| Slice A validation | ✅ **PASS** ([35](./35-slice-a-validation.md)) |
| Begin Slice B? | ❌ **NO** until `AUTHORIZE AUTH-001 SLICE B` |
| **Next phrase** | **`AUTHORIZE AUTH-001 SLICE B`** (eligible; not issued here) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ AUTH-001 Slice A **IMPLEMENTED** | 2026-07-24 |
| Validation | ✅ **PASS** · [35](./35-slice-a-validation.md) | 2026-07-24 |

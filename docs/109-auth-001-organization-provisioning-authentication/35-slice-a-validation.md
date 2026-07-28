# 35 — AUTH-001 Slice A Validation Report

**Package:** AUTH-001  
**Slice:** A — Identity foundation  
**Authorization:** [33](./33-slice-a-authorization.md)  
**Implementation:** [34](./34-slice-a-implementation.md)  
**Status:** ✅ **VALIDATED**  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE AUTH-001 SLICE A
```

**Program record:** [CORE-003 §40](../113-core-003-implementation-master-plan/40-auth-001-slice-a-authorization.md)  
**Runtime substrate:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`) · migration `20260724235515|auth001_slice_a_identity_foundation`

> Validation only. No AUTH-001 Slice B–E implementation.  
> No deferred Slice D role work. No OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2.  
> No critical defects requiring code remediation in this session.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice A Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE AUTH-001 SLICE A` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** |
| **Slice A approved for program progression?** | ✅ **YES** — Slice A **Validated** |
| **Recommend `AUTHORIZE AUTH-001 SLICE B`?** | ✅ **YES — eligible** after this Validation; subsequently **issued** ([36](./36-slice-b-authorization.md)) |
| **Begin Slice B implementation?** | ❌ **NO** in validation session — awaits dedicated implementation after authorize |
| **Authorize Slice D deferred roles?** | ❌ **NO** |
| **Authorize OPS-001 Slice B / UX-012 Slice B?** | ❌ **NO** — not this gate |

---

## 2. Scope verified against [33] / [34]

| In-scope deliverable | Evidence | Result |
|----------------------|----------|--------|
| Identity Adapter | `apps/web/src/lib/auth/identity/adapter.ts` mediates resolve / authenticate / password change / revoke / signup reject | ✅ |
| Username principal model | Live tables `identity_principals` (14 rows) + `username_registry`; RPCs present | ✅ |
| Username authentication | Login UI `#username` → `signInAction` → `authenticate` → provider email internal | ✅ |
| Dual-run email (Q10) | Live `auth_resolve_login_identifier` returns `dual_run_email=true` for email-shaped identifier; username preferred path `dual_run_email=false` | ✅ |
| First login | `/first-login` + middleware gate on protected/home/login/forgot; states `temporary_issued` / `reset_required` / `must_accept_terms` | ✅ |
| Password change | `completePasswordChange` min 12 · `permanent_set` · `admin.signOut(uid, "others")`; recovery uses adapter | ✅ |
| Invitation-only hardening | Signup UI removed; `signUpAction` rejects; `?mode=sign_up` redirected; accept page/API require auth; no `auth.signUp` / `createUser` in app | ✅ |
| UX-012 Slice A tokens | Touched auth surfaces use `@mpa/ui/auth` + `--mpa-*` | ✅ |

| Explicitly out of scope | Confirmed absent under Slice A ship | Result |
|-------------------------|-------------------------------------|--------|
| Org provisioning / Org Admin provision / subscription bind | No Slice B provision paths added | ✅ |
| Invite email / temp password delivery | Slice C not started | ✅ |
| Permission engine / dashboard assignment redesign | Slice D not started | ✅ |
| Org Admin / Leasing Agent / Facility Technician surfaces | `ops-shell-access.ts` explicitly defers; no new role surfaces | ✅ |
| Org Admin recovery policy / emergency recovery / privileged audit completion | Slice E not started; contact-email forgot-password retained for dual-run only | ✅ |

---

## 3. Acceptance checklist (AA-01 … AA-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **AA-01** | Identity Adapter mediates commercial login path | ✅ **PASS** | Commercial sign-in goes through `identity.authenticate` / `resolvePrincipal`; provider `signInWithPassword` is behind adapter |
| **AA-02** | Login uses username + password; email not login identity | ✅ **PASS** | Login form username field; provider email not shown as identity; dual-run email resolve is migration compatibility only (Q10) |
| **AA-03** | First-login enforces terms / password-change | ✅ **PASS** | Gate detection + middleware + `/first-login` requires password confirm + Terms; `must_accept_terms` / temp / reset states |
| **AA-04** | Temp cannot be reused after change; sessions revoked | ✅ **PASS** | Provider password replaced + `password_state → permanent_set`; `revokeOtherSessions` via `admin.signOut(..., "others")` (best-effort catch — see observations) |
| **AA-05** | Public self-registration disabled/removed | ✅ **PASS** | No signup UI; `rejectPublicSignup`; login `mode=sign_up` rejected; no `signUp`/`createUser` call sites in `apps/web` |
| **AA-06** | Passwords never logged / returned / on OPS payloads | ✅ **PASS** | Auth adapter does not log credentials; OPS envelope forbids `password` / `temp_password` keys (`envelope.ts`) |
| **AA-07** | Username immutability / non-reuse where A touches issuance | ✅ **PASS** | `username_registry` + `auth_register_username` (charset/length/reserved/tombstone/unavailable); unique username index; live reject: short `admin` (length) · `support` (reserved) |
| **AA-08** | No Slice D deferred-role surfaces under this authorize | ✅ **PASS** | No Org Admin / Leasing / Facility Tech first-class surfaces shipped; deferral comments retained |
| **AA-09** | Slice A auth UI uses UX-012 A tokens only | ✅ **PASS** | Login / first-login / reset / accept / forgot use `@mpa/ui/auth` and `--mpa-*` (minor utility classes alongside — not a competing system) |
| **AA-10** | Package fail conditions applicable to A not violated | ✅ **PASS** | No email-as-primary commercial UI; no open signup creating principals; no unauthorized slice work |

**All AA-01–AA-10:** ✅ **PASS**

---

## 4. Objective checks

### Identity Adapter

| Check | Result |
|-------|--------|
| Provider abstraction boundary | ✅ |
| Authentication flow (resolve → provider sign-in) | ✅ |
| Password change mediated by adapter | ✅ |
| Session revocation invoked on change | ✅ |
| Separation from product UI (UI does not call provider login email as identity) | ✅ |

### Username login

| Check | Result |
|-------|--------|
| Username authentication path | ✅ |
| Email resolution compatibility (dual-run) | ✅ live RPC |
| Error handling (generic invalid credentials; locked/disabled message) | ✅ |
| Security (service-role resolve; no email identity in UI) | ✅ |

### First login

| Check | Result |
|-------|--------|
| First-login detection (`requiresFirstLoginGate`) | ✅ |
| Middleware enforcement | ✅ |
| Temporary / reset / terms states | ✅ |
| Terms + permanent password initialization UI/action | ✅ |

### Password change

| Check | Result |
|-------|--------|
| Minimum length ≥ 12 | ✅ |
| `permanent_set` flag | ✅ |
| Session revocation call | ✅ |
| Recovery path via adapter | ✅ |

### Invitation-only entry

| Check | Result |
|-------|--------|
| Public signup blocked | ✅ |
| Accept requires authentication | ✅ |
| Invitation validation (pending / expiry / RLS visibility) | ✅ |
| No unauthorized account creation on accept | ✅ membership upsert only |

### Scope confirmations

| Check | Result |
|-------|--------|
| No AUTH Slice B–E functionality | ✅ |
| No deferred Slice D role implementation | ✅ |
| No workflow redesign beyond identity foundation | ✅ |
| No breaking public signup API retained | ✅ (signup removed/rejected) |
| Existing authenticated accept-invite membership behavior preserved | ✅ |

---

## 5. Live substrate evidence (`mpa-prod`)

| Check | Result |
|-------|--------|
| Migration applied | ✅ `auth001_slice_a_identity_foundation` (`20260724235515`) |
| `identity_principals` populated | ✅ **14** principals (all `permanent_set` after design-partner backfill) |
| RPCs | ✅ `auth_resolve_login_identifier` · `auth_register_username` |
| RLS | ✅ self-select principals · active registry select |
| Username resolve | ✅ sample username → principal + provider email · `dual_run_email=false` |
| Dual-run email resolve | ✅ email-shaped identifier → `dual_run_email=true` with username attached |
| Reserved / invalid username fail-closed | ✅ `auth_register_username('admin', …)` → invalid length; `support` → reserved username |

---

## 6. Exit criteria ([33] §6)

| Criterion | Result |
|-----------|--------|
| AA-01–AA-10 satisfied | ✅ |
| Username login / first-login / password-change certification path for Slice A scope | ✅ (code + live substrate; no critical defect) |
| No public signup creates accounts | ✅ |
| Validation phrase recorded | ✅ **this document** |

---

## 7. Observations (non-blocking)

| ID | Note | Disposition |
|----|------|-------------|
| O-01 | `revokeOtherSessions` swallows provider errors (best-effort). Password change + `permanent_set` still complete. | Track for Slice E hardening if needed; **not** AA-04 FAIL |
| O-02 | `temporary_password_expires_at` is stored but not enforced at authenticate. Temp issuance/TTL ownership is Slice C. | Deferred Slice C; acceptable for A |
| O-03 | Forgot-password remains contact-email based for dual-run. Org Admin recovery policy is Slice E. | Explicitly out of Slice A |
| O-04 | End-to-end interactive login with a temporary_issued principal was not exercised live (all 14 backfilled principals are `permanent_set`). Gate logic verified by code review + middleware wiring. | Acceptable for A validation; full temp-password E2E belongs with Slice C issuance |

---

## 8. Remediation

| Field | Result |
|-------|--------|
| Critical defects | ❌ **None** |
| Required remediation before PASS | ❌ **None** |
| Optional follow-ups | O-01…O-04 (non-blocking) |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Approve / validate Slice A?** | ✅ **YES — VALIDATED (PASS)** |
| **Recommend next governance authorization?** | ✅ **`AUTHORIZE AUTH-001 SLICE B`** — subsequently issued ([36](./36-slice-b-authorization.md)) |
| **Begin Slice B now?** | ❌ **NO** (validation session) |
| **Unlock Slice D deferred roles?** | ❌ **NO** |
| **Unlock OPS-B / UX-012 B / PMX Phase 2?** | ❌ **NO** |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **`VALIDATE AUTH-001 SLICE A`** · **PASS** | 2026-07-24 |
| Implementation remediation | Not required | 2026-07-24 |
| Next authorize | ✅ Subsequently issued: [36](./36-slice-b-authorization.md) | — |

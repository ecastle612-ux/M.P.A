# 02 — Authentication Architecture

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Invitation-only (binding)

M.P.A. is **not** an open registration platform. Accounts are created only via Organization Administrator invite, Master Admin / system provision, or Accept Invitation → Activate Account. See [27](./27-invitation-only-platform.md).

---

## Stacking model

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation (UX-005 aligned login / first-run / recovery) │
├─────────────────────────────────────────────────────────────┤
│ Product Identity (AUTH-001)                                  │
│  • Username principal                                        │
│  • Contact channels (email/phone)                            │
│  • Org membership + role + permissions                       │
│  • First-login / recovery policies                           │
├─────────────────────────────────────────────────────────────┤
│ Authorization (ADR-003 planes + capability evaluation)       │
├─────────────────────────────────────────────────────────────┤
│ Entitlements (BILL-001)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity Adapter                                             │
│  • Maps username → auth provider user                        │
│  • Password verify / session issue / revoke                  │
│  • MFA hooks                                                 │
├─────────────────────────────────────────────────────────────┤
│ Auth Provider: Supabase Auth (retained)                      │
│  Sessions via @supabase/ssr HTTP-only cookies                │
└─────────────────────────────────────────────────────────────┘
```

**Invariant:** Billing checks never replace authentication. AuthZ never trusts the client. Entitlements never grant org membership.

---

## Identity Principal

The **Identity Principal** is the durable person (or service) record used for login.

| Attribute | Rule |
|-----------|------|
| `principal_id` | Immutable UUID |
| `username` | Immutable, globally unique, MPA-generated |
| `status` | `pending` / `active` / `locked` / `disabled` / `archived` |
| `password_state` | `temporary_issued` / `permanent_set` / `reset_required` |
| `mfa_state` | `not_configured` / `optional` / `required` / `enforced` |
| `auth_provider_subject` | Opaque link to Supabase Auth user id |

Email is **not** on the principal as identity. Contact emails live in `ContactChannel` records.

---

## Identity Adapter (design)

Purpose: keep product rules independent of provider quirks.

| Adapter operation | Behavior |
|-------------------|----------|
| `resolvePrincipal(username)` | Lookup principal; reject unknown/disabled |
| `authenticate(username, password)` | Verify via provider; issue session |
| `issueTemporaryPassword(principal)` | Generate secret; store **hash only**; set expiry |
| `forcePasswordChange(principal)` | Mark `reset_required`; invalidate temp |
| `updateContactEmail(principal, email)` | Mutate contact; **no** auth identity change |
| `revokeSessions(principal)` | Global logout |
| `attachMfa` / `verifyMfa` | Optional/enforced MFA |

### Provider mapping note (design constraint)

Supabase Auth historically keys users by email. AUTH-001 product identity is username-first. The adapter **must** preserve username as the only login identifier exposed to users. Any internal provider email/alias (if required) is an implementation detail that:

- Is never shown as the user’s identity  
- Is never used as password-reset identity for Org Admins  
- Cannot be changed by the user in a way that breaks login  

Exact technical mapping is an Implement-slice decision under this Approved architecture — not a product UX choice.

---

## Authentication factors

| Factor | MVP | Notes |
|--------|-----|-------|
| Username + password | Required | Primary |
| Temporary password | Required for provisioned accounts | Single-use lifecycle |
| MFA (TOTP / WebAuthn) | Optional at first login; recommended for Org Admin | Enforceable by policy later |
| Magic link / email OTP login | **Not** primary login | May assist **contact verification** only |
| OAuth social login | Out of MVP commercial path | Future extension |
| SSO / SAML | Future enterprise | Slot reserved; does not redesign username ownership |

---

## Session model

| Concern | Rule |
|---------|------|
| Transport | HTTP-only, Secure, SameSite cookies (existing SSR pattern) |
| Subject | Authenticated principal id |
| Active organization | Explicit context; required for tenant operations |
| Active role / plane | Resolved per org + membership |
| Effective subject | ADMIN-001 impersonation overlay (audited); null in normal use |
| Absolute timeout | Configurable; shorter for privileged roles (design target) |
| Idle timeout | Configurable |
| Concurrent sessions | Allowed with revoke-all on password change / recovery |

---

## Login classes

| Class | Who | Entry |
|-------|-----|-------|
| **Commercial login** | Org Admin + subaccounts | Username + password |
| **First login** | Newly provisioned | Username + temp password → hardening gate |
| **Level 0 login** | M.P.A. Internal Master Admin | Separate hardened path / capability (`master_admin`) |
| **Impersonation** | Level 0 only | ADMIN-001; never password of target |

---

## First-login gate (mandatory)

On first successful authentication with `password_state = temporary_issued` (or `reset_required`):

1. Identity verification (contact email / phone challenge as policy requires)  
2. Accept Terms of Service / Privacy  
3. Create new permanent password (policy-compliant)  
4. Optional MFA configuration (Org Admin strongly encouraged)  
5. Temporary credential marked **consumed / expired forever**  
6. Proceed to Organization Setup Wizard (Org Admin) or home surface (subaccount)

Skipping the gate is forbidden.

---

## Authorization planes (unchanged ADR-003)

AUTH-001 provisions principals into the correct plane:

| Plane | How principals enter |
|-------|----------------------|
| PM organization | Org membership with PM staff roles |
| Property owner | `owner_property_access` grants (direct-owner org or PM-managed owners) |
| Tenant | `tenant_lease_access` |
| Vendor | Marketplace / org vendor linkage |

Portal shells remain role-aware; **assignment is automatic** ([07](./07-dashboard-assignment-rules.md)).

---

## Separation from BILL-001

```
Auth success
  → AuthZ (membership + capabilities)
    → Entitlements (plan / modules)
      → Domain action
```

Suspended subscription may block entitlements while AUTH-001 still authenticates (or may force org `suspended` — see [22](./22-edge-cases.md) Q defaults).

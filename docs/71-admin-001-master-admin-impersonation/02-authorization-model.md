# 02 — Authorization Model

**Package:** ADMIN-001  
**Status:** Draft

## Capability

| Rule | Detail |
| --- | --- |
| Gate | Existing capability key `master_admin` (Slice A) |
| Evaluation | `evaluatePermission` / `resolveAuthorizationContext` only |
| Forbidden | Hardcoded emails, allowlists in source, “fake” capability keys, bypassing RLS for normal users |
| Grant path | `organization_permission_overrides` (and any future approved grant mechanism) — same as Slice A |

## Two planes (must stay distinct)

| Plane | Meaning | Source of truth |
| --- | --- | --- |
| **Authenticated subject** | Who holds the session credentials | Supabase Auth user (Master Admin) |
| **Effective subject** | Whose UX/permissions are rendered | Impersonation / portal test context (nullable) |

When effective subject is null → normal authorization (Master Admin’s own memberships and capabilities).

When effective subject is set → **presentation and capability checks for app chrome** resolve as the impersonated user (menus, portal home, notification scoping, message inbox visibility). Mutations that would commit irreversible business actions remain governed by security rules in [08-security.md](./08-security.md).

## Portal Test Mode vs Impersonation

| Mode | Effective subject | Purpose |
| --- | --- | --- |
| **Portal Test Mode** | Synthetic portal persona for a chosen portal role (may use demo seed) | Fast Emergency Support entry without picking a real user |
| **User Impersonation** | Real org user | Faithful reproduction of that user’s experience |

Both require `master_admin` on the authenticated subject. Neither is available to other roles.

## API / page guards

- New Master Admin endpoints and Impersonation Center routes: `requireMasterAdminPageAccess` / `requireMasterAdminApiAccess` (or equivalent).
- Impersonation **start/stop** APIs: Master Admin only; reject otherwise with existing `apiError` patterns.
- Portal data loaders: if Test Mode / Impersonation active **and** authenticated subject has `master_admin`, allow read path for the effective subject; otherwise unchanged production checks.
- **No** public or PM API may accept an “act as user id” parameter without Master Admin verification server-side.

## Explicit non-goals for auth

- Creating a second Auth session  
- Sharing or rotating the target user’s password  
- Elevating the impersonated user’s stored roles  
- Granting `master_admin` via role_permission_grants to all managers globally (Slice A override model remains)

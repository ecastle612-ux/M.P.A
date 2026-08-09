# Master Admin Access Recovery

**Status:** Production data repair applied · LIVE Owner login verification pending  
**Date:** 2026-08-09  
**Scope:** Access recovery only (no auth redesign, no customer auth behavior changes)

## Symptom

After sign-in, the application showed:

> Access denied — Your account does not have a recognized role for this organization.

That maps to `/unauthorized?reason=role` from `(app)/layout.tsx` when an active organization membership exists but no recognized `UserRole` remains after filtering.

## Auth path traced

```
Login → /dashboard ((app) shell)
  → resolveAuthenticatedShellContext
  → organization_memberships (status=active) → roles filtered by isUserRole
  → if org present and defaultRole null → /unauthorized?reason=role

/admin ((admin) shell + middleware)
  → isPlatformOperatorUser
  → app_metadata.platform_operator === true
     OR platform_operators.status = 'active'
  → else /unauthorized?reason=admin
```

Legacy `app_metadata.dev_master_admin` / `role_label: Master Administrator` are **not** consulted by current authorization.

## Root cause

Two independent production record failures for the Owner user:

1. **Empty membership roles** — active membership in `M.P.A. Development` had `roles = {}`, so the app shell rejected with `reason=role`.
2. **Missing platform operator** — `platform_operators` contained **zero** rows, and JWT lacked `platform_operator: true`, so Master Admin would also fail with `reason=admin` even after the role fix.

No application authorization code was changed.

## Account state (before → after)

| Record | Before | After |
| --- | --- | --- |
| Auth user | `ecastle612@gmail.com` · id `f68545ab-8ed0-46df-b7b0-6d72f97a6c55` · `dev_master_admin=true`, `roles=[]`, no `platform_operator` | Same user · `platform_operator=true` (legacy flags retained) |
| Membership `2babd973-…` | `roles={}`, `is_owner=false`, `status=active` | `roles={organization_admin,property_manager}`, `is_owner=true`, `status=active` |
| Org `f8232926-…` | `M.P.A. Development` / `mpa-development` · created_by Owner | Unchanged (no duplicate org) |
| `platform_operators` | Empty table | One active row for Owner user |

## Repair performed (non-destructive)

Executed against production project `vahnmcrpnuggxkivynvo` via service SQL (bypasses operator RLS chicken-and-egg; does not delete users/orgs/memberships):

```sql
update public.organization_memberships
set
  roles = array['organization_admin', 'property_manager']::text[],
  is_owner = true,
  updated_at = timezone('utc', now())
where id = '2babd973-e6f3-4a14-97e9-fd396f96014e'
  and user_id = 'f68545ab-8ed0-46df-b7b0-6d72f97a6c55'
  and organization_id = 'f8232926-149d-46b3-829f-c84b55378718'
  and status = 'active'
  and cardinality(roles) = 0;

insert into public.platform_operators (user_id, status, granted_by)
values (
  'f68545ab-8ed0-46df-b7b0-6d72f97a6c55',
  'active',
  'f68545ab-8ed0-46df-b7b0-6d72f97a6c55'
)
on conflict (user_id) do update
set status = 'active', updated_at = timezone('utc', now());

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('platform_operator', true)
where id = 'f68545ab-8ed0-46df-b7b0-6d72f97a6c55';
```

## Security verification (DB)

| Check | Result |
| --- | --- |
| Active `platform_operators` rows | **1** — Owner only |
| JWT `platform_operator=true` | Owner only |
| Customer role samples (property_manager, property_owner, tenant, vendor, other organization_admin) | No operator row / no JWT operator flag |
| Empty-role memberships left untouched | QA fixtures only (`qa-master-admin@qa.mpa.local`) |
| Auth middleware / layout gates | Unchanged |

## LIVE Owner action required

Agents cannot complete interactive sign-in without Owner credentials.

1. Sign out of M.P.A. completely (clears stale session JWT).
2. Sign in again with the existing Owner account.
3. Confirm `/dashboard` no longer shows `reason=role`.
4. Open `/admin` → Platform Command Center.
5. Spot-check operator-only nav remains reachable: Organizations, Customers, Commercial, Support, System, Operators, Activity (as present in Master Admin nav).

## Verdict

| Gate | Status |
| --- | --- |
| Diagnosis | PASS |
| Data repair (existing records only) | PASS |
| Security exclusivity (DB) | PASS |
| Customer auth regression (DB role distribution) | PASS |
| LIVE Master Admin login | **PENDING Owner** |
| Overall | **CONDITIONAL PASS** — awaiting Owner LIVE confirmation |

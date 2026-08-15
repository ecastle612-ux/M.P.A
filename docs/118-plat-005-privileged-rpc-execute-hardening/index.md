# PLAT-005 — Privileged RPC Execute Hardening

**Status:** Draft / Proposed — Design only  
**Date:** 2026-08-15  
**Program:** PLAT-005  
**Blueprint record:** `docs/118-plat-005-privileged-rpc-execute-hardening/`  
**Parent audit:** [PLAT-004](../117-plat-004-residual-remediation-design/index.md) (H6 / P0; PR #221 if not yet on `main`)  
**Historical:** [PLAT-001](../93-plat-001-platform-mismatch-audit/index.md) H6  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Production (do not change from this package):** app `e56a330facf21d548815e95ff2e4c82e3c6077bd` · ledger `20260814233536` / `ops_001_operational_workspace`

---

## Verdict of this design

**READY FOR APPROVE — SCHEMA-ONLY**

This package removes unnecessary `PUBLIC` / `anon` (and, where required, `authenticated`) `EXECUTE` on privileged `SECURITY DEFINER` functions. It does **not** change function bodies, table RLS, roles, SKUs, Stripe, or application behavior.

**No function in current Production requires anonymous PostgREST access for the shipped login or product paths.** Class C is empty.

**No new ADR.** Grant hygiene is already required by `docs/14` and by ADR-026 (“revoke EXECUTE from `anon`”). ADR-031 (mutation plane) is unrelated and stays with PLAT-004.

**No implementation is authorized until this record is Approved.**

---

## Constraints honored

This design does **not**:

- Implement or apply SQL
- Modify Production
- Deploy or merge
- Change application behavior
- Change roles, SKUs, billing, Stripe, or customer data
- `CREATE OR REPLACE` function bodies
- Drop functions or tables
- Insert `pm.finance:*` grants (PLAT-006)
- Touch shared-reports persona, FO home, or OPS-001 features

---

## 1. Problem

PostgREST exposes every function `EXECUTE`-able by `anon` or `PUBLIC` at `/rest/v1/rpc/<name>`. Several Production `SECURITY DEFINER` functions:

- look up `auth.users` by email with no `auth.uid()` check
- write `username_registry` with no auth check
- claim the domain-event queue, due reminders, or scheduler lock with no auth check

PLAT-004 confirmed live anon calls succeed (`resolve_auth_user_id_by_email` 200, `auth_resolve_login_identifier` 200). Production has **188** `event_domain_events` in `pending`/`failed`. An unauthenticated caller can claim that queue today.

Later programs already used the correct pattern (do not copy those files onto Production):

```
revoke all on function public.<fn>(...) from public, anon;
grant execute on function public.<fn>(...) to authenticated;  -- only if RLS or user RPC needs it
```

See `20260814160000_plat_002_authorization_hardening.sql` and `20260814200000_fac_003_asset_inventory.sql`. Those successors are already applied. This package extends the same grant rule to the leftover July/AUTH-001/OPS claimer set.

---

## 2. Method (read-only)

| Layer | Source |
|-------|--------|
| Production functions / grants / bodies | Supabase `execute_sql` on `vahnmcrpnuggxkivynvo` (2026-08-15) |
| Ledger tip | `20260814233536` / `ops_001_operational_workspace` (unchanged) |
| Application callers | `origin/main` @ `e56a330f` — `rpc(`, login form, provisioning, portal admin Auth |
| Login path | `apps/web/src/components/shell/login-form.tsx` — `signInWithPassword({ email, password })` |
| Prior evidence | PLAT-004 live anon RPC 200s |

No Production writes. No mutating RPCs were invoked in this design.

---

## 3. Classification rules

Assign **exactly one** target class. Do not keep anon access because it exists today.

| Class | Meaning | Target EXECUTE |
|-------|---------|----------------|
| **A** | Authenticated client callable — needed for RLS policy evaluation or a current user-scoped RPC | `authenticated` + `service_role`. Revoke `PUBLIC` + `anon`. |
| **B** | Trusted server / `service_role` only | `service_role` only. Revoke `PUBLIC`, `anon`, `authenticated`. |
| **C** | Legitimately anonymous | Keep `anon` (and document why). |
| **D** | Legacy / unused RPC; remove client execution pending later deprecation | Revoke `PUBLIC`, `anon`, `authenticated`. Owner `postgres` retains. Optional `service_role` only if a server path still exists. |

Policy helpers run as the **invoking table role**. Authenticated users need `EXECUTE` on helpers referenced by `pg_policies`. Function-to-function calls between `postgres`-owned `SECURITY DEFINER` routines do **not** need client grants.

---

## 4. Login / auth compatibility

Current Production login and account-claim paths **do not call** these RPCs.

| Flow | Actual caller | Uses P0 RPC? |
|------|---------------|--------------|
| Sign in | GoTrue `signInWithPassword({ email, password })` | **No** |
| Sign up | GoTrue `signUp({ email, password })` | **No** |
| Commerce claim-password | `/api/commerce/provision/claim-password` (trusted Next.js) | **No** |
| Provisioning user lookup | `supabase.auth.admin.listUsers` / `createUser` | **No** |
| Portal invite | `auth.admin.inviteUserByEmail` / `generateLink` | **No** |
| Username login | **Not implemented** in the web app | — |

`username_registry` (23 rows) and `identity_principals` (23 rows) exist from AUTH-001. They are compatibility-required data. They are **not** on the current login form.

**Therefore:**

- Revoking `anon`/`authenticated` `EXECUTE` on `resolve_auth_user_id_by_email`, `auth_resolve_login_identifier`, and `auth_register_username` does **not** break current login.
- A future username-or-email resolver must be a **Next.js trusted route** (service-role + rate limit). Do not restore public PostgREST for that feature.
- Email enumeration via `/rest/v1/rpc/resolve_auth_user_id_by_email` is not a product requirement.

---

## 5. Authoritative Production inventory

All functions: schema `public`, owner `postgres`, `SECURITY DEFINER`. `search_path` as listed. `postgres` owner EXECUTE is implicit and is not revoked.

Legend: uid = checks `auth.uid()` / JWT; org = membership or SKU check; idn = reads identity (`auth.users`, email, username, principal); mut = writes data.

### 5.1 P0 — must change

| Function | Args | search_path | PUBLIC | anon | authenticated | service_role | uid | org | idn | mut | Caller today | Anon required? | Class | Target |
|----------|------|-------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|--------------|:---:|:---:|--------|
| `resolve_auth_user_id_by_email` | `p_email text` | `auth, public` | — | ● | ● | ● | — | — | ● | — | **None** in `e56a330f` | **No** | **B** | service_role only |
| `auth_resolve_login_identifier` | `p_identifier text` | `public` | — | ● | ● | ● | — | — | ● | — | **None** (login is GoTrue email) | **No** | **B** | service_role only |
| `auth_register_username` | `p_username text, p_principal_id uuid` | `public` | — | ● | ● | ● | — | — | ● | ● | **None** | **No** | **B** | service_role only |
| `ops_claim_domain_events` | `p_limit integer, p_claimer text` | `public` | — | ● | ● | ● | — | — | — | ● | **None** (app inserts `event_domain_events` directly; no claimer) | **No** | **B** | service_role only |
| `ops_claim_due_reminders` | `p_limit integer, p_claimer text` | `public` | — | ● | ● | ● | — | — | — | ● | **None** | **No** | **B** | service_role only |
| `ops_acquire_scheduler_leader` | `p_holder_id text, p_lease_seconds integer` | `public` | — | ● | ● | ● | — | — | — | ● | **None** (no cron/Edge Function) | **No** | **B** | service_role only |

Why B, not D: tables and rows are live (`username_registry` 23, pending events 188, scheduler leader 1, reminders 2). A future trusted worker may call them with `service_role`. Client execute is what must die.

Why not C: anonymous product flows do not need these RPCs.

### 5.2 Already hardened (no grant change)

These already match Class A. Do not replay their repo files.

| Function | Args | search_path | anon | authenticated | uid/org | Caller | Class |
|----------|------|-------------|:---:|:---:|---------|--------|:---:|
| `apply_facility_stock_movement` | `target_stock_item_id uuid, target_movement_type text, target_quantity numeric, target_reason text, target_work_order_id uuid` | `public` | — | ● | uid + FO manager / assigned tech | `inventory-service.ts` user-scoped `rpc` | **A** |
| `can_manage_facility_ops` | `target_org_id uuid` | `public` | — | ● | org + SKU surface | Policies / stock RPC | **A** |
| `can_select_facility_asset` | `target_asset_id uuid` | `public` | — | ● | org | Policies | **A** |
| `can_select_facility_stock_item` | `target_stock_item_id uuid` | `public` | — | ● | org | Policies | **A** |
| `can_select_work_order` | `target_work_order_id uuid` | `public` | — | ● | assignment + surface | 5 policies | **A** |
| `can_access_tenant_conversation` | `target_org_id uuid, target_lease_id uuid, target_tenant_account_id uuid` | `public` | — | ● | comms staff or lease resident | 9 policies | **A** |
| `is_pm_comms_staff` | `target_org_id uuid` | `public` | — | ● | uid + PM/Complete SKU | 3 policies | **A** |
| `org_sku` | `target_org_id uuid` | `public` | — | ● | SKU read (no uid) | Policy helpers | **A** |
| `org_allows_work_surface` | `target_org_id uuid, target_surface text` | `public` | — | ● | SKU | Policies / FO helpers | **A** |

`org_sku` has no `auth.uid()` check. Leaving `authenticated` EXECUTE is required for in-policy use. Do not grant `anon`. A later package may wrap it; out of scope here.

### 5.3 Policy helpers with leftover anon / PUBLIC (change)

These check `auth.uid()` (or JWT) and return boolean. Anon RPC returns false or leaks “is this UUID a member?” probing. **271** policies call `has_org_capability`; **21** call `is_org_member`; **25** call `is_org_manager`; **10** call `is_platform_operator`. Authenticated EXECUTE must remain.

| Function | Args | PUBLIC | anon | uid | Policies (approx.) | Class | Target |
|----------|------|:---:|:---:|:---:|--------------------|:---:|--------|
| `has_org_capability` | `target_org_id uuid, required_capability text` | ● | ● | ● | 271 | **A** | revoke PUBLIC+anon |
| `is_org_member` | `target_org_id uuid` | ● | ● | ● | 21 | **A** | revoke PUBLIC+anon |
| `is_org_manager` | `target_org_id uuid` | ● | ● | ● | 25 | **A** | revoke PUBLIC+anon |
| `is_platform_operator` | *(none)* | — | ● | ● | 10 | **A** | revoke anon (repo once revoked PUBLIC; Production still has anon) |
| `is_maintenance_manager` | `target_org_id uuid` | ● | ● | ● | used by FO helpers / WO | **A** | revoke PUBLIC+anon |
| `is_maintenance_technician` | `target_org_id uuid` | ● | ● | ● | WO | **A** | revoke PUBLIC+anon |
| `is_lease_resident` | `target_lease_id uuid` | ● | ● | ● | comms / leases | **A** | revoke PUBLIC+anon |
| `is_leasing_writer` | `target_org_id uuid` | ● | ● | ● | leasing | **A** | revoke PUBLIC+anon |
| `is_resident_writer` | `target_org_id uuid` | ● | ● | ● | residents | **A** | revoke PUBLIC+anon |
| `is_linked_vendor_for_work_order` | `target_work_order_id uuid` | ● | ● | ● | WO | **A** | revoke PUBLIC+anon |
| `is_work_order_resident` | `target_work_order_id uuid` | ● | ● | ● | WO | **A** | revoke PUBLIC+anon |
| `is_conversation_thread_participant` | `p_organization_id uuid, p_thread_id uuid` | — | ● | ● | legacy threads | **A** | revoke anon |

`is_maintenance_technician` still mentions `facility_technician` in SQL. That role is not in `USER_ROLES` (PLAT-001 L4). Do **not** change the body in this package.

### 5.4 Legacy RPC / trigger (change)

| Function | Args | Kind | PUBLIC | anon | authenticated | Caller | Anon required? | Class | Target |
|----------|------|------|:---:|:---:|:---:|--------|:---:|:---:|--------|
| `is_pm_staff` | `target_org_id uuid` | Helper | ● | ● | ● | **0 policies** (C5 moved to `is_pm_comms_staff`) | **No** | **D** | revoke PUBLIC+anon+authenticated |
| `create_building_qr_code_for_property` | *(none)* | Trigger | ● | ● | ● | Trigger on property insert | **No** (triggers do not use PostgREST) | **D** | revoke PUBLIC+anon+authenticated+service_role |
| `resolve_building_qr_token` | `p_token text` | RPC | ● | ● | ● | **None** in current app; 10 `building_qr_codes` rows; joins legacy `properties` | **No** current product path | **D** | revoke PUBLIC+anon+authenticated |
| `rls_auto_enable` | *(none)* | Event trigger | ● | ● | ● | DDL event trigger | **No** | **D** | revoke PUBLIC+anon+authenticated+service_role |

`resolve_building_qr_token` is **not** Class C. There is no public enrollment route on `e56a330f`. If enrollment returns, it must be a designed Next.js route, not a restored anon RPC.

### 5.5 Class C

**None.**

---

## 6. Intended grant matrix (after implement)

| Class | Functions | PUBLIC | anon | authenticated | service_role |
|-------|-----------|:---:|:---:|:---:|:---:|
| A (unchanged) | FAC-003 + PLAT-002 helpers listed in §5.2 | — | — | ● | ● |
| A (this package) | §5.3 policy helpers | — | — | ● | ● |
| B | six P0 functions in §5.1 | — | — | — | ● |
| D | `is_pm_staff`, `resolve_building_qr_token` | — | — | — | — or service_role optional |
| D trigger | `create_building_qr_code_for_property`, `rls_auto_enable` | — | — | — | — |

Owner `postgres` always retains execute.

---

## 7. Implement specification (after Approve only)

### 7.1 Migration shape

- **One new** repo file: `supabase/migrations/20260815HHMMSS_plat_005_privileged_rpc_execute_hardening.sql`
- Choose `HHMMSS` at implement so the version is **greater than** `20260814233536`.
- Production apply uses a **successor stamp** if the repo filename would collide (PLAT-004 H3). Do **not** replay `20260814160000` or `20260814200000`.
- Contents: `REVOKE` / `GRANT EXECUTE` only. No `CREATE OR REPLACE`. No table DDL. No data.

### 7.2 Required statements (intent, not a file to apply now)

**Class B — P0**

```
REVOKE ALL ON FUNCTION public.resolve_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_resolve_login_identifier(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_register_username(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ops_claim_domain_events(integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ops_claim_due_reminders(integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ops_acquire_scheduler_leader(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_auth_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_resolve_login_identifier(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_register_username(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ops_claim_domain_events(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ops_claim_due_reminders(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ops_acquire_scheduler_leader(text, integer) TO service_role;
```

Use Production `pg_get_function_identity_arguments` at apply time if signatures differ.

**Class A leftovers**

```
REVOKE ALL ON FUNCTION public.<helper>(...) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.<helper>(...) TO authenticated, service_role;
```

Apply to every function in §5.3.

**Class D**

```
REVOKE ALL ON FUNCTION public.is_pm_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolve_building_qr_token(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_building_qr_code_for_property() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;
```

### 7.3 Explicitly out of migration

- Function bodies, `search_path` on `set_updated_at` / FO triggers (L7)
- `pm.finance:*` grants (N1 / PLAT-006)
- Role / SKU / entitlement keys
- Drop of `username_registry`, QR tables, or July ops claimers

### 7.4 Rollback

Re-grant the pre-change matrix recorded in §5 (anon/PUBLIC/authenticated as inventoried). Rollback is grant-only. Do not restore anon on Class B without a new Approve.

---

## 8. Testing strategy (after Approved implement — not this package)

Do **not** call `ops_claim_*` or `auth_register_username` during tests (they mutate).

| Case | Expect after apply |
|------|--------------------|
| Anon `POST /rest/v1/rpc/resolve_auth_user_id_by_email` | 401 / permission denied (not 200) |
| Anon `POST /rest/v1/rpc/auth_resolve_login_identifier` | 401 / permission denied |
| Anon `POST /rest/v1/rpc/ops_claim_domain_events` | 401 / permission denied |
| Anon `POST /rest/v1/rpc/is_org_member` | 401 / permission denied |
| GoTrue email/password sign-in (PM, Complete, tenant) | Unchanged success |
| Authenticated `GET /api/pm/properties` | Still 200 for entitled Complete/PM |
| FAC-003 stock movement via existing API | Still works (`apply_facility_stock_movement` unchanged) |
| COM-002-TCC staff/tenant conversation GET | Still authorized via `is_pm_comms_staff` / `can_access_tenant_conversation` |
| Workspace / document list | Still org-scoped (`is_org_member` remains executable by authenticated) |
| Advisor `anon_security_definer_function_executable` | Count drops; Class B/D disappear from anon list |

Preview/branch database first. Production apply only with Owner authorization after those checks.

---

## 9. Risk and residuals

| Risk | Mitigation |
|------|------------|
| Hidden client still calls a P0 RPC | None found on `e56a330f`. Login is GoTrue. If a fork/script exists, it must move to service-role. |
| RLS breaks if helper loses `authenticated` | Class A keeps `authenticated`. Only B/D lose it. |
| Trigger QR insert fails | Trigger functions execute as owner, not via PostgREST. |
| Event dispatcher stops | No current app/cron/Edge caller. 188 pending events already have no in-repo claimer. This package does not add a worker. |
| Username login later | New design; trusted API; do not re-open anon. |

Residuals left to later programs: N1 finance grants, H5 report shapes, M2 invite home, L7 mutable `search_path`, H3 lineage map, documentation drift.

---

## 10. Approval ask

Product Owner + Architect:

1. Accept this record as the PLAT-005 design.
2. Authorize **implement** of §7 only (one successor migration, grants only).
3. Production apply remains a separate Owner step after Preview verification.

**STOP. No implementation from this document until Approved.**

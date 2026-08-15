# PLAT-005 PRODUCTION PRIVILEGED RPC HARDENING CERTIFICATION

**Title:** PLAT-005 PRODUCTION PRIVILEGED RPC HARDENING CERTIFICATION  
**Status:** PRODUCTION HARDENING SUCCESSFUL  
**Date:** 2026-08-15  
**Program:** PLAT-005  
**Authority:** Owner authorization for **Production grant-only apply** · [docs/118](../118-plat-005-privileged-rpc-execute-hardening/index.md) Approved · [docs/119](../119-plat-005-privileged-rpc-execute-hardening-implementation-certification/index.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains authoritative  
**No new ADR**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** Database grant apply + live verification only. **No application deploy.**  

---

## Verdict

**PRODUCTION HARDENING SUCCESSFUL**

Privileged `SECURITY DEFINER` EXECUTE is hardened on Production. Class B is no longer callable by `anon` or `authenticated`. Class A remains executable by `authenticated` and `service_role`. Class D client execute is removed. GoTrue email/password login still works for controlled PM, Complete/manager, and tenant UAT accounts. Trigger / event-trigger runtime remains enabled. Customer data counts are unchanged. The Production application SHA is unchanged.

**Do not deploy the application from this record.**

---

## What this package did not do

- Did not deploy the application
- Did not change application code
- Did not replace function bodies
- Did not alter or drop tables
- Did not write customer rows (ledger row only)
- Did not add finance grants, roles, SKUs, billing, or Stripe changes
- Did not invoke mutating RPCs successfully
- Did not replay `20260814160000` or `20260814200000`

---

## 1. Pre-apply Production baseline

Read 2026-08-15 against `mpa-prod` via Supabase MCP `list_migrations` and `execute_sql`, plus anon PostgREST.

### 1.1 Ledger tip

| Field | Value |
|-------|--------|
| Tip before apply | **`20260814233536` / `ops_001_operational_workspace`** |
| PLAT-005 on ledger | **No** |

### 1.2 Production application

| Field | Value |
|-------|--------|
| Latest GitHub Production deployment | `e56a330facf21d548815e95ff2e4c82e3c6077bd` @ `2026-08-14T23:43:10Z` |
| Live site | `https://www.my-property-assistant.com` |
| Live Vercel `dpl` | `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |

No newer Production deployment exists. This package did not deploy.

### 1.3 Function signatures

All 31 PLAT-005 functions exist on `public`, owner `postgres`, `SECURITY DEFINER`. Production `pg_get_function_identity_arguments` matches every GRANT/REVOKE signature in the certified file. **No signature mismatch. Apply was not BLOCKED.**

### 1.4 Pre-apply EXECUTE matrix (selected)

| Function | Class | PUBLIC | anon | authenticated | service_role |
|----------|:---:|:---:|:---:|:---:|:---:|
| `resolve_auth_user_id_by_email(text)` | B | — | ● | ● | ● |
| `auth_resolve_login_identifier(text)` | B | — | ● | ● | ● |
| `auth_register_username(text, uuid)` | B | — | ● | ● | ● |
| `ops_claim_domain_events(integer, text)` | B | — | ● | ● | ● |
| `ops_claim_due_reminders(integer, text)` | B | — | ● | ● | ● |
| `ops_acquire_scheduler_leader(text, integer)` | B | — | ● | ● | ● |
| `has_org_capability` / `is_org_member` / other §5.3 helpers | A | ● or — | ● | ● | ● |
| FAC/PLAT §5.2 helpers | A | — | — | ● | ● |
| `is_pm_staff` / `resolve_building_qr_token` | D | ● | ● | ● | ● |
| `create_building_qr_code_for_property` / `rls_auto_enable` | D | ● | ● | ● | ● |

### 1.5 Pre-apply live anon PostgREST

| RPC | Result |
|-----|--------|
| `POST /rest/v1/rpc/resolve_auth_user_id_by_email` | **200** `null` |
| `POST /rest/v1/rpc/auth_resolve_login_identifier` | **200** `[]` |

Payload used a nonexistent `example.invalid` address. This was the PLAT-004 H6 exposure.

### 1.6 Pre-apply counts

| Object | n |
|--------|--:|
| `username_registry` | 23 |
| `identity_principals` | 23 |
| `organization_memberships` | 31 |
| `organization_subscriptions` | 6 |
| `saas_subscriptions` | 4 |
| `maintenance_work_orders` | 32 |
| `facility_assets` | 6 |
| `facility_stock_items` | 2 |
| `event_domain_events` | 242 |
| pending/failed events | 188 |
| `ops_reminders` | 2 |
| `ops_scheduler_leader` | 1 |
| `building_qr_codes` | 10 |
| `comms_conversations` | 2 |
| `comms_messages` | 0 |

---

## 2. Migration contract

Certified source: `supabase/migrations/20260815180000_plat_005_privileged_rpc_execute_hardening.sql`

| Check | Result |
|-------|--------|
| Statements | **58** (31 `REVOKE ALL ON FUNCTION` + 27 `GRANT EXECUTE ON FUNCTION`) |
| Function replacement | **None** |
| Table / schema DDL | **None** |
| Data DML | **None** |
| Role / SKU / finance writes | **None** |
| Historical replay | **None** — did not apply `20260814160000` or `20260814200000` |

---

## 3. Apply

| Field | Value |
|-------|--------|
| Result | **success** |
| Method | Supabase MCP `apply_migration` |
| Name | `plat_005_privileged_rpc_execute_hardening` |
| Production version | **`20260815170604`** |
| Predecessor | `20260814233536` / `ops_001_operational_workspace` |
| Successor check | `20260815170604` > `20260814233536` |
| `cardinality(statements)` | 1 |
| SQL SHA-256 | `ad6cdf3495d0bad5529c41fe66d98702c8e5909786a4fb67e7fbd6036aae60e2` |
| Repo file SHA-256 | `ad6cdf3495d0bad5529c41fe66d98702c8e5909786a4fb67e7fbd6036aae60e2` |
| Created by | Owner account via MCP |

Exact SQL equivalence is proven by SHA-256. `length(statements[1])` is 6771 characters because comments contain UTF-8 em dashes; the repo file is 6779 bytes of the same text.

Apply-time stamp `20260815170604` differs from the repo filename `20260815180000` (PLAT-004 H3). The same bytes are recorded as `supabase/migrations/20260815170604_plat_005_privileged_rpc_execute_hardening.sql`. Fresh environments still use `20260815180000`. Do not replay either file on Production.

---

## 4. Post-apply grant matrix

Live `has_function_privilege` on Production after apply:

| Class | PUBLIC | anon | authenticated | service_role |
|-------|:---:|:---:|:---:|:---:|
| B (six P0 functions) | — | — | — | ● |
| A leftovers + restated FAC/PLAT helpers | — | — | ● | ● |
| D `is_pm_staff`, `resolve_building_qr_token` | — | — | — | ● (unchanged optional) |
| D trigger `create_building_qr_code_for_property`, `rls_auto_enable` | — | — | — | — |

Owner `postgres` retains execute.

---

## 5. Live anonymous security check

Anon PostgREST after apply, same nonexistent identity payload:

| RPC | HTTP | Body |
|-----|------|------|
| `resolve_auth_user_id_by_email` | **401** | `42501 permission denied for function …` |
| `auth_resolve_login_identifier` | **401** | `42501 permission denied for function …` |
| `ops_claim_domain_events` | **401** | `42501` — body did not run |
| `ops_claim_due_reminders` | **401** | `42501` |
| `ops_acquire_scheduler_leader` | **401** | `42501` |
| `auth_register_username` | **401** | `42501` |
| `is_org_member` | **401** | `42501` |
| `is_pm_staff` | **401** | `42501` |
| `resolve_building_qr_token` | **401** | `42501` |

Pre-apply 200 → post-apply 401 on the two identity RPCs. Mutating Class B calls failed at privilege check. `claimed_by = 'plat005-cert-probe'` count = **0**. Scheduler holder probe count = **0**. Pending/failed events remain **188**.

---

## 6. Authenticated check

GoTrue access tokens for controlled UAT accounts, then PostgREST:

| Caller | Class B identity / claim | Class A `is_org_member` / `has_org_capability` | Class D `is_pm_staff` |
|--------|--------------------------|-----------------------------------------------|------------------------|
| Tenant | **403** `42501` | **200** `false` | **403** `42501` |
| PM | **403** `42501` | **200** `false` | **403** `42501` |
| Complete/manager | **403** `42501` | **200** `false` | **403** `42501` |

Authenticated retains required Class A helper execution. Class B and Class D are not directly callable. RLS still uses Class A helpers in-policy; those grants were not broadened.

---

## 7. Login compatibility

GoTrue `POST /auth/v1/token?grant_type=password` (email/password). No password resets.

| Account | Result |
|---------|--------|
| Property Manager `uat.pm.property.demo@my-property-assistant.com` | **200** `authenticated` |
| Tenant `uat.tenant.property.demo@my-property-assistant.com` | **200** `authenticated` |
| Complete/manager on `M.P.A. UAT Clinic Demo` (`mpa_complete_platform`, `organization_admin`) | **200** `authenticated` |

Application login path on the live SHA remains `signInWithPassword({ email, password })`. No in-app caller of `resolve_auth_user_id_by_email`, `auth_resolve_login_identifier`, or `auth_register_username` except the static PLAT-005 test. Invitations / `auth.admin` architecture unchanged. No username-login dependency introduced.

---

## 8. Server-caller compatibility

`service_role` `EXECUTE` is **true** for all six Class B functions and required Class A helpers.

A `service_role` `PERFORM` of `resolve_auth_user_id_by_email` and `is_org_member` ran (non-mutating). Claim / reminder / leader functions were **not** executed, so Production queues were not processed. Access is grant-proven; a future trusted worker can call them.

---

## 9. Trigger / event-trigger safety

| Object | After apply |
|--------|-------------|
| `trg_properties_building_qr_code` on `properties` | Enabled (`O`) · `AFTER INSERT` · `create_building_qr_code_for_property()` |
| Event trigger `ensure_rls` | Enabled (`O`) · `rls_auto_enable()` |

Revoking client `EXECUTE` did not drop or disable owner-invoked trigger runtime. Functions were not dropped.

---

## 10. Data safety

Post-apply counts match the pre-apply baseline exactly. Probe claimer/leader rows = 0.

| Object | Pre | Post |
|--------|----:|-----:|
| `username_registry` | 23 | 23 |
| `identity_principals` | 23 | 23 |
| `organization_memberships` | 31 | 31 |
| `organization_subscriptions` | 6 | 6 |
| `saas_subscriptions` | 4 | 4 |
| `maintenance_work_orders` | 32 | 32 |
| `facility_assets` | 6 | 6 |
| `facility_stock_items` | 2 | 2 |
| `event_domain_events` | 242 | 242 |
| pending/failed events | 188 | 188 |
| `ops_reminders` | 2 | 2 |
| `building_qr_codes` | 10 | 10 |
| `comms_conversations` | 2 | 2 |
| `comms_messages` | 0 | 0 |

No customer data change. No incident.

---

## 11. Application state

| Field | Value |
|-------|--------|
| Production app SHA | **`e56a330facf21d548815e95ff2e4c82e3c6077bd`** (unchanged) |
| Latest Production GitHub deployment | `2026-08-14T23:43:10Z` — no deploy from this package |
| Live `dpl` | `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |

No application deploy is required. This is schema/grant hardening only.

---

## 12. Success proof

| Requirement | Evidence |
|-------------|----------|
| Class B no longer anon/authenticated callable | Pre 200 → post **401/403** `42501` on identity RPCs; claimers 401/403 without queue writes |
| Class A remains available where required | Authenticated PostgREST `is_org_member` / `has_org_capability` **200**; grants retained |
| Class D client execute removed | Anon 401 and authenticated 403 on `is_pm_staff` / QR resolver |
| GoTrue login unaffected | PM, Complete/manager, tenant password grants **200** |
| `service_role` path retained | Privilege true on A/B; non-mutating resolver executed |
| Trigger runtime intact | QR trigger and `ensure_rls` still enabled |
| No incident / data change | Counts identical; probe claims 0 |

**STOP. No application deployment.**

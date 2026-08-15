# PLAT-005 PRIVILEGED RPC EXECUTE HARDENING IMPLEMENTATION CERTIFICATION

**Title:** PLAT-005 PRIVILEGED RPC EXECUTE HARDENING IMPLEMENTATION CERTIFICATION  
**Status:** IMPLEMENTED — Production apply certified in [docs/120](../120-plat-005-production-privileged-rpc-hardening-certification/index.md)  
**Date:** 2026-08-15  
**Program:** PLAT-005  
**Authority:** [docs/118](../118-plat-005-privileged-rpc-execute-hardening/index.md) Approved · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains authoritative  
**No new ADR**  
**Parent audit:** [PLAT-004](../117-plat-004-residual-remediation-design/index.md) H6 / P0  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** Grant apply is certified in [docs/120](../120-plat-005-production-privileged-rpc-hardening-certification/index.md). **No application deploy from this record.**  
**Billing / Stripe:** No changes  
**Roles / SKUs / entitlement keys:** No additions  

---

## Verdict

**READY FOR PREVIEW VERIFICATION.**

One additive successor migration encodes the approved EXECUTE matrix. Function bodies, tables, rows, roles, SKUs, billing, and Stripe are unchanged. **Do not apply this migration to Production from this record. Do not deploy.**

---

## Scope delivered

| Item | Delivery |
|------|----------|
| Successor | `supabase/migrations/20260815180000_plat_005_privileged_rpc_execute_hardening.sql` after Production ledger `20260814233536` / `ops_001_operational_workspace` |
| Class B | Six P0 functions: `REVOKE` PUBLIC / anon / authenticated; `GRANT EXECUTE` to `service_role` only |
| Class A leftovers | Twelve policy helpers: `REVOKE` PUBLIC / anon; `GRANT EXECUTE` to `authenticated`, `service_role` |
| Class A restatement | Nine already-hardened FAC/PLAT helpers: same Class A matrix, idempotent only |
| Class D | Client `EXECUTE` removed on `is_pm_staff`, `resolve_building_qr_token`, `create_building_qr_code_for_property`, `rls_auto_enable`. Functions not dropped. |
| Tests | Static contract in `apps/web/src/lib/auth/plat-005-rpc-execute.test.ts` |
| Application code | None |

---

## Constraints honored

- No application code changes
- No function body changes
- No `CREATE OR REPLACE FUNCTION`
- No table DDL
- No row changes (`INSERT` / `UPDATE` / `DELETE`)
- No finance grants
- No role / SKU / entitlement changes
- No billing / Stripe changes
- No Production apply

---

## Grant matrix implemented

| Class | Functions | PUBLIC | anon | authenticated | service_role |
|-------|-----------|:---:|:---:|:---:|:---:|
| B | `resolve_auth_user_id_by_email(text)`, `auth_resolve_login_identifier(text)`, `auth_register_username(text, uuid)`, `ops_claim_domain_events(integer, text)`, `ops_claim_due_reminders(integer, text)`, `ops_acquire_scheduler_leader(text, integer)` | — | — | — | ● |
| A leftovers | `has_org_capability`, `is_org_member`, `is_org_manager`, `is_platform_operator`, `is_maintenance_manager`, `is_maintenance_technician`, `is_lease_resident`, `is_leasing_writer`, `is_resident_writer`, `is_linked_vendor_for_work_order`, `is_work_order_resident`, `is_conversation_thread_participant` | — | — | ● | ● |
| A restated | `apply_facility_stock_movement`, `can_manage_facility_ops`, `can_select_facility_asset`, `can_select_facility_stock_item`, `can_select_work_order`, `can_access_tenant_conversation`, `is_pm_comms_staff`, `org_sku`, `org_allows_work_surface` | — | — | ● | ● |
| D | `is_pm_staff(uuid)`, `resolve_building_qr_token(text)` | — | — | — | unchanged / optional |
| D trigger | `create_building_qr_code_for_property()`, `rls_auto_enable()` | — | — | — | — |

Owner `postgres` retains execute. Trigger / event-trigger runtime still invokes as owner.

Class C remains empty. Current login (`signInWithPassword`) does not call Class B RPCs.

---

## Static validation

The migration file is the contract. Tests assert:

| Caller | Class B | Class A | Class D |
|--------|---------|---------|---------|
| Anonymous (`PUBLIC` / `anon`) | cannot execute | cannot execute | cannot execute |
| Authenticated | cannot execute | retains execute | cannot execute |
| `service_role` | can execute | can execute | no client grant on trigger pair; `is_pm_staff` / QR resolver not granted here |

Forbidden in the migration: `CREATE OR REPLACE`, table DDL, DML, role creation, finance / SKU writes.

Do **not** call `ops_claim_*` or `auth_register_username` in tests (they mutate). Live PostgREST 401 checks belong to Preview / Production-apply certification, not this package.

---

## Out of scope (unchanged)

- Function bodies and `search_path` (L7)
- `pm.finance:*` grants (N1 / PLAT-006)
- Role / SKU / entitlement keys
- Drop of `username_registry`, QR tables, or July ops claimers
- Event dispatcher / cron worker
- Username login product path
- Application deploy

---

## Next Owner step

Production grant apply is certified in [docs/120](../120-plat-005-production-privileged-rpc-hardening-certification/index.md). **Do not deploy the application from this record.** Do **not** replay `20260814160000` or `20260814200000`.

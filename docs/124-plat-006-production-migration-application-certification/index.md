# PLAT-006 SLICE A PRODUCTION MIGRATION APPLICATION CERTIFICATION

**Title:** PLAT-006 SLICE A PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** READY FOR APPLICATION DEPLOYMENT  
**Date:** 2026-08-15  
**Program:** PLAT-006 Slice A only  
**Authority:** Owner authorization to apply Slice A only · [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) Approved · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) Accepted · [docs/122](../122-plat-006-finance-reports-routing-implementation-certification/index.md) READY · [docs/123](../123-plat-006-production-migration-certification/index.md) READY FOR PRODUCTION MIGRATION APPLICATION  
**Related:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains the authorization pipeline  
**Gate:** Design → Document → Approve → Implement → Production migration certification → **Production migration application** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** Database apply of the certified Slice A file only. **No application deploy.**  

---

## Verdict

**READY FOR APPLICATION DEPLOYMENT.**

Slice A finance capability catalog and approved grants are live on Production. The Production application remains on SHA `e56a330facf21d548815e95ff2e4c82e3c6077bd`. That split is intentional.

`pm.finance:*` is now 8 capabilities / 19 grants. Legacy `financial:*` remains 6 / 15. Customer and operational row counts are unchanged.

Authenticated staff finance is **authorized** on the live app (no longer 403 at the capability step). Snapshot and command-center routes then return **400** because Production still lacks `public.financial_charges` (FIN-OPS S1 schema was never applied). That gap is outside this authorized package. Do not apply substitute SQL. Do not apply FIN-OPS table migrations from this record.

**Do not deploy Slices B or C from this record. Do not merge from this record.**

---

## What this package did not do

- Did not deploy the application
- Did not merge
- Did not modify Slice B or Slice C
- Did not modify Stripe / billing / subscriptions / SKUs
- Did not modify memberships, users, or passwords
- Did not change RLS
- Did not modify functions
- Did not remove legacy `financial:*` rows
- Did not apply any other migration
- Did not invent substitute SQL

---

## 1. Pre-apply safety check

Immediately before apply, re-read `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `list_projects`, `list_migrations`, and `execute_sql`. Target confirmed **mpa-prod**, not Preview.

| Check | docs/123 baseline | Immediate pre-apply | Result |
|-------|-------------------|---------------------|--------|
| Ledger tip | `20260815170604` / `plat_005_privileged_rpc_execute_hardening` | same | **Match** |
| `20260815190000` registered | no | no | **Match** |
| `plat_006_finance_capability_grants` registered | no | no | **Match** |
| `permission_capabilities` | 122 | 122 | **Match** |
| `role_permission_grants` | 393 | 393 | **Match** |
| `pm.finance:*` capabilities | 0 | 0 | **Match** |
| `pm.finance:*` grants | 0 | 0 | **Match** |
| `financial:*` capabilities | 6 | 6 | **Match** |
| `financial:*` grants | 15 | 15 | **Match** |
| organizations | 21 | 21 | **Match** |
| memberships / active | 31 / 29 | 31 / 29 | **Match** |
| subscriptions | 6 (PM 5, Complete 1, FO 0) | same | **Match** |

**STOP condition:** not triggered. Lineage matched docs/123.

---

## 2. Certified source and successor version

```
20260815190000
    certified source migration
    supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql

        ↓ exact SQL (SHA-256 match)

20260815175833
    Production apply version
    name: plat_006_finance_capability_grants
    repo stamp: supabase/migrations/20260815175833_plat_006_finance_capability_grants.sql
```

| Item | Value |
|------|-------|
| Certified source | `supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql` |
| Source version **not** registered on Production | `20260815190000` count = **0** |
| Production apply version | **`20260815175833`** |
| Production apply name | `plat_006_finance_capability_grants` |
| Predecessor tip (still present) | `20260815170604` / `plat_005_privileged_rpc_execute_hardening` |
| Successor check | `20260815175833` > `20260815170604` |

`apply_migration` does not accept a version argument. Production stamped `20260815175833` (same pattern as OPS-001 / docs/115). SQL was the certified file unchanged. The successor repo file is a byte-identical copy so the Production stamp is visible in git.

### Proof of exact SQL equivalence

| Artifact | SHA-256 | Bytes |
|----------|---------|------:|
| Certified source file | `aa247a8b930d60652dc31b24099cf4f22a1918d56f6dd2ca161525bffabfeb16` | 3345 |
| Successor repo file | `aa247a8b930d60652dc31b24099cf4f22a1918d56f6dd2ca161525bffabfeb16` | 3345 |
| Production `schema_migrations.statements[1]` for `20260815175833` | `aa247a8b930d60652dc31b24099cf4f22a1918d56f6dd2ca161525bffabfeb16` | 3345 (`octet_length`) |

`cardinality(statements) = 1`. No omitted statements. No added compatibility SQL.

---

## 3. Apply result

| Field | Value |
|-------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` (`mpa-prod` only) |
| Name | `plat_006_finance_capability_grants` |
| Version registered | **`20260815175833`** |
| Result | **success** |
| Timestamp (UTC) | 2026-08-15T17:58:33Z (ledger version) |
| Other migrations applied | **None** |

Ledger tip after apply:

| Version | Name |
|---------|------|
| `20260815175833` | `plat_006_finance_capability_grants` |
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |
| `20260814233536` | `ops_001_operational_workspace` |

Registered **exactly once**. `20260815190000` remains unregistered.

---

## 4. Capability validation

`permission_capabilities`: **122 → 130**.

Exactly eight canonical `pm.finance:*` keys, all namespace `pm.finance`:

| Key |
|-----|
| `pm.finance:read` |
| `pm.finance:charge.write` |
| `pm.finance:payment.refund` |
| `pm.finance:late_fee.manage` |
| `pm.finance:vendor_invoice.review` |
| `pm.finance:vendor_payment.release` |
| `pm.finance:reports.read` |
| `pm.finance:settings.manage` |

Finance-related namespaces on Production: `financial` (6) and `pm.finance` (8) only. No misspelled or duplicate finance families.

---

## 5. Grant validation

`role_permission_grants`: **393 → 412**.

`pm.finance:*` grants: **19**.

| Role | `pm.finance:*` keys | n |
|------|---------------------|--:|
| `organization_admin` | all eight | 8 |
| `property_manager` | all eight | 8 |
| `leasing_agent` | `pm.finance:read` | 1 |
| `property_owner` | `pm.finance:read`, `pm.finance:reports.read` | 2 |
| `tenant` | none | 0 |
| `vendor` | none | 0 |
| `maintenance_technician` | none | 0 |
| `facility_technician` | none | 0 |

Overrides remain **0**.

---

## 6. Legacy compatibility

`financial:*` remains exactly:

| Object | Count |
|--------|------:|
| capability keys | **6** |
| grants | **15** |

July grant matrix unchanged: admin/PM hold all six; owner `financial:read`; tenant `financial:read` + `financial:create`.

July RLS consumers unchanged: **53** policies still reference `financial:*`. **0** policies reference `pm.finance:*`. Adding `pm.finance:*` does not satisfy `has_org_capability(..., 'financial:*')`.

---

## 7. Data-safety counts

| Object | Before | After | Delta |
|--------|-------:|------:|------:|
| `organizations` | 21 | 21 | 0 |
| `organization_memberships` | 31 | 31 | 0 |
| active memberships | 29 | 29 | 0 |
| `organization_subscriptions` | 6 | 6 | 0 |
| `product_skus` | 3 | 3 | 0 |
| `maintenance_work_orders` | 32 | 32 | 0 |
| `document_documents` | 1 | 1 | 0 |
| `workspace_tables` | 7 | 7 | 0 |
| `facility_assets` | 6 | 6 | 0 |
| `facility_stock_items` | 2 | 2 | 0 |
| `comms_conversations` | 2 | 2 | 0 |
| `comms_messages` | 0 | 0 | 0 |
| `organization_permission_overrides` | 0 | 0 | 0 |

Subscriptions remain **5** `mpa_property_manager` + **1** `mpa_complete_platform` + **0** `mpa_facility_operations`. No customer or business records changed.

---

## 8. Authenticated finance validation

Existing controlled UAT credentials only. No password resets. No membership writes. Production URL `https://www.my-property-assistant.com`.

### 8.1 Live HTTP

| Caller | Routes | Status | Authorization |
|--------|--------|-------:|---------------|
| Unauthenticated | `/api/finance/snapshot` | **401** | Unauthenticated |
| Complete Clinic Demo `organization_admin` | snapshot + command-center | **400** | **Authorized** (not 401/403) |
| `uat.pm.property.demo@…` `property_manager` on PM SKU | snapshot + command-center | **400** | **Authorized** (not 401/403) |
| `uat.tenant.property.demo@…` | snapshot + command-center | **403** | Denied |
| Complete Clinic Demo `vendor` | snapshot + command-center | **403** | Denied |
| `uat.fo.property.demo@…` `facility_technician` | snapshot + command-center | **403** | Denied |

Complete and PM staff clear `requireFinancePermission` (`pm.finance:read` / `pm.finance:reports.read` + SKU `pm.financial_operations`). The 400 body is `Could not find the table 'public.financial_charges' in the schema cache` from the existing snapshot/report loaders on SHA `e56a330f`. Slice A does not create that table. HTTP **200** snapshot payload is therefore **not demonstrated** on Production.

### 8.2 Facility Operations SKU

**NOT DEMONSTRATED LIVE.** Production has **0** `mpa_facility_operations` subscriptions. No FO-only org exists. Do not invent one.

Deployed authorization pipeline (current Production SHA, unchanged by this apply) still denies FO at `pm.financial_operations` even if a role later holds `pm.finance:*` grants:

| Evidence | Result |
|----------|--------|
| `entitlementsForSku("mpa_facility_operations")` | does **not** include `pm.financial_operations` |
| `requireFinancePermission` with FO SKU + RBAC | **403** (`require-authorized-action.test.ts`) |
| `evaluateApiPathEntitlement({ pathname: "/api/finance/snapshot", sku: "mpa_facility_operations" })` | `allowed === false` |
| `modulesForSku("mpa_facility_operations")` | no `financial_operations` module |

Automated confirmation this run: `@mpa/shared` 38 passed; `@mpa/web` `require-authorized-action.test.ts` 25 passed.

Live `facility_technician` on the PM UAT org is denied at the capability step (0 `pm.finance:*` grants for that role).

---

## 9. Application state

| Field | After apply |
|-------|-------------|
| Last certified Production SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Vercel live re-read this run | **Not available** — Vercel MCP `needsAuth` |
| Slices B / C | **Not deployed** |

```
DATABASE:    PLAT-006 Slice A live (20260815175833)
APPLICATION: e56a330f still live (pre-Slices B/C)
```

The live app already gates `/api/finance/*` on `pm.finance:*` + SKU `pm.financial_operations`. Slice A unblocks the capability step without an application deploy.

---

## 10. Incident status

**None.** Apply succeeded. No rollback. No substitute SQL. No data rewrite.

Known residual (not a Slice A apply failure): Production FIN-OPS snapshot/report loaders 400 on missing `financial_charges`. Separate Owner authorization would be required to apply FIN-OPS table migrations. Not authorized here.

---

## Constraints honored

- One successor migration only
- Exact certified SQL
- No deploy
- No merge
- No billing / Stripe / SKU / role / entitlement-key changes
- No RLS / function / membership / password changes
- Legacy `financial:*` untouched
- Product Constitution unchanged

---

## Next authorized step

Slices B and C were released in [docs/125](../125-plat-006-production-release-certification/index.md). Slice A grants remain live. Do not re-apply this migration.

# PLAT-006 PRODUCTION MIGRATION CERTIFICATION

**Title:** PLAT-006 FINANCE CAPABILITY GRANTS PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION APPLICATION  
**Date:** 2026-08-15  
**Program:** PLAT-006 Slice A only  
**Authority:** [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) Approved · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) Accepted · [docs/122](../122-plat-006-finance-reports-routing-implementation-certification/index.md) READY  
**Related:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains the authorization pipeline · ADR-031 remains the trusted application mutation architecture  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** **Read-only Production analysis only.**  

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION.**

`supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql` is additive and compatible with the **actual** Production ledger, catalog, grant unique keys, July `financial:*` RLS, and live membership/SKU mix.

This record **does not apply** the migration. It **does not deploy**. It **does not merge**. It **does not authorize** substitute SQL.

**Ledger stamp:** Production tip is `20260815170604` / `plat_005_privileged_rpc_execute_hardening`. Repo version `20260815190000` is a **valid successor**. Register the **same statements** under that filename. Do not invent different SQL.

**Apply vs deploy:** Slice A is grant catalog only. The current Production app already evaluates `pm.finance:*` via `requireFinancePermission`. Applying this file unblocks N1 on the live app. Slices B and C remain application-only and are **not** authorized to deploy from this record.

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not deploy the application
- Did not merge
- Did not change Stripe / billing / SKUs / roles / entitlement keys
- Did not add features
- Did not alter July `financial:*` rows
- Did not create substitute compatibility SQL

---

## 1. Production baseline

Read 2026-08-15 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `list_migrations` and `execute_sql` only.

### 1.1 Ledger tip

Last applied: **`20260815170604` / `plat_005_privileged_rpc_execute_hardening`**.

PLAT-006 (`20260815190000`) is **not** on the Production ledger.

Recent Production lineage:

| Version | Name |
|---------|------|
| `20260814224518` | `fac_003_production_uat_remediation` |
| `20260814233536` | `ops_001_operational_workspace` |
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |

### 1.2 Production application SHA

| Field | Value |
|-------|--------|
| Last certified Production SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Git object | Confirmed on `origin` — merge of PR #219 (OPS-001) at `2026-08-14T23:42:01Z` |
| Vercel live re-read this run | **Not available** — Vercel MCP `needsAuth`. SHA is the last certified Production baseline from docs/121–122 and the Owner brief. |

That SHA already contains FIN-OPS `/api/finance/*` gated on `pm.finance:*`. It does **not** contain PLAT-006 Slices B/C.

### 1.3 Catalog and grants

| Object | Count |
|--------|-------|
| `permission_capabilities` | **122** |
| `role_permission_grants` | **393** |
| `organization_permission_overrides` | **0** |
| `organizations` | 21 |
| `organization_memberships` | 31 (29 active) |
| `organization_subscriptions` | 6 |

### 1.4 Existing `financial:*` (must remain)

Catalog (6 keys):

| Key | Description |
|-----|-------------|
| `financial:read` | Read financial records and reports |
| `financial:create` | Create rent charges, payments, and expenses |
| `financial:update` | Update financial records |
| `financial:delete` | Soft-delete financial records |
| `financial:archive` | Archive financial records |
| `financial:admin` | Elevated financial ops: refunds above threshold, billing settings |

Grants (15 rows):

| Key | Roles |
|-----|-------|
| `financial:read` | `organization_admin`, `property_manager`, `property_owner`, `tenant` |
| `financial:create` | `organization_admin`, `property_manager`, `tenant` |
| `financial:update` | `organization_admin`, `property_manager` |
| `financial:delete` | `organization_admin`, `property_manager` |
| `financial:archive` | `organization_admin`, `property_manager` |
| `financial:admin` | `organization_admin`, `property_manager` |

July table RLS still calls `has_org_capability(organization_id, 'financial:read'|create|update|delete|archive)` on `expenses`, `financial_activity`, `rent_charges`, `payments`, billing/payment tables, owner statements, and vendor invoice/payment SELECT/manage. **No policy references `pm.finance:*`.** Adding `pm.finance:*` grants does not satisfy `financial:*` lookups (`has_org_capability` matches exact key or `namespace:*` wildcard only).

### 1.5 Existing `pm.finance:*`

| Object | Count |
|--------|-------|
| `permission_capabilities` where `key like 'pm.finance:%'` | **0** |
| `role_permission_grants` where `capability_key like 'pm.finance:%'` | **0** |
| overrides on `pm.finance:*` | **0** |

Production has the N1 hole: live FIN-OPS APIs 403 at the capability step.

### 1.6 Memberships by role (active)

| Role | Active memberships |
|------|-------------------:|
| `organization_admin` | 11 |
| `property_manager` | 20 |
| `leasing_agent` | **0** |
| `property_owner` | 1 |
| `maintenance_technician` | **0** |
| `tenant` | 2 |
| `vendor` | 2 |
| `facility_technician` (legacy, not `USER_ROLES`) | 2 |

### 1.7 Subscriptions by SKU

| `sku_code` | `status` | n |
|------------|----------|---|
| `mpa_property_manager` | `active` | **5** |
| `mpa_complete_platform` | `active` | **1** |
| `mpa_facility_operations` | — | **0** |

### 1.8 Active memberships × SKU

| SKU | Role | n |
|-----|------|--:|
| `mpa_property_manager` | `organization_admin` | 2 |
| `mpa_property_manager` | `property_manager` | 3 |
| `mpa_property_manager` | `tenant` | 1 |
| `mpa_property_manager` | `facility_technician` | 1 |
| `mpa_complete_platform` | `organization_admin` | 2 |
| `mpa_complete_platform` | `property_manager` | 2 |
| `mpa_complete_platform` | `vendor` | 1 |
| `mpa_complete_platform` | `facility_technician` | 1 |
| (no subscription) | `organization_admin` | 7 |
| (no subscription) | `property_manager` | 15 |
| (no subscription) | `property_owner` | 1 |
| (no subscription) | `tenant` | 1 |
| (no subscription) | `vendor` | 1 |

No FO-only subscriber. Finance entitlement after apply is live only for the five PM orgs and the one Complete org.

### 1.9 Constraint compatibility for `ON CONFLICT`

| Table | Constraint | Migration use |
|-------|------------|---------------|
| `permission_capabilities` | PRIMARY KEY `(key)` | `ON CONFLICT (key) DO NOTHING` |
| `role_permission_grants` | UNIQUE `(role, capability_key)` | `ON CONFLICT (role, capability_key) DO NOTHING` |
| `role_permission_grants` | CHECK role in `organization_admin`, `property_manager`, `leasing_agent`, `facility_technician`, `property_owner`, `tenant`, `vendor` | Inserted roles are all allowed. `maintenance_technician` is **not** inserted (approved none). |

Columns required by the INSERT exist: `permission_capabilities(key, namespace, description)`; `role_permission_grants(role, capability_key)`.

---

## 2. Migration review

File: `supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql`

Reviewed against **actual Production**, not Preview.

### 2.1 Classification of every statement

| # | Statement | Kind | Scope |
|---|-----------|------|-------|
| 1 | `INSERT INTO permission_capabilities … ON CONFLICT (key) DO NOTHING` | Catalog insert | Eight existing `pm.finance:*` keys |
| 2 | `INSERT INTO role_permission_grants … ON CONFLICT (role, capability_key) DO NOTHING` | Grant insert | Approved matrix only (19 rows) |
| 3 | `DELETE FROM role_permission_grants WHERE capability_key = 'pm.finance:read' AND role IN ('tenant','vendor')` | Narrow revoke | S0 hole only. **No-op on Production today** (0 matching rows) |

Comments mention `financial:*` only to forbid touching those rows. There is no `DELETE`/`UPDATE` on `financial:*`.

### 2.2 Forbidden-pattern scan

| Pattern | Present? |
|---------|----------|
| Subscription / `organization_subscriptions` writes | **No** |
| SKU / `product_skus` writes | **No** |
| Customer / membership / org data writes | **No** |
| Stripe / billing | **No** |
| RLS `CREATE`/`ALTER`/`DROP POLICY` | **No** |
| Function create/replace/drop | **No** |
| Table DDL | **No** |
| `DELETE` of `financial:*` | **No** |
| Improvised compatibility SQL | **No** |

**STOP condition:** not triggered. Scope matches docs/121 §A / docs/122 Slice A.

---

## 3. Canonical key match

Compared byte-for-byte with `packages/shared/src/finance/permissions.ts` `FINANCE_CAPABILITIES`:

| Key | Source | Migration |
|-----|:------:|:---------:|
| `pm.finance:read` | ● | ● |
| `pm.finance:charge.write` | ● | ● |
| `pm.finance:payment.refund` | ● | ● |
| `pm.finance:late_fee.manage` | ● | ● |
| `pm.finance:vendor_invoice.review` | ● | ● |
| `pm.finance:vendor_payment.release` | ● | ● |
| `pm.finance:reports.read` | ● | ● |
| `pm.finance:settings.manage` | ● | ● |

No extra keys. No `financial:*` aliases. No second family.

**STOP condition:** not triggered.

---

## 4. Role grant matrix compatibility

After apply, Production `role_permission_grants` for `pm.finance:*` would be exactly:

| Role | Resulting `pm.finance:*` keys |
|------|-------------------------------|
| `organization_admin` | all eight |
| `property_manager` | all eight |
| `leasing_agent` | `pm.finance:read` only (dormant — 0 live memberships) |
| `property_owner` | `pm.finance:read`, `pm.finance:reports.read` |
| `maintenance_technician` | none (0 live memberships; not inserted) |
| `tenant` | none (DELETE is no-op; no row to remove) |
| `vendor` | none |
| `facility_technician` | none (legacy role; not in docs/121 matrix) |

July `financial:*` 15 grants remain. Overrides remain 0.

### 4.1 Who would pass the live pipeline

```
Authentication → Organization → Role → SKU entitlement pm.financial_operations → pm.finance:* → action
```

| Caller | After Slice A apply on current app |
|--------|------------------------------------|
| PM SKU + admin / property_manager (2 + 3) | **Allowed** per matrix |
| Complete + admin / property_manager (2 + 2) | **Allowed** per matrix |
| FO SKU | **N/A** — 0 FO subscriptions. If one appears later, denied at SKU even with grants |
| PM tenant (1) | **Denied** at capability (no `pm.finance:read`) |
| Complete vendor (1) | **Denied** at capability |
| `facility_technician` (2) | **Denied** at capability |
| Staff with no subscription | **Denied** at SKU entitlement |
| Owner (1, no subscription) | Grants present; staff finance still **403** at SKU. Owner route still needs entitlement + `pm.finance:reports.read` |
| Unauthenticated | JSON **401** (unchanged) |

Tenant/vendor are **not** granted `pm.finance:read`. Resident billing / checkout stay on their own routes.

---

## 5. Expected row deltas (apply-time)

| Table | Before | After | Delta |
|-------|-------:|------:|-------|
| `permission_capabilities` | 122 | 130 | **+8** `pm.finance:*` |
| `role_permission_grants` | 393 | 412 | **+19** |
| `financial:*` catalog | 6 | 6 | 0 |
| `financial:*` grants | 15 | 15 | 0 |
| tenant/vendor `pm.finance:read` | 0 | 0 | 0 (DELETE no-op) |
| subscriptions / SKUs / memberships | unchanged | unchanged | 0 |

---

## 6. Rollback

If applied and then rolled back, delete **only** PLAT-006-created rows:

```sql
delete from public.role_permission_grants
where capability_key in (
  'pm.finance:read',
  'pm.finance:charge.write',
  'pm.finance:payment.refund',
  'pm.finance:late_fee.manage',
  'pm.finance:vendor_invoice.review',
  'pm.finance:vendor_payment.release',
  'pm.finance:reports.read',
  'pm.finance:settings.manage'
)
  and role in ('organization_admin', 'property_manager', 'leasing_agent', 'property_owner');

delete from public.permission_capabilities
where key in (
  'pm.finance:read',
  'pm.finance:charge.write',
  'pm.finance:payment.refund',
  'pm.finance:late_fee.manage',
  'pm.finance:vendor_invoice.review',
  'pm.finance:vendor_payment.release',
  'pm.finance:reports.read',
  'pm.finance:settings.manage'
);
```

Do **not** delete `financial:*`. Do not write subscriptions. Rollback SQL is documentation for a later Owner apply package — **not executed here**.

---

## 7. Apply order

1. **Apply** the approved file to `mpa-prod` as `20260815190000` / `plat_006_finance_capability_grants`.
2. Do **not** deploy PLAT-006 application code from this record.
3. After apply, a separate Owner package may certify that `/api/finance/snapshot` is 200 for a controlled PM/Complete staff account.
4. Slices B/C (report shape + routing) require a later application deploy authorization.

Current Production app at `e56a330f` remains compatible: it already requires `pm.finance:*` and will begin allowing entitled staff after the catalog/grants exist.

---

## 8. Constraints honored

- No new product, SKU, role, or entitlement key
- No billing / Stripe / commercial-flow changes
- No July `financial:*` mutation
- No RLS / function / table DDL
- ADR-026 pipeline unchanged
- FAC-002 `work_surface` untouched (application; not in this SQL)
- No Production apply or deploy from this record
- No substitute SQL

---

## 9. Known apply notes (not blockers)

- `leasing_agent` grant is dormant (0 memberships)
- Legacy `facility_technician` memberships receive no `pm.finance:*` (correct)
- Tenant on a PM SKU keeps `financial:read` for July RLS and still cannot call staff `/api/finance/*`
- Vercel Production SHA was not re-fetched this run (MCP unauthenticated); treat `e56a330f` as the last certified app baseline
- Zero FO subscriptions — FO SKU-deny remains untested on live Production until an FO SKU exists (Preview-first)

---

## Next authorized step

Owner apply of **the same** `20260815190000` statements to `mpa-prod` was completed in [docs/124](../124-plat-006-production-migration-application-certification/index.md). **Do not re-apply from this record. Do not deploy from this record.**

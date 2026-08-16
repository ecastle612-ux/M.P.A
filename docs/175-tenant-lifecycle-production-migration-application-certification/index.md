# 175 — Tenant Lifecycle Production Migration Application Certification

**Title:** TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** **READY FOR TENANT LIFECYCLE APPLICATION DEPLOYMENT**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — Production schema apply  
**Authority:** Owner authorization to apply SHA `dcad8ed6…` only · [docs/174](../174-tenant-lifecycle-production-migration-recertification/index.md) **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION** · [docs/173](../173-tenant-lifecycle-sql-qualification-compatibility-implementation-certification/index.md) · [docs/172](../172-tenant-lifecycle-sql-qualification-compatibility-amendment/index.md) **Approved** · [docs/170](../170-tenant-lifecycle-financial-receipts-compatibility-amendment/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · docs/165 · docs/167 · docs/168 (obsolete SHA) · docs/169 **BLOCKED** · docs/171 **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`)  
**Certified source:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Only valid source SHA-256:** `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a`  
**Obsolete SHA-256 (must not authorize apply or replay):** `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`  
**Obsolete SHA-256 (must not authorize apply or replay):** `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844`  
**This package:** One Production apply of the certified tenant-lifecycle SQL. **No application deploy. No invitation. No binding. No move-out. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/subscription/pricing change. No native apps. No Web Push. Do not replay `20260816120000`.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Verdict

**READY FOR TENANT LIFECYCLE APPLICATION DEPLOYMENT**

The certified tenant-lifecycle SQL is live on Production under platform stamp **`20260816094933`** / `docs_166_tenant_lifecycle`. Stamp `20260816120000` was **not** registered and **must not** be replayed.

Occupancy columns are live. Backfill is 15 preserved IDs, **14 occupying / 1 moved_out**, Property Demo UAT occupying with `occupy_to` NULL, all 15 rows resolved to the intended `pm_residents`. Bindings exist and have **0** rows. Existing 14 invitations are unchanged. Receipts resident policy uses `issued_at`. Finance and document helpers use `record_timestamp`. Maintenance INSERT qualifies `maintenance_work_orders` columns. FIN-OPS money, July freeze, write-guard, Stripe execution, COM-002, work orders, documents, SKUs, and the Production application SHA are unchanged.

The Production application remains on pre-tenant-lifecycle SHA `867c579b`. That split is intentional.

**Do not deploy the tenant-lifecycle application from this record.**

---

## What this package did not do

- Did not deploy the tenant-lifecycle application
- Did not create, send, or accept a tenant invitation
- Did not create a tenant binding
- Did not move anyone out
- Did not mutate FIN-OPS money, reopen July, change `finance_ops_writes_enabled()`, or enable Stripe execution
- Did not implement M5
- Did not change SKUs, subscriptions, or pricing
- Did not implement native apps or Web Push
- Did not replay `20260816120000`
- Did not apply obsolete SHAs `4b1edb1f…` or `1c88c992…`

---

## 1. Pre-apply Production recheck

Read-only immediately before apply against `mpa-prod` / `vahnmcrpnuggxkivynvo` as `postgres`. Compared to docs/174.

| Item | Live | Gate |
|------|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | match |
| Health | `ACTIVE_HEALTHY` | match |
| Region / Postgres | us-west-2 / 17.6.1.141 | match |
| Production application SHA | `867c579bad30a5417c4cc682e90790627a55052d` (GitHub Production deployment `5928842424`, 2026-08-16T07:42:07Z; `origin/main`) | **no** tenant-lifecycle deploy |
| Ledger tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` | match |
| `20260816120000` | **absent** | match |
| Any `tenant_lifecycle` / `docs_166` stamp | **absent** | no successor yet |
| Occupancy columns / helpers / bindings | **absent** | match |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` | unchanged |
| July | `july_freeze_enabled = true` (updated 2026-08-16 07:52:09.009771+00) | frozen |
| Stripe execution | 6 `financial_module_settings` rows; `stripe_payment_execution_enabled` all false; `late_fees_enabled` all false | off |

### 1.1 Pre-apply counts (docs/174)

| Table | docs/174 | Live | Drift |
|-------|---------:|-----:|-------|
| `organizations` | 21 | 21 | none |
| `organization_memberships` | 36 | 36 | none |
| `organization_invitations` | 14 | 14 | none |
| `lease_agreements` | 15 | 15 | none |
| `lease_residents` | 15 | 15 | none |
| `pm_residents` | 15 | 15 | none |
| `property_units` | 22 | 22 | none |
| `financial_charges` | 18 | 18 | none |
| `financial_payments` | 11 | 11 | none |
| `financial_receipts` | 1 | 1 | none |
| `financial_payment_allocations` | 11 | 11 | none |
| COM-002 conversations / messages | 2 / 8 | 2 / 8 | none |
| `maintenance_work_orders` | 33 | 33 | none |
| `document_documents` | 1 | 1 | none |
| `saas_subscriptions` / `organization_subscriptions` | 4 / 6 | 4 / 6 | none |

Identity hashes matched docs/174 §1.3 exactly (orgs `58621de8…`, lease_residents `df7ee4bf…`, charges `a5a2e3ad…`, payments `2e015270…`, receipts `c1a92f1f…`, allocations `a0a83f939…`, work-order IDs `90012af5…`).

Pre-apply money fingerprints:

| Set | n | Amount total | Money hash |
|-----|--:|--------------|------------|
| charges | 18 | `24708.16` | `112cd94e6032c6ad28869da1cf5369ba` |
| payments | 11 | `11111.00` | `544da66dbfa0945b514f772504c69514` |
| receipts | 1 | `1.00` | `ee71aa549d7daec6325bb8a4b8798db8` |
| allocations | 11 | `11111.00` | `722960fea1ff681ef3f2f09fbd856800` |

Certified file SHA immediately before apply: `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a` (19,251 bytes / 599 lines). Pre-apply gate: **PASS**.

---

## 2. Certified source and Production stamp

```
20260816120000
    certified source migration
    supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql
    SHA-256 dcad8ed6…

        ↓ apply_migration name docs_166_tenant_lifecycle
        ↓ platform assigned a later stamp
        ↓ stored SQL ≡ certified SQL except two CREATE POLICY indent spaces

20260816094933
    Production apply version
    name: docs_166_tenant_lifecycle
    repo twin: supabase/migrations/20260816094933_docs_166_tenant_lifecycle.sql
```

| Item | Value |
|------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` |
| Requested name | `docs_166_tenant_lifecycle` |
| Result | **success** |
| Certified source version **not** registered | `20260816120000` count = **0** |
| Production apply version | **`20260816094933`** |
| Production apply name | `docs_166_tenant_lifecycle` |
| Predecessor tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` |
| Successor check | `20260816094933` > `20260816074525` |
| Other migrations applied | **None** |
| `cardinality(statements)` | **1** |

**Do not later replay `20260816120000`.** The objects are already live under `20260816094933`.

### 2.1 Stored SQL equivalence

| Artifact | SHA-256 | Bytes |
|----------|---------|------:|
| Certified source file `20260816120000_…sql` | `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a` | 19,251 |
| Production `schema_migrations.statements[1]` for `20260816094933` | `b5703fa1fb7af589594beb60d58931ee91e49dd38597127017be5bf34d21107a` | 19,255 |
| Repo twin `20260816094933_…sql` | `b5703fa1fb7af589594beb60d58931ee91e49dd38597127017be5bf34d21107a` | 19,255 |

The platform stamp is different from the certified filename, as authorized. The stored statement is **not** byte-identical to the certified file because the apply payload indented two `CREATE POLICY … on public.organization_invitation_tenant_bindings` lines by two spaces each (four spaces total). Reconstructing the certified file plus those four spaces yields SHA `b5703fa1…` and 19,255 bytes — exact match to Production `statements[1]` and the repo twin.

That delta is whitespace only. It does not change identifiers, predicates, helper signatures, grants, or DML. No compatibility SQL was added. No obsolete SHA was applied. Semantic equivalence to SHA `dcad8ed6…` is proven.

---

## 3. Post-apply verification

### 3.1 Occupancy and bindings

| Check | Result |
|-------|--------|
| 1. `lease_residents` still 15 rows, identical IDs | **PASS** — n=15, ID hash `df7ee4bfb2dd96f45be9dc4358b89f5b` |
| 2. Occupancy fields live | **PASS** — `pm_resident_id`, `occupancy_status` NOT NULL default `occupying`, `occupy_from` NOT NULL, `occupy_to` nullable |
| 3. Backfill 14 occupying / 1 moved_out | **PASS** — occupying 14 all `occupy_to` NULL; moved_out 1; unmatched persons 0 |
| 4. Property Demo UAT occupying, `occupy_to` NULL | **PASS** — `1275cb2e-…` / user `6cde6423-…` / person `a11ce002-…0301` / occupy_from `2026-08-14` / occupy_to NULL |
| 5. All 15 resolve to intended `pm_residents` | **PASS** — 15/15 `person_match` and `email_match` |
| 6. Bindings table exists with 0 rows | **PASS** |
| 7. Existing 14 invitations unchanged | **PASS** — n=14, ID hash `f697f696f1abb3bfb8414446f2913e63` |

Maya `c4ca99d7-…` is the single `moved_out` row (`occupy_from` 2026-08-01, `occupy_to` 2027-07-31, no `user_id`), classified from existing lease status `ended`.

### 3.2 Helpers, grants, and RLS

| Check | Result |
|-------|--------|
| 8. Occupancy helpers and execution grants | **PASS** — all certified helpers present; `authenticated` EXECUTE true; `anon` / `public` EXECUTE false |
| 9. Tenant RLS occupancy-aware | **PASS** — lease/person/occupancy SELECT uses `tenant_occupies_lease` / `tenant_occupied_lease` / `member_is_tenant_only`; COM-002 insert uses `tenant_can_write_conversation` |
| 10. Receipt policy uses `issued_at` | **PASS** — `financial_receipts_select_resident` passes `issued_at`; staff `financial_receipts_select_staff` retained |
| 11. Historical finance/document helpers use `record_timestamp` | **PASS** — `finance_resident_can_select_charge(..., record_timestamp timestamptz)` and `tenant_can_select_document(..., record_timestamp timestamptz)` |
| 12. Maintenance resident INSERT qualifies target-table columns | **PASS** — `maintenance_work_orders.requested_by_user_id`, `.resident_id`, `.organization_id`, `.property_id`, `.unit_id`; no `NEW.`; `maintenance_work_orders_select` retained |

### 3.3 UAT portal access retained

JWT-claim simulation of Property Demo tenant `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` (active membership roles `{tenant}` on org `a11ce002-…00c2`):

| Surface | Result |
|---------|--------|
| `tenant_occupies_lease` | true |
| `tenant_occupied_lease` | false |
| `member_is_tenant_only` | true |
| `is_lease_resident` / `finance_resident_owns_lease` | true |
| `tenant_can_write_conversation` / `can_access_tenant_conversation` | true on person `…0301` / lease `…0401` |
| FIN-OPS charge `f2a6d161-…` / `17.16` / `open` | `finance_resident_can_select_charge` true |
| COM-002 | both live threads remain on `…0301` / `…0401` |
| Maintenance insert predicate | current occupancy true; person `portal_status=active`; property `…0101` / unit `…0201` match lease |

| Check | Result |
|-------|--------|
| 13. Current UAT tenant retains approved portal/lease/FIN-OPS/COM-002/maintenance access | **PASS** |

### 3.4 Unchanged operational domains

| Check | Result |
|-------|--------|
| 14. FIN-OPS 18 / 11 / 1 / 11; money hashes/totals unchanged | **PASS** — same hashes and totals as §1.1 |
| 15. `finance_ops_writes_enabled()` remains true | **PASS** |
| 16. July remains frozen | **PASS** — `july_freeze_enabled = true`, `updated_at` still 2026-08-16 07:52:09.009771+00 |
| 17. Stripe execution remains false | **PASS** — 0/6 true; late fees 0/6 |
| 18. COM-002 stays 2 / 8 | **PASS** — conversation hash `aa96e902…`, message hash `b92903b2…` |
| 19. Work orders stay 33 | **PASS** — ID hash `90012af5…` |
| 20. Documents stay 1 | **PASS** — `1e9aa31d-…`, Clinic Complete org, `entity_type=organization` |
| 21. No historical row deleted | **PASS** — identity hashes for orgs, memberships, invitations, leases, residents, units, charges, payments, receipts, allocations, documents, and work-order IDs unchanged |
| 22. No SKU/subscription/pricing changes | **PASS** — saas 4 / org subs 6; saas ID hash `ac31d516…`; org-sub ID hash `6714dcac…` |
| 23. Application SHA remains pre-tenant-lifecycle | **PASS** — GitHub Production still `867c579b` (deployment `5928842424`); `origin/main` still `867c579b` |

Project health after apply remains `ACTIVE_HEALTHY`.

---

## 4. Security and release order

| Check | Result |
|-------|--------|
| Anonymous execute on new helpers | revoked |
| No new privileged mutation RPC | accept remains service-role after server checks |
| PLAT-002 | `maintenance_work_orders_select` / `can_select_work_order` not dropped |
| Staff FIN-OPS / document write | `financial_receipts_select_staff` and `document_documents_write_manager` retained |
| ADR-033 | `member_has_finance_capability` unchanged |

| Order | Safety |
|-------|--------|
| **A. schema apply (this package) → later deploy tenant-lifecycle app** | **SAFE** — required next step, not performed here |
| B. deploy occupancy-required app before this stamp | **UNSAFE** — no longer the live risk; schema is already applied |
| Apply in the same change as Stripe / M5 / July / SKU / native / Web Push | **forbidden** |

---

## 5. Next gate

This certification does **not** deploy the tenant-lifecycle application. It does **not** authorize invitations, bindings, or move-out.

**READY FOR TENANT LIFECYCLE APPLICATION DEPLOYMENT**

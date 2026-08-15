# 131 — ADR-033 SLICE D DATA-PLANE IMPLEMENTATION CERTIFICATION

**Title:** ADR-033 COMPLETE DELEGATED OPERATIONS — SLICE D DATA-PLANE IMPLEMENTATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION CERTIFICATION  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Authority:** [docs/130](../130-complete-delegated-operations-dataplane-scope/index.md) **Approved** · [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · [docs/129](../129-complete-delegated-operations-production-migration-application/index.md)  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** In-repo successor migration + contract tests + this certification. **No Production apply. No deploy. No operating_scope assignment. No FIN-OPS.**

---

## Verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION.**

Slice D remainder is implemented exactly as designed in docs/130 §6 + §7 + §13. The successor is in the repo only. Production still ends at `20260815185722` / `adr_033_member_operating_scope`. The Production application remains pre-ADR-033.

**Do not apply `20260815210000` / `adr_033_dataplane_member_scope` to Production from this record.**  
**Do not replay `20260815200000` / `adr_033_member_operating_scope` (duplicate of the live stamp).**  
**Do not deploy the ADR-033 application.**  
**Do not assign Sarah / Mike / Erick operating scopes.**  
**Do not implement FIN-OPS.**

---

## What this package did not do

- Did not call `apply_migration` or write Production
- Did not deploy
- Did not assign `operating_scope`
- Did not create Sarah / Mike / Erick memberships
- Did not implement or remediate docs/126
- Did not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Did not change Stripe, SKUs, subscriptions, or prices
- Did not rewrite FAC-003 asset / stock policies
- Did not AND member scope into `has_org_capability` FAC-001/002 tables
- Did not create a new ADR or amend ADR-033
- Did not weaken `can_manage_facility_ops` to org-member, role-only, SKU-only, or `USING (true)`

---

## Production baseline (unchanged by this package)

Read-only facts from docs/129. This package did not re-query or write Production.

| Layer | Value |
|-------|--------|
| App SHA | `44d50bf178b89842494671060852891087eed200` |
| Ledger tip | `20260815185722` / `adr_033_member_operating_scope` |
| Certified first-ADR-033 source (do not apply) | `20260815200000` / `adr_033_member_operating_scope` |
| Stored `operating_scope` | all NULL |
| This successor | repo-only `20260815210000` — **not applied** |

---

## Scope delivered

| Designed item (docs/130) | Delivery |
|--------------------------|----------|
| §6 `can_manage_facility_ops` | `CREATE OR REPLACE` — manager ∧ SKU facility ∧ member facility |
| §7.1 WO manager ALL | `DROP` / `CREATE` `maintenance_work_orders_manage_manager` |
| §7.2 Tech UPDATE | `DROP` / `CREATE` `maintenance_work_orders_update_technician` — assignment kept |
| §7.3 Updates INSERT | `DROP` / `CREATE` `maintenance_updates_insert` — staff AND `can_select_work_order` |
| §8 / §9 FAC-003 | inherit helper; no policy rewrite |
| §13 matrix | `apps/web/src/lib/auth/adr-033-dataplane-rls.test.ts` |
| FAC-001/002 capability tables | **not** included |
| Vendors / MEDIA-001 / OPS-001 chrome | **not** included |

---

## Migration

**File:** `supabase/migrations/20260815210000_adr_033_dataplane_member_scope.sql`

| Field | Value |
|-------|--------|
| Repo stamp | `20260815210000` |
| Name | `adr_033_dataplane_member_scope` |
| Predecessor (live) | `20260815185722` / `adr_033_member_operating_scope` |
| Successor check | `20260815210000` > `20260815185722` and > certified source `20260815200000` |
| SHA-256 | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |
| Kind | Additive `CREATE OR REPLACE FUNCTION` + three `DROP POLICY` / `CREATE POLICY` |
| Destructive DDL | none |
| Customer-row rewrite | none |

Predecessor pair `20260815185722` and `20260815200000` remain byte-identical (`dbb4abdbdd8db103a6860f32e88d9ecff2012d23ba101617fac20252112f52b1`). This successor does not replay that SQL.

### Exact statements

1. `CREATE OR REPLACE FUNCTION public.can_manage_facility_ops(uuid)`  
   Body: `is_maintenance_manager` AND `org_allows_work_surface(..., 'facility')` AND `member_allows_work_surface(..., 'facility')`.  
   `SECURITY DEFINER`, `search_path = public`.  
   `REVOKE ALL` from `public`, `anon`. `GRANT EXECUTE` to `authenticated`.
2. `DROP POLICY IF EXISTS` / `CREATE POLICY` `maintenance_work_orders_manage_manager`  
   `USING` / `WITH CHECK`: manager AND `org_allows_work_surface(organization_id, work_surface)` AND `member_allows_work_surface(organization_id, work_surface)`.
3. `DROP POLICY IF EXISTS` / `CREATE POLICY` `maintenance_work_orders_update_technician`  
   `USING` / `WITH CHECK`: technician AND SKU surface AND member surface AND `technician_user_id = auth.uid()`.
4. `DROP POLICY IF EXISTS` / `CREATE POLICY` `maintenance_updates_insert`  
   `WITH CHECK`: staff (`is_maintenance_manager` OR `is_maintenance_technician`) AND `can_select_work_order(work_order_id)`, OR resident, OR linked vendor.

No other objects.

---

## Access matrix (certified in tests)

SKU remains the outer bound. Stored BOTH on PM / FO cannot expand past the SKU.

| Case | Residential manager mutate | Facility manager mutate | `can_manage_facility_ops` |
|------|:--------------------------:|:-----------------------:|:-------------------------:|
| PM × any stored scope | Y | N | N |
| FO × any stored scope | N | Y | Y |
| Complete PROPERTY (Sarah) | Y | **N** | **N** |
| Complete FACILITY (Mike) | **N** | Y | Y |
| Complete BOTH (Erick) | Y | Y | Y |
| Complete NULL | Y | Y | Y |

Also certified:

- Assigned technician UPDATE requires matching member scope **and** assignment
- Portal resident / vendor are not managers
- Migration does not assign scopes, rewrite FAC-003 policies, or touch FIN-OPS
- Helper execute remains `authenticated` only
- Forbidden shapes (`is_org_member`, `USING (true)`) are absent

FAC-003 asset / stock / movement RPC inherit the helper after a later apply. Movement client INSERT remains `WITH CHECK (false)`.

---

## Split-state safety (unchanged)

```
DATABASE:    ADR-033 live (20260815185722); this successor not applied
APPLICATION: pre-ADR-033 SHA 44d50bf1
Stored scopes: all NULL
```

If this successor is later applied while the current application remains live, Complete NULL staff stay BOTH. `can_manage_facility_ops` stays true for Complete NULL managers. **Schema-before-app remains SAFE.** Do not assign Sarah / Mike before this successor if the goal is full data-plane isolation.

---

## Automated test evidence

| Suite | Result |
|-------|--------|
| `@mpa/web` `src/lib/auth/adr-033-dataplane-rls.test.ts` | **1 file / 23 tests passed** |
| `@mpa/web` `src/lib/auth/fac-003-rls.test.ts` (unchanged historical contract) | **passed** with the new file (**2 files / 30 tests**) |

Coverage:

- Successor stamp after `20260815185722` and `20260815200000`
- Helper conjuncts + revoke/grant
- Three designed policy replacements only
- No FAC-003 rewrite, no scope assignment, no FIN-OPS, no `DELETE` / `DROP TABLE`
- Does not replay the first ADR-033 table
- PM / FO / Complete × stored scopes
- Sarah / Mike / Erick / Complete NULL
- Technician assignment + surface
- Portal non-managers

These are local file-contract and boolean-matrix tests. They do not impersonate Production JWTs and do not write customer rows.

---

## Confirmations

| Check | Result |
|-------|--------|
| docs/130 Approved | **yes** — Owner `APPROVE docs/130` 2026-08-15 |
| Implemented only §6 + §7 + §13 | **yes** |
| FAC-001/002 `has_org_capability('facility:*')` tables | **not** rewritten |
| New ADR / ADR-033 amendment | **none** |
| Subscription / SKU / Stripe / billing writes | **none** |
| FIN-OPS / `financial_*` / S0–S2 replay | **none** |
| Production migration apply | **not performed** |
| Production deploy | **not performed** |
| Operating-scope assignment | **not performed** |

---

## FIN-OPS

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

This package does not create `financial_charges`, replay S0/S1/S2, or touch July `financial_activity`. Final FIN-OPS reconciliation still depends on the completed ADR-033 boundary after a later Owner-authorized apply **and** application deploy.

---

## Next authorized step

Read-only Production certification completed in [docs/132](../132-complete-delegated-operations-dataplane-production-migration-certification/index.md). Apply completed in [docs/133](../133-complete-delegated-operations-dataplane-production-migration-application/index.md) (**READY FOR ADR-033 APPLICATION DEPLOYMENT**). Do not apply `20260815210000` from this record. Do not deploy from this record.

From this record:

- Do **not** apply `20260815210000`
- Do **not** apply `20260815200000`
- Do **not** deploy
- Do **not** assign operating scopes
- Do **not** implement FIN-OPS

**STOP after this implementation certification.**

---

## Constraints honored

- Product Constitution: three products; Complete remains one subscription
- Implementation Gate: docs/130 Approved; implement only the designed successor
- No Production write
- No FIN-OPS
- No Stripe / SKU / subscription change
- No `USING (true)` / org-member fallback
- Resident, assigned technician, and assigned vendor paths preserved

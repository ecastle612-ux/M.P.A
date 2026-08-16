# 160 — FIN-OPS Production Reconciliation M3 Production Application Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M3 PRODUCTION APPLICATION CERTIFICATION  
**Status:** **READY FOR M4 APPLICATION CUTOVER DESIGN**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M3B then M3A apply  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/158](../158-fin-ops-production-reconciliation-m3-implementation-certification/index.md) · [docs/159](../159-fin-ops-production-reconciliation-m3-production-migration-certification/index.md) **READY FOR M3 PRODUCTION APPLICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2)  
**This package:** Production application of **M3B then M3A only**. **No write-guard enable. No M4. No M5. No July reopen. No money mutation.**

---

## Verdict

**READY FOR M4 APPLICATION CUTOVER DESIGN**

M3B and M3A are live on Production. July is read-only. FIN-OPS SELECT is enabled by RLS. FIN-OPS writes remain guarded off. The current application SHA is unchanged. No customer FIN-OPS write succeeded. The point of no return has **not** been crossed.

Post-M3 state:

| Surface | State |
|---------|-------|
| July | **READ-ONLY** (`finance_july_frozen` + privilege revoke) |
| FIN-OPS | **SELECT ENABLED BY RLS** · **WRITES GUARDED OFF** (`finance_ops_writes_enabled() = false`) |
| Application | SHA `50204033bae59ff5f71cb76609b89a7f300545a2` **unchanged** |

---

## What this package did not do

- Did not call `finance_ops_writes_set(true)`
- Did not enable FIN-OPS customer writes
- Did not deploy M4 or change application finance write paths
- Did not implement M5
- Did not reopen, drop, archive, truncate, or rewrite July
- Did not replay S0 / S1 / S2
- Did not change Stripe, SaaS billing, subscriptions, SKUs, prices, roles, entitlements, or ADR-033 scopes
- Did not invent customer finance fixtures for resident UAT

---

## 1. Final pre-M3 reconciliation

Recomputed live immediately before M3B at `2026-08-16T06:42:54Z`. Not reused from docs/159.

| Measure | July | FIN-OPS | Required | Result |
|---------|------|---------|----------|--------|
| Charges | 17 / `24691` | 17 / `24691` | 17 / `24691.00` | match |
| Paid | `11111` | `11111` | `11111.00` | match |
| Payments | 11 | 11 | 11 | match |
| Allocations | — | 11 | 11 | match |
| Outstanding | `13580` | `13580` | `13580.00` | match |
| Vendor AP | `125.5` | `125.5` | `125.50` | match |

| Organization | Charges / gross / paid / outstanding |
|--------------|--------------------------------------|
| Canopy | 4 / `4951.00` / `1651.00` / `3300.00` |
| PMX | 1 / `1500.00` / `500.00` / `1000.00` |
| Development | 12 / `18240.00` / `8960.00` / `9280.00` |

`finance_m2_reconcile()` agreed. No unexplained drift. Gate: **PASS — apply M3B authorized**.

---

## 2. Pre-apply security baseline

| Item | Live immediately before M3B |
|------|-----------------------------|
| App SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (GitHub Production 2026-08-15T22:28:34Z) |
| Ledger tip | `20260816060336` / `docs_152_fin_ops_m2d_development_identity_repair` |
| M3B / M3A stamps | **absent** |
| `finance_ops_writes_enabled()` | **absent** |
| `finance_m3_assert_preflight()` | **absent** |
| July | writable — `anon` / `authenticated` / `service_role` had INSERT/UPDATE/DELETE on `rent_charges` |
| July freeze triggers | **0** |
| FIN-OPS | fail-closed — RLS on, **0** policies on `financial_charges`, no `anon`/`authenticated` grants; `service_role` ALL |
| `finance_m2_version()` | `20260816020000` |
| `finance_m2d_version()` | `docs_152_m2d_owner_unit_map` |
| Lineage | 155 rows (28 M2D) |
| Canopy / PMX / Development SKU | **NULL** |

July hashes matched docs/159:

| Table | n | Hash |
|-------|--:|------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` |
| `financial_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` |
| `financial_payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `finance_lineage_map` | 155 | `8dc5e5378b9376e9c2bcc9323c798913` |

---

## 3. M3B source

Certified file: `supabase/migrations/20260816070000_docs_157_fin_ops_reconciliation_m3b.sql`

| Item | Value |
|------|-------|
| SHA-256 | `6548c2037ab808a85b854aee8ce05c325e69cdccd4bc0e21ba5add26d16a1f37` |
| Installs | `finance_ops_writes_enabled` / guard machinery; default **false**; `finance_july_frozen`; `finance_m3_preflight` / `finance_m3_assert_preflight` |
| Does not | enable FIN-OPS writes; move money; alter M2/M2D rows; apply M3A; deploy M4 |

Source SHA re-verified immediately before apply. **No source drift.**

---

## 4. Actual M3B stamp and SQL equivalence

Production assigned a different stamp than the repo source.

| Item | Value |
|------|-------|
| Certified repo stamp | `20260816070000` — **do not replay** |
| Production stamp | **`20260816064447`** / `docs_157_fin_ops_reconciliation_m3b` |
| `cardinality(statements)` | 1 |
| Production stored SHA-256 | `6548c2037ab808a85b854aee8ce05c325e69cdccd4bc0e21ba5add26d16a1f37` |
| Successor repo file | `supabase/migrations/20260816064447_docs_157_fin_ops_reconciliation_m3b.sql` |

Stored SQL SHA-256 equals the certified source. Equivalence: **PASS**.

After apply: `finance_ops_writes_enabled() = false`, `july_freeze_enabled = true`, 15 FIN-OPS write-guard triggers, 17 July freeze triggers. Setter EXECUTE is `postgres` + `service_role` only.

---

## 5. Write-guard validation

`finance_ops_writes_enabled() = false` immediately after M3B and still false after M3A.

No Production path in this package set it true. Authenticated `finance_ops_writes_set(true)` raised `permission denied for function finance_ops_writes_set`.

Trusted / `service_role`-equivalent writes (superuser session; trigger still fires):

| Probe | Outcome |
|-------|---------|
| `financial_charges` INSERT | `finance_ops_writes_frozen` |
| `financial_charges` UPDATE | `finance_ops_writes_frozen` |
| `financial_payments` INSERT | `finance_ops_writes_frozen` |
| `financial_stripe_webhook_events` INSERT | `finance_ops_writes_frozen` |
| `financial_vendor_invoices` UPDATE | `finance_ops_writes_frozen` |
| `financial_vendor_payments` UPDATE | `finance_ops_writes_frozen` |

Authenticated PostgREST-equivalent (`SET ROLE authenticated`): `permission denied for table financial_charges`.

Guard was **not** weakened for testing. Maintenance GUC was **not** set.

---

## 6. July freeze validation

Authenticated / anon INSERT/UPDATE/DELETE privileges revoked on the full freeze inventory. Write policies dropped (`july_write_policies = null`). SELECT of historical `rent_charges` still returns 17.

Trusted-path outcomes:

| Probe | Outcome |
|-------|---------|
| `rent_charges` INSERT | `finance_july_frozen` |
| `rent_charges` UPDATE | `finance_july_frozen` |
| `rent_charges` DELETE (real row; rolled back by exception) | `finance_july_frozen` |
| `payments` INSERT / UPDATE | `finance_july_frozen` |
| `payment_receipts` UPDATE | `finance_july_frozen` |
| `payment_customers` UPDATE | `finance_july_frozen` |
| `billing_ledger_entries` UPDATE | `finance_july_frozen` |
| `financial_activity` UPDATE | `finance_july_frozen` |
| `expenses` UPDATE | `finance_july_frozen` |
| `owner_statements` UPDATE | `finance_july_frozen` |
| `vendor_invoices` UPDATE | `finance_july_frozen` |
| `vendor_payments` UPDATE | `finance_july_frozen` |

Empty certified siblings (`payment_attempts`, `payment_methods`, `late_fees`, `billing_schedules`, `billing_invoices`, `billing_adjustments`, `autopay_enrollments`) each have `finance_july_write_guard` attached and authenticated write privileges revoked.

Authenticated path: `permission denied for table rent_charges`.

`saas_invoices` remains writable for authenticated (SaaS billing; out of freeze inventory). Historical July reads remain as designed. No historical money row changed.

---

## 7. Reconciliation after freeze

Recomputed after M3B, before M3A. Totals and hashes identical to the final pre-M3 baseline.

`finance_m2_reconcile()` still agrees. Freeze did **not** change money or source rows. **Not an incident.**

---

## 8. `finance_m3_assert_preflight()`

```sql
select public.finance_m3_assert_preflight();
```

Result: **`ready: true`**, `blockers: []`. Returned July / FIN-OPS / Canopy / PMX / Development totals match the certified expected money. Did **not** raise `finance_m3_reconciliation_drift`. Gate: **PASS — apply M3A authorized**.

---

## 9. M3A source

Certified file: `supabase/migrations/20260816070100_docs_157_fin_ops_reconciliation_m3a.sql`

| Item | Value |
|------|-------|
| SHA-256 | `6ec6bb702e880dd06e06b368749131cfce863867a1c4b2a38233814eb79b5e00` |
| Contains | `member_has_finance_capability`, `finance_resident_owns_lease`, 21 SELECT-only policies, approved SELECT grants / webhook+lineage revokes |
| Does not contain | authenticated INSERT/UPDATE/DELETE policies; write-guard enable; M4 write policy; July unfreeze |

Source SHA re-verified immediately before apply. **No source drift.**

---

## 10. Actual M3A stamp and SQL equivalence

| Item | Value |
|------|-------|
| Certified repo stamp | `20260816070100` — **do not replay** |
| Production stamp | **`20260816064707`** / `docs_157_fin_ops_reconciliation_m3a` |
| `cardinality(statements)` | 1 |
| Production stored SHA-256 | `6ec6bb702e880dd06e06b368749131cfce863867a1c4b2a38233814eb79b5e00` |
| Successor repo file | `supabase/migrations/20260816064707_docs_157_fin_ops_reconciliation_m3a.sql` |

Stored SQL SHA-256 equals the certified source. Equivalence: **PASS**. Nothing else was applied.

Live policies after M3A: **21 SELECT-only** policies — every `create policy` in the certified M3A file. Webhook and lineage have **no** policies and **no** authenticated grants. `write_policies = 0`. Authenticated grants are **SELECT only** on the 14 customer-visible tables.

---

## 11. Staff finance UAT

UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` is Complete. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` is PM. Proved with `SET ROLE authenticated` + JWT `sub`.

| Persona | Live user | `has_org_capability(pm.finance:read)` | `member_has_finance_capability` | Direct RLS | Writes |
|---------|-----------|--------------------------------------|---------------------------------|------------|--------|
| **Erick** — Complete + both + `organization_admin` | `3e81e139-…` | **true** | **true** | Clinic connect/settings **1**; charges **0** (Clinic has no money); Canopy/PMX/Development **0** | `permission denied` |
| **Sarah** — Complete + `property_operations` + `property_manager` | `c1616e08-…` | **true** | **true** | same Clinic SELECT allow | `permission denied` |
| **Mike** — Complete + `facility_operations` + `property_manager` | `a1f4c2c7-…` | **true** | **false** | **0** on every FIN-OPS table including connect/settings | `permission denied` |
| **PM SKU manager** | `0e1fc6e4-…` on Property Demo | **true** | **true** | Property Demo connect/settings **1**; charges **0** | `permission denied` |
| **FO** | no live FO subscriber | — | — | **denied** — helper/SQL only; `fo_subs = []` | — |
| Vendor | `efd879ed-…` | false | false | **0** | `permission denied` |
| Tenant | `6cde6423-…` | false | false | **0** | `permission denied` |
| Anon | `SET ROLE anon` | — | — | `permission denied for table financial_charges` | — |
| Authenticated non-member | `00000000-…0099` | false | false | **0** | — |

### Critical Mike proof

```
has_org_capability('pm.finance:read') = true
AND member_allows_work_surface(residential) = false
AND member_has_finance_capability(...) = false
AND SELECT financial_charges / connect / settings / vendor AP = 0
```

Mike does **not** inherit Complete + FACILITY PM finance.

---

## 12. Resident access UAT

Live Production still cannot prove a known-row case:

| Fact | Live after M3 |
|------|----------------|
| `lease_residents.user_id` not null | **1** (UAT Property Demo) |
| `pm_residents.user_id` not null | **1** |
| FIN-OPS charges on a linked lease | **0** |
| Canopy / PMX / Development resident `user_id` | **all null** |

**NOT DEMONSTRATED LIVE — AUTOMATED/RLS CONTRACT PASS**

Policies installed: own-lease SELECT on charges / payments / allocations / receipts / schedules / ledger (`charge|payment|allocation` only). No resident INSERT/UPDATE/DELETE. No customer finance fixtures were invented.

---

## 13. Table-by-table SELECT validation

| Table | Erick (Complete / both) | Mike (Complete / FACILITY) | SKU-denied org staff | Vendor / tenant / non-member | Anon | Writes |
|-------|-------------------------|----------------------------|----------------------|------------------------------|------|--------|
| `financial_connect_accounts` | 1 Clinic | 0 | 0 on migrated org | 0 | denied | denied |
| `financial_module_settings` | 1 Clinic | 0 | 0 on migrated org | 0 | denied | denied |
| `financial_charge_schedules` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_charges` | 0 Clinic / 0 migrated | 0 | **0** (Canopy 4 / PMX 1 / Dev 12 exist) | 0 | denied | denied |
| `financial_payments` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_payment_allocations` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_ledger_entries` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_receipts` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_stripe_webhook_events` | `permission denied` | `permission denied` | `permission denied` | `permission denied` | denied | guarded |
| `financial_notifications` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_late_fee_policies` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_delinquency_cases` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_payment_arrangements` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_vendor_invoices` | 0 | 0 | 0 | 0 | denied | denied |
| `financial_vendor_payments` | 0 | 0 | 0 | 0 | denied | denied |
| `finance_lineage_map` | `permission denied` | `permission denied` | `permission denied` | `permission denied` | denied | no client grant |

No generic org-member policy. Staff predicate is only `member_has_finance_capability`. Empty Clinic charge counts are honest empty, not Canopy/Development proof.

---

## 14. Application split-state UAT

Current Production application remains SHA `50204033bae59ff5f71cb76609b89a7f300545a2`. No finance write path was modified. No M4 deploy.

Classification after M3 (SQL-proven; current app already queries `financial_*`, not July):

| Class | Routes | Proof |
|-------|--------|-------|
| **READ SAFE** | snapshot, charge GET, payment GET, reports, vendor GET, collections GET, resident billing where approved | SELECT policies + helper; empty UAT Clinic totals are not Canopy/Development money |
| **WRITE GUARDED** | charge POST, payment POST, checkout, vendor POST, collections POST, reminders, FIN-OPS Stripe webhook | `finance_ops_writes_frozen` on trusted insert; authenticated privilege deny |
| **M4 REQUIRED** | checkout manager branch still role-only (`property_manager` / `organization_admin`), not ADR-033 | insert is still trigger-guarded; do not treat as a bypass |
| **DENIED** | `/api/commerce/webhooks/stripe` | SaaS — out of scope |

No route successfully wrote July or FIN-OPS. Empty zeros were not treated as success for migrated orgs; operator totals remain 4 / 1 / 12.

---

## 15. SKU-denied migrated orgs

Canopy, PMX, and Development still have **no** `organization_subscriptions` row. `org_sku()` is **NULL**. `org_allows_work_surface(residential)` is **NULL**. Subscriptions remain **6**. No SKU was attached.

| Org staff | `has_org_capability(read)` | helper | Visible migrated charges |
|-----------|----------------------------|--------|--------------------------|
| Canopy `property_manager` `bbc4cffa-…` | true | **false** | **0** of 4 |
| PMX `property_manager` `a52c389a-…` | true | **false** | **0** of 1 |
| Development admin `f68545ab-…` | true | **false** | **0** of 12 |

Canopy staff also belongs to UAT Clinic (Complete). The 1 connect/settings row they can see is **Clinic**, not Canopy. Canopy helper for `pm.finance:read` and `pm.finance:settings.manage` is **false**.

M3 did not expose migrated money merely because finance rows exist.

---

## 16. Data-safety comparison

Business rows unchanged after M3B + M3A. Hashes identical to the pre-M3 baseline.

| Object | Before | After |
|--------|--------|-------|
| July money hashes | docs/159 / pre-M3 §2 | **identical** |
| FIN-OPS money | 17 / 11 / 11 / 1 receipt / 1 vendor invoice / 1 vendor payment / 41 ledger | **identical** |
| `finance_lineage_map` | 155 (28 M2D) | **identical** |
| `property_units` | 22 | 22 |
| leases / lease_residents / pm_residents | 15 / 15 / 15 | 15 / 15 / 15 |
| organizations / memberships / subscriptions | 21 / 36 / 6 | 21 / 36 / 6 |
| Canopy / PMX / Development SKU | NULL | NULL |
| `finance_m2_version()` / `finance_m2d_version()` | unchanged | unchanged |
| App SHA | `50204033…` | `50204033…` |
| Stripe / SaaS / ADR-033 / FAC-003 / COM-002 / OPS-001 | not mutated | not mutated |

M3 altered security/schema state only: cutover flags, freeze/guard triggers, SELECT helpers/policies/grants.

---

## 17. Rollback boundary

No successful customer FIN-OPS write occurred. **The point of no return has not been crossed.**

If M3 needs rollback before M4:

- M3A SELECT policies and authenticated SELECT grants may be removed (return to M1 fail-closed).
- July may be reopened **only after** proving July and FIN-OPS still reconcile and `finance_ops_writes_enabled()` never flipped.
- Do **not** automatically reopen July.
- Do **not** delete FIN-OPS, M2/M2D, Option B, or July history.
- Do **not** replay unused stamps `20260816070000` / `20260816070100` if equivalent SQL is already live as `20260816064447` / `20260816064707`.
- Do **not** replay S0 / S1 / S2.

Exact rollback state now: July frozen; FIN-OPS SELECT on; writes guarded off; money hashes unchanged.

---

## 18. M4 remains blocked

`finance_ops_writes_enabled() = false`. `finance_ops_cutover_state.writes_enabled = false` (set at `2026-08-16T06:44:47Z`, never flipped).

Do **not** call `finance_ops_writes_set(true)`. Do **not** deploy M4. Do **not** enable FIN-OPS customer writes.

M4 remains a separate Design → Document → Approve package.

---

## 19. Incident status

**None.** Pre-M3 money matched. Freeze did not move money. Assert returned READY. M3A did not move money. Guard never enabled.

---

## FINAL VERDICT

**READY FOR M4 APPLICATION CUTOVER DESIGN**

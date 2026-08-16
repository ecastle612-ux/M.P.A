# 141 — FIN-OPS Production Reconciliation M1 Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M1 IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR PRODUCTION MIGRATION CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — slice M1 only  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted**  
**Related:** [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/25](../25-fin-ops-001/index.md) · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · PLAT-006  
**Gate:** Design → Document → Approve → **Implement (M1)**  
**Production:** **No Production migration apply. No Production deploy. No July data movement. No M2–M5.**  
**Billing / Stripe / SKUs / subscriptions / roles / entitlement keys:** No changes

---

## Verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION**

M1 adds one Production-compatible successor migration that creates the **empty** August `financial_*` schema the live application already queries, plus `finance_lineage_map` for later M2. It does **not** replay S0/S1/S2. It does **not** backfill July rows. It does **not** apply to Production.

---

## What this package did not do

- Did not apply SQL to `mpa-prod`
- Did not implement M2 / M3 / M4 / M5
- Did not move, update, delete, or truncate July finance rows
- Did not seed Connect accounts or module-settings rows
- Did not change Stripe products, prices, Checkout, or SaaS webhooks
- Did not change subscriptions, SKUs, roles, or `pm.finance:*` grants
- Did not replace ADR-033 helpers or PLAT-005 RPC hardening
- Did not change application finance behavior

---

## Migration filename

`supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql`

Successor after the live Production tip **`20260815222252` / `docs_135_invitation_acceptance_remediation`**.

Do **not** apply `20260806030000` / `40000` / `50000`. Do **not** apply unused stamps `20260815200000` / `20260815210000` / `20260815220000`.

---

## Schema objects created

| Object | Role |
|--------|------|
| `financial_connect_accounts` | Connect linkage; default `not_started`; no Stripe account id |
| `financial_module_settings` | Safe column defaults; no org rows |
| `financial_charge_schedules` | Recurring generators |
| `financial_charges` | Includes S2 `late_fee_assessed_at` / `source_charge_id` |
| `financial_payments` | Unique Stripe session index when present |
| `financial_payment_allocations` | Unique `(payment_id, charge_id)` |
| `financial_ledger_entries` | Future authoritative ledger; unique `(organization_id, idempotency_key)` |
| `financial_receipts` | Unique per payment |
| `financial_stripe_webhook_events` | Future-event inbox; unique `stripe_event_id` |
| `financial_notifications` | Resident/staff notices |
| `financial_late_fee_policies` | Empty; assessment remains off |
| `financial_delinquency_cases` | Empty |
| `financial_payment_arrangements` | Empty |
| `financial_vendor_invoices` | FK to live `vendor_vendors` |
| `financial_vendor_payments` | FK to live `vendor_vendors` |
| `finance_lineage_map` | M2 provenance; unique `(source_table, source_id, target_table)` |

All operational tables begin **empty**. No July rows are inserted.

---

## Source migrations referenced / extracted from

Object shapes were extracted from, **not replayed**:

| Historic file | Extracted |
|---------------|-----------|
| `20260806030000_fin_ops_001_s0_foundation.sql` | Connect + module settings columns |
| `20260806040000_fin_ops_001_s1_resident_billing.sql` | Charge/payment/ledger/receipt/webhook/notification tables |
| `20260806050000_fin_ops_001_s2_delinquency_vendor_ap.sql` | Late-fee / delinquency / arrangement / vendor AP tables + charge late-fee columns |

---

## Production-lineage differences from S0/S1/S2

| S0/S1/S2 behavior | M1 |
|-------------------|----|
| CREATE property/lease scaffolding | **Omitted** — live `property_properties`, `property_units`, `lease_agreements`, `lease_residents` |
| CREATE `vendor_vendors` | **Omitted** — live vendor identity |
| CREATE `event_domain_events` / `audit_events` | **Omitted** — live OPS-001 objects |
| REPLACE `is_org_member` / `is_org_manager` / `is_lease_resident` | **Omitted** |
| Insert `pm.finance:*` catalog + tenant/vendor `read` | **Omitted** — PLAT-006 is live |
| S1/S2 `is_org_manager` / `is_org_member` policies | **Omitted** — M3 |
| S1 default `stripe_payment_execution_enabled = true` | **false** |
| S2 default late-fees / vendor flags true | **false** (late fees and vendor AP flags) |
| Backfill / dual-write | **None** |

---

## Objects intentionally omitted

- `property_properties`, `property_units`, `lease_agreements`, `lease_residents`, `pm_residents`
- `vendor_vendors`
- `event_domain_events`, `audit_events`
- July tables (`rent_charges`, `payments`, `expenses`, `owner_statements`, `financial_activity`, `billing_ledger_entries`, `vendor_invoices`, `vendor_payments`)
- Permission / grant rows
- ADR-033 functions
- SaaS billing objects

---

## RLS posture

M1 enables RLS on every new table and creates **zero** policies.

- `REVOKE ALL` from `public`, `anon`, and `authenticated` when those roles exist
- `GRANT ALL` to `service_role` when that role exists
- No org-member blanket policies
- No tenant/vendor staff-finance access
- No `is_org_manager` finance policies

This is fail-closed until M3 adds `pm.finance:*` ∩ member operating scope. Staff APIs remain authorization-gated in Next.js (ADR-033). After a later Production apply of M1, missing-table 400s become empty/denied table access until M3/M4.

---

## ADR-033 compatibility

M1 does not create SKU-only Complete finance access. It does not replace `member_operating_scope` or `member_allows_work_surface`. Facility-scoped Complete remains denied at `requireFinancePermission` / `entitlementsForMember`. Full table-policy intersection is M3.

---

## PLAT-006 compatibility

M1 does not insert or delete `permission_capabilities` or `role_permission_grants`. Live `pm.finance:*` catalog and the approved role matrix stay as PLAT-006 left them. Tenant/vendor `pm.finance:read` is not reintroduced.

---

## Stripe isolation

- FO inbox is `financial_stripe_webhook_events` with unique `stripe_event_id`
- No historical webhook replay
- No payment rows created by M1
- `/api/commerce/webhooks/stripe` untouched
- Connect rows are not seeded; column default is `not_started`
- `stripe_payment_execution_enabled` defaults **false**

---

## Module defaults

Column defaults only. **No organization rows.**

| Flag | Default |
|------|---------|
| `foundation_enabled` | true |
| `charges_enabled` | true (manual operational charges; no banking) |
| `payments_enabled` | true (manual) |
| `late_fees_enabled` | **false** |
| `vendor_invoices_enabled` | false |
| `vendor_payments_enabled` | false |
| `reports_enabled` | false |
| `stripe_payment_execution_enabled` | **false** |
| Connect `status` | `not_started` |
| Connect `charges_enabled` / `payouts_enabled` | false |

---

## Test evidence

| Check | Result |
|-------|--------|
| Scratch Postgres apply (Production-like parents) | **PASS** — `scripts/validate-docs-140-m1-sql.sh` |
| Second apply (IF NOT EXISTS idempotency) | **PASS** |
| New tables empty | **PASS** |
| July stub tables unchanged (count = 1) | **PASS** |
| Zero RLS policies on new tables | **PASS** |
| `late_fees_enabled` default false | **PASS** |
| `financial_charges` → `lease_agreements` FK | **PASS** |
| `financial_vendor_invoices` → `vendor_vendors` FK | **PASS** |
| `docs-140-m1-schema.test.ts` | **PASS** |
| Shared finance + operating-scope tests | **32 passed** |
| Web finance + auth regressions (PLAT-006, ADR-033, docs/135) | **67 passed** |
| `@mpa/web` lint | **PASS** |
| `@mpa/web` + `@mpa/shared` typecheck | **PASS** |
| `@mpa/web` production build | **PASS** (finance routes compiled) |

No application finance source changes. Services compile against the M1 column contract.

---

## Migration safety

| Rule | Held |
|------|------|
| One new successor file | Yes |
| Additive `CREATE TABLE IF NOT EXISTS` | Yes |
| No DROP of existing finance tables | Yes |
| No DELETE / UPDATE / TRUNCATE of July data | Yes |
| No CREATE OR REPLACE of helpers | Yes |
| No subscription / SKU / Stripe / role / entitlement writes | Yes |
| Production apply | **Not performed** |

---

## Expected Production apply behavior (later Owner step)

When a later package is authorized to apply this file to `mpa-prod`:

1. Ledger gains `20260816010000` / `docs_140_fin_ops_reconciliation_m1` after tip `20260815222252`.
2. Fifteen `financial_*` tables plus `finance_lineage_map` appear **empty**.
3. July finance row counts stay exactly as they are at apply time.
4. Live property / lease / vendor / ADR-033 / PLAT-006 objects are unchanged.
5. Staff `/api/finance/snapshot` will no longer 400 on a missing `financial_charges` relation; it will see empty FIN-OPS data behind fail-closed RLS until M3/M4.
6. No Connect onboarding, no late-fee assessment, no SaaS billing change.

That apply is **not** authorized by this certification.

---

## Final verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION**

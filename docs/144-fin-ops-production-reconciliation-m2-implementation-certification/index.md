# 144 — FIN-OPS Production Reconciliation M2 Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — slice M2 only  
**Authority:** Owner authorization for **in-repo M2 implementation only** · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/141](../141-fin-ops-production-reconciliation-m1-implementation-certification/index.md) · [docs/142](../142-fin-ops-production-reconciliation-m1-production-migration-certification/index.md) · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md)  
**Target modeled:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Repository implementation + scratch-fixture proof only. **No Production backfill. No deploy. No M3–M5.**

---

## Verdict

**READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**

M2 is implemented in-repo as a trusted, reviewable backfill mechanism. It materializes canonical lease/resident identity, migrates July money facts into the live M1 `financial_*` landing zone, reconstructs the FIN-OPS ledger, records `finance_lineage_map`, and fails closed when identity or money cannot be proven.

This record **does not authorize** running M2 against Production, freezing July writes, deploying application code, or implementing M3 / M4 / M5.

---

## What this package did not do

- Did not apply M2 to `mpa-prod`
- Did not move, update, delete, or truncate Production July finance rows
- Did not freeze July Production writes (M3)
- Did not implement M3 RLS, M4 write cutover, or M5 collections
- Did not deploy application code
- Did not call Stripe APIs or create customers / PaymentIntents / Checkout Sessions / Connect accounts
- Did not modify billing, subscriptions, SKUs, or pricing
- Did not apply `20260816010000` to Production (already live as `20260816003005`)
- Did not replay `20260806030000` / `40000` / `50000`
- Did not grant authenticated or anon access to migrated rows
- Did not change ADR-033 or PLAT-006 `pm.finance:*`

---

## Implementation files

| File | Role |
|------|------|
| `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql` | Installs trusted `finance_m2_*` functions. Does **not** execute the backfill. |
| `packages/shared/src/finance/docs-140-m2-maps.ts` | Reviewable TypeScript mapping tables. SQL is authoritative for execution. |
| `packages/shared/src/finance/docs-140-m2-maps.test.ts` | Mapping unit tests |
| `packages/shared/src/finance/index.ts` | Re-exports M2 maps |
| `scripts/fixtures/docs-140-m2-july-snapshot.sql` | Synthetic Production-shaped July fixture |
| `scripts/validate-docs-140-m2-sql.sh` | Scratch apply, dry-run, double run, reconcile, fail-closed cases |
| `apps/web/src/lib/finance/docs-140-m2-backfill.test.ts` | Contract tests + scratch validator |

Successor after live Production tip **`20260816003005` / `docs_140_fin_ops_reconciliation_m1`**.

---

## Migration / backfill mechanism

`20260816020000` installs functions only. A later Owner-authorized Production step would call them as `postgres` / `service_role`.

| Function | Purpose |
|----------|---------|
| `finance_m2_version()` | `20260816020000` |
| `finance_m2_preflight(org)` | Fail-closed source validation |
| `finance_m2_backfill_org(org, dry_run)` | Identity + money + ledger for one org |
| `finance_m2_run(dry_run default true, org default null)` | Orchestrates orgs; dry-run default |
| `finance_m2_reconcile()` | Recomputes source/target counts and money |
| `finance_m2_july_fingerprint()` | July immutability hash |
| `finance_m2_seed_entitled_settings()` | Safe settings/Connect for active PM/Complete orgs only |

**Execution identity:** `postgres` / `service_role` only. `REVOKE ALL` from `public`, `anon`, and `authenticated`. No client-facing RPC. No anon/authenticated `SECURITY DEFINER` function.

**Dry-run:** `finance_m2_run(true)` validates and returns source totals. It writes no FIN-OPS rows and no failed-state lineage.

**Retry:** same source + same approved target is idempotent. Same source + different target raises `conflicting_lineage` and stops that org.

---

## Transaction boundaries

`finance_m2_run()` is one outer transaction.

Each organization is a PL/pgSQL `BEGIN / EXCEPTION` subtransaction.

| Outcome | What commits to the outer transaction | What rolls back |
|---------|----------------------------------------|-----------------|
| Org succeeds | Identity, money, ledger, lineage, `m2_run` status `migrated` | Nothing for that org |
| Org fails | `finance_lineage_map` row `m2_run` → `organization`, status `failed`, error text | All materialization and money writes for that org |
| Dry-run | Nothing | Nothing |

A failed org is never left half-migrated without a recorded failed state. Other orgs that already succeeded remain visible in the outer transaction.

---

## Exact source → target mappings

| July source | FIN-OPS target | UUID rule |
|-------------|----------------|-----------|
| `leases` referenced by charges/payments | `lease_agreements` | Reuse legacy UUID |
| `tenants` referenced by charges | `lease_residents` | Reuse legacy UUID |
| `tenants` (profile) | `pm_residents` | Reuse tenant UUID, or link existing org+email |
| `rent_charges` | `financial_charges` | Reuse charge UUID |
| `payments` | `financial_payments` | Reuse payment UUID |
| payment → charge | `financial_payment_allocations` | New row, unique `(payment_id, charge_id)` |
| `payment_receipts` | `financial_receipts` | Reuse receipt UUID when parent payment migrated |
| `payment_customers` | lineage only → `mapped_stripe_customer_metadata` | No operational FIN-OPS customer row |
| `vendor_invoices` | `financial_vendor_invoices` | Reuse invoice UUID; vendor remains `vendor_vendors` |
| `vendor_payments` | `financial_vendor_payments` | Reuse payment UUID |
| reconstructed facts | `financial_ledger_entries` | Deterministic `idempotency_key` |
| org run | `finance_lineage_map` `m2_run` | Status `migrated` or `failed` |

Unchanged July archives: `expenses`, `owner_statements`, `financial_activity`, `billing_ledger_entries`.

---

## Identity strategy

Canonical FIN-OPS identity remains `property_properties` / `lease_agreements` / `lease_residents` / `pm_residents`.

July finance still references `leases` / `tenants`. docs/140 established those UUIDs do not currently overlap the canonical domain. M2 reuses the legacy UUID when inserting the canonical row.

Rules:

1. Preserve organization, property, and source identity.
2. Map lease status `active` → `active`, `expired|terminated|ended` → `ended`, `draft` → `draft`.
3. If a canonical row already exists, verify organization/property compatibility. Incompatible → `STOP`.
4. Link `pm_residents` by org+email when present; otherwise insert with the tenant UUID.
5. Do not invent missing leases, tenants, residents, or a third identity domain.
6. Leave `leases` and `tenants` in place.

---

## Charge mapping

| July | FIN-OPS |
|------|---------|
| `id` | reused |
| `due_date` | `due_at` |
| `monthly_rent` | `rent` |
| `custom` / `other` / `security_deposit` | `one_time` |
| `paid` | `paid` |
| `partial` | `partially_paid` |
| `overdue` and `amount_paid = 0` | `open` |
| `overdue` and `amount_paid > 0` | `partially_paid` |
| `description` | `label` |
| `charge_number` | `memo` |
| `schedule_id` | `NULL` |
| currency | `USD` when source is empty or USD; any other currency `STOP` |
| `deleted_at` | `void` + `void_reason = july_soft_delete` |

`late_status` is ignored. No retroactive `late_fee` charges. No charge schedules for historical one-time facts.

---

## Payment mapping

| July | FIN-OPS |
|------|---------|
| `id` | reused |
| `completed` | `succeeded` |
| `manual` | `manual_other` |
| `check` | `manual_check` |
| `card` with no Stripe object id | `manual_other` |
| `card` / any method with Stripe PI / session / charge id in metadata | `STOP` `unexpected_stripe_source` |
| unsupported method | `STOP` |
| `stripe_checkout_session_id` / `stripe_payment_intent_id` | `NULL` |
| `payment_date` | `paid_at` at UTC midnight |

Non-`completed` payment status `STOP`s.

---

## Allocation strategy

Each July payment with a proven `rent_charge_id` creates one `financial_payment_allocations` row: `amount = payments.amount`.

Existing allocation for the same pair with a different amount → `STOP` `duplicate_payment_allocation`.

Same pair + same amount is idempotent (`ON CONFLICT DO NOTHING`).

The runner independently recomputes `sum(amount_paid) = sum(payments.amount)` before writing and again after writing.

---

## Vendor AP mapping

Canonical vendor identity is `vendor_vendors`.

| July | FIN-OPS |
|------|---------|
| `vendor_invoices` | `financial_vendor_invoices`, status `paid`, reuse id, preserve `work_order_id` |
| null `invoice_number` | stable `july-{id}` |
| `vendor_payments` | `financial_vendor_payments`, status `paid`, reuse id |
| July `expense_id` | stays on the July invoice only |

The six July `expenses` rows are not migrated into FIN-OPS A/R.

---

## Receipt / customer disposition

**Receipt:** the fixture/Production-shaped `payment_receipts` row maps to `financial_receipts` only when its parent payment migrated. Number, amount, payload, and `issued_at` are preserved. No receipt is invented because a payment exists. Delivery status and provider metadata are not fabricated.

**Customer:** July `payment_customers` is not a FIN-OPS customer/account domain. If `external_customer_id` matches `^cus_[A-Za-z0-9]+$`, M2 records lineage to `mapped_stripe_customer_metadata` only. Otherwise it records `unmapped_payment_customer` / `skipped`. No Stripe customer, Connect account, bank account, or payment method is created.

The safe fixture uses `cus_FIXTURE01`. The live Production id is not stored in this repository.

---

## Ledger reconstruction rules

`financial_ledger_entries` is reconstructed from migrated facts. July `billing_ledger_entries` and `financial_activity` are not copied.

| Fact | `idempotency_key` | Type / direction |
|------|-------------------|------------------|
| charge | `july-charge:{id}` | `charge` / debit |
| payment | `july-payment:{id}` | `payment` / credit |
| allocation | `july-allocation:{payment}:{charge}` | `allocation` / debit |
| vendor invoice | `july-vendor-invoice:{id}` | `charge` / debit |
| vendor payment | `july-vendor-payment:{id}` | `payment` / credit |

Unique `(organization_id, idempotency_key)` prevents duplicate ledger facts.

**Explained difference (docs/140 §16):** July `billing_ledger_entries` in the certified baseline sums to `2.00`. Reconstructed FIN-OPS ledger totals follow migrated charges, payments, allocations, and vendor AP, not that July sum. This is expected and is not treated as a silent mismatch.

---

## Lineage behavior

Unique `(source_table, source_id, target_table)`.

| Behavior | Result |
|----------|--------|
| same source + same target | idempotent refresh |
| same source + different target | `STOP` `conflicting_lineage` |
| missing required identity / money proof | org subtransaction rolls back; `m2_run` status `failed` |

Every migrated operational financial fact has deterministic lineage, including identity materialization, allocations, vendor AP, reconstructed ledger keys, and receipt/customer disposition.

---

## Settings / Connect seed

After a successful non-dry run, `finance_m2_seed_entitled_settings()` inserts safe defaults only for organizations with an **active** `mpa_property_manager` or `mpa_complete_platform` subscription:

- late fees off
- Stripe payment execution off
- vendor AP flags on so the migrated paid pair is visible
- Connect `not_started`, `stripe_account_id` NULL

Unsubscribed July-data orgs and Facility Operations orgs are not seeded.

---

## Collections / late fees

After M2 the following remain empty:

- `financial_late_fee_policies`
- `financial_delinquency_cases`
- `financial_payment_arrangements`
- `financial_stripe_webhook_events`
- `financial_charge_schedules`

M5 remains separate.

---

## July immutability proof

M2 SQL contains no `UPDATE` / `DELETE` / `TRUNCATE` of:

`rent_charges`, `payments`, `vendor_invoices`, `vendor_payments`, `billing_ledger_entries`, `financial_activity`, `expenses`, `owner_statements`, `payment_receipts`, `payment_customers`.

The scratch validator hashes those tables before the first run and after the second run. The fingerprints must match.

---

## Stripe isolation

M2 does not call Stripe. It does not create customers, PaymentIntents, Checkout Sessions, Connect accounts, bank accounts, refunds, subscriptions, prices, or products. Historical webhook events are not populated. Card payments without a real Stripe object id map to `manual_other`, never `online_stripe`.

---

## ADR-033 compatibility

M1 fail-closed RLS remains the Production model. M2 adds no policies and no authenticated grants. Complete + FACILITY cannot gain PM finance because of M2. ADR-033 and PLAT-006 tests remain the authorization proof.

---

## Safe fixture

`scripts/fixtures/docs-140-m2-july-snapshot.sql` is synthetic and Production-shaped:

| Shape | Fixture rows (recomputed) |
|-------|---------------------------|
| charges | 17 |
| charge total | `24691.00` |
| amount_paid | `11111.00` |
| payments | 11 |
| payment total | `11111.00` |
| vendor pair | 1 + 1 = `125.50` |
| receipt | 1 mapped |
| customer | metadata only (`cus_FIXTURE01`) |
| expenses / statements / activity / billing ledger | 6 / 6 / 12 / 8 unchanged |

Type/status/method distribution matches the certified July mix: 13 `monthly_rent`, 2 `custom`, 1 `other`, 1 `security_deposit`; 6 paid / 1 partial / 10 overdue; 9 manual / 1 check / 1 card without Stripe ids; three unsubscribed July orgs plus entitled PM/Complete orgs and one FO org.

Reconciliation success is source-vs-target from those rows, not a hardcoded pass from this paragraph.

---

## Idempotency evidence

The scratch validator runs `finance_m2_run(false)` twice. The second run must produce no duplicate identities, charges, payments, allocations, vendor AP, ledger keys, or lineage triples, and identical reconciled balances.

---

## Failure tests

| Case | Expected stop |
|------|----------------|
| missing tenant | `missing_july_tenant` |
| missing lease | `missing_july_lease` |
| mismatched organization | `payment_org_mismatch` |
| missing payment charge | `missing_payment_charge` |
| incompatible canonical lease | `incompatible_canonical_lease` |
| incompatible canonical resident | `incompatible_canonical_resident` |
| conflicting lineage | `conflicting_lineage` |
| duplicate allocation amount | `duplicate_payment_allocation` |
| unsupported payment method | `unsupported_payment_method` |
| unexpected Stripe-like metadata | `unexpected_stripe_source` |
| money mismatch | `money_reconciliation_mismatch` |
| good org + bad org in one run | good org commits; bad org rolls back and records `failed` |

---

## Expected future Production execution plan

**Design only. Do not run in this package.**

1. Re-read Production baseline (July counts, hashes, money).
2. Verify M1 objects and fail-closed security (`20260816003005` live; do not apply `20260816010000`).
3. Verify July source hashes/counts/money still match the certified baseline or document drift.
4. Apply `20260816020000` (function install only) after a later Owner migration-certification step.
5. Run `select public.finance_m2_run(true);` (preflight / dry-run).
6. Review `finance_m2_reconcile()` and dry-run output.
7. Execute `select public.finance_m2_run(false);` as `postgres` / `service_role`.
8. Verify target counts/money against recomputed source.
9. Verify July source unchanged via `finance_m2_july_fingerprint()`.
10. Verify lineage and failed-org records if any.
11. Certify M2 Production backfill.

Do not freeze July writes in that future M2 apply unless a later approved cutover moves that boundary. M3 owns the write-freeze. M3/M4 remain separately gated.

---

## Tests run for this certification

| Suite | Result |
|-------|--------|
| `scripts/validate-docs-140-m2-sql.sh` | **PASS** — dry-run, double apply, source-vs-target reconcile, July fingerprint unchanged, required fail-closed cases |
| `packages/shared` finance + ADR-033 + PLAT-006 auth tests | **332 passed** |
| `apps/web` `src/lib/finance` (M1 + M2 contract) | **15 passed** |
| `pnpm lint` | **PASS** |
| `pnpm typecheck` | **PASS** |
| `pnpm --filter @mpa/web build` | **PASS** |

### Unrelated pre-existing failure

`apps/web/src/app/api/commerce/checkout/checkout.route.test.ts` — `returns price unconfigured when unit-volume env Prices are absent` expects HTTP `503/502/400` when SaaS Price envs are missing. This cloud environment returns **200** because those envs are present. The test is SaaS Checkout, not FIN-OPS. M2 does not touch billing, SKUs, subscriptions, or Stripe Checkout. **Not hidden; not blocking M2.**

---

## FINAL VERDICT

**READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**

# 143 — FIN-OPS Production Reconciliation M1 Production Migration Application Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M1 PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** **READY FOR M2 DESIGN / IMPLEMENTATION AUTHORIZATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — slice M1 only  
**Authority:** Owner authorization for **Production M1 schema application only** · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/141](../141-fin-ops-production-reconciliation-m1-implementation-certification/index.md) · [docs/142](../142-fin-ops-production-reconciliation-m1-production-migration-certification/index.md) **READY FOR PRODUCTION MIGRATION APPLICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Database apply only. **No application deploy. No M2–M5. No July movement.**

---

## Verdict

**READY FOR M2 DESIGN / IMPLEMENTATION AUTHORIZATION**

M1 empty August `financial_*` + `finance_lineage_map` is live on Production. July finance counts, hashes, and money totals are unchanged. Customer roles remain fail-closed. The Production application SHA is unchanged.

This record **does not authorize** M2 backfill, M3 policies, M4 write cutover, M5, deploy, or Stripe/billing/SKU changes.

**Incident status:** none.

---

## What this package did not do

- Did not implement or apply M2 / M3 / M4 / M5
- Did not migrate, backfill, or reconstruct July finance rows or ledger entries
- Did not freeze July writes
- Did not deploy application code
- Did not modify Stripe, billing, subscriptions, SKUs, or pricing
- Did not replay S0 / S1 / S2
- Did not change ADR-033
- Did not broaden RLS or add authenticated access
- Did not rollback (no incident)

---

## 1. Certified source and Production stamp

```
20260816010000
    certified source (not registered on Production)
    supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql

        ↓ exact certified SQL via apply_migration
          (platform stored the file minus the terminating newline)

20260816003005
    Production apply version
    name: docs_140_fin_ops_reconciliation_m1
    repo stamp: supabase/migrations/20260816003005_docs_140_fin_ops_reconciliation_m1.sql
```

| Item | Value |
|------|-------|
| Certified source | `supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql` |
| Source version on Production | **0** — do **not** apply `20260816010000` later |
| Production apply version | **`20260816003005`** |
| Production apply name | `docs_140_fin_ops_reconciliation_m1` |
| Predecessor tip | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| Successor check | `20260816003005` > `20260815222252` |
| S0 / S1 / S2 | Still **unapplied** |

The historical source file is unchanged. The successor repo file is a **byte-identical copy** so the Production stamp is visible in git.

### Proof of SQL equivalence

| Artifact | SHA-256 | Notes |
|----------|---------|-------|
| Certified source file | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` | 20,476 bytes including POSIX terminating newline |
| Successor repo file | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` | `cmp` identical to source |
| Source file with terminating newline stripped | `c5631a082dd91ce13d98405d89a140aed2ba3feaf18bd2e31dac7c0a0ef48b01` | 20,475 bytes |
| Production `schema_migrations.statements[1]` for `20260816003005` | `c5631a082dd91ce13d98405d89a140aed2ba3feaf18bd2e31dac7c0a0ef48b01` | `cardinality(statements) = 1` |

`apply_migration` stored the certified text without the file’s final `\n`. No statement was added, omitted, or rewritten. That is **not** material lineage drift and is **not** a substitute SQL file.

Do **not** subsequently replay `20260816010000`.

---

## 2. Pre-apply gate

Re-read immediately before apply against `mpa-prod` / `vahnmcrpnuggxkivynvo`.

| Check | Result |
|-------|--------|
| Target name / ref | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Health | `ACTIVE_HEALTHY` |
| Ledger tip | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| M1 or equivalent already applied | **No** |
| Certified file SHA | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` |
| All 16 M1 objects | `to_regclass` **null** |
| S0 / S1 / S2 | Absent |
| July hashes | Matched docs/142 exactly |

**Gate: PASS.** Apply proceeded.

---

## 3. Apply result

| Field | Value |
|-------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` |
| Name | `docs_140_fin_ops_reconciliation_m1` |
| Version registered | `20260816003005` |
| Result | **success** |
| Other migrations applied | **None** |

Ledger tip after apply:

| Version | Name |
|---------|------|
| `20260816003005` | `docs_140_fin_ops_reconciliation_m1` |
| `20260815222252` | `docs_135_invitation_acceptance_remediation` |
| `20260815193129` | `adr_033_dataplane_member_scope` |

---

## 4. Object validation

All 16 objects exist. RLS is enabled. Policy count is **0** on each.

| Object | Exists | RLS | Policies | Rows |
|--------|--------|-----|---------:|-----:|
| `financial_connect_accounts` | yes | on | 0 | 0 |
| `financial_module_settings` | yes | on | 0 | 0 |
| `financial_charge_schedules` | yes | on | 0 | 0 |
| `financial_charges` | yes | on | 0 | 0 |
| `financial_payments` | yes | on | 0 | 0 |
| `financial_payment_allocations` | yes | on | 0 | 0 |
| `financial_ledger_entries` | yes | on | 0 | 0 |
| `financial_receipts` | yes | on | 0 | 0 |
| `financial_stripe_webhook_events` | yes | on | 0 | 0 |
| `financial_notifications` | yes | on | 0 | 0 |
| `financial_late_fee_policies` | yes | on | 0 | 0 |
| `financial_delinquency_cases` | yes | on | 0 | 0 |
| `financial_payment_arrangements` | yes | on | 0 | 0 |
| `financial_vendor_invoices` | yes | on | 0 | 0 |
| `financial_vendor_payments` | yes | on | 0 | 0 |
| `finance_lineage_map` | yes | on | 0 | 0 |

Contract columns observed on `financial_charges`: `due_at date NOT NULL`, `late_fee_assessed_at timestamptz NULL`, `source_charge_id uuid NULL` → self-FK, `status text NOT NULL`, `resident_id` / `lease_id` / `property_id` as designed.

Representative constraints live as certified: charges → `lease_agreements` / `property_properties` / `lease_residents`; payments method/status checks; allocations unique `(payment_id, charge_id)`; ledger unique `(organization_id, idempotency_key)`; vendor invoices/payments → `vendor_vendors`; lineage unique `(source_table, source_id, target_table)`; webhook unique `stripe_event_id`.

Certified indexes are present, including `financial_payments_stripe_session_uidx` and `financial_charges_due_idx`.

---

## 5. Empty landing zone

Every new M1 table has **0 rows**. No finance backfill ran.

---

## 6. Security validation

`role_table_grants` on the 16 tables: **postgres** and **service_role** only. No `PUBLIC`, `anon`, or `authenticated` grants.

`has_table_privilege` on all 16:

| Role | SELECT | INSERT |
|------|--------|--------|
| `anon` | false | false |
| `authenticated` | false | false |
| `service_role` | true | true |

Representative access (no temporary policy added):

| Actor | Result |
|-------|--------|
| Unauthenticated / `anon` | **DENIED** at table privilege |
| Authenticated PM / Complete | App auth may pass; **database fail-closed** (privilege denied). Snapshot HTTP 400 matches docs/142 and is **not** an M1 failure |
| Complete + `facility_operations` | Denied at `requireFinancePermission` / `entitlementsForMember` before DB (current app unchanged) |
| Tenant / vendor | No `pm.finance:*` grants added; new tables revoked |

---

## 7. July finance preservation

Before and after apply — **identical**.

| Table | n | ID hash |
|-------|--:|---------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` |
| `vendor_invoices` | 1 | `b3e6da623b7600ae4e89f655c544cbe9` |
| `vendor_payments` | 1 | `a1709be7d24cdea8a75337478cd8261e` |
| `payment_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `payment_customers` | 1 | `e2310baded7554d6591d7b99097629ad` |

Monetary baseline unchanged:

| Measure | Value |
|---------|-------|
| `rent_charges` total | `24691.00` |
| `rent_charges.amount_paid` | `11111.00` |
| `payments` total | `11111.00` |

---

## 8. Non-finance data safety

Pre-apply and post-apply counts match.

| Object | n |
|--------|--:|
| `organizations` | 21 |
| `organization_memberships` | 36 |
| `organization_subscriptions` | 6 (Complete 1 active, PM 5 active, FO 0) |
| `organization_invitations` | 14 |
| `saas_subscriptions` | 4 |
| `saas_invoices` | 3 |
| `property_properties` | 9 |
| `lease_agreements` | 1 |
| `lease_residents` | 1 |
| `pm_residents` | 1 |
| `vendor_vendors` | 13 |
| `maintenance_work_orders` | 33 |
| `facility_assets` | 6 |
| `communication_messages` | 2 |
| `event_domain_events` | 251 |
| `audit_events` | 125 |
| `document_documents` | 1 |
| `workspace_tables` | 7 |
| `organization_operating_scope_events` | 19 |
| `pm.finance:*` capabilities | 8 |
| `pm.finance:*` grants | 19 |

Operating scopes unchanged: `both` 1, `property_operations` 2, `facility_operations` 2, `NULL` 31.

---

## 9. Safe defaults

| Check | Result |
|-------|--------|
| Connect rows | **0** — no bank connection, no Stripe account id |
| Connect column defaults | `status = not_started`, `charges_enabled = false`, `payouts_enabled = false` |
| Module-settings rows | **0** |
| Column defaults | `late_fees_enabled = false`, `stripe_payment_execution_enabled = false`, vendor flags false |
| Delinquency cases | 0 |
| Payment arrangements | 0 |
| FO webhook inbox | 0 |
| Financial notifications | 0 |
| Autopay / schedules | 0 |
| Vendor invoices / payments | 0 |

Late fees remain **OFF**. No vendor payment was initiated.

---

## 10. Stripe / billing isolation

| Check | Result |
|-------|--------|
| Stripe API mutation by this package | **None** |
| SaaS subscriptions / invoices | Unchanged (4 / 3) |
| `saas_stripe_webhook_events` | 0 |
| `financial_stripe_webhook_events` | 0 |
| `/api/commerce/webhooks/stripe` | Not changed (no deploy) |
| Stripe products / prices / Checkout | Not modified |

---

## 11. Application state

**No deploy was performed.**

| Field | Value |
|-------|-------|
| Latest GitHub Production deployment | `50204033bae59ff5f71cb76609b89a7f300545a2` |
| Created | `2026-08-15T22:28:34Z` |
| Meaning | Merge of invitation remediation PR #240 |
| `origin/main` | same SHA |
| This package | schema only |

Split state (intentional):

| Plane | State |
|-------|-------|
| Database | M1 empty `financial_*` landing zone **LIVE** (`20260816003005`) |
| Application | Current Production app **unchanged** |

Finance remains fail-closed until later authorized slices. HTTP 400 from intentional database denial matches docs/142 and is **not** an M1 defect. Empty report zeros must not be treated as successful financial truth.

---

## 12. Rollback boundary

| Condition | Status |
|-----------|--------|
| M2 has run | **No** |
| `financial_*` business rows | **0** |
| `finance_lineage_map` | **0** |
| M4 write cutover | **No** |

M1 remains inside the empty-schema rollback boundary. Rollback was **not** executed. July source data must never be altered as M1 rollback.

---

## 13. Certification matrix

| Item | Result |
|------|--------|
| Actual Production stamp | `20260816003005` / `docs_140_fin_ops_reconciliation_m1` |
| Certified-source SHA | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` |
| SQL equivalence | Stored SQL = certified file minus terminating newline; successor repo file byte-identical to source |
| Predecessor | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| Objects | 16 exist, empty, RLS on, 0 policies |
| July before/after | Counts, hashes, and money identical |
| Non-finance safety | Unchanged |
| Stripe isolation | Unchanged / empty FO inbox |
| Production application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` unchanged |
| Split-state | Live empty schema + unchanged app; fail-closed |
| Incident | **None** |

---

## Final verdict

**READY FOR M2 DESIGN / IMPLEMENTATION AUTHORIZATION**

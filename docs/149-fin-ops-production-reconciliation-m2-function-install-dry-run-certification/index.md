# 149 — FIN-OPS Production Reconciliation M2 Function Installation + Production Dry-Run Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 FUNCTION INSTALLATION + PRODUCTION DRY-RUN CERTIFICATION  
**Status:** **READY FOR CONTROLLED M2 PRODUCTION BACKFILL**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M2 function install + `finance_m2_run(true)` only  
**Authority:** Owner authorization for M2 function install + Production dry-run · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md) · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/147](../147-fin-ops-production-reconciliation-m2-compatibility-implementation-certification/index.md) · [docs/148](../148-fin-ops-production-reconciliation-m2-production-backfill-certification/index.md) **READY FOR M2 FUNCTION INSTALL + PRODUCTION DRY-RUN**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Installed the certified trusted `finance_m2_*` functions and executed **only** `finance_m2_run(true)`. **No execute. No Option B materialization. No finance-row writes. No M2D. No July freeze. No M3–M5. No deploy.**

---

## Verdict

**READY FOR CONTROLLED M2 PRODUCTION BACKFILL**

Live Production dry-run is the authority. `select public.finance_m2_run(true)` returned:

| Organization | Id | Readiness |
|--------------|----|-----------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | **READY** |
| PMX Workflow Org `1784074584644` | `90af697c-461f-4652-8dc2-2ccf43346e11` | **READY** — one Option B unit proposed, not created |
| M.P.A. Development | `f8232926-149d-46b3-829f-c84b55378718` | **BLOCKED** — eight unique `unit_property_mismatch` charges; one Option B candidate does not unblock the org |

`ready_count` = 2. `blocked_count` = 1. `failures` = `[]`. Version reported `20260816020000`.

That mixed outcome is acceptable under ADR-035. It does **not** authorize `finance_m2_run(false)`.

Dry-run wrote nothing. July fingerprints and certified money are unchanged. M1 `financial_*` and `finance_lineage_map` remain empty. Option B UUIDs remain absent from `property_units`.

**Incident status:** process only. Supabase MCP `apply_migration` cannot carry the certified 66,538-byte installer in one payload. Production ledger therefore recorded two incomplete stamps, and the remaining certified function bodies were installed with sliced `execute_sql` `CREATE OR REPLACE` / `REVOKE` / `GRANT` from the same certified source. No finance, identity, or July row was written by that path. Stored `schema_migrations` SQL is **not** equivalent to the certified installer. Live function catalog + dry-run behavior are the authority for this verdict. Do **not** later replay `20260816020000`.

---

## What this package did not do

- Did not call `finance_m2_run(false)` or `finance_m2_run(false, :org)`
- Did not create, update, or delete `property_units`, `units`, leases, tenants, or residents
- Did not write `finance_lineage_map` or any `financial_*` row
- Did not repair Development (M2D unauthorized)
- Did not freeze July writes
- Did not implement M3 / M4 / M5
- Did not deploy application code
- Did not call Stripe or change billing, subscriptions, SKUs, or pricing
- Did not apply unused stamps `20260816010000` / `20260816020000` / S0 / S1 / S2
- Did not grant anon or authenticated `EXECUTE` on `finance_m2_*`
- Did not change ADR-033 operating scopes, PLAT-005, or `pm.finance:*`

---

## 1. Production project identity

| Item | Live value |
|------|------------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Health | `ACTIVE_HEALTHY` |
| Region | us-west-2 |
| Postgres | 17.6.1.141 |
| Pre-install ledger tip | **`20260816003005` / `docs_140_fin_ops_reconciliation_m1`** |
| Predecessor | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| Actual M2 Production stamps | **`20260816045252` / `docs_140_fin_ops_reconciliation_m2`** then **`20260816045753` / `docs_140_fin_ops_reconciliation_m2_functions`** |
| Current ledger tip | `20260816045753` |
| `20260816020000` | **absent from Production ledger** — unused certified source; do not replay |
| `20260816010000` / S0 / S1 / S2 | **absent** |
| Production app SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (GitHub Production 2026-08-15T22:28:34Z) |

Pre-install recheck against docs/148: project healthy; M1 tip unchanged; app SHA unchanged; `finance_m2_*` absent; M1 tables empty; lineage empty; July fingerprints and money matched; Option B candidates absent; no unexpected successor migration. Lineage gate: **PASS**.

---

## 2. Certified installer verification

Certified source: `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql`

| Check | Result |
|-------|--------|
| SHA-256 immediately before apply | `9e46f961d0f91a45c3f0adbcc10b511345c7b9ee26383686e02d330a15edabab` |
| Bytes | 66,538 including trailing newline |
| Calls `finance_m2_run` | **No** |
| `finance_m2_run(false)` | **Absent** |
| Creates finance / identity / lineage rows | **No** |
| Creates `property_units` | **No** |
| Materializes identities | **No** |
| Modifies July rows | **No** |
| Freezes July writes | **No** |
| Client-callable privileged RPC | **No** |
| `GRANT` to anon / authenticated | **No** — `REVOKE` from `public`, `anon`, `authenticated` |
| Changes M1 RLS | **No** |
| Changes `pm.finance:*` / ADR-033 | **No** |
| Stripe / billing / SKU / price | **No** |
| M3 / M4 / M5 / M2D | **No** |

Installer SHA and static behavior match docs/148. Gate: **PASS**.

---

## 3. Actual Production install path

### Why the ledger SQL is not the certified installer

`apply_migration` rejected the full 66KB file (`Failed to parse arguments string as JSON object`). Two smaller `apply_migration` calls then registered:

| Stamp | Name | Stored SQL | Character length | Byte length |
|-------|------|------------|----------------:|------------:|
| `20260816045252` | `docs_140_fin_ops_reconciliation_m2` | Certified header comments only | 1,993 | 2,003 |
| `20260816045753` | `docs_140_fin_ops_reconciliation_m2_functions` | Same header + `finance_m2_version()` | 2,121 | 2,131 |

Stored SQL equivalence to the certified 66,538-byte source: **FAIL**.

The remaining certified `CREATE OR REPLACE FUNCTION` / `REVOKE` / `GRANT` statements were then applied in file order via sliced `execute_sql`. No extra SQL was invented. `finance_m2_run` was not called during install.

Repo twins (byte-identical to stored Production SQL; do not treat as the installer):

- `supabase/migrations/20260816045252_docs_140_fin_ops_reconciliation_m2.sql`
- `supabase/migrations/20260816045753_docs_140_fin_ops_reconciliation_m2_functions.sql`

Authoritative unused source remains `20260816020000`. **Do not later replay it.**

### Function installation produced zero data movement

Immediately after functions existed and before dry-run:

| Object | Count |
|--------|------:|
| All 16 M1 `financial_*` + `finance_lineage_map` | 0 |
| `property_units` | 13 (hash `278ab46aaf95aabcb474facb9f846d53`) |
| `lease_agreements` / `lease_residents` / `pm_residents` | 1 / 1 / 1 |
| Option B `f2f7fdbe-…` / `2649465e-…` in `property_units` | **absent** |

---

## 4. Function and grant inventory

`public.finance_m2_version()` returns `20260816020000`.

All **23** certified functions exist. None are `SECURITY DEFINER`.

| Function | Arguments |
|----------|-----------|
| `finance_m2_backfill_org` | `uuid, boolean` |
| `finance_m2_column_exists` | `text, text` |
| `finance_m2_currency_provenance` | `text` |
| `finance_m2_ensure_canonical_unit` | `uuid, uuid, uuid` |
| `finance_m2_has_stripe_identity` | `jsonb` |
| `finance_m2_july_fingerprint` | |
| `finance_m2_legacy_unit_label` | `text, text` |
| `finance_m2_map_charge_status` | `text, numeric` |
| `finance_m2_map_charge_type` | `text` |
| `finance_m2_map_lease_status` | `text` |
| `finance_m2_map_legacy_unit_status` | `text` |
| `finance_m2_map_payment_method` | `text, jsonb` |
| `finance_m2_normalize_currency` | `text` |
| `finance_m2_org_report` | `uuid` |
| `finance_m2_preflight` | `uuid` |
| `finance_m2_reconcile` | |
| `finance_m2_record_lineage` | `uuid, text, uuid, text, uuid, text, text` |
| `finance_m2_relation_exists` | `text` |
| `finance_m2_run` | `boolean, uuid` |
| `finance_m2_seed_entitled_settings` | |
| `finance_m2_source_currency` | `text, uuid` |
| `finance_m2_usable_stripe_customer_id` | `text` |
| `finance_m2_version` | |

`has_function_privilege` for every `finance_m2_*` function:

| Role | `EXECUTE` |
|------|-----------|
| `anon` | **false** |
| `authenticated` | **false** |
| `service_role` | **true** |
| `postgres` | **true** |

`information_schema.routine_privileges` rows granting `finance_m2_*` to `anon`, `authenticated`, or `PUBLIC`: **none**.

`service_role` can execute helpers as well as the six explicitly granted entry points. That matches Supabase default privileges plus the certified `REVOKE` from client roles. No new client-callable privileged finance mutation surface exists.

---

## 5. Complete live `finance_m2_run(true)` result

Executed once as:

```sql
select public.finance_m2_run(true);
```

Envelope:

```json
{
  "dry_run": true,
  "version": "20260816020000",
  "failures": [],
  "ready_count": 2,
  "blocked_count": 1
}
```

Three finance-bearing organizations were reported. No other organization appeared.

### Canopy Property Partners — READY

| Field | Live dry-run |
|-------|----------------|
| Organization | `f88ee244-5343-4ddf-be48-15e96b9380ee` / Canopy Property Partners |
| Readiness | **READY** |
| Charges | 4 / gross `4951` / paid `1651` |
| Payments | 2 / `1651` |
| Expected allocations | 2 / `1651` |
| Outstanding | `3300` |
| Existing canonical units | 4 |
| Units / leases / residents to materialize | 0 / 1 / 1 |
| Missing units | 0 |
| `unit_property_mismatch` | 0 |
| Vendor AP | 1 invoice + 1 payment / `125.5` |
| Receipts | 1 |
| Customers | 1 |
| Currency provenance | `migration_default_usd` |
| Reconciliation | `amount_paid_equals_payments` = true |
| Target / lineage / currency blockers | 0 / 0 / 0 |
| Exact blockers | none |
| Expected reconstructed ledger if later executed | 4 charge + 2 payment + 2 allocation + 1 vendor invoice + 1 vendor payment = **10** |

Receipt `a602c6cf-…` / `RCPT-MRWUB646-BD75` maps to existing payment `1c047e5e-…`. Payment customer `ba045dd9-…` is Stripe `cus_Uw3YubMWVmCvVj` (`cus_*` shape → metadata lineage only).

### PMX Workflow Org — READY

| Field | Live dry-run |
|-------|----------------|
| Organization | `90af697c-461f-4652-8dc2-2ccf43346e11` / `PMX Workflow Org 1784074584644` |
| Readiness | **READY** |
| Charges | 1 / gross `1500` / paid `500` |
| Payments | 1 / `500` |
| Expected allocations | 1 / `500` |
| Outstanding | `1000` |
| Existing canonical units | 0 |
| Units / leases / residents to materialize | **1** / 1 / 1 |
| Missing units | 0 |
| `unit_property_mismatch` | 0 |
| Vendor / receipt / customer | 0 |
| Currency provenance | `migration_default_usd` |
| Reconciliation | `amount_paid_equals_payments` = true |
| Exact blockers | none |
| Expected reconstructed ledger if later executed | 1 charge + 1 payment + 1 allocation = **3** |

Option B proposal (not created):

| Unit | Property | Legacy facts |
|------|----------|--------------|
| `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` | PMX Harbor Residences `ec061fb8-…` | `101` / `Waterfront 101` / `vacant_ready`; not deleted; still absent from `property_units` |

### M.P.A. Development — BLOCKED

| Field | Live dry-run |
|-------|----------------|
| Organization | `f8232926-149d-46b3-829f-c84b55378718` / M.P.A. Development |
| Readiness | **BLOCKED** |
| Charges | 12 / gross `18240` / paid `8960` |
| Payments | 8 / `8960` |
| Expected allocations | 8 / `8960` |
| Outstanding | `9280` |
| Existing canonical units | 3 |
| Units / leases / residents to materialize | **1** / 12 / 12 |
| Missing units (`missing_unit_for_resident`) | 8 |
| `unit_property_mismatch` rows | **13** (8 unique charges; five dual-table duplicates) |
| Vendor / receipt / customer | 0 |
| Currency provenance | `migration_default_usd` |
| Reconciliation | `amount_paid_equals_payments` = true |
| Expected reconstructed ledger if later executed | **0** — org must roll back |
| Exact blockers | `unit_property_mismatch` + `missing_unit_for_resident` on the eight mismatch charges |

Option B proposal (not created; does **not** make the org READY):

| Unit | Property | Legacy facts |
|------|----------|--------------|
| `2649465e-1894-4c19-b699-457c8570a7f3` | Harbor View Townhomes `d22cb503-…` | `003` / `Unit 3` / `occupied`; not deleted; still absent from `property_units` |

Unique `unit_property_mismatch` charges (same eight as docs/148):

`de460536-d3c9-45c6-bfcd-4f14c42f3991`, `5fada492-d95f-492c-b612-8126fcf63cc9`, `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc`, `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e`, `c38053b1-621f-49bb-a2fb-33d621279ff5`, `daa44657-291b-4e76-a7c5-a1a312ad647a`, `6405eeca-afba-42e7-a077-ceccec85b6bd`, `d4fadeac-adf8-4ba0-a84a-76c9a9b41633`.

Preflight emitted both a canonical-row mismatch and a legacy-row mismatch for five of those charges, which is why the report counts 13 mismatch rows. Unique blocked charges remain **8**.

Development’s Option B candidate did not change readiness.

---

## 6. Money and currency

Certified July money before and after dry-run:

| Measure | Pre | Post | docs/148 |
|---------|-----|------|----------|
| Charges | 17 | 17 | match |
| Gross | `24691.00` | `24691.00` | match |
| Paid | `11111.00` | `11111.00` | match |
| Payments | 11 / `11111.00` | 11 / `11111.00` | match |
| Outstanding | `13580.00` | `13580.00` | match |
| Vendor AP | `125.50` | `125.50` | match |

Org dry-run money sums to the same certified totals: `18240 + 4951 + 1500 = 24691`; paid `8960 + 1651 + 500 = 11111`; payments `8 + 2 + 1 = 11`; outstanding `9280 + 3300 + 1000 = 13580`; vendor AP only on Canopy.

Currency provenance for all three finance orgs: `migration_default_usd`. `currency_blockers` = 0. July `rent_charges.currency` and `payments.currency` columns remain absent.

---

## 7. Zero-write proof

Compared immediately after `finance_m2_run(true)` to the pre-dry-run baseline. **Zero changes.**

| Object | Pre | Post |
|--------|----:|-----:|
| `property_units` | 13 / `278ab46aaf95aabcb474facb9f846d53` | same |
| `lease_agreements` | 1 | 1 |
| `lease_residents` | 1 | 1 |
| `pm_residents` | 1 | 1 |
| All 15 M1 `financial_*` tables | 0 | 0 |
| `finance_lineage_map` | 0 | 0 |
| `organizations` | 21 | 21 |
| `organization_memberships` | 36 | 36 |
| `organization_invitations` | 14 | 14 |
| `organization_subscriptions` | 6 | 6 |
| `saas_subscriptions` | 4 | 4 |
| `product_skus` | 3 | 3 |
| `organization_operating_scope_events` | 19 | 19 |
| Membership `operating_scope` | `both` 1 / `facility_operations` 2 / `property_operations` 2 / null 31 | unchanged |
| Option B units in `property_units` | absent | absent |

July ID hashes (`md5(string_agg(id::text, ',' order by id))`) unchanged:

| Table | n | Hash |
|-------|--:|------|
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
| `units` | 35 | `36721a55559734bc797809faa8583883` |
| `leases` | 18 | `c77f0f1e04591ed6de59159104f18970` |
| `tenants` | 35 | `c7e62bfe4a5c2b2c3f734e167edadda7` |

`finance_m2_july_fingerprint()` (amount-aware hashes for charges/payments/vendors) after dry-run:

| Key | Hash |
|-----|------|
| `rent_charges` | `5d81ddd1008580e7238d8182e97d999c` |
| `payments` | `2593213450eb4accd2dea291f25f7b43` |
| `vendor_invoices` | `c96e33d110224a7a2ec346f11e696a96` |
| `vendor_payments` | `2972061122638fe9936688db7c17a466` |
| `expenses` | `c0aacc9a93d44493bc9472f240c1015e` |
| `owner_statements` | `1368d31240f3f5ba2bda87a61f68fc44` |
| `financial_activity` | `1fbf8c12736faefc423c58f5f098326d` |
| `billing_ledger_entries` | `3ea27b482b8d2e1dbbff0afcfdb2007c` |
| `payment_receipts` | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `payment_customers` | `e2310baded7554d6591d7b99097629ad` |

The only Production change from this authorization is installation of the certified `finance_m2_*` functions and registration of stamps `20260816045252` and `20260816045753`.

---

## 8. Security proof

| Check | Result |
|-------|--------|
| `anon` `EXECUTE` `finance_m2_run` | **false** |
| `authenticated` `EXECUTE` `finance_m2_run` | **false** |
| `service_role` / `postgres` `EXECUTE` `finance_m2_run` | **true** |
| Any `finance_m2_*` `SECURITY DEFINER` | **none** |
| Client grants on `finance_m2_*` | **none** |
| New client-callable privileged finance mutation | **none** |
| M1 `financial_charges` anon SELECT/INSERT | **false** / **false** |
| M1 `financial_charges` authenticated SELECT/INSERT | **false** / **false** |
| M1 `financial_charges` `service_role` SELECT/INSERT | **true** / **true** |
| M1 landing-zone RLS | **on**, policies **0** (July `financial_activity` still has its pre-existing 2 policies; not an M1 table) |
| PLAT-005 | Intact — no new client `GRANT`; no new privileged RPC; `finance_m2_*` remain trusted-only |
| ADR-033 scopes | Unchanged (`both` 1, `facility_operations` 2, `property_operations` 2, null 31) |

Permissions were not weakened to make finance APIs work.

---

## 9. Incident record

| Finding | Classification |
|---------|----------------|
| MCP `apply_migration` cannot transport the certified 66KB installer | Process / tooling |
| Ledger stamps `20260816045252` and `20260816045753` store header / version SQL only | Process — stored SQL ≠ certified source |
| Remaining functions installed via sliced `execute_sql` from certified `20260816020000` | Process — live catalog matches certified signatures and dry-run behavior |
| Finance, identity, July, SKU, Stripe, or ADR-033 data movement | **None** |

This incident does not change the dry-run authority and does not authorize execute. A later execute authorization must use the live `finance_m2_*` catalog already installed. It must not apply `20260816020000`.

---

## 10. Next Owner-authorized action

If this record is accepted, the **only** authorized next Production step is a dedicated controlled execute authorization for `finance_m2_run(false)` (or an explicit narrower execute scope). That later package must recertify writes.

**Not authorized by this record:**

- `finance_m2_run(false)`
- `finance_m2_run(false, :org)` for Canopy or PMX
- creating Production units outside a later execute gate
- repairing Development
- M2D / M3 / M4 / M5
- July freeze
- application deploy
- Stripe / billing / SKU / price / subscription changes
- replaying `20260816020000`
- rewriting `schema_migrations.statements` unless separately authorized

July remains the authoritative writable source until a later global M4. M3 freeze remains global. Per-org fail-closed **backfill** is allowed by ADR-035 only after a dedicated execute authorization. Per-org **cutover** is still forbidden.

Canopy and PMX READY with Development BLOCKED is an acceptable dry-run under ADR-035. It is not an execute authorization.

---

## FINAL VERDICT

**READY FOR CONTROLLED M2 PRODUCTION BACKFILL**

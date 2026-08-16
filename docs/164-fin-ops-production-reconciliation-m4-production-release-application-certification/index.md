# 164 — FIN-OPS Production Reconciliation M4 Production Release Application Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M4 PRODUCTION RELEASE APPLICATION CERTIFICATION  
**Status:** **PRODUCTION FIN-OPS CUTOVER SUCCESSFUL**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M4 Production release execution  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/160](../160-fin-ops-production-reconciliation-m3-production-application-certification/index.md) · [docs/161](../161-fin-ops-production-reconciliation-m4-application-cutover-design/index.md) **Approved** · [docs/162](../162-fin-ops-production-reconciliation-m4-implementation-certification/index.md) · [docs/163](../163-fin-ops-production-reconciliation-m4-production-release-certification/index.md) **READY FOR M4 PRODUCTION RELEASE**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2)  
**This package:** Executed the certified M4 release sequence only. **No Stripe payment execution. No M5. No July reopen. No SKU / subscription / pricing / ADR-033 / membership change.**

---

## Verdict

**PRODUCTION FIN-OPS CUTOVER SUCCESSFUL**

The certified M4 application is live on Production. The certified M4 write RLS is live under Production stamp `20260816074525` with stored SQL SHA-256 equal to the certified source. `finance_ops_writes_enabled()` is **true**. July remains frozen. Stripe payment execution remains **false**. M5 remains disabled.

The controlled first write succeeded on UAT Property Demo only:

| Item | Value |
|------|-------|
| Charge ID | `f2a6d161-ab4e-4ca3-923a-de0955d86c7b` |
| Actor | Property Demo PM manager `0e1fc6e4-278b-4de5-a9e5-2e13acba7371` |
| Organization | `a11ce002-0001-4000-8000-0000000000c2` |
| Label | `M4-FIRST-WRITE UAT-PM 2026-08-16` |
| Amount | `17.16` |
| Created at | `2026-08-16T07:52:30.70012Z` |

**POINT OF NO RETURN = CROSSED**

FIN-OPS is now the sole operational finance write domain. July remains historical / read-only. This package did not delete the new charge and must not be rolled back by reopening July.

Incident status: **none**.

---

## What this package did not do

- Did not enable Stripe payment execution
- Did not implement M5
- Did not reopen, modify, archive, or drop July
- Did not replay S0 / S1 / S2
- Did not replay unused M3 stamps `20260816070000` / `20260816070100`
- Did not later replay repo stamp `20260816080000` after equivalent SQL was registered
- Did not apply any migration other than the certified M4 write RLS
- Did not create a subscription
- Did not modify SKUs, pricing, billing plans, ADR-033 scopes, or customer memberships
- Did not first-write Canopy, PMX, Development, or leaseless Clinic

---

## 1. Final precheck

Re-read live immediately before mutation. Project confirmed `mpa-prod` / `vahnmcrpnuggxkivynvo`, region `us-west-2`, engine Postgres `17.6.1.141`, status **`ACTIVE_HEALTHY`**.

| Item | Live immediately before mutation |
|------|----------------------------------|
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (pre-M4; GitHub Production 2026-08-15T22:28:34Z) |
| Ledger tip | `20260816064707` / `docs_157_fin_ops_reconciliation_m3a` |
| M3B | `20260816064447` / `docs_157_fin_ops_reconciliation_m3b` **live** |
| Unused stamps `20260816070000` / `20260816070100` | **absent** |
| M4 stamp `20260816080000` or equivalent | **absent** |
| FIN-OPS write policies (`polcmd <> r`) | **0** |
| FIN-OPS M3 SELECT policies | **21** (plus July `financial_activity_select_authorized`, not an M4 write policy) |
| `finance_ops_writes_enabled()` | **false** |
| `finance_july_freeze_enabled()` | **true** |
| Stripe execution true rows | **0** / 6 |
| Point of no return | **not crossed** |

`finance_m2_reconcile()` immediately before mutation:

| Measure | Required | Live |
|---------|----------|------|
| Charges | 17 / `24691.00` | 17 / `24691` |
| Paid | `11111.00` | `11111` |
| Payments | 11 | 11 |
| Allocations | 11 | 11 |
| Outstanding | `13580.00` | `13580` |
| Vendor AP | `125.50` | `125.5` |

July / FIN-OPS ID hashes (`md5(string_agg(id::text, ',' order by id))`) identical to docs/159 / docs/160 / docs/163:

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

No unexplained drift. Gate: **PASS — deploy authorized**.

---

## 2. Merge / deploy evidence

Certified implementation HEAD `b8af9d6c` was merged to `main` through the normal Production path (PR #261, merge commit below). The write guard was **not** lifted during deploy.

| Item | Value |
|------|-------|
| Merge commit | `867c579bad30a5417c4cc682e90790627a55052d` |
| Merge time | `2026-08-16T07:40:56Z` |
| Message | `FIN-OPS M4 in-repo application cutover and write RLS` |
| Contains certified HEAD | **yes** — `b8af9d6c2bcd3ff2ae82377b9dce797c6ea46741` is an ancestor of `867c579b` |
| GitHub Production deployment | `5928842424` |
| Production deploy created | `2026-08-16T07:42:07Z` |
| Production deploy state | **success** — “Deployment has completed” |
| Vercel commit status on `867c579b` | **success** |
| Public hostname probed | `https://www.my-property-assistant.com` HTTP 200 |

Deployed checkout artifact (merge SHA, file `apps/web/src/lib/finance/checkout-authz.ts` + `apps/web/src/app/api/finance/checkout/route.ts`):

1. `authorizeFinanceCheckout` runs first.
2. Staff branch calls `requireFinancePermission("pm.finance:charge.write", lease.organization_id)`.
3. Only then may `createServiceRoleClient()` run.
4. Role-only manager/admin authorization is gone.

Unauthenticated Production probes after deploy: `POST /api/finance/checkout`, `POST /api/finance/charges`, and `POST /api/finance/collections` each returned **401** `{ error: "Unauthenticated" }`.

---

## 3. Deployed Production SHA

| Item | Value |
|------|-------|
| Intended M4 implementation HEAD | `b8af9d6c2bcd3ff2ae82377b9dce797c6ea46741` |
| Production merge SHA now serving | **`867c579bad30a5417c4cc682e90790627a55052d`** |
| Previous Production SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` — **replaced** |
| Write guard at deploy time | **false** |

The remediating application and the still-false write guard coexisted only as designed. The unsafe inverse (old SHA + guard true) did not occur.

---

## 4. M4-RLS apply

Source re-hashed immediately before apply:

| Item | Value |
|------|-------|
| Certified repo file | `supabase/migrations/20260816080000_docs_161_fin_ops_reconciliation_m4_write_rls.sql` |
| Source SHA-256 | `178f89d9b70519ca6d7fd61b8bbe670075fd8832e5b78f1385cbf66e40119846` |
| Guard at apply | **`finance_ops_writes_enabled() = false`** |
| Apply channel | Supabase `apply_migration` name `docs_161_fin_ops_reconciliation_m4_write_rls` |
| Other migrations applied | **none** |

### Actual Production stamp and stored SQL equivalence

The platform assigned a different timestamp than the repo source.

| Item | Value |
|------|-------|
| Certified repo stamp | `20260816080000` — **do not replay** |
| Production stamp | **`20260816074525`** / `docs_161_fin_ops_reconciliation_m4_write_rls` |
| `cardinality(statements)` | 1 |
| Stored statement length | 8487 |
| Production stored SHA-256 | `178f89d9b70519ca6d7fd61b8bbe670075fd8832e5b78f1385cbf66e40119846` |
| Successor repo file | `supabase/migrations/20260816074525_docs_161_fin_ops_reconciliation_m4_write_rls.sql` |

Stored SQL SHA-256 equals the certified source. Equivalence: **PASS**.

After apply, while the guard was still false:

- `finance_ops_writes_enabled() = false`
- `finance_july_freeze_enabled() = true`
- 14 approved M4 write policies live (`*_insert_staff` / `*_update_staff` only; no DELETE; no M5 / Connect / settings / webhook / lineage writes)
- M3 SELECT policies unchanged
- `finance_m2_reconcile()` still 17 / `24691` / `11111` / 11 / 11 / `13580` / vendor AP `125.5`
- July hashes unchanged
- Unused M3 stamps and repo stamp `20260816080000` still **absent**

---

## 5. Post-RLS / pre-enable validation

Write guard kept **false**. No first-write yet.

### Application authorization (Production HTTP)

Cookie name `mpa_session`. Active org cookie `mpa_active_organization_id`.

| Actor | GET `/api/finance/charges` | POST `/api/finance/charges` `one_time` | POST `/api/finance/checkout` | POST `/api/finance/collections` M5 |
|-------|---------------------------|----------------------------------------|------------------------------|------------------------------------|
| PM SKU manager `0e1fc6e4-…` on Property Demo | **200** `{ charges: [] }` | **400** `{ error: "finance_ops_writes_frozen" }` | **403** `{ error: "stripe_payment_execution_disabled" }` | **403** `{ error: "finance_m5_not_authorized" }` |
| Complete Clinic manager `ce12a723-…` | **200** `{ charges: [] }` | **400** `Lease not found` (Clinic has 0 leases) | **404** `Lease not found` | **403** `{ error: "finance_m5_not_authorized" }` |
| Canopy staff (SKU **NULL**) | **403** entitlement `pm.financial_operations` | **403** entitlement | **404** lease not visible | **403** entitlement |
| Vendor `efd879ed-…` | **403** Forbidden | **403** Forbidden | **404** lease not visible | **403** Forbidden |
| Tenant `6cde6423-…` | **403** Forbidden | **403** Forbidden | **403** `stripe_payment_execution_disabled` (resident path, then flag) | **403** Forbidden |
| Anonymous | **401** | **401** | **401** | **401** |

PM checkout reached `requireFinancePermission` and then the Stripe execution flag. It did **not** create a pending payment. Authorized staff charges reached the database and were stopped by `finance_ops_writes_frozen`.

### Database helpers (JWT `sub` + `member_has_finance_capability`)

| Persona | Residential surface | `pm.finance:charge.write` |
|---------|---------------------|---------------------------|
| Erick Complete + **both** | true | **true** |
| Sarah Complete + **property_operations** | true | **true** |
| Mike Complete + **facility_operations** | **false** | **false** |
| PM SKU manager | true | **true** |
| Vendor | not residential staff | **false** |
| Tenant | SKU allows org surface; no staff key | **false** |

FO SKU: **no live Facility Operations subscriber** (`organization_subscriptions` = 1 Complete + 5 Property Manager). FO deny remains structural.

Mike HTTP password is not present in this operator environment. Mike denial is proved by the deployed checkout staff path (`requireFinancePermission` before `createServiceRoleClient`), the live helper (`clinic_write = false`, `clinic_residential = false`), and the merge-commit automated tests. Complete + FACILITY does not receive PM finance.

July `rent_charges` UPDATE still raised `finance_july_frozen`. Authorized and unauthorized trusted-path inserts raised `finance_ops_writes_frozen` while the guard was false (BEFORE trigger fires before RLS WITH CHECK). After enable, unauthorized writers remain denied by application authorization and `member_has_finance_capability` RLS.

No unexplained drift. Gate: **PASS — enable authorized**.

---

## 6. Write-guard enable

Only after every prior check passed:

```sql
select public.finance_ops_writes_set(true);
```

Immediate follow-up read (separate statement; `finance_ops_writes_enabled()` is `STABLE` and must not be read in the same snapshot as the setter):

| Item | After enable |
|------|----------------|
| `finance_ops_writes_set(true)` | accepted |
| `finance_ops_writes_enabled()` | **true** |
| `finance_july_freeze_enabled()` | **true** |
| Stripe execution true rows | **0** |
| M5 tables | still 0 rows; no M5 implementation |
| Point of no return | **still not crossed** — no customer INSERT yet |

Stripe payment execution was **not** enabled. July was **not** reopened. M5 was **not** implemented.

---

## 7. Controlled first write

**Org:** UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` only.  
**Actor:** certified PM manager `0e1fc6e4-278b-4de5-a9e5-2e13acba7371`.  
**Path:** Production `POST /api/finance/charges` `kind=one_time`.  
**Lease:** `a11ce002-0001-4000-8000-000000000401` / property `…0101` / unit `…0201` / primary resident `1275cb2e-be3c-4626-91ff-a3e1a8eee2fd` (tenant `6cde6423-…`).

| Field | Value |
|-------|-------|
| Label | `M4-FIRST-WRITE UAT-PM 2026-08-16` |
| Amount | `17.16` |
| HTTP | **201** |
| Charge ID | **`f2a6d161-ab4e-4ca3-923a-de0955d86c7b`** |
| `created_by` | `0e1fc6e4-278b-4de5-a9e5-2e13acba7371` |
| Status | `open` |
| `amount_paid` | `0.00` |
| Late fee | `late_fee_assessed_at` null |
| Payment | **none** |
| Allocation | **none** |
| Stripe | **none** |

Ledger: exactly one debit `ebcdd0b1-1a01-44f7-b53d-3ab344ad9faf` with `idempotency_key = charge:f2a6d161-ab4e-4ca3-923a-de0955d86c7b`.

Once this INSERT committed: **POINT OF NO RETURN = CROSSED**.

---

## 8. Exact before / after totals

| Measure | Before | After | Result |
|---------|--------|-------|--------|
| `financial_charges` | 17 | **18** | match |
| Gross | `24691.00` | **`24708.16`** | match |
| Paid | `11111.00` | `11111.00` | unchanged |
| Payments | 11 | 11 | unchanged |
| Allocations | 11 | 11 | unchanged |
| Outstanding | `13580.00` | **`13597.16`** | match |
| Vendor AP | `125.50` | `125.50` | unchanged |
| Property Demo charges | 0 | **1 / `17.16` / 0 / `17.16`** | match |
| Canopy | 4 / `4951.00` / `1651.00` / `3300.00` | same | unchanged |
| PMX | 1 / `1500.00` / `500.00` / `1000.00` | same | unchanged |
| Development | 12 / `18240.00` / `8960.00` / `9280.00` | same | unchanged |
| Clinic | 0 | 0 | unchanged |

`finance_m2_reconcile()` after the write:

| Side | Charges / total / paid / payments |
|------|-----------------------------------|
| July / source | 17 / `24691` / `11111` / 11 |
| FIN-OPS / target | **18 / `24708.16` / `11111` / 11** |
| Allocations | 11 |
| Outstanding | `13597.16` |
| Stripe webhook events | 0 |
| Late-fee / delinquency / arrangements | 0 / 0 / 0 |

The source/target charge-count split is the expected first operational write, not July drift.

---

## 9. July hash preservation

| Table | n | Hash | vs docs/159–163 |
|-------|--:|------|-----------------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` | **unchanged** |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` | **unchanged** |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` | **unchanged** |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` | **unchanged** |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` | **unchanged** |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` | **unchanged** |
| `financial_payments` | 11 | `2e0152700616760386f3dfae332312a1` | **unchanged** |
| `finance_lineage_map` | 155 | `8dc5e5378b9376e9c2bcc9323c798913` | **unchanged** |
| `financial_charges` | **18** | `a5a2e3ad6d56fd23d8fa0413f7362d02` | **changed by the one new FIN-OPS row only** |

`finance_july_freeze_enabled()` remains **true**. No July row was inserted, updated, or deleted.

---

## 10. Post-write persona / security

| Check | Result |
|-------|--------|
| Exactly one labeled charge | **1** row `M4-FIRST-WRITE UAT-PM 2026-08-16` |
| Correct org / lease / property / unit / resident | Property Demo + certified lease graph |
| Amount | `17.16` exactly |
| Duplicate charge | **none** |
| Payments on the lease | **0** |
| Allocations on the charge | **0** |
| Stripe checkout sessions / webhook events | **0 / 0** |
| Connect not `not_started` | **0** |
| PM GET `/api/finance/charges` | **200** — only `f2a6d161-…` / `17.16` |
| PM checkout | **403** `stripe_payment_execution_disabled` |
| PM M5 `arrangement` | **403** `finance_m5_not_authorized` |
| Vendor GET/POST finance | **403** Forbidden |
| Canopy GET/POST finance | **403** entitlement `pm.financial_operations` |
| Tenant GET staff charges | **403** Forbidden |
| Mike helper after the write | `clinic_write = false`, `pm_org_write = false`, `clinic_residential = false` |
| Cross-org write | denied at authorization (vendor / Canopy) |
| Unused / repo-only stamps | `70000` / `70100` / `80000` still **absent** |

---

## 11. Control-plane status

| Control | Status |
|---------|--------|
| Point of no return | **CROSSED** |
| FIN-OPS write domain | **sole operational write domain** |
| `finance_ops_writes_enabled()` | **true** |
| July | **frozen / historical** |
| M5 | **disabled** — routes return `finance_m5_not_authorized`; no late-fee / delinquency / arrangement rows |
| Stripe payment execution | **false** on all settings rows |
| Incident | **none** |

---

## 12. Failure-rule compliance

Before the first successful customer write, every serious check passed. The guard was enabled only after those checks. After the successful first write this package:

- did **not** reopen July
- did **not** delete `f2a6d161-ab4e-4ca3-923a-de0955d86c7b`
- preserved the new financial history inside FIN-OPS

---

## Final verdict

**PRODUCTION FIN-OPS CUTOVER SUCCESSFUL**

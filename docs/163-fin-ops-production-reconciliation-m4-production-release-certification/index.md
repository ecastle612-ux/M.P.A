# 163 — FIN-OPS Production Reconciliation M4 Production Release Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M4 PRODUCTION RELEASE CERTIFICATION  
**Status:** **READY FOR M4 PRODUCTION RELEASE**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — read-only release certification  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/160](../160-fin-ops-production-reconciliation-m3-production-application-certification/index.md) · [docs/161](../161-fin-ops-production-reconciliation-m4-application-cutover-design/index.md) **Approved** · [docs/162](../162-fin-ops-production-reconciliation-m4-implementation-certification/index.md) **READY FOR M4 PRODUCTION RELEASE CERTIFICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2)  
**This package:** Read-only Production certification of the M4 release package. **No deploy. No M4 apply. No `finance_ops_writes_set(true)`. No Production finance transaction. No July mutation. No M5. No Stripe/SKU/subscription change.**

---

## Verdict

**READY FOR M4 PRODUCTION RELEASE**

Live Production still matches docs/160. The certified M4 application and M4-RLS migration match docs/161 / docs/162. There is no unexplained money, hash, ledger, or authorization drift. The current Production application is still the pre-M4 SHA and **must not** coexist with a lifted write guard. The certified sequence remains safe: deploy remediating app → apply M4-RLS → revalidate → lift guard last → controlled UAT first-write.

This certification does **not** authorize those later Owner steps.

---

## What this package did not do

- Did not merge or deploy M4
- Did not apply `20260816080000` or any substitute M4 SQL
- Did not call `finance_ops_writes_set(true)`
- Did not create a Production FIN-OPS transaction
- Did not modify, reopen, archive, or drop July
- Did not enable Stripe payment execution
- Did not implement M5
- Did not replay unused stamps `20260816070000` / `20260816070100` or S0/S1/S2
- Did not change SKUs, subscriptions, pricing, billing, ADR-033 scopes, or memberships

---

## 1. Actual Production baseline

Re-read live immediately. Not reused from docs/162.

| Item | Live 2026-08-16 |
|------|-----------------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Region / engine | `us-west-2` / Postgres 17.6.1.141 |
| Health | `ACTIVE_HEALTHY` |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` — GitHub Production 2026-08-15T22:28:34Z — **pre-M4** |
| Ledger tip | `20260816064707` / `docs_157_fin_ops_reconciliation_m3a` |
| M3B | `20260816064447` / `docs_157_fin_ops_reconciliation_m3b` **live** |
| M3A | `20260816064707` / `docs_157_fin_ops_reconciliation_m3a` **live** |
| Unused repo stamps `20260816070000` / `20260816070100` | **absent** — do not replay |
| M4 stamp `20260816080000` | **absent** |
| Substitute M4 write policies (`*_insert_staff` / `*_update_staff` / `polcmd <> 'r'`) | **0** |
| `finance_ops_writes_enabled()` | **false** |
| `finance_ops_cutover_state.writes_enabled` | **false** |
| `finance_july_freeze_enabled()` | **true** |
| July freeze triggers | **17** `finance_july_write_guard` |
| FIN-OPS write-guard triggers | **15** `finance_ops_write_guard` |
| FIN-OPS SELECT policies | **21** M3A staff/resident SELECT policies; all `polcmd = r` |
| Authenticated FIN-OPS grants | **SELECT only** on the 14 customer-visible tables; no INSERT/UPDATE/DELETE |
| Stripe execution true rows | **0** / 6 settings |
| Connect not `not_started` | **0** / 6 |
| Late-fee / delinquency / arrangements | **0 / 0 / 0** |
| `finance_m2_version()` / `finance_m2d_version()` | `20260816020000` / `docs_152_m2d_owner_unit_map` |
| Point of no return | **not crossed** |

`finance_ops_writes_set(boolean)` EXECUTE remains revoked from `authenticated` / `anon` (postgres + `service_role` only). PLAT-005 intact.

No unexplained drift versus docs/160.

---

## 2. Reconciliation

`finance_m2_reconcile()` recomputed live:

| Measure | July / source | FIN-OPS / target | Required | Result |
|---------|---------------|------------------|----------|--------|
| Charges | 17 / `24691` | 17 / `24691` | 17 / `24691.00` | match |
| Paid | `11111` | `11111` | `11111.00` | match |
| Payments | 11 / `11111` | 11 / `11111` | 11 | match |
| Allocations | — | 11 / `11111` | 11 | match |
| Outstanding | `13580` | `13580` | `13580.00` | match |
| Vendor AP | `125.5` | `125.5` | `125.50` | match |
| Late fees / delinquency / arrangements / webhooks | 0 | 0 | 0 | match |

Per-org FIN-OPS (unchanged):

| Organization | Id | Charges / gross / paid / outstanding |
|--------------|----|--------------------------------------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | 4 / `4951.00` / `1651.00` / `3300.00` |
| PMX Workflow Org | `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 / `1500.00` / `500.00` / `1000.00` |
| M.P.A. Development | `f8232926-149d-46b3-829f-c84b55378718` | 12 / `18240.00` / `8960.00` / `9280.00` |
| UAT Clinic Demo | `a11ce001-0001-4000-8000-00000000c11c` | **0** |
| UAT Property Demo | `a11ce002-0001-4000-8000-0000000000c2` | **0** |

SKU: Clinic `mpa_complete_platform` active; Property Demo `mpa_property_manager` active; Canopy / PMX / Development **NULL**. Subscriptions still **6**. Orgs / memberships still **21 / 36**. Ledger **41**. Receipts **1**. Vendor invoice/payment **1 / 1**.

ID hashes (`md5(string_agg(id::text, ',' order by id))`) identical to docs/159 / docs/160:

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

Reconciliation gate: **PASS**.

---

## 3. Certified M4 application artifact

| Item | Value |
|------|-------|
| Implementation branch | `cursor/fin-ops-m4-impl-b7a1` |
| Implementation PR | https://github.com/ecastle612-ux/M.P.A/pull/261 — **draft**, `MERGEABLE` |
| Implementation HEAD | `b8af9d6c2bcd3ff2ae82377b9dce797c6ea46741` |
| Code commit | `27a69a690b24a269fe9fcd4dcd51eebef664bbd4` — `feat: implement FIN-OPS M4 application cutover and write RLS` |
| Cert commit | `b8af9d6c2bcd3ff2ae82377b9dce797c6ea46741` — `docs: certify FIN-OPS M4 in-repo implementation` |
| Drift vs docs/162 | **none** — this branch contains that HEAD |
| CI `verify` | **SUCCESS** (GitHub Actions run 31934135014) |
| Vercel Preview | **SUCCESS** — `m-p-a-web/8x3SHhLeNRigPEjAMVDriBREtYC1` |
| lint / typecheck / Production build | **pass** (docs/162) |
| Required tests | **pass** (docs/162: 42 new M4; 92 web finance/auth; 32 shared) |

The live Production application is still `50204033`. It is **not** the release candidate. Do not merge or deploy from this certification.

---

## 4. Checkout authorization proof

Live Production SHA `50204033` still contains the unsafe hole:

```ts
const isManager =
  membershipRoles.includes("property_manager") ||
  membershipRoles.includes("organization_admin");
if (!residentLink && !isManager) { /* 403 */ }
// then createServiceRoleClient()
```

That is why the remediating application **must deploy before** the write guard can be lifted.

Certified candidate (`27a69a69` / `b8af9d6c`):

1. `authorizeFinanceCheckout` runs first.
2. Staff branch calls `requireFinancePermission("pm.finance:charge.write", lease.organization_id)`.
3. Only then may `createServiceRoleClient()` run.
4. Role-only manager/admin check is gone.
5. `finance_ops_writes_enabled()` is not used as RBAC.

| Persona | Live membership (unchanged) | Candidate staff checkout |
|---------|-----------------------------|--------------------------|
| **Erick** Clinic Complete + BOTH + admin `3e81e139-…` | present | allowed by capability |
| **Sarah** Clinic Complete + PROPERTY + PM `c1616e08-…` | present | allowed by capability |
| **Mike** Clinic Complete + FACILITY + PM `a1f4c2c7-…` | present | **403 before `createServiceRoleClient()`** |
| **PM SKU manager** Property Demo `0e1fc6e4-…` | present | allowed |
| FO SKU | no live FO subscriber | denied by SKU entitlement |
| tenant `6cde6423-…` | Property Demo tenant | lease-self only; no staff keys |
| vendor `efd879ed-…` | Clinic vendor | denied from staff checkout |
| non-member / anonymous | — | 403 / 401 |

The global write guard is **not** the mechanism that denies Mike on the candidate. Automated proof: `checkout-authz.test.ts` + `checkout.route.test.ts` (Mike 403, `createServiceRoleClient` not called).

Checkout also requires `stripe_payment_execution_enabled = true`. That flag is **false** on all 6 orgs, so even an authorized caller cannot start Stripe execution after a later guard lift until a separate Owner step.

---

## 5. Certified M4 migration

File: `supabase/migrations/20260816080000_docs_161_fin_ops_reconciliation_m4_write_rls.sql`

| Item | Value |
|------|-------|
| SHA-256 | `178f89d9b70519ca6d7fd61b8bbe670075fd8832e5b78f1385cbf66e40119846` — **exact match** |
| Successor after | live Production tip `20260816064707` |
| Replay unused M3 stamps | **forbidden** — file does not replay `70000` / `70100` |
| `finance_ops_writes_set(` | **absent** |
| New function / `SECURITY DEFINER` / `GRANT EXECUTE` | **absent** |
| July / money DML | **absent** |
| `stripe_payment_execution_enabled` flip | **absent** |
| Write predicate | only `member_has_finance_capability(organization_id, '<PLAT-006 key>')` |
| Forbidden fallbacks | no `is_org_manager`, `is_org_member`, role-only, SKU-only |
| DELETE | not granted |
| M5 / Connect / settings / webhook / lineage writes | revoked / no policies |
| M3 SELECT | not dropped |

Valid successor to the actual Production ledger. **Not applied.**

---

## 6. July freeze

| Check | Live |
|-------|------|
| `finance_july_freeze_enabled()` | **true** |
| Freeze triggers | 17 tables including `rent_charges`, `payments`, receipts/customers, `billing_ledger_entries`, `financial_activity`, `expenses`, `owner_statements`, July `vendor_invoices` / `vendor_payments` |
| July ID hashes | identical to docs/159 / docs/160 |
| Candidate `apps/web` `.from("<july money table>")` | **zero** |

July was not unfrozen for this certification. Stale writes still fail `finance_july_frozen`. M4 does not create dual-write.

---

## 7. Split-state safety

### State A — M4 app deployed, M4-RLS not applied, guard=false

**SAFE.**

| Actor | What happens |
|-------|----------------|
| Mike checkout | 403 at `requireFinancePermission` — never reaches `service_role` |
| Erick/Sarah/PM checkout | authorized, then `stripe_payment_execution_disabled` (flag false) — no pending insert |
| Authorized staff charge/payment | user JWT; authenticated still has **no INSERT grant**; if a trusted path reached the table, trigger raises `finance_ops_writes_frozen` |
| Current SHA `50204033` | **already gone** after this deploy, so the role-only hole cannot meet a later guard lift |

The unsafe window is the inverse: **old app + guard=true**. This certification forbids that order.

### State B — M4 app deployed, M4-RLS applied, guard=false

**SAFE — required before guard lift.**

| Class | Behavior |
|-------|----------|
| READS | M3 SELECT unchanged |
| AUTHORIZED WRITES | reach the database and fail `finance_ops_writes_frozen` |
| UNAUTHORIZED WRITES | fail authorization first |
| Mike | authorization 403, not merely frozen |

---

## 8. Exact Production order

Proved against the live schema and the release candidate. **Do not invert.**

| Step | Action | Guard | App | Write RLS | Why |
|------|--------|-------|-----|-----------|-----|
| 0 | Now | false | `50204033` | none | Old checkout cannot succeed |
| 1 | **Deploy M4-APP** SHA `b8af9d6c` | false | remediating | none | Role-only hole gone |
| 2 | Revalidate | false | remediating | none | Mike 403; writes frozen; July hashes unchanged |
| 3 | **Apply** `20260816080000` | false | remediating | live | Policies exist; trigger still blocks |
| 4 | Revalidate | false | remediating | live | State B proofs; money/hashes unchanged |
| 5 | **`finance_ops_writes_set(true)`** | true | remediating | live | Last explicit gate |
| 6 | Controlled first-write | true | remediating | live | UAT Property Demo only |

Application-before-RLS does **not** create an unsafe write window while the guard stays false. It **removes** the unsafe window that would exist if the guard were lifted under `50204033`.

---

## 9. Pre-guard security matrix

No persona may depend solely on the global guard for authorization.

| Persona | App auth (candidate) | DB RLS after M4-RLS | Trusted `service_role` |
|---------|----------------------|---------------------|------------------------|
| Erick BOTH | allow `charge.write` | `member_has_finance_capability` true | checkout only after app auth + execution flag |
| Sarah PROPERTY | allow `charge.write` | helper true | same |
| Mike FACILITY | **403** | helper false (no residential surface) | never reached |
| PM SKU manager | allow | helper true on Property Demo | same |
| FO SKU | 403 SKU | helper false | never reached |
| resident | lease-self checkout only | own-lease SELECT; no staff write policy | checkout after lease-self + flag |
| vendor | 403 | helper false; no `pm.finance:*` | never reached |
| anonymous | 401 | privilege deny | never reached |
| authenticated non-member | 403 | helper false | never reached |
| cross-org / Canopy-PMX-Development staff | 403 SKU NULL | helper false | never reached |

---

## 10. M5 hard-stop

Candidate `POST /api/finance/collections` kinds `policy`, `assess_late_fees`, `sync_delinquency`, `reminder`, `arrangement`:

1. `requireFinancePermission` for the existing capability
2. `403 { error: "finance_m5_not_authorized" }`

Mutation services are not called. M4-RLS grants no write on late-fee, delinquency, or arrangement tables. This remains true after a later `finance_ops_writes_set(true)`. M5 was not implemented.

---

## 11. Stripe hard-stop

| Control | Live / candidate |
|---------|------------------|
| `stripe_payment_execution_enabled` | all **false** |
| Candidate checkout | refuses `stripe_payment_execution_disabled` after auth |
| Connect | 6 rows, all `not_started` |
| `/api/commerce/webhooks/stripe` | unchanged; `handleSaasStripeEvent` only |
| `/api/finance/webhooks/stripe` | pending-row only; no invented payment; no historical replay |

SaaS prices, subscriptions, and SKUs were not changed. After a later guard lift, operational Stripe Checkout still stays off until a separate Owner authorization flips the execution flag.

---

## 12. First-write plan — designed, not executed

**Org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` (PM SKU, **0** FIN-OPS charges).

UAT Clinic is Complete and SKU-valid, but it has **0 leases** (1 property). Do not invent a Clinic lease in the ceremony. Do **not** use Canopy, PMX, or Development (SKU NULL).

**Actor:** Property Demo PM manager `0e1fc6e4-278b-4de5-a9e5-2e13acba7371`.

**Forbidden actors:** Mike, vendor, tenant-as-staff, anon, Canopy/PMX/Development staff, Erick-on-Clinic (no lease).

**Action (later Owner package only):**

`POST /api/finance/charges` `kind=one_time` on lease `a11ce002-0001-4000-8000-000000000401` / property `…0101` / unit `…0201`.

Suggested marker: label `M4-FIRST-WRITE UAT-PM 2026-08-16`, amount **`17.16`**.

**Before execution capture:**

| Measure | Expected now |
|---------|--------------|
| Global charges / gross / paid / outstanding | 17 / `24691.00` / `11111.00` / `13580.00` |
| Payments / allocations | 11 / 11 |
| Property Demo charges | 0 |
| July hashes | table in §2 |

**After later execution of unpaid charge `X=17.16`:**

| Object | Expected delta |
|--------|----------------|
| Property Demo charges | 1 / `17.16` / 0 / `17.16` |
| Global charges / gross / paid / outstanding | 18 / `24708.16` / `11111.00` / `13597.16` |
| Payments / allocations / vendor AP | unchanged |
| Canopy / PMX / Development | unchanged 4 / 1 / 12 |
| July hashes / totals | **identical** |
| Stripe / late fee / M5 | none |

No Stripe interaction. Optional same-ceremony manual payment is out of this certification.

---

## 13. Point of no return

**POINT OF NO RETURN CROSSED** = the first successful customer `INSERT` into `financial_charges` or `financial_payments` after `finance_ops_writes_enabled() = true`.

Does **not** cross it:

- deploying M4-APP
- applying `20260816080000`
- setting the guard true with no successful customer write

After it crosses:

- FIN-OPS is the sole operational write domain
- July stays historical / read-only
- do not automatically reopen July
- do not delete the new FIN-OPS row as rollback
- rollback must preserve post-cutover finance history

It is **not crossed** now.

---

## 14. Failure / containment

| Phase | State | Containment |
|-------|-------|-------------|
| **A** | Deploy failure before M4-RLS | Remain on `50204033` or roll back app. Guard stays false. July stays frozen. |
| **B** | M4-RLS apply failure, guard=false | Do not lift the guard. Repair/apply the certified file only. Do not replay unused M3 stamps. |
| **C** | Post-RLS validation failure | Keep guard false. Drop/revoke M4 write policies/grants if required. Do not reopen July. |
| **D** | Guard true, no successful customer write | `finance_ops_writes_set(false)`. Optionally revert C then B. Reconcile July vs FIN-OPS first. |
| **E** | First successful customer write occurred | **Do not** reopen July. **Do not** delete the new FIN-OPS row. Fix forward on FIN-OPS. |

For A–D the guard remaining false is the containment mechanism. For E, preserve post-cutover history.

---

## 15. Observability and STOP signals

| Signal | Expected now / during A–B | STOP / rollback |
|--------|---------------------------|-----------------|
| `finance_ops_writes_frozen` on authorized write before enable | expected | no |
| `finance_ops_writes_frozen` after enable on Erick/PM first-write | warning | stay in D; do not reopen July |
| Mike / FO / vendor / anon **403** | expected | incident if 200 + write — disable guard if pre-first-write |
| Mike denied only as `finance_ops_writes_frozen` | **not acceptable** on candidate | do not lift guard |
| `finance_m5_not_authorized` | expected on collections POST | incident if 201 |
| `stripe_payment_execution_disabled` | expected until separate auth | incident if a live Checkout session is created |
| `finance_july_frozen` / July hash change | expected if stale write tried / **incident if hash changes** | Phase E: fix forward; never unfreeze automatically |
| Unmatched FIN-OPS webhook / invented payment | refuse `pending_payment_missing` | incident if a payment row appears |
| Duplicate webhook `{ duplicate: true }` | expected retry | incident if second payment row |
| Allocation ≠ payment / missing ledger | n/a until first-write | fix forward on FIN-OPS |
| Cross-org 200 with other-org money | never | disable guard if pre-first-write |
| SaaS webhook touching `financial_*` | never | stop the mix; do not reopen July |
| Sustained `/api/finance/*` 5xx after enable | — | Phase D: disable guard; Phase E: fix forward |

---

## 16. Exact next Owner-authorized actions

This record authorizes **certification only**. Each later step needs its own Owner authorization:

1. Deploy M4-APP SHA `b8af9d6c2bcd3ff2ae82377b9dce797c6ea46741` while `finance_ops_writes_enabled() = false`
2. Apply certified `20260816080000` (SHA-256 `178f89d9…19846`) while the guard stays false
3. Revalidate freeze, Mike denial, SKU denial, State B frozen writes, and July hashes
4. Call `finance_ops_writes_set(true)` last
5. Execute the §12 first-write on UAT Property Demo — not Canopy, PMX, Development, or leaseless Clinic

Do not combine ENABLE with APP. Do not flip `stripe_payment_execution_enabled`. Do not implement M5.

---

## FINAL VERDICT

**READY FOR M4 PRODUCTION RELEASE**

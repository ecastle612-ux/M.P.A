# 162 — FIN-OPS Production Reconciliation M4 Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M4 IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR M4 PRODUCTION RELEASE CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — in-repo M4-APP + M4-RLS  
**Authority:** [docs/161](../161-fin-ops-production-reconciliation-m4-application-cutover-design/index.md) **Approved** · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/160](../160-fin-ops-production-reconciliation-m3-production-application-certification/index.md) · ADR-016 · ADR-033 · ADR-034 · ADR-035 · PLAT-002 · PLAT-005 · PLAT-006  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (read-only baseline only)  
**This package:** In-repo M4-APP + M4-RLS implementation and certification. **No Production deploy. No M4 migration apply. No `finance_ops_writes_set(true)`. No Production finance transaction. No July mutation. No M5. No Stripe/SKU/subscription change.**

---

## Verdict

**READY FOR M4 PRODUCTION RELEASE CERTIFICATION**

Implementation matches docs/161. Staff checkout no longer authorizes by role alone. Mike is denied before `service_role`. Authorized writes remain safe while `finance_ops_writes_enabled() = false`. M5 mutation routes stay hard-stopped. July has no application write path. The M4 write RLS migration exists in-repo and has **not** been applied to Production.

---

## What this package did not do

- Did not deploy M4
- Did not apply `20260816080000` to Production
- Did not call `finance_ops_writes_set(true)`
- Did not create a Production finance transaction
- Did not modify, reopen, archive, or drop July
- Did not enable `stripe_payment_execution_enabled`
- Did not implement M5 collections mutations
- Did not replay unused stamps `20260816070000` / `20260816070100` or S0/S1/S2
- Did not change SaaS Stripe pricing, subscriptions, SKUs, billing plans, roles, entitlements, or ADR-033 scopes
- Did not modify customer memberships

---

## 1. Exact application changes

| Path | Change |
|------|--------|
| `apps/web/src/lib/finance/checkout-authz.ts` | Staff checkout = `requireFinancePermission("pm.finance:charge.write")`. Resident = lease-self. SKU + execution-flag helpers. |
| `apps/web/src/app/api/finance/checkout/route.ts` | Authorization **before** `createServiceRoleClient()`. No role-only manager/admin check. Requires residential SKU and `stripe_payment_execution_enabled = true`. |
| `apps/web/src/lib/finance/finops-stripe-webhook.ts` | Pending-row resolver. Webhook must not invent a payment. |
| `apps/web/src/app/api/finance/webhooks/stripe/route.ts` | Completes only against an existing matching pending `financial_payments` row. Expired/failed only mark that pending row. |
| `apps/web/src/lib/finance/m5-hard-stop.ts` | M5 collection kinds + `finance_m5_not_authorized`. |
| `apps/web/src/app/api/finance/collections/route.ts` | Auth first, then hard-stop every M5 POST kind. GET remains read-safe. |
| `apps/web/src/lib/finance/billing-service.ts` | `loadResidentFinancialStatus` derive-only. `getLeaseLedger` no longer writes. Persist stays on write paths via `refreshResidentFinancialStatus`. |
| `apps/web/src/app/api/finance/resident/billing/route.ts` | GET uses derived ledger balance only. |
| `apps/web/src/app/api/finance/charges/route.ts` | Unchanged — already `pm.finance:charge.write`. |
| `apps/web/src/app/api/finance/payments/route.ts` | Unchanged — already `pm.finance:charge.write` (PLAT-006). |
| `/api/commerce/webhooks/stripe` | Unchanged. Isolated from FIN-OPS. |

---

## 2. Checkout authorization remediation

Removed:

```ts
membershipRoles.includes("property_manager") ||
membershipRoles.includes("organization_admin")
```

Staff branch is now:

```
authorizeFinanceCheckout
→ requireFinancePermission("pm.finance:charge.write", lease.organization_id)
```

That is SKU ∩ member operating scope ∩ `pm.finance:charge.write` ∩ action.

| Persona | Result |
|---------|--------|
| Erick / Complete + BOTH | allowed by capability |
| Sarah / Complete + PROPERTY | allowed by capability |
| Mike / Complete + FACILITY | **403 before `createServiceRoleClient()`** |
| PM SKU authorized manager | allowed |
| FO SKU | denied |
| tenant | lease-self only; no staff finance keys |
| vendor | denied from staff checkout |
| non-member | denied |

`finance_ops_writes_enabled()` is **not** used as RBAC. It remains the cutover safety control.

Checkout also refuses unless the org SKU allows residential finance and `financial_module_settings.stripe_payment_execution_enabled = true`. That flag was **not** flipped.

---

## 3. Write-route / capability mapping

| Route | Capability | Notes |
|-------|------------|-------|
| `POST /api/finance/charges` | `pm.finance:charge.write` | Compatible. User JWT. |
| `POST /api/finance/payments` | `pm.finance:charge.write` | PLAT-006 contract. No invented `payment.create`. |
| `POST /api/finance/checkout` staff | `pm.finance:charge.write` | Remediating. |
| `POST /api/finance/checkout` resident | lease-self | Never `pm.finance:*`. |
| `POST /api/finance/reminders` | `pm.finance:charge.write` | Notification only. |
| `POST /api/finance/vendor-invoices` create/review | `pm.finance:vendor_invoice.review` | Compatible. |
| `POST /api/finance/vendor-invoices` schedule/mark_paid | `pm.finance:vendor_payment.release` | Compatible. |
| `POST /api/finance/collections` M5 kinds | auth then `finance_m5_not_authorized` | Hard-stopped. |
| `POST /api/finance/webhooks/stripe` | Stripe signature | Pending-row only. |

No new capability names. No role-only, SKU-only, `is_org_manager`-only, or generic org-member finance authorization.

---

## 4. Service_role trust-boundary verification

| Path | Auth before trusted mutate | Proof |
|------|----------------------------|-------|
| Checkout pending insert | `authorizeFinanceCheckout` before `createServiceRoleClient()` | Route source + checkout route test: Mike 403, `createServiceRoleClient` not called |
| Checkout session update | same request after authorized insert | Same request |
| FIN-OPS webhook | Stripe signature, then pending-row match | Missing pending → `pending_payment_missing`; `applySucceededPayment` not called |
| Staff charges / payments | `requireFinancePermission` then user JWT | Unauthorized never reaches `createOneTimeCharge`; authorized frozen error is `finance_ops_writes_frozen` |
| SaaS commerce webhook | separate secret / handler | Does not import FIN-OPS payment apply |

Webhook completion always passes `paymentId`. It does not take `applySucceededPayment`'s insert-without-id branch.

---

## 5. M4 RLS / grant changes

New successor after live Production M3A `20260816064707`:

`supabase/migrations/20260816080000_docs_161_fin_ops_reconciliation_m4_write_rls.sql`

**Stored SQL SHA-256:** `178f89d9b70519ca6d7fd61b8bbe670075fd8832e5b78f1385cbf66e40119846`

Staff write condition on every A policy:

```
member_has_finance_capability(organization_id, '<PLAT-006 key>')
```

| Table | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|
| `financial_charges`, `financial_charge_schedules`, `financial_payments` | `charge.write` | `charge.write` | deny |
| allocations, receipts, notifications | `charge.write` | no grant | deny |
| `financial_ledger_entries` | `charge.write` **or** `vendor_payment.release` | no grant | deny |
| `financial_vendor_invoices` | `vendor_invoice.review` | same | deny |
| `financial_vendor_payments` | `vendor_payment.release` | same | deny |
| late-fee / delinquency / arrangements / Connect / settings / webhook / lineage | **deny** | **deny** | deny |

M3 SELECT policies were not dropped or rewritten. No anon grants. No new `SECURITY DEFINER` function. No `is_org_manager` / `is_org_member` / role-only / SKU-only fallback.

---

## 6. Proof the write guard is not lifted

| Check | Result |
|-------|--------|
| Migration source contains `finance_ops_writes_set(` | **absent** |
| Live Production `finance_ops_writes_enabled()` | **false** (read-only check 2026-08-16) |
| Live Production M4 stamp `20260816080000` | **absent** |
| Authorized charge POST with guard false | reaches service, surfaces `finance_ops_writes_frozen` |
| Unauthorized charge / checkout | 403 **Forbidden**, no mutation |

Expected split state after later M4-APP deploy (still not this package):

- READS: M3 RLS
- AUTHORIZED WRITES: reach DB, fail `finance_ops_writes_frozen`
- UNAUTHORIZED WRITES: fail authorization first
- Mike: authorization denial, not merely frozen

---

## 7. Proof M5 stays disabled

`POST /api/finance/collections` kinds `policy`, `assess_late_fees`, `sync_delinquency`, `reminder`, `arrangement`:

1. `requireFinancePermission` for the kind's existing capability
2. then `403` `{ error: "finance_m5_not_authorized" }`

Mutation services are not called. M4 RLS grants no write on late-fee, delinquency, or arrangement tables. Late fees remain future-only. Connect remains `not_started`.

---

## 8. Proof July has no application write path

Searched `apps/web` TypeScript for `.from("<july table>")` on:

`rent_charges`, `payments`, `payment_receipts`, `payment_customers`, `billing_ledger_entries`, `financial_activity`, `expenses`, `owner_statements`, `vendor_invoices`, `vendor_payments`

**Zero matches.** M4 does not create dual-write behavior. July remains read-only.

---

## 9. Tests

| Suite | Result |
|-------|--------|
| New M4 checkout / RLS / webhook / collections / charges tests | **42 passed** |
| `apps/web` finance + ADR-033 + PLAT-006 + PLAT-005 (`docs-135-rls`) + PLAT-002 RLS | **12 files / 92 passed** |
| `@mpa/shared` operating-scope + finance | **6 files / 32 passed** |

Required proofs:

1. Checkout manager branch no longer role-only — **pass**
2. Erick / Complete + BOTH authorized — **pass**
3. Sarah / Complete + PROPERTY authorized — **pass**
4. Mike / FACILITY denied before `service_role` — **pass**
5. PM SKU authorized manager allowed — **pass**
6. FO SKU denied — **pass**
7. Tenant cannot obtain staff finance authority — **pass**
8. Vendor cannot obtain staff finance authority — **pass**
9. Non-member denied — **pass**
10. Authenticated staff write policies require `member_has_finance_capability` — **pass**
11. Complete FACILITY + `property_manager` + grants still cannot write finance — **pass**
12. Stored BOTH cannot expand a single-product SKU — **pass**
13. Guard false: authorized M4 writes fail with write guard — **pass**
14. Unauthorized fail authorization rather than the guard — **pass**
15. No July application write — **pass**
16. M5 mutation paths remain disabled — **pass**
17. SaaS commerce Stripe webhook isolated — **pass**
18. Existing M3 SELECT contract remains in M3A and is not weakened by M4 — **pass**
19. ADR-033 tests remain green — **pass**
20. PLAT-006 finance authorization tests remain green — **pass**
21. PLAT-005 security tests remain green — **pass**

---

## 10. Lint / typecheck / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/web lint` | **pass** |
| `pnpm --filter @mpa/shared lint` | **pass** |
| `pnpm --filter @mpa/web typecheck` | **pass** |
| `pnpm --filter @mpa/shared typecheck` | **pass** |
| Production `next build` | **pass** — compiled successfully; `/api/finance/checkout`, `/api/finance/webhooks/stripe`, `/api/commerce/webhooks/stripe` present |

---

## 11. Read-only Production baseline

Checked read-only on `mpa-prod` / `vahnmcrpnuggxkivynvo`. **No apply. No setter. No money write.**

| Item | Live |
|------|------|
| `finance_ops_writes_enabled()` | **false** |
| M3B | `20260816064447` / `docs_157_fin_ops_reconciliation_m3b` |
| M3A | `20260816064707` / `docs_157_fin_ops_reconciliation_m3a` |
| Unused repo stamps `20260816070000` / `20260816070100` | **absent** |
| M4 stamp `20260816080000` | **absent** |
| FIN-OPS charges / gross / paid | 17 / `24691.00` / `11111.00` |
| Payments / allocations | 11 / 11 |
| Any `stripe_payment_execution_enabled` | **false** |
| Connect rows not `not_started` | **0** |
| Late-fee policies | **0** |
| July | unchanged from docs/160 — still frozen / read-only |
| Point of no return | **not crossed** |

---

## 12. Exact next Production certification gate

**M4 PRODUCTION RELEASE CERTIFICATION** — separate Owner authorization.

That later gate, not this package, is the only place that may:

1. Deploy the remediating M4-APP SHA while the guard stays false
2. Apply `20260816080000` while the guard stays false
3. Re-validate freeze, Mike denial, SKU denial, and July hashes
4. Call `finance_ops_writes_set(true)` as the last explicit write-enable
5. Perform the controlled first write on a SKU-entitled UAT org — not Canopy, PMX, or Development

---

## FINAL VERDICT

**READY FOR M4 PRODUCTION RELEASE CERTIFICATION**

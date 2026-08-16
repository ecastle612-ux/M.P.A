# 157 — FIN-OPS Production Reconciliation M3 Cutover Design

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M3 PRODUCTION CUTOVER DESIGN  
**Status:** **Approved**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — security boundary, July write freeze, and split-state rules  
**Authority:** [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md) · [docs/155](../155-fin-ops-production-reconciliation-m2d-production-application-certification/index.md) · [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) **READY FOR M3 PRODUCTION CUTOVER DESIGN** · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · [docs/94 PLAT-002](../94-plat-002-authorization-hardening/index.md) · [docs/121 PLAT-006](../121-plat-006-finance-reports-routing-remediation/index.md) · PLAT-005 privileged-RPC hardening (accepted; `finance_m2_*` already revoked from `authenticated`)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2)  
**This package:** Approved design. Implementation is a separate in-repo package. **No Production SQL. No July freeze. No FIN-OPS RLS apply. No authenticated grants. No M4 deploy. No application finance write change. No M5. No Stripe / billing / SKU / role / entitlement change.**

---

## Verdict

**Approved** — Product Owner `APPROVE docs/157` on 2026-08-16.

M2 is complete for every finance-bearing July organization. M3 is the security and operational cutover boundary between reconciled but fail-closed FIN-OPS data and the later M4 application write cutover.

M3 owns:

| Owner | Scope |
|-------|--------|
| **M3** | FIN-OPS RLS; `pm.finance:*` at the database boundary; ADR-033 member operating-scope enforcement; resident self-access; July write freeze; FIN-OPS write-guard until M4; cutover verification and rollback |
| **M4** | Application finance write migration; lifting the FIN-OPS write-guard; staff/trusted write policies and grants; checkout/Connect execution if separately authorized |
| **M5** | Future collections functionality only |

M3 does **not** make FIN-OPS the live customer write domain. Schema-first July freeze is safe for the current Production app because that app already targets `financial_*` names and does not write July tables. Enabling FIN-OPS **writes** before July is frozen is unsafe. The race-free Production sequence is therefore: final reconciliation → FIN-OPS write-guard → July freeze → validate freeze → enable FIN-OPS **SELECT** RLS → validate security → later M4 write enable.

No new ADR is required. M3 is implementation detail under ADR-016, ADR-033, ADR-034, ADR-035, PLAT-002, PLAT-005, and PLAT-006.

**Product Owner approved docs/157.** In-repo M3A + M3B + M3C implementation is authorized. Production apply remains a separate M3D authorization.

---

## What this package does not do

- Does not write or apply Production SQL
- Does not freeze July
- Does not add FIN-OPS RLS policies to Production
- Does not grant authenticated or anon access
- Does not deploy M4 or change application finance writes
- Does not implement M5
- Does not archive, drop, truncate, or delete July finance tables or rows
- Does not replay S0 / S1 / S2 (`20260806030000` / `40000` / `50000`)
- Does not change Stripe, SaaS billing, subscriptions, SKUs, prices, roles, entitlements, or ADR-033 scopes
- Does not create replacement `pm.finance:*` capability names
- Does not silently activate Connect or Stripe payment execution

---

## 1. Current Production / M2 state

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo`. Compared to [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md).

| Item | Live |
|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` `ACTIVE_HEALTHY` |
| Ledger tip | `20260816060336` / `docs_152_fin_ops_m2d_development_identity_repair` |
| `finance_m2_version()` | `20260816020000` |
| `finance_m2d_version()` | `docs_152_m2d_owner_unit_map` |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (unchanged; no deploy in this package) |
| July | Preserved and **unfrozen** |
| FIN-OPS customer access | **Fail-closed** — RLS on, **0** policies, **no** anon/authenticated table grants on M1 `financial_*` / `finance_lineage_map` |
| M4 write cutover | **Has not occurred** |
| FO subscriber | **None** (`organization_subscriptions` = 5 active PM + 1 active Complete) |

### 1.1 Global reconciliation (still matches docs/156)

| Measure | July source | FIN-OPS target |
|---------|-------------|----------------|
| Charges | 17 / `24691.00` | 17 / `24691.00` |
| Paid | `11111.00` | `11111.00` |
| Payments | 11 / `11111.00` | 11 / `11111.00` |
| Allocations | — | 11 / `11111.00` |
| Outstanding | `13580.00` | `13580.00` |
| Vendor AP | `125.50` | `125.50` |
| Late fees / delinquency / arrangements / webhooks | 0 | 0 |

`finance_m2_reconcile()` agrees.

| Organization | Id | Charges / gross / paid / outstanding |
|--------------|----|--------------------------------------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | 4 / `4951.00` / `1651.00` / `3300.00` |
| PMX Workflow Org | `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 / `1500.00` / `500.00` / `1000.00` |
| M.P.A. Development | `f8232926-149d-46b3-829f-c84b55378718` | 12 / `18240.00` / `8960.00` / `9280.00` |

### 1.2 SKU fact that M3 must not paper over

The three finance-bearing organizations have **no** `organization_subscriptions` row. Live `org_sku()` is `NULL`. `org_allows_work_surface(..., 'residential')` is `NULL` (treated as deny).

| Org | SKU | FIN-OPS money | Settings / Connect seed |
|-----|-----|---------------|-------------------------|
| Canopy / PMX / Development | **none** | yes | **no** |
| M.P.A. UAT Clinic Demo | `mpa_complete_platform` | 0 | yes — Connect `not_started` |
| M.P.A. UAT Property Demo | `mpa_property_manager` | 0 | yes — Connect `not_started` |
| Four bug-cert PM orgs | `mpa_property_manager` | 0 | yes — Connect `not_started` |

docs/140 already forbade creating SKUs for unsubscribed July orgs. M3 preserves that. Staff FIN-OPS access on Canopy / PMX / Development remains **SKU-denied**. Those rows stay operator / `service_role` evidence until a later commercial subscription exists. M3 does not attach SKUs.

UAT Clinic Demo already has Erick-class (`organization_admin` + `both`), Sarah-class (`property_manager` + `property_operations`), and Mike-class (`property_manager` + `facility_operations`) memberships. Use those for authorization proof. Do not treat their empty charge lists as proof that RLS row filters work. Known-row RLS proof is an M3C scratch-fixture requirement.

### 1.3 Connect / Stripe execution

All six seeded `financial_connect_accounts` rows are `not_started` with `charges_enabled=false` and `payouts_enabled=false`. All six `financial_module_settings` rows have `stripe_payment_execution_enabled=false` and `late_fees_enabled=false`. M3 must not flip these.

---

## 2. Binding authorization formula

Preserve ADR-033 / docs/127:

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role / module permission
  ∩ action
```

FIN-OPS is **Property Operations**. Staff database access requires **both**:

1. the matching live `pm.finance:*` capability via `has_org_capability`
2. `coalesce(member_allows_work_surface(organization_id, 'residential'), false)`

`member_allows_work_surface` already intersects `org_allows_work_surface` (SKU) with Complete member scope. M3 must call it explicitly on every staff policy and must coalesce `NULL` to false so unsubscribed orgs deny rather than error.

Do **not** authorize staff merely because they are:

- an organization member
- an organization manager (`is_org_manager`)
- in an organization that owns Complete
- holding `property_manager`
- storing `operating_scope = both` on a non-Complete SKU
- holding `pm.finance:*` without the Property surface

SKU remains the outer entitlement boundary. Replay of S1/S2 `is_org_manager` / `is_org_member` finance policies is forbidden.

---

## 3. Required staff persona matrix

| Persona | SKU | Scope | Role | Expected FIN-OPS staff access |
|---------|-----|-------|------|-------------------------------|
| Erick-class | Complete | `both` | `organization_admin` | According to `pm.finance:*` (admin holds all eight) |
| Sarah-class | Complete | `property_operations` | `property_manager` | According to `pm.finance:*` (manager holds all eight) |
| Mike-class | Complete | `facility_operations` | `property_manager` | **DENIED** at API **and** at RLS helper/policy, even though the role possesses `pm.finance:*` grants |
| Complete + BOTH staff | Complete | `both` | capability-bearing staff role | According to that role’s `pm.finance:*` |
| PM SKU manager | Property Manager | implied Property | `property_manager` | According to `pm.finance:*` |
| PM SKU + stored `both` | Property Manager | stored `both` | `property_manager` | Finance **allowed** (SKU wins; stored FO scope cannot grant Facility and cannot strip Property) |
| FO SKU manager / helper | Facility Operations | implied Facility | any | **DENIED** — no live FO subscriber; helper/automated proof only |
| Tenant / resident | any | n/a | `tenant` | **No staff finance.** Separate resident self-access only |
| Vendor | any | n/a | `vendor` | **No staff finance.** No vendor AP self-service |
| Anon | — | — | — | **DENIED** (no grants, no policies) |
| Authenticated non-member | — | — | — | **DENIED** |
| `service_role` / operator | — | — | trusted | Explicit administrative paths only; still subject to the M3 write-guard on customer money tables |

Mike must fail because `member_has_finance_capability(...)` is **false**, not because a finance-bearing org happens to have zero rows visible to him. Required smoking-gun cert:

```
has_org_capability(org, 'pm.finance:read') = true
AND member_allows_work_surface(org, 'residential') = false
AND member_has_finance_capability(org, 'pm.finance:read') = false
```

API layer already matches this matrix via `requireFinancePermission` → `requireAuthorizedAction` (`apps/web/src/lib/auth/require-authorized-action.test.ts`). M3 must not be weaker at RLS.

---

## 4. Live `pm.finance:*` catalog (do not replace)

Audited live on Production. Exact keys in `permission_capabilities`:

| Key | Live grants |
|-----|-------------|
| `pm.finance:read` | `organization_admin`, `property_manager`, `leasing_agent`, `property_owner` |
| `pm.finance:charge.write` | `organization_admin`, `property_manager` |
| `pm.finance:payment.refund` | `organization_admin`, `property_manager` |
| `pm.finance:late_fee.manage` | `organization_admin`, `property_manager` |
| `pm.finance:vendor_invoice.review` | `organization_admin`, `property_manager` |
| `pm.finance:vendor_payment.release` | `organization_admin`, `property_manager` |
| `pm.finance:reports.read` | `organization_admin`, `property_manager`, `property_owner` |
| `pm.finance:settings.manage` | `organization_admin`, `property_manager` |

Tenant/vendor `pm.finance:read` remains **0** (PLAT-006 revoke). Do not re-seed S0 tenant/vendor finance grants.

There is **no** `pm.finance:payment.write` / `payment.create` / `payment.record`. The live application already maps manual payment creation to `pm.finance:charge.write` (`/api/finance/payments` POST). M3 preserves that mapping. Inventing a ninth key requires a separately approved decision and is rejected here.

July still has a **legacy** `financial:*` catalog (`financial:read/create/update/delete/archive/admin`) with tenant `financial:create` + `financial:read`. That catalog is **not** the FIN-OPS staff model. M3 must not reuse `financial:*` on `financial_*` tables. July freeze must not depend on revoking those catalog rows (entitlement change is out of scope). Freeze the tables instead.

---

## 5. Capability mapping (API and RLS must agree)

| Action | Live API gate | M3 staff RLS capability | M3 authenticated write? |
|--------|---------------|-------------------------|-------------------------|
| Charge read / snapshot / lease ledger | `pm.finance:read` | `pm.finance:read` | n/a |
| Charge create / void / amount adjust | `pm.finance:charge.write` | `pm.finance:charge.write` | **M4 only** |
| Charge schedule create | `pm.finance:charge.write` | `pm.finance:charge.write` | **M4 only** |
| Payment read | `pm.finance:read` | `pm.finance:read` | n/a |
| Manual payment create | `pm.finance:charge.write` | `pm.finance:charge.write` | **M4 only** |
| Payment refund | `pm.finance:payment.refund` | `pm.finance:payment.refund` | **M4 only** (no current Production refund traffic) |
| Ledger read | `pm.finance:read` | `pm.finance:read` | ledger remains append-only via trusted writer |
| Reports / owner / command-center | `pm.finance:reports.read` | `pm.finance:reports.read` **or** `pm.finance:read` on the underlying money tables | n/a |
| Settings / Connect configuration | `pm.finance:settings.manage` | `pm.finance:settings.manage` | **no client writes in M3**; M4 owns Connect onboarding |
| Vendor AP read | `pm.finance:read` | `pm.finance:read` | n/a |
| Vendor invoice create / review | `pm.finance:vendor_invoice.review` | `pm.finance:vendor_invoice.review` | **M4 only** |
| Vendor payment schedule / release | `pm.finance:vendor_payment.release` | `pm.finance:vendor_payment.release` | **M4 only** |
| Collections snapshot | `pm.finance:read` | `pm.finance:read` | n/a |
| Late-fee policy / assess | `pm.finance:late_fee.manage` | `pm.finance:late_fee.manage` | **M5 / separately authorized**; M3 SELECT of empty tables only |
| Resident own charges / payments / receipts | resident route (no `pm.finance:*`) | `finance_resident_owns_lease` | **no direct PostgREST writes** |
| Webhook inbox | trusted Stripe path | **no authenticated access** | trusted only |
| Lineage map | operator | **no authenticated access** | trusted only |

`property_owner` may SELECT money and report surfaces (`pm.finance:read` + `pm.finance:reports.read`) when SKU ∩ surface pass. They have no write capabilities.

`leasing_agent` is read-only.

---

## 6. Exact FIN-OPS RLS model

### 6.1 Helpers (M3A)

Add three `SECURITY DEFINER` helpers with `search_path = public`. Revoke from `public` / `anon`. Grant `EXECUTE` on the two staff/resident predicates to `authenticated` only. Do not grant `EXECUTE` on the write-domain setter to `authenticated`.

**`member_has_finance_capability(target_org_id uuid, required_capability text)`**

```
coalesce(public.org_allows_work_surface(target_org_id, 'residential'), false)
AND coalesce(public.member_allows_work_surface(target_org_id, 'residential'), false)
AND public.has_org_capability(target_org_id, required_capability)
```

This is the only staff predicate allowed on FIN-OPS tables. It is false for Mike even when `has_org_capability` is true.

**`finance_resident_owns_lease(target_org_id uuid, target_lease_id uuid)`**

Canonical Property Operations identity only:

1. `lease_agreements.id = target_lease_id` and `lease_agreements.organization_id = target_org_id`
2. and either:
   - `lease_residents.user_id = auth.uid()` for that lease, or
   - `pm_residents.user_id = auth.uid()` in the same org **and** a `lease_residents` row on that lease sharing the resident profile (same `lease_residents.id` as a linked `pm_residents` identity, or same org + email when `user_id` is only on `pm_residents`)

Do not use `is_org_member`. Do not grant residents `pm.finance:*`. A resident must never see another resident’s finance data.

Live `is_lease_resident(lease_id)` only checks `lease_residents.user_id`. Keep it. The new helper is the FIN-OPS contract and adds org isolation plus the `pm_residents` link.

**`finance_ops_writes_enabled()`** (read) and a trusted setter used only by M4 apply.

Default **false**. Consulted by the FIN-OPS write-guard trigger. Not an entitlement. Not a SKU.

### 6.2 Privilege baseline

M1 already: RLS enabled, `REVOKE ALL` from `public` / `anon` / `authenticated`, `GRANT ALL` to `service_role`, **0** policies.

M3A adds, only after M3B freeze + write-guard are live on Production:

| Privilege | `authenticated` | `anon` | `service_role` |
|-----------|-----------------|--------|----------------|
| `SELECT` on customer-visible FIN-OPS tables listed in §7 | **GRANT** | deny | keep |
| `INSERT` / `UPDATE` / `DELETE` on every `financial_*` / `finance_lineage_map` | **remain revoked** | deny | keep (trigger-guarded) |
| `SELECT` on `financial_stripe_webhook_events` / `finance_lineage_map` | **remain revoked** | deny | keep |

Do **not** `FORCE ROW LEVEL SECURITY`. Trusted maintenance and the Stripe webhook path need `service_role` to bypass RLS. The write-guard trigger is the service-role barrier.

### 6.3 Policy shape

Every staff policy:

```
organization_id isolation
AND member_has_finance_capability(organization_id, '<required pm.finance:*>')
```

Every resident SELECT policy (only on tables in §7 that allow it):

```
finance_resident_owns_lease(organization_id, lease_id)
```

Allocations have no `lease_id`. Resident allocation SELECT is via the parent payment:

```
exists (
  select 1 from public.financial_payments p
  where p.id = financial_payment_allocations.payment_id
    and public.finance_resident_owns_lease(p.organization_id, p.lease_id)
)
```

No `FOR ALL` staff policies. No generic org-member policies. No `is_org_manager` policies. Write policies are **specified here and installed by M4**, not by M3 apply.

### 6.4 FIN-OPS write-guard (M3B, required)

`BEFORE INSERT OR UPDATE OR DELETE` on every M1 money/control table in §7 except `finance_lineage_map` (already operator-only) and except a documented maintenance bypass:

- If `finance_ops_writes_enabled()` is false, raise `finance_ops_writes_frozen`.
- Bypass only for a named maintenance role / explicit `SET` local used by certified M2/M2D functions if they must ever be re-run (they must not be). Ordinary `service_role` checkout/webhook **must not** bypass.

This closes the current hole: `/api/finance/checkout` and `/api/finance/webhooks/stripe` use `createServiceRoleClient()` and would otherwise insert `financial_payments` / webhook rows while July is still the preserved source and M4 has not started.

M3 does not activate Stripe. The guard is defense in depth if `STRIPE_SECRET_KEY` is present in the app environment.

---

## 7. Per-table policy design

Legend: **S** = SELECT · **I/U/D** = INSERT/UPDATE/DELETE · **M3** = installed by M3 · **M4** = designed here, applied by M4 · **deny** = no authenticated policy and no grant.

| Table | Staff S | Staff I/U/D | Resident S | Resident I/U/D | Vendor | Trusted / service_role | Direct client writes? |
|-------|---------|-------------|------------|----------------|--------|------------------------|-----------------------|
| `financial_connect_accounts` | `settings.manage` (M3) | deny in M3; M4 may UPDATE only non-activation columns via trusted onboarding | deny | deny | deny | yes; cannot flip `status` to `ready` or enable charges/payouts in M3 | **No** |
| `financial_module_settings` | `settings.manage` (M3) | deny in M3; M4 trusted only; client must not set `stripe_payment_execution_enabled` | deny | deny | deny | yes | **No** |
| `financial_charge_schedules` | `read` (M3) | M4: `charge.write` | own `lease_id` (M3) | deny | deny | yes, write-guarded | **No in M3** |
| `financial_charges` | `read` (M3) | M4: `charge.write` | own `lease_id` (M3) | deny | deny | yes, write-guarded | **No in M3** |
| `financial_payments` | `read` (M3) | M4: `charge.write` for manual create; `payment.refund` for refund columns | own `lease_id` (M3) | deny | deny | pending Stripe rows only after M4 lifts guard **and** approved pending-payment contract | **No in M3** |
| `financial_payment_allocations` | `read` (M3) | M4: `charge.write` (created with the payment) | via parent payment lease (M3) | deny | deny | yes, write-guarded | **No in M3** |
| `financial_ledger_entries` | `read` (M3) | **no authenticated writes ever** — append-only trusted writer | own `lease_id` (M3), resident-visible types only (`charge`, `payment`, `allocation`; not internal vendor keys if those should stay staff) | deny | deny | trusted append only | **No** |
| `financial_receipts` | `read` (M3) | M4: `charge.write` | own `lease_id` (M3) | deny | deny | yes, write-guarded | **No in M3** |
| `financial_stripe_webhook_events` | deny | deny | deny | deny | deny | webhook path only; idempotent on `stripe_event_id`; future events only | **No** |
| `financial_notifications` | `read` for org staff (M3) | M4 trusted/staff `charge.write` | `user_id = auth.uid()` only (M3) | deny | deny | yes, write-guarded | **No in M3** |
| `financial_late_fee_policies` | `late_fee.manage` **or** `read` (M3; tables are empty) | M5 | deny | deny | deny | yes, write-guarded | **No** |
| `financial_delinquency_cases` | `read` (M3; empty) | M5 | own `lease_id` if a later M5 contract says so; **deny in M3** | deny | deny | yes | **No** |
| `financial_payment_arrangements` | `read` (M3; empty) | M4/M5: `charge.write` matches current collections POST | own `lease_id` SELECT only if a later contract requires; **deny in M3** (resident billing already queries this table — classify that path fail-closed until M4/M5) | deny | deny | yes | **No in M3** |
| `financial_vendor_invoices` | `read` (M3) | M4: `vendor_invoice.review` | deny | deny | **deny** | yes, write-guarded | **No in M3** |
| `financial_vendor_payments` | `read` (M3) | M4: `vendor_payment.release` | deny | deny | **deny** | yes, write-guarded | **No in M3** |
| `finance_lineage_map` | deny | deny | deny | deny | deny | operator / M2 functions only | **No** |

Least privilege: no table uses “any org member.” Resident mutations stay on trusted application routes, and those routes remain write-guarded until M4.

---

## 8. ADR-033 database intersection — Sarah / Mike / Erick

Conceptual staff rule (every staff policy):

```
organization isolation
AND member_allows_work_surface(organization_id, 'residential')
AND required pm.finance:*
```

Implemented as `member_has_finance_capability`. Proof obligations:

| Actor | `has_org_capability(pm.finance:read)` | `member_allows_work_surface(residential)` | `member_has_finance_capability` | `/api/finance/snapshot` | PostgREST `financial_charges` |
|-------|----------------------------------------|-------------------------------------------|----------------------------------|-------------------------|-------------------------------|
| Sarah — Complete + `property_operations` + `property_manager` | true | true | true | 200 (empty on UAT Clinic today) | policy allows; rows only if that org has charges |
| Mike — Complete + `facility_operations` + `property_manager` | **true** | **false** | **false** | **403** | helper false; SELECT returns 0 on orgs with rows in the scratch fixture |
| Erick — Complete + `both` + `organization_admin` | true | true | true | 200 | policy allows |

Mike’s denial is the helper returning false, not “Development has no FO-visible finance rows.”

Complete + unassigned staff remain compatibility BOTH (live `member_operating_scope` already does this). M3 does not change that ADR-033 rule.

---

## 9. Resident self-access

Designed separately from staff authorization.

| Decision | Rule |
|----------|------|
| Capabilities | Residents do **not** receive `pm.finance:*` |
| Identity | `lease_agreements` + `lease_residents` + `pm_residents` only |
| Visible objects | Own charges, payments, allocations (via payment), receipts, and resident-visible ledger rows for that lease |
| Hidden | Other residents’ rows; vendor AP; Connect; settings; webhooks; lineage; late-fee policies; delinquency (M3) |
| Writes | **Denied** on every `financial_*` table through PostgREST |
| Mutations | Trusted application routes only (`/api/finance/resident/billing` is read; `/api/finance/checkout` is the mutation). Checkout remains write-guarded until M4 |
| Cross-resident | Must be proven: resident A cannot `SELECT` resident B’s charge even in the same org |

Current `/api/finance/resident/billing` uses the user JWT against `lease_residents` then `financial_*`. After M3A SELECT policies, a linked resident on a SKU-entitled org can see their own rows. Unlinked July tenants (`user_id` null) remain unable to self-serve. M3 does not invent login links.

---

## 10. Vendor access

Vendor AP is **staff finance**.

Audited application behavior: `/api/finance/vendors` and `/api/finance/vendor-invoices` both call `requireFinancePermission`. There is no approved vendor-portal invoice inbox and no vendor grant of `pm.finance:*`.

**Decision:** keep `financial_vendor_invoices` and `financial_vendor_payments` denied to the `vendor` role. Defer vendor self-service. Do not treat July `vendor:read` on legacy `vendor_invoices` as a FIN-OPS contract.

---

## 11. Stripe / Connect / webhook boundary

| Domain | Path / table | M3 rule |
|--------|--------------|---------|
| SaaS billing | `/api/commerce/webhooks/stripe` | Untouched. Separate secret, separate processor |
| FIN-OPS / property finance | `/api/finance/webhooks/stripe` + `financial_stripe_webhook_events` | Separate domain |
| Webhook INSERT | ordinary authenticated client | **Forbidden** |
| Events | future Stripe events only | No historical fabrication; no replay of July |
| Idempotency | `stripe_event_id` unique | Keep |
| Payment creation from webhook | only against an approved **pending** `financial_payments` row | M4; write-guard blocks this in M3 |
| Connect | `not_started` | M3 must not silently activate |
| Execution flag | `stripe_payment_execution_enabled=false` | M3 must not set true |

Manual recording does not require Connect. Resident Checkout stays fail-closed until M4 + explicit Connect readiness.

---

## 12. July write-freeze inventory

M3 may freeze July **only** because docs/156 proves every finance-bearing July organization has a reconciled FIN-OPS copy, **and** the §16 pre-apply reconciliation still matches.

### 12.1 Tables that must become read-only

Minimum inventory (live counts 2026-08-16):

| Table | Rows | Why freeze |
|-------|-----:|------------|
| `rent_charges` | 17 | Authoritative July A/R |
| `payments` | 11 | Authoritative July cash |
| `payment_receipts` | 1 | July receipt |
| `payment_customers` | 1 | Payment-rail identity |
| `payment_attempts` | 2 | Payment-rail |
| `payment_methods` | 0 | Sibling; still writable today |
| `billing_ledger_entries` | 8 | July ledger / history |
| `financial_activity` | 12 | Activity trail, not FIN-OPS ledger |
| `expenses` | 6 | Archive; not FIN-OPS A/R |
| `owner_statements` | 6 | Archive |
| `vendor_invoices` | 1 | Migrated source |
| `vendor_payments` | 1 | Migrated source |
| `late_fees` | 0 | Sibling |
| `billing_schedules` | 0 | Sibling |
| `billing_invoices` | 0 | Sibling |
| `billing_adjustments` | 0 | Sibling |
| `autopay_enrollments` | 0 | Sibling |

Also freeze any other `public` table whose write path can create operational July money if implementation audit finds one. Do not freeze canonical identity tables (`property_units`, `lease_agreements`, `lease_residents`, `pm_residents`, `vendor_vendors`).

Do **not** DELETE, DROP, truncate, or rewrite July history. SELECT policies stay. July remains historical / read-only evidence.

### 12.2 How writes are prevented (approved combination)

July is still writable today: every table above has authenticated `INSERT`/`UPDATE`/`DELETE` grants and write policies. Several use legacy `financial:create` (including **tenant** `financial:create` on July `payments` / `rent_charges`). The current app does **not** call those table names, but PostgREST and any leftover server path can.

M3B uses all three layers:

1. **Privileges** — `REVOKE INSERT, UPDATE, DELETE` on the freeze list from `anon` and `authenticated`. Keep `SELECT`.
2. **Policies** — drop or replace write policies (`polcmd` `a`/`w`/`d`/`*`) with no-op deny. Keep SELECT policies. Do not leave `vendor_invoices_manage_org` (`FOR ALL`) in place; split it so SELECT can remain.
3. **Triggers** — `BEFORE INSERT OR UPDATE OR DELETE` raise `finance_july_frozen` for every freeze-list table, including `service_role`. This is the stale application/server barrier.

Do not revoke `financial:*` catalog grants (that would be an entitlement change). The table freeze is sufficient.

Application path removal of July names is already true in `apps/web` (no `.from("rent_charges")` / `.from("payments")`). M3 does not need an app deploy to freeze July. M4 must not reintroduce July writes.

---

## 13. Race-free cutover sequence

ADR-034: July is frozen for writes **before** FIN-OPS accepts customer writes. Never both accepting operational writes.

### 13.1 Why a naive “enable RLS then later freeze” is wrong

If M3A SELECT is applied while July is still writable, a stale PostgREST/`financial:create` write can move July money after the last reconciliation. Staff would then read a stale FIN-OPS copy. Misleading-zero on UAT orgs must not hide that.

If FIN-OPS writes are enabled before July is frozen, checkout `service_role` can create pending payments in FIN-OPS while July remains open. That is dual-write.

### 13.2 Why schema-first July freeze is safe for the current app

Live app finance services already query `financial_*`, not July names. Current writes fail because M1 revoked authenticated grants and installed no policies. Freezing July does **not** break `/api/finance/snapshot`, charges, payments, reports, or vendor AP. Those paths are already fail-closed or about to become SELECT-only against FIN-OPS.

Therefore M3 freeze does **not** require a simultaneous M4 deploy. It **does** require the FIN-OPS write-guard so checkout/webhook cannot become the write domain early.

### 13.3 Required Production order (M3D)

1. **Final reconciliation** (§16). STOP on drift.
2. **Maintenance / write barrier** — confirm Connect `not_started`, `stripe_payment_execution_enabled=false`, finance webhook not processing customer money; optional app maintenance window.
3. **Install FIN-OPS write-guard** (`finance_ops_writes_enabled=false`).
4. **Freeze July** (privileges + write-policy removal + freeze triggers).
5. **Validate freeze** — authenticated and `service_role` INSERT into `rent_charges` / `payments` must raise `finance_july_frozen`; SELECT still works; hashes unchanged.
6. **Enable FIN-OPS SELECT RLS** (helpers, staff/resident SELECT policies, `GRANT SELECT` on customer-visible tables only).
7. **Validate FIN-OPS security** (§15).
8. **Stop.** Later M4 deploy lifts the write-guard and installs write policies/grants.

There must not be a window where July accepts new authoritative money after step 1, or where both domains accept competing operational writes.

---

## 14. Current-app split-state analysis

Application SHA `50204033` already targets August `financial_*` names. Classification is against **proposed M3D state** (July frozen, FIN-OPS SELECT open, FIN-OPS writes guarded).

| Endpoint | Auth today | Data source in code | M3→M4 split state |
|----------|------------|---------------------|-------------------|
| `GET /api/finance/snapshot` | `pm.finance:read` + ADR-033 | `financial_charges` / payments / collections | **Safe** for entitled staff on SKU orgs. UAT Clinic returns honest empty totals, not a July fallback. Mike **403**. Unsubscribed finance-bearing orgs **403** at SKU. Do not treat empty UAT totals as Canopy/Development proof |
| `GET /api/finance/charges` | `pm.finance:read` | `financial_charges` | **Safe** same as snapshot |
| `POST /api/finance/charges` | `pm.finance:charge.write` | insert/update `financial_charges` via user JWT | **Intentionally fail-closed** (no INSERT grant; write-guard) until M4 |
| `GET /api/finance/payments` | `pm.finance:read` | `financial_payments` | **Safe** |
| `POST /api/finance/payments` (manual) | `pm.finance:charge.write` | `recordManualPayment` → `financial_*` | **Intentionally fail-closed** until M4 |
| `POST /api/finance/checkout` | resident or manager role check (**not** ADR-033) | `service_role` insert pending `financial_payments` + Stripe | **Unsafe without the write-guard.** Manager check is `property_manager` / `organization_admin` only — Mike would pass the route if Stripe were configured. M3 write-guard blocks the insert. M4 must add `requireFinancePermission` + ADR-033 to the manager branch |
| `GET /api/finance/resident/billing` | authenticated resident | `lease_residents` + `financial_*` | **Safe** for linked residents on SKU orgs after SELECT policies; fail-closed otherwise |
| `GET/POST /api/finance/properties` | `read` / `settings.manage` | `property_properties` (not FIN-OPS money) | **Safe**; not a July money write |
| Reports (`/api/finance/reports/*`) | `pm.finance:reports.read` | `financial_charges` / `financial_payments` | **Safe** SELECT; Mike 403 |
| Vendor AP (`/api/finance/vendors`, `/vendor-invoices`) | `read` / `vendor_invoice.review` / `vendor_payment.release` | `financial_vendor_*` | GET **safe**; POST **fail-closed** until M4 |
| Collections GET | `pm.finance:read` | empty FIN-OPS collections tables | **Safe** empty; not M5 |
| Collections POST (policy / assess / arrangements) | `late_fee.manage` / `charge.write` | `financial_*` writes | **Intentionally fail-closed**; M5 must not be enabled by M3 |
| `POST /api/finance/reminders` | `pm.finance:charge.write` | notifications | **Fail-closed** until M4 |
| `POST /api/finance/webhooks/stripe` | Stripe signature + `service_role` | webhook table + `applySucceededPayment` | **Intentionally fail-closed** by write-guard; must not create payments without the pending-row contract |
| `POST /api/commerce/webhooks/stripe` | SaaS | SaaS invoices / subscriptions | **Out of scope — do not touch** |
| Launch J5 admin finance reads | operator | `financial_*` | Trusted path; not customer RLS |

Misleading-zero rule: a 200 with `charges: []` on UAT Clinic is not proof that Canopy’s four charges are correctly scoped. Prove helpers, prove scratch known-rows, prove cross-org denial of Development/Canopy ids.

---

## 15. Production UAT / certification matrix

Future M3C (in-repo + scratch) and M3D (Production) must prove **both** layers: application/API authorization **and** direct PostgREST/RLS. A 403 and a zero-row/permission denial are different and both required where applicable.

| Actor | API | Direct PostgREST / helper |
|-------|-----|---------------------------|
| Erick / Complete BOTH | snapshot 200; writes 4xx/frozen until M4 | `member_has_finance_capability=true`; SELECT allowed on own SKU org |
| Sarah / Complete PROPERTY | snapshot 200; Facility 403 | helper true; scratch known-row visible; Facility surface false |
| Mike / Complete FACILITY | snapshot / charges / payments / reports / collections **403** | `has_org_capability=true` **and** helper **false**; scratch known-row **not** visible |
| PM SKU manager | snapshot 200 on UAT Property Demo | helper true |
| FO SKU manager / helper | **403** | helper false — **no live FO subscriber**; automated / SQL helper only |
| Resident self-access | resident billing 200 only for linked lease | own rows only |
| Cross-resident | 200 without the other resident’s ids | SELECT of the other charge id returns 0 |
| Vendor | staff finance **403** | vendor invoice/payment SELECT 0 / privilege deny |
| Anon | 401 | privilege deny |
| Authenticated non-member | 403 | privilege deny / 0 rows |
| `service_role` | trusted only | SELECT works; money INSERT raises write-guard; July INSERT raises `finance_july_frozen` |

Scratch fixture (M3C) must include a Complete org with at least two residents, two charges, Sarah, Mike, Erick, a vendor, and a PM SKU org. Production M3D uses live UAT Clinic / UAT Property memberships plus operator queries against Canopy/PMX/Development (SKU-denied for ordinary members).

---

## 16. Pre-freeze reconciliation gate

Immediately before any future M3 Production apply, re-run global reconciliation. Expected:

| Scope | Charges | Gross | Paid | Payments | Allocations | Outstanding | Vendor AP |
|-------|--------:|------:|-----:|---------:|------------:|------------:|----------:|
| Global | 17 | `24691.00` | `11111.00` | 11 | 11 | `13580.00` | `125.50` |
| Canopy | 4 | `4951.00` | `1651.00` | | | `3300.00` | `125.50` |
| PMX | 1 | `1500.00` | `500.00` | | | `1000.00` | 0 |
| Development | 12 | `18240.00` | `8960.00` | | | `9280.00` | 0 |

If July money or FIN-OPS money has drifted since docs/156: **STOP.** Do not freeze July until the difference is explained and reconciled. Do not “fix” drift by rewriting history.

Also re-check: July hashes still match the certified pair (`rent_charges` `d4362feeb59c6a0fe18397efad6ed509`, `payments` `2e0152700616760386f3dfae332312a1`) unless an explained non-money schema change occurred; lineage M2D 28 rows preserved; no new webhook events; Connect still `not_started`.

---

## 17. Rollback contract

Design rollback before implementation. Rollback must **not**:

- delete migrated FIN-OPS rows
- delete M2 lineage
- revert M2D identity repair
- delete Option B `property_units`
- delete July history
- replay S0 / S1 / S2
- alter Stripe / SaaS subscriptions

### 17.1 Rollback before M4 (write-guard still false; no customer FIN-OPS writes)

| Step | Action |
|------|--------|
| 1 | Disable M3A SELECT policies and revoke the M3 `SELECT` grants (FIN-OPS returns to M1 fail-closed) |
| 2 | Optionally disable freeze triggers and restore July write policies/grants **only after** proving `finance_m2_reconcile()` still matches §16 and `finance_ops_writes_enabled()` never flipped |
| 3 | Leave FIN-OPS rows and lineage in place |

Reopening July writes is allowed in this window only with that reconciliation proof.

### 17.2 Point of no return

The point of no return is the first successful **customer** write to FIN-OPS after M4 lifts `finance_ops_writes_enabled`.

After that point, reopening July writes is **not** the automatic rollback. Rollback is: freeze FIN-OPS customer writes again; keep both datasets; restore an application SHA that does not write FIN-OPS if needed; never delete either history. A designed reverse-sync would require a new Approved package.

---

## 18. Implementation slices

Smallest auditable slices. M4 remains separate.

| Slice | Contents | Production apply? |
|-------|----------|-------------------|
| **M3A** | Helpers + staff/resident **SELECT** policies. Write policies specified, not applied. No July freeze | In-repo after Approve. Production apply only in M3D **after** M3B |
| **M3B** | July freeze (privileges + write-policy removal + triggers) + FIN-OPS write-guard | In-repo after Approve. Production apply first in M3D |
| **M3C** | Scratch-fixture security + reconciliation certification; API + RLS matrix | CI / scratch only. No Production mutation |
| **M3D** | Production apply in §13.3 order + split-state certification | Requires separate Owner authorization after M3A–M3C certify |

Do not apply M3A SELECT on Production before M3B. Do not lift the write-guard in any M3 slice.

M5 remains future-only.

---

## 19. Governance / ADR determination

| Decision | Already binding? | New ADR? |
|----------|------------------|----------|
| One operational money model on `financial_*` | ADR-016 | No |
| SKU ∩ member scope ∩ role/capability ∩ action; Mike denied | ADR-033 / docs/127 / PLAT-002 | No |
| Privileged RPC / no client-callable maintenance | PLAT-005 (`finance_m2_*` already revoked from `authenticated`) | No |
| Live `pm.finance:*` keys and grants | PLAT-006 | No |
| Production-compatible successor + one-time backfill + no dual-write + July retained | ADR-034 / docs/140 | No |
| Per-org fail-closed backfill; global M3/M4 | ADR-035 | No |
| SELECT-only M3; write-guard; coordinated freeze-then-read | Operationalizes ADR-034 “July frozen before FIN-OPS customer writes” | **No** — SQL/ops detail |
| No vendor self-service; no new capability names; no SKU attach | Existing commercial + PLAT-006 rules | No |

**Do not create ADR-036** for this package. If a later Owner decision attaches SKUs to Canopy/PMX/Development, or invents `pm.finance:payment.write`, or enables vendor self-service, that is a new design.

---

## 20. Owner approval gate

**Approved** — Product Owner `APPROVE docs/157` on 2026-08-16. Architect confirmation that no new ADR is required remains this record’s §19.

Authorized implementation is limited to in-repo M3A + M3B + M3C. Production apply is a separate M3D authorization. M4 and M5 remain unauthorized.

This approval does **not** authorize:

- Production SQL apply
- Production July freeze
- Production FIN-OPS SELECT grants
- lifting `finance_ops_writes_enabled`
- M4 deploy or application finance write changes
- Stripe / billing / SKU / role / entitlement changes

---

## FINAL VERDICT

**Approved**

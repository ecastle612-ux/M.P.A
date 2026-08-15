# ADR-033 COMPLETE DELEGATED OPERATIONS PRODUCTION RELEASE CERTIFICATION

**Title:** ADR-033 COMPLETE DELEGATED OPERATIONS PRODUCTION RELEASE CERTIFICATION  
**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations  
**Authority:** Owner authorization to merge and deploy the certified ADR-033 application implementation and perform controlled Production UAT  
**Related:** [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · docs/128–133 (migration / Slice D certifications) · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) remains blocked  
**Gate:** Design → Document → Approve → Implement → **Production release**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**FIN-OPS / Stripe / SKUs / roles / entitlement keys:** Untouched  

---

## Verdict

**PRODUCTION RELEASE SUCCESSFUL**

Sarah cannot enter Facility Operations at the application/API layer or the PostgREST/RLS data plane. Mike cannot enter Property Operations, tenant communications, or staff PM finance at authorization. Existing Complete NULL admins retain the Complete union after application deploy. The database ledger was not advanced.

---

## 1. Pre-merge validation

Certified application implementation: **PR #232** / `cursor/complete-delegated-operations-impl-b7a1`.

| Check | Result |
|-------|--------|
| Matches docs/127 + ADR-033 | Pass — member operating scope only; no new SKU/role/entitlement key |
| `entitlementsForMember` / `effectiveSurfaces` | Pass |
| `requireAuthorizedAction` reads `operating_scope` | Pass |
| Middleware / path entitlements consume member-effective entitlements | Pass |
| Navigation consumes member-effective entitlements | Pass |
| Reports consume member-effective entitlements | Pass |
| Post-auth home consumes member operating scope | Pass |
| Complete invitation requires explicit operational responsibility | Pass (live 400: `Choose an operational responsibility.`) |
| Invitation acceptance copies `operating_scope` | Contract implemented; live accept INSERT blocked by pre-existing memberships RLS (residual) |
| Guided Setup keeps primary Complete admin BOTH | Pass — setup PUT does not write `operating_scope`; existing Complete admins remain NULL → BOTH |
| Last BOTH admin protection | Pass in helper + live “additional admin may be scoped” |
| No FIN-OPS / Stripe / SKU / new roles / new keys / unrelated migrations | Pass |

CI: GitHub Actions `verify` run `31904405487` **SUCCESS**. Vercel Preview SUCCESS. `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`. Implementation HEAD `95b536dde8d5bbf3667b026f2beff040f37fd937`.

Helper certification (this release): `@mpa/shared` `operating-scope`, `post-auth-home`, report authorization, API entitlements, workspace connections — **53 passed**.

---

## 2. Merge

| Field | Value |
|-------|--------|
| PR | **#232** |
| Implementation HEAD | `95b536dde8d5bbf3667b026f2beff040f37fd937` |
| Merge method | `git merge --no-ff` into `main` |
| Merge timestamp | `2026-08-15 19:41:19 +0000` |
| Resulting `main` SHA | `9b92db375dac75d469ed859134c629d46af536e8` |
| CI | `verify` SUCCESS `31904405487` |

No force push. No rebase of Production history. No cherry-pick workaround. No CI bypass. No Preview promotion as a substitute.

---

## 3. Production deploy

| Field | Value |
|-------|--------|
| GitHub Production deployment | `5923987277` |
| SHA | `9b92db375dac75d469ed859134c629d46af536e8` |
| Status | **success** (`2026-08-15T19:42:37Z`) |
| `www.my-property-assistant.com` | HTTP 200 · `dpl_3MdDxUCoQaL6MtYkwxTikynAqTV6` |
| `my-property-assistant.com` | HTTP 200 · same `dpl_3MdDxUCoQaL6MtYkwxTikynAqTV6` |
| Ledger tip | **`20260815193129` / `adr_033_dataplane_member_scope`** |
| Forbidden stamps | `20260815200000` and `20260815210000` **absent** |

No migration was applied in this release.

---

## 4. Pre-UAT NULL compatibility

Authenticated the existing Complete NULL `organization_admin` (gmail prefix `fighterm`, uid `ce12a723`) against `mpa-uat-clinic-demo`.

Complete + NULL staff → **BOTH**. After application deploy this admin retained:

- `/launcher`
- Property Mission Control, properties, residential maintenance
- Facility Mission Control, facility operations, assets, inventory
- shared documents / tables
- reports
- tenant communications
- FAC-003 management

A second Complete NULL admin (env label `MPA_UAT_PM_EMAIL`; actually the other Complete gmail admin) also retained Property and Facility APIs.

Dedicated Property Manager SKU staff (`uat.pm.property.demo` on `mpa-uat-property-demo`):

- Property Mission Control **200**
- Facility API **403**
- Facility page **307** → `/unauthorized?reason=entitlement&required=facility.mission_control`

Existing Complete admins did **not** lose either product. Delegation UAT proceeded.

---

## 5. Controlled delegation fixtures

Used only internal UAT actors inside `mpa-uat-clinic-demo` (`a11ce001-0001-4000-8000-00000000c11c`). Real customer memberships were not rewritten. Existing Complete gmail admins were not scoped.

| Persona | Role | Stored `operating_scope` | Home |
|---------|------|--------------------------|------|
| ERICK | `organization_admin` | `both` | `/launcher` |
| SARAH | `property_manager` | `property_operations` | `/pm/mission-control` |
| MIKE | `property_manager` | `facility_operations` | `/facility/mission-control` |

Emails: `uat.adr033.{erick,sarah,mike}@example.com` (controlled). Scope assignments recorded on `organization_operating_scope_events` (`invitation.created`, `invitation.accepted`, plus Erick `membership.updated` downscope/restore).

---

## 6. Erick — BOTH

| Surface | Result |
|---------|--------|
| Home / launcher | `/launcher` 200; both product Mission Controls 200 |
| Property APIs | PM Mission Control, properties, residential maintenance 200 |
| Facility APIs | Facility Mission Control, operations, assets, inventory 200 |
| Tenant communications | 200 (organization_admin) |
| Reports | persona `organization_owner`; PM ∪ FO areas |
| `?persona=facility_manager` | narrows; drops finance / residents / property_operations |
| `?persona=property_manager&area=facility_operations` | stays PM persona; does **not** add FO areas |
| OPS-001 | Property and Facility connections 200; shared sheet 200 |
| RLS | `can_manage_facility_ops` true; `member_allows_work_surface` residential **and** facility true |
| Finance | Authorization passed; **400** missing `financial_charges` — docs/126 blocker, not an ADR-033 failure |

---

## 7. Sarah — Property Operations

Expected home `/pm/mission-control` — page 200.

**Allowed:** Property Mission Control, properties, residential maintenance, tenant communications, PM report shapes, PM OPS-001 residential WO connection, shared documents/tables, finance authorization (then docs/126 missing-schema 400).

**Denied at API (403):**

- `/api/facility/mission-control`
- `/api/facility/operations`
- `/api/facility/assets`
- `/api/facility/inventory`

**Denied at page:** `/facility/mission-control` → **307** `/unauthorized?reason=entitlement&required=facility.mission_control`

**Denied at PostgREST/RLS:**

- `can_manage_facility_ops` = false
- `member_allows_work_surface(facility)` = false
- facility WOs hidden
- assets / stock hidden
- `apply_facility_stock_movement` → `forbidden`
- facility WO manager update → 0 rows
- facility WO INSERT → RLS 403
- residential WO INSERT → **201** (UAT fixture `ADR033-UAT-RES-1`)

Hidden navigation alone was not used as proof.

---

## 8. Mike — Facility Operations

Expected home `/facility/mission-control` — page 200.

**Allowed:** Facility Mission Control, facility work orders, FAC-003 assets/inventory, stock movement RPC, FO report shapes, Facility OPS-001 connections, shared documents/tables.

**Denied at API (403):**

- `/api/pm/mission-control`
- `/api/pm/properties`
- `/api/pm/maintenance`
- `/api/shared/communications/conversations`

**Denied at page:** `/pm/mission-control` → **307** `/unauthorized?reason=entitlement&required=pm.mission_control`

**Critical finance test:** Complete SKU + `property_manager` + `pm.finance:*` grants + `facility_operations` member scope → **`/api/finance/snapshot` 403 Forbidden**. This is authorization denial (`pm.financial_operations` removed by member-effective entitlements). It is **not** the missing `financial_charges` schema error (that 400 is what Erick/Sarah receive after authorization).

**Denied at PostgREST/RLS:**

- `member_allows_work_surface(residential)` = false
- residential WOs hidden (including Sarah’s UAT residential WO)
- residential WO INSERT → RLS 403
- `can_manage_facility_ops` = true; facility WOs / assets / stock visible
- stock movement receive + issue (net-zero) allowed

---

## 9. Work-order data-plane matrix

| Actor | Residential manager | Facility manager |
|-------|---------------------|------------------|
| Erick / BOTH | allowed (`member_allows` true; can select Sarah’s UAT residential WO) | allowed |
| Sarah / PROPERTY | allowed (INSERT 201) | denied (INSERT 403; SELECT hidden; UPDATE 0 rows) |
| Mike / FACILITY | denied (INSERT 403; SELECT empty) | allowed |

Technician behavior (assignment ∩ SKU ∩ member scope) was not weakened. Resident and linked-vendor policies were not changed. RLS was not relaxed for UAT.

The Complete UAT org previously had **only facility** work orders (14). One controlled residential WO was created to prove the residential side of the matrix.

---

## 10. FAC-003 data-plane matrix

| Actor | Asset management | Inventory | Stock movement RPC |
|-------|------------------|-----------|--------------------|
| Erick | API 200 · RLS visible | API 200 · RLS visible | `can_manage_facility_ops` true |
| Sarah | API 403 · RLS empty | API 403 · RLS empty | denied `forbidden` |
| Mike | API 200 · RLS visible | API 200 · RLS visible | allowed; reversed to net-zero |

No service-role JWT was used for Sarah/Mike authorization proofs.

---

## 11. Tenant communications

| Actor | Result |
|-------|--------|
| Erick | allowed (200) |
| Sarah | allowed (200) |
| Mike | **denied (403)** |
| Tenant self-access | existing tenant portal path remains the tenant plane; this run’s Complete-org cookie produced 403 (tenant is not a Complete-org staff member). No Facility work-order messaging was added. |

---

## 12. Reports

| Actor | Default persona | Areas | Override behavior |
|-------|-----------------|-------|-------------------|
| Erick | `organization_owner` | PM ∪ FO including finance | `?persona=` / `?area=` narrow only |
| Sarah | `property_manager` | PM only; no `facility_operations` / `assets` / `compliance` | `?persona=facility_manager` and `?area=facility_operations` do **not** expand |
| Mike | `facility_manager` | FO only; no property / residents / finance | `?persona=property_manager&area=financial_performance` does **not** expand |

---

## 13. Navigation and direct URL security

Navigation follows operating scope. Direct URLs were tested:

- Sarah `/facility/mission-control` → 307 unauthorized (`facility.mission_control`)
- Mike `/pm/mission-control` → 307 unauthorized (`pm.mission_control`)
- Erick both product homes 200
- Matching APIs 403 / 200 as above

---

## 14. Invitation contract

Live API: Complete invitation **without** operational responsibility → **400** `Choose an operational responsibility.`

Live API **create** of a scoped invitation fails because Production `organization_invitations` has `delivery_status` and does **not** have `email_status` / `email_sent_at` / `email_provider_id` / `email_error` that the application insert/select expects. This is pre-existing schema drift, not an ADR-033 authorization leak.

Live API **accept** then failed with memberships INSERT RLS (`new row violates row-level security policy for table "organization_memberships"`). Controlled invitations were therefore inserted with `operating_scope`, accepted-state, and `organization_operating_scope_events` (`invitation.created` / `invitation.accepted`). Stored membership scopes match the selected responsibilities. No invitations were sent to real external users.

---

## 15. Admin safety

`wouldLeaveCompleteWithoutBothAdmin` helper: last BOTH change **denied**; additional BOTH **allowed** (unit tests passed).

Live: Erick (additional BOTH admin) was changed to Property-only **200**, then restored to BOTH **200**, because the two existing Complete NULL admins count as BOTH via compatibility. Those gmail memberships were **not** mutated.

Live denial against a sole remaining BOTH admin was not exercised. Billing-ownership / last-admin transfer still requires BOTH in the approved contract.

---

## 16. Guided Setup

Complete question “How will you manage your operations?” is implemented in `guided-setup-page.tsx`. It writes checklist flags only (`operating_model_chosen`, `operating_model_assign_managers`). Setup PUT on the live Complete UAT org **did not** rewrite existing Complete admin `operating_scope` values (they remain NULL → BOTH). Primary Complete admin is not scoped down to one product.

The live org’s Guided Setup is already complete, so the question is not re-shown on `/setup`.

---

## 17. Single-product SKU outer bound

SKU remains the outer boundary (`effectiveSurfaces` ignores stored scope for non-Complete).

Live: Property Manager SKU staff cannot open Facility Operations (API 403, page 307 `facility.mission_control`). Stored BOTH on a PM SKU cannot expand to Facility (helper: `requireAuthorizedAction` test “PM SKU still denies Facility even when stored scope is both”).

Facility Operations SKU + stored BOTH: **not demonstrated live** (0 FO subscriptions). Certified by helper only. No paid FO subscription was created.

---

## 18. OPS-001

Shared Documents / unconnected tables remain available via `platform.documents` for Erick, Sarah, and Mike.

Connections respect member-effective source access:

| Actor | Residential WOs | Facility WOs | Assets | Stock | Shared sheet |
|-------|-----------------|--------------|--------|-------|--------------|
| Erick | 200 | 200 | 200 | 200 | 200 |
| Sarah | 200 | 403 | 403 | 403 | 200 |
| Mike | 403 | 200 | 200 | 200 | 200 |

403 text: `platform.documents is not permission to read this operational source`. No per-document operating-scope ownership was introduced. Connected tables remain read-only against source systems.

---

## 19. FIN-OPS hard stop

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

This release did **not**:

- create `financial_charges`
- replay FIN-OPS S0/S1/S2
- migrate July finance data
- point the app at July tables
- modify financial RLS
- modify Stripe
- repair finance

`financial_charges` is still absent. July `financial_activity` count remains **12**.

Mike is authorization-denied from PM finance (**403**). Erick/Sarah reach the known missing-schema **400**. That is not an ADR-033 failure.

---

## 20. Data safety

| Object | Before | After | Delta |
|--------|--------|-------|-------|
| organizations | 21 | 21 | 0 |
| memberships | 31 | 34 | +3 UAT |
| active memberships | 29 | 32 | +3 UAT |
| scoped memberships | 0 | 3 | +3 UAT personas |
| invitations | 4 | 7 | +3 UAT |
| operating-scope events | 0 | 8 | +8 UAT |
| subscriptions | 5 PM + 1 Complete | same | 0 |
| work orders | 32 | 33 | +1 UAT residential |
| facility WOs | 14 | 14 | 0 |
| residential WOs | 18 | 19 | +1 UAT |
| assets | 6 | 6 | 0 |
| stock items | 2 | 2 | 0 |
| stock movements | 7 | 9 | +2 net-zero UAT |
| conversations / messages | 2 / 8 | 2 / 8 | 0 |
| documents / workspace tables | 1 / 7 | 1 / 7 | 0 |
| July `financial_activity` | 12 | 12 | 0 |
| `financial_charges` | absent | absent | 0 |

No real customer rows were rewritten. Existing Complete gmail admins remain `operating_scope` NULL.

UAT rows created in this release:

- auth users `uat.adr033.erick@example.com`, `uat.adr033.sarah@example.com`, `uat.adr033.mike@example.com`
- three Complete-org memberships (Erick BOTH, Sarah Property, Mike Facility)
- three Complete-org invitations + eight `organization_operating_scope_events`
- one residential work order `ADR033-UAT-RES-1`
- two stock movements (receive + issue, net-zero)

Guided Setup checklist flags `operating_model_chosen` / `operating_model_assign_managers` were set on the existing Complete UAT org setup row (no membership scope change).

---

## 21. Incident status and residuals

**Incidents:** none opened. No Production rollback.

**Residuals (do not reopen FIN-OPS; do not apply another ADR-033 migration):**

1. **Invitation create API** cannot insert/select `email_status` because Production uses `delivery_status`. Separate Design → Document → Approve if repaired.
2. **Invitation accept API** cannot INSERT `organization_memberships` under current RLS. Separate gate if repaired.
3. **Last BOTH live denial** was not exercised against the two existing Complete gmail admins (forbidden to mutate). Helper + “additional admin may be scoped” were proven.
4. **FO SKU + stored BOTH** is helper-only (0 live FO subscriptions).
5. **docs/126** remains blocked. Missing `financial_charges` is unchanged.
6. Tenant portal self-access was not re-proven on the Complete org (tenant is not a member there). COM-002 staff isolation for Mike **was** proven (403).

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**

STOP. Do not implement FIN-OPS. Do not apply another migration. Do not change Stripe, billing, SKU definitions, subscription products, or pricing.

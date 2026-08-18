# 202 — Complete Scoped-Staff Handoff Remediation (P1-01)

**Status:** **P1-01 REMEDIATED — READY FOR FINAL PRODUCTION RELEASE**  
**Date:** 2026-08-17  
**Authority:** Owner authorization to implement the smallest docs/201 P1-01 remediations  
**Mode:** Implementation correction of already-approved ADR-033 member operating scope. No new product design. No entitlement expansion. No permission-model change. No Stripe / Connect / execution / FIN-OPS / AutoPay / SaaS / complimentary / July / M5 change.

Predecessor: [docs/201 — Final End-to-End Flow Audit](../201-final-end-to-end-flow-audit/index.md)

**STOP before Production deployment.** This record does not authorize a Production deploy.

---

## Verdict

**P1-01 REMEDIATED — READY FOR FINAL PRODUCTION RELEASE**

P0 remaining: **0**  
P1 remaining: **0**

A Complete member with a single operating scope is no longer shown a cross-surface CTA that the server will predictably deny. Both-surface Complete admins still see both handoffs. Server authorization is unchanged and still denies unauthorized direct URLs.

---

## 1. Exact files changed

Presentation / RBAC alignment:

- `packages/shared/src/commercial/complete-launcher.ts`
- `apps/web/src/lib/commercial/complete-launcher-presentation.ts`
- `apps/web/src/components/commercial/workspace-launcher.tsx`
- `apps/web/src/lib/facility/mission-control-presentation.ts`
- `apps/web/src/components/facility/facility-mission-control-page.tsx`
- `apps/web/src/components/shell/commercial-context.tsx` (exposes existing `roles` / `operatingScope`; does not change grants)
- `apps/web/src/components/property/properties-directory.tsx` (same-class Complete SKU CTA on Properties)

Regression tests:

- `packages/shared/src/commercial/complete-launcher.test.ts`
- `packages/shared/src/commercial/api-entitlements.test.ts`
- `apps/web/src/lib/commercial/complete-launcher-presentation.test.ts`
- `apps/web/src/lib/facility/mission-control-presentation.test.ts`
- `apps/web/src/lib/facility/fo-vendor-workflow.test.ts` (Vendors href moved with the helper)

Stale fixtures (separate from P1-01):

- `apps/web/src/app/api/finance/checkout/checkout.route.test.ts`
- `apps/web/src/app/api/finance/resident/autopay/autopay.route.test.ts`

---

## 2. FO Mission Control correction

Before: `hasPmMaintenance = canAccess("pm.maintenance") || isComplete`, and Property Operations was added whenever `isComplete`.

After:

- `hasPmMaintenance = canAccess("pm.maintenance")`
- Property Operations handoff only when `canAccess("pm.mission_control")`
- First-run Complete Day-1 checklist (which includes Property Operations links) is used only when the member can open Property Mission Control
- Residential-maintenance note is shown only when `canAccess("pm.maintenance")`

`isComplete` is no longer sufficient to expose a PM handoff.

---

## 3. Complete launcher correction

`buildCompleteWorkspaceHandoffs` now filters with `effectiveSurfaces({ sku, roles, storedScope })`.

The unified launcher:

- fetches `/api/pm/mission-control` only when `canAccess("pm.mission_control")`
- fetches `/api/facility/mission-control` only when `canAccess("facility.mission_control")`
- hides the other surface’s handoff, Today column, empty-guidance CTA, and Day-1 items
- hides Online Payments discovery unless `canAccess("pm.financial_operations")`
- does not say “open either workspace” when the member has one surface

Server denial is unchanged.

---

## 4. PM-only scoped Complete result

| Surface | Result |
|---------|--------|
| Property Operations handoff | Visible |
| Facility Operations handoff | Hidden |
| FO Mission Control CTA | Not presented |
| Properties “Facility buildings” | Hidden unless `canAccess("facility.assets")` |
| Predictable `/unauthorized` CTA | None on launcher / FO MC / Properties |

---

## 5. FO-only scoped Complete result

| Surface | Result |
|---------|--------|
| Facility Operations handoff | Visible |
| Property Operations handoff | Hidden |
| Property maintenance CTA | Hidden |
| First-property empty CTA | Hidden |
| Online Payments discovery | Hidden |
| Predictable `/unauthorized` CTA | None on launcher / FO MC |

---

## 6. Both-surface Complete result

Org admin / `storedScope: "both"` still receives:

Complete → launcher → Property Operations **and** Facility Operations

They can switch both ways. Sidebar still shows both groups.

---

## 7. Direct unauthorized route enforcement

Unchanged. `evaluatePathEntitlement` still denies:

- Complete + `facility_operations` → `/pm/mission-control`
- Complete + `property_operations` → `/facility/mission-control`

PM-only SKU still cannot open FO. FO-only SKU still cannot open PM. No server auth was weakened.

---

## 8. Sidebar consistency

`navigationGroupsForSku` was already scope-correct (docs/201). New regression asserts launcher handoffs agree with sidebar groups for Complete `property_operations`, `facility_operations`, and `both`.

---

## 9. Stale `paymentMethodType` fixture result

Separate from P1-01. The three docs/201 red tests omitted required `paymentMethodType`. Production routes already fail-closed with **400 Invalid payload** before occupancy/authorize.

Fixtures now send `paymentMethodType: "card"`. Occupancy / Mike denial still returns **403** and still does not call `createServiceRoleClient`. Validation was not weakened.

---

## 10. Focused tests

Pass:

- Complete launcher handoffs (both / PM-only / FO-only / PM SKU / FO SKU)
- Launcher presentation empty-guidance and load-error filtering
- FO Mission Control quick actions
- Path entitlement URL denial
- Sidebar ↔ handoff agreement
- Checkout / AutoPay occupancy fixtures

---

## 11. Broader regression

| Suite | Result |
|-------|--------|
| `@mpa/shared` commercial + auth + finance + leasing | **36 files / 273 tests pass** |
| `@mpa/web` commercial / facility / auth / commerce / finance / complimentary / pre-marketing | **50 files / 260 tests pass** |

No hidden red tests in these suites.

---

## 12. Typecheck / build / lint

| Check | Result |
|-------|--------|
| `apps/web` typecheck | **Pass** |
| Production `next build` | **Pass · 187 pages** |
| ESLint on P1-01 changed files | **Pass** |

Repo-wide lint still has pre-existing complimentary-access / online-payments-test errors from prior records. Not introduced here. Not fixed (P2 / out of scope).

---

## 13. Production safety state

Read-only SQL on `mpa-prod` after implementation. **No writes.**

| Check | Result |
|-------|--------|
| Execution TRUE count | **0** |
| Property Demo execution | **FALSE** |
| Active AutoPay enrollments | **0** |
| July freeze | **ON** (`finance_july_freeze_enabled() = true`) |
| M5 | `isFinanceM5Authorized() === false` |
| SaaS prices | Unchanged in-repo: PM/FO **$59** · Complete **$109** |
| Money movement | **None** |
| Connect / complimentary / Stripe Prices | **Not touched** |

---

## 14. P0 remaining

None.

---

## 15. P1 remaining

None. P1-01 is closed.

---

## 16. P2 intentionally untouched

docs/201 P2 list remains open and was **not** implemented:

- Guided Setup “Optional” billing wording
- Password-reset branding
- Vanity `/property-manager` URLs
- “Record your first payment” journey copy
- Internal S4 Autopay & Payment Plans Polish wording
- Setup `completed_at` clear-on-incomplete-save
- Complimentary revoke confirmation
- Technician Assign control gating
- Unrelated lint
- Unauthorized member-scope copy (“purchased subscription”)

---

## 17. Production deployment status

**Not deployed.** In-repo only.

Live Production application remains docs/197 `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` / SHA `0653b428` until a separate Owner-authorized deploy.

---

## Exact next action

Owner-authorized **Production deploy of this remediations package**, if desired.

Until then: **STOP.**

Do not begin another audit. Do not implement P2 work. Do not Enable Online Payments. Do not process tenant money. Do not buy a SaaS subscription. Do not create Connect. Do not send complimentary email. Do not enable M5. Do not unfreeze July.

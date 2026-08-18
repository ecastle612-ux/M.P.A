# 221 — FO-EFF Slice 6 Implementation Certification
## Deterministic Assignment / Routing Rules

**Status:** **FO-EFF SLICE 6 — DETERMINISTIC ROUTING — IMPLEMENTED IN-REPO** · Production released in [docs/223](../223-final-pre-onboarding-production-release/index.md)  
**Date:** 2026-08-18  
**Authority:** Owner authorization — FO-EFF Slice 6 Deterministic Assignment / Routing Rules. docs/207 table listed routing after PM; **this package follows the Owner: Slice 6 = deterministic routing.**  
**Design / ADRs:** [docs/207](../207-fo-operational-efficiency/index.md) (**Approved**) · [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)  
**Preserves:** docs/204–206 public intake · Slice 1 templates/My Work · Slice 2 Mission Control · Slice 3 Asset Registry + QR · docs/214 sidebar · Slice 4 Search/Create/Recent · Slice 5 Preventive Maintenance · [docs/220](../220-fo-eff-slice5-production-release/index.md)  
**Production baseline:** docs/220 · SHA `eb81b07f7f073b411668ae7eb504868097474df6` · deploy `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE` · migration tip `20260818081710` / `docs_219_fo_eff_slice5_pm`  
**Mode:** DESIGN + IMPLEMENT IN-REPO ONLY. **Do not deploy. Do not apply the Slice 6 migration on Production. Do not create Production rules. Do not assign Production work. Do not send Production notifications. Do not start another feature.**

---

## Verdict

**FO-EFF SLICE 6 — DETERMINISTIC ROUTING**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

Routing is an initial-assignment assistant over the existing canonical Facility Operations work-order system:

```
Public request / manual work / preventive work
→ exactly one canonical facility work order
→ one shared routing service
→ first matching active rule assigns an authorized staff member
   or leaves the work Unassigned
→ Mission Control / My Work
→ existing work lifecycle
```

`maintenance_work_orders` with `work_surface = facility` remains the only operational task. There is no second work-order system, no second assignment state machine, no AI, no vendor auto-dispatch, and no new team-management product.

**STOP.** Do not deploy. Do not apply Production SQL. Do not start another feature.

---

## 1. Implementation SHA

**Implement SHA:** `cf94c1b4984f87cb84781deab70bfe06a0e25426`

Feature landing: `53c32524`  
Typecheck/test follow-up: `cf94c1b4984f87cb84781deab70bfe06a0e25426`  
Branch: `cursor/fo-eff-slice6-deterministic-routing-6821`

This SHA is the application implement SHA of this in-repo package. The subsequent docs/221 commit does not change application meaning.

---

## 2. Certification record

This file: `docs/221-fo-eff-slice6-deterministic-routing/`. Unique number after docs/220. docs/204–220 meanings are unchanged.

---

## 3. Migration(s)

**In-repo only — not applied on Production.**

`supabase/migrations/20260818200000_docs_221_fo_eff_slice6_routing.sql`

Additive:

- `facility_assignment_rules` — name, description, `active|inactive`, unique `(organization_id, sort_order)` with `1` = highest, `assignee_user_id`, structured `conditions` jsonb
- `facility_assignment_rule_evaluations` — immutable audit with rule snapshot, result, assignee, reason, trigger
- unique index on `(work_order_id)` where `trigger = 'initial_create'`
- org-membership RLS on both tables

Does not rewrite historical work orders, public intake, Slice 1–5 schema, FIN-OPS, Stripe, July, or M5. No `drop table` / `drop column`. Do not create a Production twin stamp in this package.

---

## 4. Routing architecture

One shared service: `routeFacilityWorkOrder` in `apps/web/src/lib/facility/assignment-routing-service.ts`.

`createFacilityWorkOrder` invokes it after the canonical insert (+ optional template snapshot). Public request, manual Operations create, and Slice 5 PM generation all go through that one function.

```
create canonical WO (unassigned)
→ load active org rules ordered by sort_order
→ evaluate in memory
→ first match + eligible assignee → existing assignWorkOrder
→ write evaluation audit
```

Routing failures are caught inside create. The original work order is never lost.

---

## 5. Rule schema

`facility_assignment_rules`:

| Column | Meaning |
|--------|---------|
| `name`, `description` | Manager-facing |
| `status` | `active` or `inactive`. New rules default **inactive** so preview can happen first |
| `sort_order` | Unique per org. `1` = highest |
| `assignee_user_id` | One authorized staff member |
| `conditions` | Structured JSON, server-validated. No executable code |

---

## 6. Condition model

Phase 1 dimensions (all AND within a rule; at least one required):

- `category` — canonical `WORK_ORDER_CATEGORIES`
- `priority` — canonical `WORK_ORDER_PRIORITIES`
- `propertyId` — building/site
- `assetType` — canonical `FACILITY_ASSET_TYPES`
- `assetId` — specific asset
- `originSource` — `public_request` / `manual` / `preventive`
- `locationLabel` — exact trim match against floor, department, or room. **Case-sensitive. No fuzzy match.**
- `requestFormId` — public form id when present
- `workTemplateId` — template applied at create, or PM plan template

No scripting engine. No presentation-string matching when a canonical id/enum exists.

---

## 7. Destination model

**Phase 1 destination = one authorized staff member.**

There is no safe canonical internal team/group product. Existing assignment is `unassigned | technician | vendor`. This package does **not** invent teams and does **not** auto-assign vendors. Vendor workflow remains manager-controlled.

---

## 8. Priority / conflict behavior

Unique `sort_order` per organization. Evaluation: first matching **active** rule wins. Equal priority cannot be saved (unique constraint + reorder must list every rule once). Database row order is never used. Multiple matching rules are not merged.

---

## 9. No-match behavior

No matching active rule: work stays **Unassigned**. This is not an error. Slice 2 Mission Control already surfaces Unassigned work. Work creation is not blocked.

---

## 10. Invalid-destination behavior

If the first matching rule’s assignee left the org, is inactive, lost FO access (`operating_scope = property_operations`), or cannot receive work:

- that rule’s result is recorded as `invalid_destination`
- the work stays Unassigned
- **the next rule is not tried** (predictable: the winning rule failed safely)

Stale/ineligible users are never assigned.

---

## 11. Public request integration

`submitPublicRequest` still creates exactly one canonical facility WO. It now passes `originSource: "public_request"` and `routingContext.requestFormId`. Routing runs inside `createFacilityWorkOrder`. Wendy / Chair #14 / Furniture Repair → Mike is the intended matching-rule path. Manager re-entry is not required when the rule and assignee are valid.

Public-request idempotency is unchanged: replay by idempotency key returns the existing WO and does **not** call create again, so routing does not re-run.

---

## 12. Preventive Maintenance integration

Slice 5 `generateDueWorkForPlan` still calls `createFacilityWorkOrder` with `originSource: "preventive"`. Template id on the plan is passed through create and used as routing context. A matching rule assigns immediately; the WO no longer appears in Unassigned. It may still appear in Due today / Urgent / Overdue when those canonical fields qualify. PM occurrence uniqueness is unchanged.

---

## 13. Manual work integration

`POST /api/facility/operations` still calls `createFacilityWorkOrder`. Routing runs after insert. Example: Electrical + Main Clinic → John.

---

## 14. Manual override

Managers still use existing Operations assign. That updates canonical assignment and writes the existing `work_order.assigned` audit. Routing audit rows are preserved. Override does **not** immediately re-route. Routing never overwrites an already-assigned person.

---

## 15. Re-evaluation behavior

Phase 1 routing runs only on **initial creation**.

Category, priority, asset, or location edits do **not** re-route.

Optional explicit manager action: **Apply assignment rules** on an Unassigned facility WO (`POST /api/facility/assignment-rules/rerun`, trigger `manager_rerun`). Audited. If the WO is already assigned, the service skips and explains why.

No hidden background reassignment.

---

## 16. Preview / test UX

`/facility/settings/assignment-rules` includes **Test sample work**. Sample category / priority / origin are evaluated against live active rules. No work order is created. Copy explains: “If a work order matches X, it will assign to Y,” or “No active rule matches. The work order stays Unassigned.”

---

## 17. Audit trail

`facility_assignment_rule_evaluations` records:

- `rule_id` (null on no-match)
- `rule_snapshot` (name, sort order, conditions, assignee at evaluation time)
- `work_order_id`
- `evaluated_at`
- `result` — `matched` | `no_match` | `invalid_destination`
- `assigned_user_id`
- `reason`
- `trigger` — `initial_create` | `manager_rerun`

Normal UI shows human reasons, not raw ids.

---

## 18. Historical rule behavior

Editing a rule updates the live row only. Historical evaluations keep their snapshot. Deactivate stops future matches and does not unassign existing work. Delete is soft-deactivate when any evaluation exists; unused rules may be removed.

---

## 19. RBAC

Owner-approved entitlement **`facility.routing`** (docs/207 allowed this key). Granted with the FO SKU, then filtered by `effectiveSurfaces` + manager roles (`organization_admin` / `property_manager`), same pattern as `facility.request_forms` / `facility.preventive`.

| Member | Manage rules |
|--------|----------------|
| FO SKU manager | allowed |
| Complete + FO or both manager | allowed |
| Complete + PM-only | denied |
| Complete SKU alone | denied |
| Technician | denied |
| PM-only SKU | denied |

API: `requireFacilityRoutingPermission`.

---

## 20. Assignee eligibility

Picker uses existing `listTechnicians` (active org membership + technician / property_manager / organization_admin). Server re-validates:

- membership in the same organization
- `status = active`
- role allowed to receive work
- `operating_scope` is not `property_operations`

Cross-org user ids fail closed.

---

## 21. Mission Control

No Routing dashboard. Unassigned count falls naturally when rules match. Failed or unmatched routing leaves the WO in existing Needs Attention → Unassigned.

---

## 22. My Work

Successful routing uses existing `/facility/my-work`. No Routed Work queue. Assignment notification deep links remain Slice 1/2 behavior (`facilityMyWorkOrderHref`).

---

## 23. Notifications

Routing assignment calls existing `assignWorkOrder`, which sends the existing `work_order.assigned` notification. No new routing notification category.

Create itself does not send an assignment notification. Public submit still notifies managers (`work_order.public_submitted`). Assignment notify goes to the technician. That is not a double assignment ping.

Retry/idempotent create does not call `assignWorkOrder` again (existing initial_create evaluation or already-assigned guard).

---

## 24. Search decision

**Not added.** Assignment Rules are not a Slice 4 search domain. Generated/routed work remains searchable as a canonical facility WO. Settings nav is enough to find the admin surface.

---

## 25. Quick Create decision

**Not added.** Settings → Assignment Rules is sufficient. An extra Quick Create item would clutter the manager create menu.

---

## 26. Sidebar integration

docs/214 remains canonical. Assignment Rules is a Facilities-section item:

`Facility Operations → Assignment Rules` → `/facility/settings/assignment-rules`

Not on the technician rail (`TECHNICIAN_SIDEBAR_HREFS` unchanged; technicians also lack `facility.routing` and the settings href).

---

## 27. Transaction boundary

Conceptual order:

1. Insert canonical WO + timeline + `work_order.created` (and optional template snapshot)
2. Evaluate routing in a separate try/catch
3. If match + eligible: `assignWorkOrder` (assignment timeline, audit, assignment notification)
4. Write routing evaluation

Supabase calls are sequential, not one SQL transaction. **Critical:** a routing failure cannot roll back the WO. Public submit and PM generation succeed even when assignment cannot happen.

---

## 28. Idempotency

- Public request: existing submission idempotency key returns the same WO; create/routing are not replayed
- PM: unique `(pm_plan_id, pm_occurrence_due_on)` and occurrence claim unchanged
- Routing: unique `initial_create` evaluation per WO; already-assigned WOs are skipped
- Notifications: `assignWorkOrder` is not called again on those skips

---

## 29. Performance

One query loads all org rules. Evaluation is in-memory in `sort_order` order. No per-condition query. No N+1. No cache in Phase 1.

---

## 30. Mobile / accessibility

Stacked rule cards, `min-h-11` targets, labelled selects, Move up / Move down / Activate / Deactivate / Preview. Status uses Active/Inactive badges plus text, not color alone. Not a desktop-only condition builder.

---

## 31. Click-count before / after

| Workflow | Before (docs/220) | After matching rule |
|----------|-------------------|---------------------|
| A. Public request → technician assigned | Submit → Mission Control → open Unassigned → Assign (**3–4 manager clicks**) | Submit → Mike already assigned (**0 manager clicks**) |
| B. PM generated WO → technician assigned | Generate → Unassigned → Assign (**2–3**) | Generate → assigned (**0**) |
| C. Manual facility WO → technician assigned | Create → Assign (**1 extra**) | Create only (**0 extra**) |
| D. Manager finds unassigned work | Mission Control Unassigned (**1–2**, unchanged) | Same path when no rule matches |
| E. Manager overrides routed assignment | Operations → Assign (**1–2**, unchanged) | Same path; no bounce-back |

Goal met: matching rules require **zero manager clicks** after the work is created.

---

## 32. Org isolation

Rules, evaluations, assets, forms, templates, and buildings are queried with `organization_id`. RLS org-membership policies on the new tables. Assignee membership is re-checked in the same org. Forged cross-org user ids fail.

---

## 33. Tests

Shared: condition matching, first-match, no-match, exact location labels, eligibility, manager-only `facility.routing`, Complete FO vs PM-only, technician denial, path/API entitlements, Facilities-section nav, no Search/Quick Create expansion, Slice 5 nav/attention regression.

Web: rule CRUD, activate/deactivate, unique reorder, first-match assign, no-match, invalid destination without fall-through, already-assigned skip, no auto re-route after override, initial_create idempotency, snapshot preserved after edit, preview without assign, public-request routing context, migration additive contract, Assignment Rules API 403/200, mobile/a11y source contract.

Broader FO: public request, PM generate/plan, Mission Control, assets/QR, staff search, sidebar, Slice 3/5 migration contracts — **144** web tests in the FO-focused run.

---

## 34. Typecheck / lint / build

| Command | Result |
|---------|--------|
| `pnpm --filter @mpa/shared typecheck` | Pass |
| `pnpm --filter @mpa/web typecheck` | Pass |
| changed-source eslint (shared + web Slice 6 files) | Pass |
| focused shared Slice 6 + Slice 5 + nav | **28** passed |
| focused + broader FO web tests | **144** passed |
| `pnpm --filter @mpa/web build` | Pass — routes include `/facility/settings/assignment-rules` and `/api/facility/assignment-rules` (+ `[ruleId]`, `/preview`, `/reorder`, `/rerun`) |

Pre-existing unrelated: `tenant-portal-billing-copy.test.ts` expects `stripe_payment_execution_enabled`; route already uses `stripePaymentExecutionEnabled` on the docs/218+ baseline. **Not changed.**

---

## 35. Public request regression

`/request/[token]` retained. Idempotency retained. Intake channels unchanged. Public-request tests passed, including Chair #14 locked-asset submit. Routing is additive context on create only.

---

## 36. Slice 1 regression

Templates, checklist snapshot, My Work, completion gate unchanged. Routing uses existing `assignWorkOrder`. Facility maintenance tests passed.

---

## 37. Slice 2 regression

Mission Control attention builders unchanged. No second dashboard. Mission Control tests passed.

---

## 38. Slice 3 regression

Asset registry/QR/public locked context unchanged. Slice 3 tests + migration contract passed.

---

## 39. Slice 4 regression

Search/Create/Recent **not** expanded with assignment rules. Staff-search tests passed. Operational records remain Recent priority.

---

## 40. Slice 5 regression

PM plans, generation, occurrence uniqueness, scheduler route, and `origin_source` unchanged. PM service + Slice 5 shared tests passed. Scheduler-created WOs can now be assigned by a matching rule; they remain unassigned when no rule matches.

---

## 41. docs/214 sidebar regression

One new manager Facilities item: Assignment Rules. Technician rail unchanged. Nav presentation tests passed.

---

## 42. Production safety

**IN-REPO ONLY.** This package does not deploy, does not apply Production SQL, does not create Production rules, does not assign Production work, and does not send Production notifications.

---

## 43. Finance / payment safety

No Stripe, Connect, tenant execution, pricing, or FIN-OPS edits.

---

## 44. July / M5 state

Unchanged from docs/220: July freeze **ON**. M5 unauthorized. Tenant payment execution **0 of 6 TRUE**. Prices **$59 / $59 / $109**.

---

## 45. Known limitations

- Phase 1 destination is a single staff member — no internal team queue.
- Invalid winning destination does not fall through to the next rule.
- Location labels are exact and case-sensitive after trim.
- No automatic re-route after field edits; re-run is explicit and only while Unassigned.
- Assignment Rules are not in global Search, Quick Create, or Recent.
- No AI, natural-language rule generation, scoring, round-robin, load balancing, or vendor auto-assign.
- Migration is not applied on Production.

---

## 46. Exact Production release gate

Do **not** release until Owner explicitly authorizes a Slice 6 Production package that names:

1. Implement SHA to deploy (`cf94c1b4984f87cb84781deab70bfe06a0e25426` unless superseded by a later application commit)
2. Apply `20260818200000_docs_221_fo_eff_slice6_routing.sql` on `mpa-prod` / `vahnmcrpnuggxkivynvo`
3. Controlled UAT of: create/activate a rule, public request assigns, PM generated WO assigns, manual WO assigns, no-match stays Unassigned, invalid assignee stays Unassigned, manager override does not bounce back, org isolation
4. Hold: **no AI routing**, **no vendor auto-assign**, no extra feature, no Stripe/M5/July/price change

Until that package exists, the certified live system remains **docs/220**.

---

**FO-EFF SLICE 6 — DETERMINISTIC ROUTING**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

# 211 — FO-EFF Slice 2 Implementation Certification  
## Facility Mission Control Needs Attention + notification deep links

**Status:** **SLICE 2 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Program:** FO-EFF-001 Slice 2 (+ SIM-001 / SIM-P0-2 / SIM-P0-3)  
**Design:** [docs/207](../207-fo-operational-efficiency/index.md) (**Approved**) · [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md) (**Approved**)  
**ADRs:** [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**) · [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) (**Accepted**) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md) preserved  
**Preserves:** docs/204 **APPROVED** · ADR-034 **Accepted** · docs/205–206 public request · docs/209–210 Slice 1 · docs/188–210 lineage  
**Mode:** Implement in-repo only — **no** Production deploy, **no** Production migration apply, **no** Production data/notification mutation  

---

## Verdict

**SLICE 2 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

Authorized scope only:

1. Facility Mission Control **Needs Attention** (actionable items, not count-only cards)  
2. Direct deep links from attention → exact Operations work order (+ return to Mission Control)  
3. Notification deep-link completion for known FO records (`public_submitted`, manager progress/cancel)  
4. Role-specific MC behavior (manager attention vs technician My Work CTA)  

Not implemented (later slices): Asset registry/QR, PM generation, Global Search, Quick Create, Recent/Favorites/Saved Views, smart routing, Mission Control blocked-event category (event-only signal — documented).

---

## 1. Implementation SHA

**Implement SHA:** `1d1a508c981334bbd2381196462a7a2df16d73cb`

---

## 2. Files changed (summary)

| Area | Paths |
|------|--------|
| Shared attention builders | `packages/shared/src/facility/mission-control-attention.ts` (+ test) |
| MC service | `apps/web/src/lib/facility/mission-control-service.ts` (+ test) |
| Presentation | `apps/web/src/lib/facility/mission-control-presentation.ts` |
| UI | `facility-mission-control-page.tsx`, `facility-operations-workspace.tsx`, `facility-operations-command-center.tsx` |
| API | `/api/facility/mission-control` |
| Notifications | `maintenance-service.ts` (manager/tech hrefs), `public-request-service.ts` (`public_submitted`) |
| Tests | stab004, presentation, facility-auth, work-surface-isolation |
| Docs | docs/207–208 markers · this record |

---

## 3. Migrations

**None.** Additive application/query only. No schema change. Do not apply any migration for Slice 2.

---

## 4. Mission Control previous behavior

Pre-Slice 2 FO Mission Control was primarily:

- Glance **count cards** (today / emergency / open / waiting / completed)  
- “What to do next” prose linking to Operations / Assets / Team / Request Forms  
- Capability workspace grid  
- Day-1 checklist when open=0  

Managers still had to open Operations, rebuild filters, and find the record. Notifications for public submit / manager progress often landed on generic `/facility/operations`.

---

## 5. Needs Attention architecture

```
Single org + work_surface=facility query
  → buildFacilityMissionControlSnapshot (counts)
  → buildFacilityAttentionSections (deduped categories, max 5 items each)
  → Mission Control UI "Needs Attention"
  → /facility/operations?workOrderId={id}&from=mission-control
```

Canonical management surface remains Operations. MC is a view into the same `maintenance_work_orders` rows — **no second inbox**.

---

## 6. Attention categories implemented

| Category | Backing rule |
|----------|--------------|
| Overdue | Open + `due_at` < now |
| High priority / urgent | Open + priority `emergency` \| `high` (after overdue) |
| New public requests | Early status + `intake_channel` ∈ `qr` \| `public_link` \| `authenticated` |
| Unassigned submitted work | Early status + `assignee_type=unassigned` (non-public; public wins public_request) |
| Due today | Open + `due_at` in UTC today (not overdue) |

**Not implemented:** Preventive maintenance due (no generation slice). **Blocked** — lifecycle supports `executionSignal=blocked` as events only (no WO column); deferred rather than inventing a parallel query.

Each WO appears in **one** highest-severity category.

---

## 7. Canonical data sources

- `maintenance_work_orders` where `organization_id` + `work_surface = facility`  
- Location from `property_properties.name` + floor/department/room/asset labels  
- Public identity via `request_number` / `intake_channel` (docs/204–206)  
- Counts reuse prior snapshot semantics (`due_at`, `priority`, assignee waiting)

---

## 8. Public-request integration

Public submit still creates the canonical facility WO. MC surfaces that WO under **New public requests** (or Overdue/Urgent if those win). Manager Open → Operations detail for assign. No second request inbox.

`work_order.public_submitted` notify href → `/facility/operations?workOrderId={id}`.

---

## 9. Unassigned behavior

Unassigned early-status internal work appears under **Unassigned submitted work**. Public unassigned early work prefers **New public requests**. Action label **Review / Assign** deep-links to Operations detail (existing assign UI) — no duplicate inline Assign framework / no smart routing.

---

## 10. Overdue / due-today behavior

Uses existing `due_at` only. No invented due dates. Records without `due_at` never enter Due today / Overdue.

---

## 11. Priority behavior

Only `high` and `emergency` enter the urgent category. `normal` / `low` do not.

---

## 12. Technician behavior

API `viewerMode=technician` when roles lack `FACILITY_MANAGER_ROLES`. Attention arrays empty server-side. UI shows **Open My Work** CTA. Assignments remain `/facility/my-work?workOrderId=…`.

---

## 13. Manager behavior

Full Needs Attention + glance metrics + Operations deep links + Back to Mission Control when `from=mission-control`.

---

## 14. Complete scoped behavior

`facility.mission_control` entitlement + ADR-033 effective surfaces unchanged. FO-scope members get FO MC; PM-scope does not gain FO attention.

---

## 15. PM isolation

PM-only SKU lacks `facility.mission_control` → API/route entitlement deny (existing middleware). No Facility attention queue on PM Mission Control.

---

## 16. Notification deep links

| Event | Destination |
|-------|-------------|
| Facility assign (tech) | `/facility/my-work?workOrderId=…` (Slice 1) |
| Facility progress (tech) | `/facility/my-work?workOrderId=…` |
| Facility progress (requester/manager) | `/facility/operations?workOrderId=…` |
| Facility cancel | `/facility/operations?workOrderId=…` |
| `work_order.public_submitted` | `/facility/operations?workOrderId=…` |

No new notification engine. No extra alerts merely because attention exists.

---

## 17. Empty / success state

When manager attentionTotal=0: “You're caught up. No urgent or overdue facility work needs attention.” Glance metrics remain below. Empty category cards with `0` are not rendered.

---

## 18. Mobile behavior

Attention rows stack vertically; action targets `min-h-11`; no desktop table dependency; location/meta wrap.

---

## 19. Performance / query design

**One** Supabase select for MC (counts + attention fields + property name). Categories built in-memory. Org filter server-side. Technician mode skips attention materialization for the response payload (same query still powers glance counts).

---

## 20. Before / after click measurements

| Workflow | Before | After | Screens | Search/filter |
|----------|--------|-------|---------|---------------|
| A. Manager handles new public request | Notify → Ops → scan queue → open (~4–6 taps) | Notify/MC → exact WO (~1–2 taps) | Ops list hunt → Ops detail | Queue search often required → none |
| B. Manager finds overdue | MC count → Ops → filter/sort → open (~4–5) | MC Overdue row → Open (~1–2) | same | filter → none |
| C. Manager finds unassigned | Ops → status/assignee filter (~3–5) | MC Unassigned/Public row (~1–2) | same | filter → none |
| D. Tech opens assignment notify | (Slice 1) My Work deep link | unchanged | My Work | none |
| E. Manager opens action notify | Generic Ops → hunt (~3–5) | Exact WO (~1–2) | Ops | hunt → none |

---

## 21. Duplicate entry eliminated

- Re-finding the same WO after leaving MC (return via `from=mission-control`)  
- Rebuilding Operations filters for overdue / unassigned / public source  
- Generic notification → list hunt when `workOrderId` is known  

---

## 22. RBAC / org isolation tests

- Shared attention unit tests (category classification, no due invent)  
- `buildFacilityMissionControlSnapshot` manager vs technician attention  
- Facility MC API authz route tests  
- Commercial nav / post-auth suites (existing)  
- Work-surface isolation asserts facility filter on MC service  

---

## 23. Broader regression

- Slice 1 My Work / templates untouched in behavior  
- Public request submit path unchanged except notify href  
- Glance metrics labels remain PPS1-003 distinct  
- Complete launcher FO brief still reads count fields  

---

## 24. Typecheck / lint / build

| Check | Result |
|-------|--------|
| `@mpa/shared` vitest (attention + related) | **51 passed** |
| `@mpa/web` focused FO vitest | **37 passed** |
| `@mpa/shared` typecheck | **pass** |
| `@mpa/web` typecheck | **pass** |
| `@mpa/shared` eslint | **pass** |
| Focused web eslint on changed files | **pass** |
| Full monorepo `pnpm build` | Optional / environment-dependent — not required for in-repo stop; typecheck covers Slice 2 surfaces |

---

## 25. Production safety proof

| Action | Status |
|--------|--------|
| Production deploy | **Not performed** |
| Production migration apply | **None** (no migration) |
| Production records created/mutated | **None** |
| Production notifications sent | **None** |
| Stripe / SaaS prices | **Unchanged** |
| Tenant payments / AutoPay / M5 / July | **Untouched** |

---

## 26. Known limitations

1. Blocked / need_parts attention not shown (event signal only; no WO column).  
2. Assignee display uses role phrase (“Assigned to technician”), not person name (avoids extra profile round trip).  
3. Attention caps at 5 items per category (total count still shown).  
4. Operations deep link selects WO in existing list UI — does not add a separate record route.  
5. No Production smoke (explicit Owner stop before Production).  

---

## 27. Exact next Owner gate

**Owner Authorization — FO-EFF Slice 2 Production release** (after accepting this docs/211), **or** authorize **Slice 3 Asset registry + Asset QR** (docs/207 sequence) as a separate Design→Document→Approve→Implement package.

Do **not** auto-start Asset Registry / Asset QR / PM generation / Global Search / Quick Create / Recent Items.

---

## Final verdict

**SLICE 2 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

**STOP.**

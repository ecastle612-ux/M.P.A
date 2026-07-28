# 48 — OPS-001 Slice E Implementation Summary

**Package:** OPS-001  
**Slice:** E — Unified Inbox + Universal Command Center + Global Search + Quick Actions  
**Authorization:** [47](./47-slice-e-authorization.md) · [CORE-003 §91](../113-core-003-implementation-master-plan/91-ops-001-slice-e-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED PASS** ([49](./49-slice-e-validation.md))  
**Date:** 2026-07-26  
**Migration:** None (aggregates A–D substrates on demand; no new persistence plane)  
**Validation probe:** `ops001-slice-e-v1` ([49](./49-slice-e-validation.md))

> UX-012 Slices C–E · PMX-004 Phases 9–11 · FIN remaining · partner marketplace UI **not** touched.  
> FAC-002 product surfaces **not** redesigned.  
> AUTH-001 · COM-001 · OPS-001 Slices A–D behaviors preserved.  
> No parallel event bus · no parallel homepage bus · no ungated AI mutations.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| **Unified Inbox** | Org-scoped, per-principal aggregation of notifications + ops tasks + AI recommendations; filters (kind/status/unread/assigned); read/unread for notifications; assignment state; deep links; `/inbox` + `/api/ops/inbox` |
| **Universal Command Center homepage** | Single `/dashboard` composition from Task / Timeline / Inbox / AI Director / KPIs / Monitoring / Quick Actions; existing Operations Center modules retained below as integrations — not alternate homes |
| **Global Search** | Fail-closed org + permission corpora via `/api/ops/search`; Commands corpus for entitled quick actions; Cmd+K provider `opsGlobalSearchProvider` |
| **Global Quick Actions** | Permission/context catalog; domain command create-task + navigate actions; emit `ops.quick_action.invoked` / task events; `/api/ops/quick-actions` |
| **Operational command surface** | Composes A–D engines only (bus, timeline, notify, tasks/priority, AI Director, automation signals via monitoring, analytics KPIs) |
| **Shell** | `/inbox` · `/activity` · `/dashboard` on OPS path prefixes; leasing/tech may reach CC/inbox without changing AUTH assigned landings |
| **Tests** | Fail-closed search · quick-action permission gating |

---

## 2. Files changed

### Lib (OPS)

| Path | Change |
|------|--------|
| `apps/web/src/lib/ops/unified-inbox.ts` | **Added** — inbox aggregation + mark read |
| `apps/web/src/lib/ops/command-center-home.ts` | **Added** — Universal CC homepage composition |
| `apps/web/src/lib/ops/global-search.ts` | **Added** — fail-closed multi-corpus search |
| `apps/web/src/lib/ops/quick-actions.ts` | **Added** — catalog + execute + Commands helpers |
| `apps/web/src/lib/ops/slice-e.test.ts` | **Added** — OE-05/OE-07 unit coverage |
| `apps/web/src/lib/ops/catalog.ts` | Slice E event types |
| `apps/web/src/lib/ops/index.ts` | Barrel exports |

### API

| Path | Change |
|------|--------|
| `apps/web/src/app/api/ops/inbox/route.ts` | **Added** — list + mark read |
| `apps/web/src/app/api/ops/search/route.ts` | **Added** — fail-closed search |
| `apps/web/src/app/api/ops/quick-actions/route.ts` | **Added** — list + execute |
| `apps/web/src/app/api/ops/command-center/route.ts` | **Added** — homepage composition |

### UI / shell

| Path | Change |
|------|--------|
| `apps/web/src/app/(app)/inbox/page.tsx` | **Added** — Unified Inbox page |
| `apps/web/src/components/ops/unified-inbox-panel.tsx` | **Added** |
| `apps/web/src/components/ops/command-center-home-panel.tsx` | **Added** |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Composes Command Center home |
| `apps/web/src/components/shell/dashboard-shell.tsx` | Renders CC panel above Operations Center |
| `apps/web/src/lib/command-center/providers/ops-global-search-provider.ts` | **Added** — Cmd+K secure search |
| `apps/web/src/lib/command-center/registry.ts` | Registers ops search provider |
| `apps/web/src/lib/command-center/providers/static-providers.ts` | Command Center / Ops Inbox nav entries |
| `apps/web/src/components/shell/navigation-config.ts` | Command Center + Ops Inbox nav |
| `apps/web/src/lib/auth/ops-shell-access.ts` | `/inbox` · `/activity` · `/dashboard` prefixes for leasing/tech |
| `apps/web/src/middleware.ts` | Matcher includes `/inbox` · `/activity` |
| `apps/web/src/components/presentation/nav-icons.tsx` | Icons for `/inbox` · `/activity` |

### Docs

| Path | Change |
|------|--------|
| `docs/111-ops-001-…/48-slice-e-implementation.md` | **Added** — this summary |
| `docs/111-ops-001-…/47-slice-e-authorization.md` | Implementation status |
| `docs/111-ops-001-…/18-implementation-slices.md` | Slice E Implement ✅ |
| `docs/111-ops-001-…/README.md` | Board status |
| `docs/111-ops-001-…/02-event-catalog.md` | Slice E events |
| `docs/113-core-003-…/91-ops-001-slice-e-authorization.md` | Implementation status |
| `docs/113-core-003-…/05-…` · `README.md` | Next action → validate |

---

## 3. Unified Inbox architecture

```
GET /api/ops/inbox?kind=&status=&unreadOnly=&assignedToMe=
  → listUnifiedInbox (org + principal)
       · notifications (Notification Center / Slice B)
       · ops tasks (Task Engine / Slice C) — assigned_to_me | unassigned
       · AI recommendations (AI Director / Slice D)
  → emit ops.inbox.opened (secret-free)

PATCH /api/ops/inbox { sourceId: "notification:…" }
  → mutateNotification mark_read / mark_unread

UI: /inbox (distinct from /communications/inbox messaging)
```

Filters: kind, status (all/unread/open/read), unreadOnly, assignedToMe.  
Deep links to underlying work. No COM commercial dashboard coupling.

---

## 4. Universal Command Center architecture

```
/dashboard (single operational landing for OA/PM AUTH homes)
  → composeCommandCenterHome
       · priority tasks (Priority Engine)
       · inbox unread + preview
       · AI recommendations (human-gated)
       · recent activity (Timeline / Slice A)
       · quick actions (permission filtered)
       · KPI snapshots (Slice D analytics)
       · monitoring (queue / workflows / automation / lag)
       · alerts composition
  → CommandCenterHomePanel (UX-012 A `--mpa-*` tokens)
  → existing OperationsCenterView module metrics (integrations, not alternate home)

GET /api/ops/command-center → same composition for refresh
```

**AUTH landings preserved:** leasing → `/leases`, technician → `/maintenance` (AUTH-001). Those roles may open `/dashboard` / `/inbox` / `/activity` via updated path allowlists. No second homepage product.

---

## 5. Global Search

```
GET /api/ops/search?q=
  → runGlobalSearch / globalSearch
       fail-closed per corpus:
         commands | tasks | ai | properties | units | tenants | leases | maintenance | vendors
       denied corpora → empty hits + listed in deniedCorpora
       org_id always applied on domain queries
       schema/query errors → deny corpus (no leakage)
  → emit ops.search.performed

Cmd+K: opsGlobalSearchProvider → same API
```

### MVP corpus gap list (OE-05)

| Corpus | Status |
|--------|--------|
| tasks · ai · commands | ✅ Live |
| properties · units · tenants · leases · maintenance · vendors | ✅ Live when permission + table shape allow; else fail-closed deny |
| announcements / messages as first-class search corpora | Deferred — notifications remain via Inbox; messaging providers remain in pre-existing Cmd+K API providers |
| Full US-01 document/restricted snippet redaction beyond deny | Design target remains; MVP never returns restricted snippets from denied corpora |

---

## 6. Quick Actions

| Action ID | Behavior | Permissions |
|-----------|----------|-------------|
| `create_work_order` | Navigate `/maintenance?create=1` | maintenance:write \| create |
| `create_task` / `assign_follow_up` | `createOpsTask` + OPS events | maintenance:write |
| `open_inbox` | Navigate `/inbox` | maintenance:read \| dashboard:read |
| `open_activity` | Navigate `/activity` | maintenance:read \| dashboard:read |
| `review_ai` | Navigate `/inbox?kind=ai` | maintenance:read |
| `open_maintenance` | Navigate `/maintenance` | maintenance:read |

Success emits `ops.quick_action.invoked` or task-create events. Forbidden without permission. No raw SQL domain mutations. AI Director approve/reject remains Slice D gated APIs — not ungated from Quick Actions.

---

## 7. Operational integration (A–D)

| Engine | How Slice E uses it |
|--------|---------------------|
| Event Bus (A) | Emits inbox/search/quick-action outcomes; timeline consumption |
| Timeline (A) | Recent activity on CC; `/activity` preserved |
| Notification Center (B) | Inbox notification stream + mark read |
| Task / Priority (C) | Priority tasks panel + inbox tasks + create_task action |
| Workflow / Automation / Monitoring (C/D) | Queue/workflow/automation health on CC |
| AI Director (D) | Pending recommendations on CC + inbox; human gates intact |
| Analytics (D) | KPI tiles on CC |

No parallel buses. No FAC redesign. No extra dashboards beyond composing `/dashboard`.

---

## 8. OPS completion status

| Slice | Authorize | Implement | Validate |
|-------|-----------|-----------|----------|
| A–D | ✅ | ✅ | ✅ PASS |
| **E** | ✅ ([47](./47-slice-e-authorization.md)) | ✅ **([48](./48-slice-e-implementation.md))** | ✅ **PASS** ([49](./49-slice-e-validation.md)) |

OPS-001 Slice E is the final presentation/command layer. Package status: ✅ **COMPLETE** (A–E Validated).

---

## 9. Explicit non-goals (verified not shipped)

- UX-012 Slices C–E role chrome  
- PMX-004 Phases 9–11  
- FIN remaining / marketplace UI  
- FAC-002 redesign  
- Parallel command centers / homes / event buses  
- Ungated AI money/legal/resident-blast mutations  

---

## 10. Recommendation

**Completed:** `VALIDATE OPS-001 SLICE E` → ✅ **PASS** ([49](./49-slice-e-validation.md)).

OPS-001 A–E ✅ **COMPLETE**. Do **not** begin UX-012 C–E · PMX-004 9–11 · FIN remaining · marketplace without separate authorize phrases.

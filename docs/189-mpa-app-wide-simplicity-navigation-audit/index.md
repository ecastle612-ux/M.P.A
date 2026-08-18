# M.P.A. APP-WIDE SIMPLICITY + NAVIGATION AUDIT

**Title:** M.P.A. APP-WIDE SIMPLICITY + NAVIGATION AUDIT  
**Status:** DESIGN COMPLETE — APPROVAL REQUIRED  
**Date:** 2026-08-18  
**Program:** SIM-001 (App-Wide Simplicity Initiative)  
**Related ADR:** [ADR-035](../18-decision-log/adr-035-app-wide-simplicity-navigation.md) (**Proposed**)  
**Companion:** [docs/188 — FO Operational Efficiency](../188-fo-operational-efficiency/index.md)  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Production:** No production change from this package  
**Billing / Stripe / SKUs / commercial flow:** Unchanged (Product Constitution)  
**Visual identity:** Preserve Canopy — **not** a cosmetic redesign  

---

## Constraints honored

This package audits and designs information architecture, navigation, and workflow efficiency. It does **not** implement, deploy, mutate Production, activate tenant payments, change Stripe/pricing, enable M5, unfreeze July, or implement unrelated modules.

**Objective:** Fewer clicks, less searching, less duplicate entry, clearer next actions, consistent navigation, faster daily work — while preserving security confirmations and financial server confirmation.

**Target feeling:** “I open it and immediately see what I need to do” — not “I figure out which module contains what I need.”

**Coordination:** FO-EFF features (docs/188) must be designed for this destination IA **before** implement (Owner §28).

---

## 1. Complete route / surface inventory

Inventory from `apps/web` app router + shared nav (`packages/shared/src/commercial/modules.ts`, master-admin, portal nav). Route groups stripped to URL paths.

### 1.1 Public / commercial

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/pricing`, `/modules`, `/enterprise`, `/get-started` | Product education / Enterprise sales motion page |
| `/checkout`, `/checkout/success`, `/checkout/cancel` | Stripe Checkout |
| `/commerce/continue` | Post-checkout continue |
| `/complimentary/claim` | Complimentary claim |
| `/privacy`, `/terms` | Legal |
| `/login`, `/forgot-password`, `/reset-password` | Auth |
| `/accept-invitation/[token]` | Invite accept |
| `/demo`, `/demo/[product]`, … | Demo |

### 1.2 Guided setup / launcher / account

| Path | Purpose |
|------|---------|
| `/setup` | Guided Setup |
| `/launcher` | Complete / workspace launcher |
| `/dashboard`, `/profile` | Legacy/account |
| `/billing` | Tenant Billing & Plan (org) |
| `/settings/organization`, `/settings/team` | Org settings |
| `/complimentary/expired` | Expired complimentary |

### 1.3 Property Manager

| Path | Purpose |
|------|---------|
| `/pm/mission-control` | PM home |
| `/pm/properties`, `/pm/properties/[propertyId]`, `.../money` | Properties |
| `/pm/residents`, `/pm/residents/[residentId]` | Residents |
| `/pm/leasing`, `/pm/leasing/[leaseId]` | Leases |
| `/pm/maintenance` | Residential maintenance |
| `/pm/reports/work-orders` | WO reports |
| `/pm/vendors` | Vendors |
| `/pm/financial-operations` | Fin Ops |

### 1.4 Facility Operations

| Path | Purpose |
|------|---------|
| `/facility/mission-control` | FO home |
| `/facility/operations` | Work orders |
| `/facility/reports`, `/facility/vendors` | Reports / vendors |
| `/facility/assets`, `/facility/assets/[assetId]` | Asset registry (FAC-003) |
| `/facility/inventory`, `/facility/inventory/[itemId]` | Stock ledger |
| `/facility/preventive-maintenance`, `/inspections`, `/safety`, `/compliance`, `/parts`, `/building-systems` | Category WO queues |
| `/facility/capital-projects` | Exists; **not** a commercial product — nav hidden/planned |

**Designed (not shipped):** `/facility/my-work`, `/facility/pm-schedules`, Asset QR routes (docs/188).

### 1.5 Shared

`/shared/documents`, `/shared/tables`, `/shared/reports`, `/shared/communications` (+ conversation routes).

### 1.6 Portals

`/portal`, `/portal/manager`, `/portal/owner` (+ financials/properties), `/portal/tenant` (+ billing, maintenance, documents, messages), `/portal/vendor`.

### 1.7 Master Admin

Live nav: `/admin`, support, system, platform orgs/customers/operators, view-as, commercial billing/provisioning/lifecycle/subscriptions/complimentary-access/checkout. Extra pages may redirect / stay out of nav.

### 1.8 Other

`/unauthorized`.

---

## 2. Role inventory

| Role / persona | Primary home (today) | Should feel like (target) |
|----------------|----------------------|---------------------------|
| Organization admin / property manager (PM SKU) | `/pm/mission-control` | Portfolio + residents + maintenance + money attention |
| Same on FO SKU | `/facility/mission-control` | Operations + PM due + assets + requests |
| Complete admin | `/launcher` then surface | Effective-surface aware (ADR-033) |
| Maintenance / facility technician | Often skewed to PM maintenance path | **My Work** only for daily execution |
| Tenant | `/portal/tenant` | Balance + Pay Once / AutoPay + history |
| Owner portal | `/portal/owner` | Portfolio money (existing) |
| Vendor portal | `/portal/vendor` | Assigned vendor work |
| Master Admin | `/admin` | Platform administration |
| Complimentary | Same SKU surfaces + expiry states | Identical simplicity rules; no special clutter |
| Public requester (future FO QR) | Token form | Restricted intake only |

---

## 3. Click-count matrix

Guidance bands: **1 ideal · 2 good · 3 acceptable · 4+ justify or simplify**. Do not weaken security/payment confirms to chase clicks.

| Workflow | Start | Screens (approx today) | Clicks/taps (approx) | Band | Friction notes |
|----------|-------|------------------------|----------------------|------|----------------|
| PM: open Mission Control attention → WO | MC | 2–3 | 2–4 | Mixed | If MC is stats-first, extra hops |
| PM: Resident → Post Charge | Residents list | 3–5 | 4+ | **Simplify** | Module hop + re-identify resident/lease |
| PM: Unit/property → maintenance history | Property | 3–4 | 4+ | Simplify | Sidebar detour common |
| FO: Create WO from Operations | Operations | 2–3 | 2–3 | Acceptable | Asset/location re-entry risk |
| FO: Find asset → create WO | Assets | 3–5 | 4+ | **Simplify** | Needs contextual Create + QR |
| FO: Technician do assigned job | Ops/MC | 4–6 | 4+ | **P0** | Manager chrome; needs My Work |
| FO: Complete checklist job | N/A (missing) | — | — | Gap | Templates not shipped |
| Tenant: Pay Once | Portal billing | 2–4 | 2–4 | Watch | Keep payment confirm |
| Public: Checkout → account → setup | Marketing | Multi | Multi | Binding commercial flow — do not reorder |
| Claim complimentary | Claim URL | 2–3 | 2–3 | OK | |
| Password recovery | Login | 2–3 | 2–3 | OK | Security > clicks |
| Complete: switch PM ↔ FO | Launcher | 2–3 | 2–3 | Acceptable | Reduce if daily thrash |
| Global find “Chair 14” | — | None today | Many | **Gap** | No global search |
| Notification → record | Notify | Often 2–4 | 3–5 | Simplify | Must deep-link |

*Counts are audit estimates from route/IA review, not instrumented analytics. Implement packages should add lightweight instrumentation after Approve if Owner wants measured baselines.*

---

## 4. Top friction points

1. **Technician forced through manager navigation** to execute work.  
2. **No global search** — users hunt modules then re-search.  
3. **Mission Control skews toward presence/stats** vs “what needs me.”  
4. **Duplicate entry** of property/building/asset/resident already known from context.  
5. **Weak contextual actions** — open record → sidebar → other module → search again.  
6. **Category queue sprawl** in FO (many similar list pages) without schedule/asset anchors.  
7. **Role home mismatch** (technician default bias toward PM maintenance).  
8. **Notifications** that land on generic queues.  
9. **Empty states** that say “none” without next action.  
10. **Mobile** tables/controls tuned for desktop operations consoles.

---

## 5. Duplicate-entry findings

| Context | Re-asked today / risk | Prefer |
|---------|----------------------|--------|
| Asset known | Building/floor/room on WO | Prefill from `facility_assets` |
| Asset QR | Location + asset | Server resolve from token |
| Resident → charge | Resident/lease/org | Prefill; authorize server-side |
| WO → add vendor | Building/WO | Prefill WO scope |
| PM schedule → WO | Asset/site/priority/template | Copy from schedule |
| Routing matched | Assignee | Auto/suggest — don’t re-pick blindly |
| Complete surface switch | Org | Never re-enter org |

**Hard rule:** Prefill is never authorization. Server re-checks org, surface, RBAC, and entity membership.

---

## 6. Global search design

### 6.1 One command center

Available from primary authenticated staff UI (PM, FO, Complete effective surfaces). Shortcut: `/` focuses search (desktop). Mobile: persistent search entry in shell.

### 6.2 Query examples

Resident, tenant, property, unit, building, room, asset, work order, FR request number (when public requests exist), vendor, lease, receipt, charge (when authorized).

Example: `Chair 14` → Asset Chair #14, open WO, request FR-…, building Main Clinic.

### 6.3 Permissions

- **Server-side** filtering only.  
- User must never discover unauthorized records via suggestion enumeration.  
- Rate-limit; minimum query length; no cross-org.  
- Complete: filter by effective operating scope (ADR-033).  
- Technician: narrow to assigned WOs + entitled linked assets (per Owner decision in docs/188).

### 6.4 Result actions

Each hit shows type + primary action (Open, Assign, Pay — if allowed). Enter opens top authorized result.

---

## 7. Quick Create design

Global **+ Create** (or `N` shortcut) — **context-aware**, permission-filtered.

| Surface | Options (examples) |
|---------|-------------------|
| PM | Property, Resident, Lease, Maintenance Request, Charge |
| FO | Work Order, Asset, Request Form (when exists), Preventive Schedule |
| Complete | Union filtered by effective surface + RBAC |
| Technician | **Only** actions they can perform (e.g., none, or note on assigned WO) — never manager creates |

Do not show inaccessible actions. Prefer create drawers that inherit current property/building/asset context when present.

---

## 8. Contextual-action design

Act where the user already is:

| Record | Actions |
|--------|---------|
| Resident | View Lease, Post Charge, Maintenance History |
| Unit | Resident, Lease, Maintenance |
| Asset | Report Problem, Create Work Order, History, PM Schedule |
| Building / site | Work Orders, Assets, Request QR, PM Due |
| Vendor | Active Work, History, Contact |
| Work Order | Start/Assign/Complete, Asset, Checklist, Vendor |
| Lease | Resident, Unit, Charges |

Reduce: open record → back to sidebar → find module → search same object.

---

## 9. Recent / favorite / saved-view recommendation

| Capability | Phase 1 recommendation | Rationale |
|------------|------------------------|-----------|
| **Recent** | **Yes — lightweight** | Recently viewed entities (property, building, asset, WO, resident) — org + user scoped; no cross-org leakage |
| **Favorites / pins** | **Yes — lightweight** | Pin properties, buildings, assets, key views (My Work, Past Due). Cap count (e.g., 8) |
| **Saved views** | **Yes — filters** | Named filter sets: My open work, Emergency, Unassigned, Building A, Overdue PM, Past-due balances, Move-outs this month |

Privacy: per-user within org; surface-aware; never share technician pins into tenant portal.

---

## 10. Mission Control recommendations

Mission Control answers: **WHAT NEEDS MY ATTENTION?**

Prioritize actionable queues (click → land on work):

| PM examples | FO examples |
|-------------|-------------|
| Overdue maintenance | Overdue / due today WO |
| Unassigned requests | Unassigned + routing suggestions |
| Past-due balances / payment issues | PM due / overdue schedules |
| Expiring leases | Safety / emergency |
| Vendor action needed | Blocked / Need Parts signals |

Statistics are secondary. Preserve Canopy Operations Console character — action before analytics (docs/07).

---

## 11. Technician simplification

- Default post-auth home → **My Work** (docs/188) when role is technician.  
- Hide manager-only nav (reports, vendors admin, team, fin ops, PM schedules admin).  
- Today / Overdue / Upcoming only.  
- Notifications → execution screen.  
- No requirement to visit Mission Control for daily work.

---

## 12. PM simplification

- Resident/Unit/Lease contextual money + maintenance actions.  
- Mission Control attention for past-due and open maintenance.  
- Quick Create for charge/maintenance with prefill.  
- Global search for resident/unit/lease.  
- Keep Fin Ops confirms intact.

---

## 13. FO simplification

- Collapse cognitive load of many category queues: keep queues, but lead with **Operations + Assets + (future) PM Schedules + My Work**.  
- Asset-centric create and QR.  
- Templates on create/triage.  
- Routing reduces assign clicks.  
- Capital Projects remains non-product (hidden).

---

## 14. Complete simplification

- Launcher chooses surface; remember last effective surface (safe preference).  
- Search/Create scoped to effective surface.  
- Do not show PM money actions on FO-only days without scope.  
- ADR-033 operating scope is the authority.

---

## 15. Tenant simplification

- Home: balance, Pay Once, AutoPay status, recent activity.  
- Billing history/receipts one path.  
- Maintenance request without staff chrome.  
- Never optimistic financial success before server confirm.

---

## 16. Mobile findings

| Flow | Finding |
|------|---------|
| Technician work | Needs phone-first My Work; desktop tables fail |
| QR request / asset scan | Full-bleed simple form; large photo capture |
| WO update | Sticky primary actions |
| Tenant payment | Large pay CTA; avoid dense tables |
| Manager ops on phone | Acceptable list→detail; defer dense reports |

Avoid tiny controls. Prefer list cards over multi-column grids at phone width.

---

## 17. Terminology findings

| Observed variants | Canonical recommendation |
|-------------------|--------------------------|
| Request / Work Request / Work Order | **Work Order** for staff jobs; **Request** for intake before triage (public/tenant). Avoid “Work Request” as a third term |
| Maintenance vs Operations | PM SKU: **Maintenance**; FO SKU: **Operations** (same spine, surface language) |
| Online Payments / Billing / Charge / Payment | **Charge** (ledger), **Payment** (settlement), **Billing** (tenant-facing home), **Online Payments** only if already customer-facing label — do not rename stable Fin Ops concepts without strong reason |
| Preventive Maintenance vs Preventive Work queue | **PM Schedule** (admin) vs **Preventive work** (WO category queue) |
| Asset vs Equipment vs Inventory | **Asset** (serialized equipment); **Inventory/Stock** (quantities) |
| FR / WO numbers | Keep stable prefixes once public requests exist |

**Rule:** Do not rename stable concepts without usability evidence + Approve.

---

## 18. Empty-state findings

Every important empty state should answer: What is this? Why empty? What next?

| Bad | Better |
|-----|--------|
| “No assets” | “Track equipment and service history in one place.” **[Add Asset]** |
| “No work orders” | “Nothing assigned. When work is assigned, it appears here.” |
| “No results” (search) | “No matches you can access.” (no leakage) |

Avoid essay tutorials for experienced users — one sentence + one CTA.

---

## 19. Navigation consistency findings

| Issue | Recommendation |
|-------|----------------|
| Breadcrumbs inconsistent | Record pages: Surface → List → Record; include entity name |
| Back often returns to MC | Prefer history back to previous record/list; MC is not the only hub |
| FO category nav length | Group under Operations; don’t force equal weight to every category |
| Shared docs/tables/reports | Keep shared, but don’t interrupt daily ops path |
| Technician vs manager same shell | Role-specific shell density |

Where am I? What record? How back? What next? — must be answerable on every operational detail page.

---

## 20. Recommended information architecture

```
Role home (attention or My Work)
  ├─ Global Search
  ├─ Quick Create (RBAC)
  ├─ Recent / Pins
  └─ Primary modules (SKU + role filtered)
        └─ Record pages with contextual actions
              └─ Deep links from notifications
```

**FO destination (with docs/188):**

```
My Work (tech) | Mission Control (manager)
Operations
Assets (+ QR)
PM Schedules (manager)
Templates (manager settings or ops sub)
Vendors / Reports / Inventory (manager)
```

**Do not** bury Assets five clicks deep. **Do not** build technician flows around manager dashboards.

---

## 21. P0 / P1 / P2 / P3 table

| ID | Recommendation | Priority |
|----|----------------|----------|
| SIM-P0-1 | Technician My Work as default home | P0 |
| SIM-P0-2 | Mission Control attention queues with deep links | P0 |
| SIM-P0-3 | Notification → exact record | P0 |
| SIM-P0-4 | Asset contextual Report Problem / Create WO (with FO-EFF) | P0 |
| SIM-P1-1 | Global search (server-authorized) | P1 |
| SIM-P1-2 | Quick Create context-aware | P1 |
| SIM-P1-3 | Prefill / kill duplicate entry on top flows | P1 |
| SIM-P1-4 | Recent items | P1 |
| SIM-P1-5 | Saved views for ops + money lists | P1 |
| SIM-P1-6 | Breadcrumbs + sane back behavior | P1 |
| SIM-P1-7 | Empty states with CTA | P1 |
| SIM-P2-1 | Favorites / pins | P2 |
| SIM-P2-2 | Keyboard shortcuts (`/`, `N`, Esc) | P2 |
| SIM-P2-3 | Terminology pass (non-breaking) | P2 |
| SIM-P2-4 | Mobile polish on manager lists | P2 |
| SIM-P2-5 | Prefetch / skeletons / preserve filters & scroll | P2 |
| SIM-P3-1 | Remember last Complete surface | P3 |
| SIM-P3-2 | Advanced saved-view sharing within org | P3 |
| SIM-P3-3 | Instrumentation dashboard for click metrics | P3 |

---

## 22. Effort / impact matrix

| Item | Effort | Impact |
|------|--------|--------|
| Technician My Work home | MEDIUM | HIGH |
| MC attention queues | MEDIUM | HIGH |
| Notification deep links | LOW–MEDIUM | HIGH |
| Asset contextual actions + QR | MEDIUM (w/ FO-EFF) | HIGH |
| Global search | HIGH | HIGH |
| Quick Create | MEDIUM | HIGH |
| Prefill duplicate-entry kills | LOW–MEDIUM | HIGH |
| Recent | LOW | MEDIUM–HIGH |
| Saved views | MEDIUM | MEDIUM–HIGH |
| Favorites | LOW | MEDIUM |
| Breadcrumbs/back | LOW–MEDIUM | MEDIUM |
| Empty states | LOW | MEDIUM |
| Keyboard shortcuts | LOW | LOW–MEDIUM |
| Performance perception | MEDIUM | MEDIUM |
| Terminology renames | MEDIUM | LOW (risk HIGH if forced) |

---

## 23. Implementation sequence

**Do not implement everything at once.** Smallest sequence for largest effort reduction:

| Package | Contents | Notes |
|---------|----------|-------|
| **SIM-S1** | Role-specific homes (esp. technician My Work) + notification deep links | Pair with FO-EFF-S2 |
| **SIM-S2** | Mission Control attention model (PM + FO) | Action before analytics |
| **SIM-S3** | Contextual actions + prefill on Resident/Unit/Asset/WO | Pair with FO-EFF-S3 |
| **SIM-S4** | Global Search MVP (WO, asset, resident, property, vendor) | Server authz first |
| **SIM-S5** | Quick Create + Recent | |
| **SIM-S6** | Saved views + empty states + breadcrumbs | |
| **SIM-S7** | Favorites + keyboard shortcuts + perf perception | Polish |

FO-EFF slices (docs/188) interleave: templates → My Work → Asset QR → PM generation → routing → public bridge.

**Measurable simplification, not feature accumulation.**

---

## 24. Regression risks

| Risk | Mitigation |
|------|------------|
| Search leakage across orgs/surfaces | Mandatory authz tests; no client-only filtering |
| Quick Create shows forbidden actions | RBAC matrix tests per role/SKU |
| Technician home breaks manager bookmarks | Role-based default only; managers unchanged |
| MC redesign becomes cosmetic dashboard | Keep Canopy; attention lists first |
| Prefill trusted as authz | Server checks on every mutation |
| Optimistic UI on payments | Forbidden for financial settlement |
| Breaking commercial flow | Landing → product → monthly/annual → Stripe → account → setup → MC **unchanged** |
| Complete scope confusion | ADR-033 tests |
| Renaming terms breaks help/docs | Prefer aliases; Approve renames |

---

## 25. Exact Owner decisions

1. **Approve** docs/189 + **Accept** ADR-035?  
2. Authorize SIM-S1–S3 as first implement packages after Approve?  
3. Global Search in Phase 1 for staff only (not tenant/master-admin mixed)? **Recommend staff-first.**  
4. Technician default home = `/facility/my-work` even on Complete?  
5. Favorites in Phase 1 or defer to S7?  
6. Saved views shared across users? **Recommend personal-only Phase 1.**  
7. Any terminology renames in Phase 1, or freeze vocabulary with aliases only?  
8. May implement packages add click/attention instrumentation?  
9. Confirm commercial flow and pricing/Stripe remain untouched.  
10. Confirm this is **not** a visual redesign authorization.  

---

## Cross-link: FO efficiency before build

Per Owner §28: do not build Assets five clicks deep then add search; do not build technician workflows around manager nav then retrofit mobile; do not build PM schedules that re-ask known asset/building data. **Destination IA in this record binds FO-EFF implement packages.**

---

## Final recommendation (combined)

**Smallest high-leverage sequence across both goals:**

1. Approve docs/188 + docs/189 (+ Accept ADR-034/035)  
2. **SIM-S1 + FO-EFF-S1/S2** — Templates/checklists + Technician My Work + notification deep links  
3. **SIM-S2** — Mission Control attention  
4. **FO-EFF-S3 + SIM-S3** — Asset QR + contextual actions + prefill  
5. **SIM-S4/S5** — Global Search + Quick Create + Recent  
6. **FO-EFF-S4/S5** — PM generation + routing  
7. **SIM-S6/S7** + public QR bridge when docs/204–205 (or successor) Approved  

Stop feature accumulation when daily “see → act → complete” is measurably shorter for technician, facility manager, and property manager personas.

---

## Status line

**M.P.A. SIMPLICITY AUDIT COMPLETE — APPROVAL REQUIRED**

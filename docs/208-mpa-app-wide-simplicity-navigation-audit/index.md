# M.P.A. APP-WIDE SIMPLICITY + NAVIGATION AUDIT

**Title:** M.P.A. APP-WIDE SIMPLICITY + NAVIGATION AUDIT  
**Status:** DESIGN COMPLETE — APPROVAL REQUIRED (RECONCILED)  
**Date:** 2026-08-18  
**Program:** SIM-001  
**Related ADR:** [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) (**Proposed**)  
**Companion:** [docs/207 — FO Operational Efficiency](../207-fo-operational-efficiency/index.md)  
**Predecessor lineage:** Certified docs/188–206 on `cursor/facility-work-request-production-021b` (see docs/207 §0) · includes [docs/204](../204-facility-custom-work-request-forms/index.md) / [ADR-034](../18-decision-log/adr-034-facility-public-work-request-intake.md) / [docs/205](../205-facility-public-work-request-intake-implementation/index.md) / [docs/206](../206-facility-public-work-request-production-release/index.md)  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Production:** No production change from this package  
**Visual identity:** Preserve Canopy — **not** a cosmetic redesign  

---

## 0. Lineage reconciliation

This record **replaces** the erroneous `docs/189` simplicity draft that was numbered against stale `main` (through docs/187 only). Certified **docs/189** remains **Tenant Stripe Rent Collection Implementation Certification** and is untouched.

New number after certified sequence ending at **docs/206**: **docs/208**.

Public Facility Request Forms, QR/link intake, public mobile portal, request tracking, and FO request-source information are **in scope** for this audit as **shipped certified surfaces**, not future work.

---

## Constraints

Fewer clicks, less searching, less duplicate entry, clearer next actions, consistent navigation, faster daily work. Do not weaken security or payment confirms. Do not reorder the binding commercial flow (ADR-019). Measure each future implement package on: **clicks to complete**, **repeated data entry**, **time to next action**.

---

## 1. Complete route / surface inventory

### Public / commercial
`/`, `/pricing`, `/modules`, `/enterprise`, `/get-started`, `/checkout` (+ success/cancel), `/commerce/continue`, `/complimentary/claim`, `/privacy`, `/terms`, `/login`, `/forgot-password`, `/reset-password`, `/accept-invitation/[token]`, `/demo/*`

### Facility public request intake (certified docs/204–206)
| Path | Purpose |
|------|---------|
| `/request/[token]` | Public / Contact Required mobile request portal |
| `/request/status/[statusToken]` | Requester tracking (coarse status only) |
| `/facility/settings/request-forms` | Admin form builder, publish, share link, QR, contextual intakes |

### Guided setup / launcher / account
`/setup`, `/launcher`, `/dashboard`, `/profile`, `/billing`, `/settings/organization`, `/settings/team`, `/complimentary/expired`

### Property Manager
`/pm/mission-control`, properties, residents, leasing, maintenance, reports/work-orders, vendors, financial-operations

### Facility Operations
`/facility/mission-control`, `/facility/operations` (includes intake-origin WOs + FR numbers + source), reports, vendors, assets, inventory, category queues, **request-forms settings**; designed (docs/207): `/facility/my-work`, PM schedules

### Shared
documents, tables, reports, communications

### Portals
tenant (billing, Pay Once/AutoPay, maintenance, documents, messages), owner, vendor, manager

### Master Admin
operations, customers, commercial (incl. complimentary), support/view-as

---

## 2. Role inventory

| Persona | Target home |
|---------|-------------|
| PM manager | Attention: portfolio, residents, maintenance, money |
| FO manager | Attention: operations, unassigned/intake, PM due, assets, request forms |
| Technician | **My Work** |
| Complete | Effective-surface aware (ADR-033 / docs/202–203) |
| Tenant | Balance + pay + history |
| Public requester | Token portal only |
| Master Admin | Platform admin |

---

## 3. Click-count matrix (guidance)

Bands: 1 ideal · 2 good · 3 acceptable · 4+ justify/simplify.

| Workflow | Band today | Notes |
|----------|------------|-------|
| Public asset/floor QR → submit request | **Good** (certified) | Locked context kills duplicate entry — preserve |
| Requester → track FR status | **Good** | Email CTA → status URL |
| Staff find intake-origin WO in Operations | Acceptable | Needs search by FR# + source filter (SIM) |
| Admin: create form → publish → QR | 4+ risk | Wizard/progressive disclosure; keep security |
| Admin: mint **asset** contextual intake | Justify | One action from asset detail (docs/207) |
| Technician complete assigned job | **P0** | Still manager-chrome heavy without My Work |
| Resident → Post Charge | 4+ | Contextual prefill |
| Global find “Chair 14” / `FR-2026-…` | Gap | No global search |
| Notification → record | Simplify | Must deep-link WO/FR/asset |

---

## 4. Top friction points

1. Technician navigation tax  
2. No global search (WO, FR, asset, resident, property)  
3. Mission Control not consistently attention-first  
4. Duplicate entry outside QR-locked paths  
5. Weak contextual actions across modules  
6. FO category-queue sprawl  
7. Request-forms admin discoverability (settings vs Operations)  
8. Notifications landing on generic queues  
9. Mobile desktop-table patterns  
10. `main` vs certified-line doc drift (process risk — not UX)

---

## 5. Duplicate-entry findings

| Context | Prefer |
|---------|--------|
| **Certified QR intake** | Keep locked building/floor/dept/room/asset — gold standard |
| Asset → mint intake | Copy ids/labels from `facility_assets` server-side |
| Asset → staff WO | Prefill `facility_asset_id` |
| Resident → charge | Prefill resident/lease |
| WO → vendor | Prefill WO/building |
| PM schedule → WO | Copy schedule/asset/template |

Prefill ≠ authorization.

---

## 6. Global search design

One staff command center. Examples: resident, property, unit, building, room, **asset**, **work order**, **FR request number**, vendor, lease, receipt/charge (authorized).

`Chair 14` → Asset, open WO, FR-…, building.  
`FR-2026-` → intake-origin WO.

**Server-side** permission filter only. Complete scope-aware. Technician results narrowed.

---

## 7. Quick Create

Context-aware `+` / `N`:

- PM: Property, Resident, Lease, Maintenance, Charge  
- FO: Work Order, Asset, **Request Form**, **Contextual Intake/QR**, Preventive Schedule  
- Technician: no manager creates  
- Complete: effective surface only  

---

## 8. Contextual actions

| Record | Actions |
|--------|---------|
| Asset | Report Problem, **Create/Print Asset Request QR** (docs/204 intake), History, PM |
| Building | WOs, Assets, Request QR, PM Due |
| Work Order (intake) | View submission snapshot, FR status link (staff), Assign, Checklist |
| Request Form | Publish, Share Link, QR, Intakes, Preview |
| Resident / Unit / Vendor | As previously designed |

---

## 9. Recent / favorites / saved views

**Recent:** yes (org+user; include FR/WO/asset).  
**Favorites:** lightweight pins.  
**Saved views:** My open work, Unassigned, **Source = QR/Link/Public**, Overdue PM, Past-due balances, etc. Personal-only Phase 1.

---

## 10. Mission Control

Attention first: Overdue, Unassigned, Due today, Safety, **New public requests**, PM due, Payment issues, Expiring leases, Vendor action. Click → exact work.

---

## 11–15. Role simplification

- **Technician:** My Work home; hide manager admin (including request-forms admin).  
- **PM:** Contextual money/maintenance; attention MC.  
- **FO:** Lead with Operations + Assets + Request Forms entry + (future) PM Schedules + My Work; keep category queues secondary.  
- **Complete:** Last effective surface + ADR-033.  
- **Tenant:** Balance / Pay Once / AutoPay / history; no optimistic money success.

---

## 16. Mobile findings

Public request portal (certified) is the pattern to emulate. Technician My Work must match that simplicity. Avoid dense admin tables on phone for daily execute paths. Payment confirms stay explicit.

---

## 17. Terminology

| Canonical | Notes |
|-----------|-------|
| **Request Form** | Admin builder (docs/204) |
| **Request** / **FR-…** | Public intake + tracking number |
| **Work Order** | Staff operational job (includes intake-origin) |
| **Source** | qr / link / authenticated labels on WO |
| Maintenance (PM SKU) vs Operations (FO SKU) | Surface language |
| Asset vs Stock/Inventory | FAC-003 |
| Charge / Payment / Billing | Fin Ops — don’t rename casually |

---

## 18. Empty states

What / why / next CTA. Examples: no request forms yet → **Create Request Form**; no assets → **Add Asset**; My Work empty → calm “Nothing assigned.”

---

## 19. Navigation consistency

Breadcrumbs: Surface → List → Record (include FR/asset names). Back should not always dump to Mission Control. Request Forms under FO settings must be reachable from Operations empty/attention (“Public requests”).

---

## 20. Recommended IA

```
Role home (attention | My Work)
  Global Search · Quick Create · Recent/Pins
  Primary modules (SKU + role)
    Record pages + contextual actions
    Notifications → deep links
Public: /request/{token} + /request/status/{token} (unchanged contracts)
```

---

## 21. P0 / P1 / P2 / P3

| ID | Item | Pri |
|----|------|-----|
| SIM-P0-1 | Technician My Work home | P0 |
| SIM-P0-2 | MC attention + **new public requests** | P0 |
| SIM-P0-3 | Notification deep links (incl. `public_submitted`) | P0 |
| SIM-P0-4 | Asset → intake QR / Report Problem contextual | P0 |
| SIM-P1-1 | Global search (FR, WO, asset, …) | P1 |
| SIM-P1-2 | Quick Create | P1 |
| SIM-P1-3 | Prefill duplicate-entry kills | P1 |
| SIM-P1-4 | Recent + saved views (incl. source filters) | P1 |
| SIM-P1-5 | Breadcrumbs / empty states | P1 |
| SIM-P2-1 | Favorites, keyboard `/` `N` Esc | P2 |
| SIM-P2-2 | Request-forms admin IA polish | P2 |
| SIM-P2-3 | Perf perception (skeletons, preserve filters) | P2 |
| SIM-P3-1 | Shared saved views; click instrumentation | P3 |

---

## 22. Effort / impact

My Work, MC attention, notification deep links, asset contextual QR: **MEDIUM effort / HIGH impact**.  
Global search: **HIGH / HIGH**.  
Quick Create, Recent, prefill: **LOW–MEDIUM / HIGH**.  
Favorites/shortcuts: **LOW / MEDIUM**.

---

## 23. Implementation sequence (aligned with Owner + docs/207)

1. Templates/checklists + Technician My Work  
2. Mission Control attention + notification deep links  
3. Asset registry + Asset QR via **existing** intakes + contextual actions  
4. Global Search + Quick Create + Recent  
5. Preventive Maintenance generation  
6. Deterministic routing  

Do not implement everything at once. Each slice must show shorter see → act → complete.

---

## 24. Regression risks

Search leakage; Quick Create over-permission; breaking docs/204 token/public contracts; optimistic payments; commercial flow reorder; Complete scope (docs/202); treating certified intake as “future” again; renumbering historical docs.

---

## 25. Exact Owner decisions

1. Approve docs/208 + Accept ADR-037?  
2. Authorize SIM slices interleaved with FO-EFF as §23?  
3. Staff-only global search Phase 1?  
4. Technician default `/facility/my-work` on Complete FO scope?  
5. Personal-only saved views Phase 1?  
6. Freeze terminology with aliases (recommended)?  
7. Confirm commercial flow / Stripe untouched?  
8. Confirm **not** a visual redesign?  
9. Confirm docs/204 **APPROVED**, ADR-034 **Accepted**, docs/205 **certified**, docs/206 **Production successful** remain authoritative?  

---

## Owner approval gate

docs/208 Approved · ADR-037 Accepted · slice Authorize · **no implement/deploy/Production from this record**.

---

**M.P.A. SIMPLICITY AUDIT RECONCILED — APPROVAL REQUIRED**

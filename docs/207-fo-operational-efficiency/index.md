# FO OPERATIONAL EFFICIENCY — PM / ASSETS / CHECKLISTS / MOBILE / ROUTING

**Title:** FO OPERATIONAL EFFICIENCY — Preventive Maintenance, Assets + QR, Checklists, Technician My Work, Smart Assignment  
**Status:** **Approved** — Owner 2026-08-18 · Slice 1 authorized (Templates/Checklists + Technician My Work) · see [docs/209](../209-fo-eff-slice1-templates-my-work-implementation/index.md)  
**Date:** 2026-08-18  
**Approved:** 2026-08-18 — Product Owner  
**Program:** FO-EFF-001  
**Related ADR:** [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**)  
**Companion:** [docs/208 — M.P.A. App-Wide Simplicity + Navigation Audit](../208-mpa-app-wide-simplicity-navigation-audit/index.md)  
**Predecessor lineage:** docs/188–206 certified product line (see §0) · especially [docs/204](../204-facility-custom-work-request-forms/index.md) (**APPROVED**) · [ADR-034](../18-decision-log/adr-034-facility-public-work-request-intake.md) (**Accepted**) · [docs/205](../205-facility-public-work-request-intake-implementation/index.md) (**IMPLEMENTED IN-REPO**) · [docs/206](../206-facility-public-work-request-production-release/index.md) (**PRODUCTION RELEASE SUCCESSFUL**)  
**Gate:** Design → Document → Approve → **Implement** (Slice 1 only; ADR-012)  
**Production:** No Production deploy/apply from Slice 1  
**Billing / Stripe / SKUs / roles:** No changes  

---

## 0. Lineage reconciliation (mandatory)

### 0.1 Mismatch found

| Fact | Detail |
|------|--------|
| `origin/main` tip | `b30567e3` — complimentary access through **docs/187** only |
| Erroneous prior design branch | `cursor/fo-efficiency-simplicity-design-01f2` created **conflicting** `docs/188` / `docs/189` FO/Simplicity designs and a **false** ADR-034/035 on top of stale `main` |
| Certified history (not on `main`) | Lives on **`origin/cursor/facility-work-request-production-021b`** (tip `56d80d38`) — docs/188–202, 204–206 + Accepted ADR-034 |
| docs/203 | Certified on **`origin/cursor/final-e2e-flow-audit-021b`** (`6ce5a593`); cited by docs/204 as predecessor; **not** present as a tree path on the production-request branch (parallel merge ancestry) |
| Public request | **Already Approved / Accepted / Implemented / Production-released** — not “future” |

### 0.2 Where certified docs/188–205(+206) live

| Record | Branch | Key commit(s) |
|--------|--------|----------------|
| docs/188–199 (tenant Stripe / Online Payments) | `cursor/facility-work-request-production-021b` (merged ancestry from tenant-payment line) | e.g. `bd44da30` merge of 188–193; later 194–199 certs |
| docs/200–202 | same production-request line | marketing / e2e / scoped-staff |
| docs/203 | `cursor/final-e2e-flow-audit-021b` | `6ce5a593` |
| docs/204 design | production-request + forms branches | `295fa9f7` / `499b93f0` |
| ADR-034 Accepted | same | Facility Public Work Request Intake |
| docs/205 impl cert | `c3fc21bc` / `d4241238` implement · `e8758b22` / `c3188f61` certify · pin `74dfb355` |
| docs/206 Production release | `56d80d38` | stamp `20260818011913` · app SHA `06164778` |

### 0.3 Reconciliation performed

1. Abandoned conflicting numbers on the stale-`main` design branch (do **not** merge that PR as canonical).  
2. Rebased this design package onto **`origin/cursor/facility-work-request-production-021b`** so certified docs/188–206 and ADR-034 remain intact.  
3. Assigned **new** numbers **docs/207** (this record) and **docs/208** (simplicity).  
4. Assigned **new** ADRs **ADR-036** / **ADR-037** — **ADR-034 preserved** as public-request intake.  
5. Rewrote public-request assumptions to **integrate** with docs/204–206 (no second intake system).

**This package does not rewrite or renumber historical certified records.**

---

## Constraints honored

No implement, deploy, Production mutation, Stripe/pricing changes, M5, July unfreeze, or docs/201 P2 expansion beyond what docs/202/203 already certified. No second work-order state machine. No second public QR/request system.

---

## Product goal

One connected FO efficiency system:

```
Asset
  → preventive schedule OR public/staff request (docs/204–206)
  → facility maintenance_work_order
  → automatic / suggested assignment
  → technician My Work
  → checklist
  → evidence (MEDIA-001)
  → complete / closed
  → asset service history updated
```

Coordinated with docs/208 so new capabilities **shorten** workflows (clicks, duplicate entry, time-to-next-action).

---

## 1. Existing architecture reuse

| Spine | Decision |
|-------|----------|
| `maintenance_work_orders` + `work_surface = facility` | Only job system (ADR-020) |
| Canonical lifecycle | Unchanged; facility complete → closed |
| FAC-003 `facility_assets` + `scan_code` | Registry + QR hook |
| **docs/204 / ADR-034 / docs/205–206** | **Canonical public intake** — forms, intakes, submissions, `/request/{token}`, FR numbers, notifications |
| MEDIA-001 | `maintenance` evidence; `facility_asset` photos; intake parent `facility_request_intake` already certified |
| FAC-002 | Reports later for PM due — not a new stack |
| PLAT-002 / ADR-026 / ADR-033 | Authz + Complete scope |
| `facility_request_intakes.context_json` | Already supports locked `facilityAssetId` / labels / building / floor / department / room |

---

## 2. Asset model

Extend FAC-003; keep records practical (not every field required).

Identity: name, `asset_code`, type, site/building, optional floor/room/department labels, manufacturer/model/serial, dates, status, vendor, notes, MEDIA photos, OPS docs/manuals, optional `scan_code`.

History = facility WOs with `facility_asset_id` (including public-intake WOs).

**Department:** docs/204 notes department is label-on-intake today, not a registry. Asset registry may store `department_label` additively for QR context — Owner decision §18.

---

## 3. Preventive maintenance model

Admin schedule: name, site/building, optional asset or category, recurrence, start date, checklist template, default assignee seed, priority, duration, required evidence.

Occurrence states: Upcoming / Due / Overdue / Completed / Skipped (audited).

Schedule states: Active / Paused / Ended.

---

## 4. Recurrence / generation

Phase 1: every N days / monthly / every N months / annually. Idempotent generation via unique `(pm_schedule_id, occurrence_key)` → at most one WO. Creates facility WO; attaches template snapshot; may seed assignee then apply routing. Edits affect future occurrences only.

---

## 5. Checklist / template model

Reusable `facility_work_templates` with typed items: Checkbox, Text, Number/reading, Yes/No, Photo/evidence. Snapshot onto WO at create (PM, internal, or staff triage applying template to intake-origin WO). Required items/evidence enforced server-side before Complete.

Not a replacement for OPS-001 documents; optional SOP link allowed.

---

## 6. Technician mobile workflow

Phone-first **My Work** (`/facility/my-work`): Today / Overdue / Upcoming → Start → location/asset → issue → checklist → media → notes → Complete.

Map Pause / Blocked / Need Parts / Escalate to **events + notes + assignment changes** — **no new status enum**. Canonical lifecycle only.

---

## 7. Routing-rule model

Deterministic ordered rules (category, building, priority/safety, asset type → technician or vendor). First match wins. Suggest vs auto. Full audit. Admin override always. No autonomous AI. Phase 1 team = lead user or unassigned + label (Owner decision).

---

## 8. QR integration — **extends docs/204–206 (no second system)**

### 8.1 Hard rule

Do **not** create a parallel public QR/request portal, token scheme, or submission table. Public reporting uses **existing**:

```
QR / share link
  → /request/{public-token}
  → contextual intake (facility_request_intakes)
  → immutable facility_request_submissions snapshot
  → canonical facility maintenance_work_order (submitted)
  → existing FO workflow
```

### 8.2 Asset QR = contextual intake on demand

Per docs/204 §8 (`context_kind = asset`):

1. Manager (or approved automation after Approve) creates a **`facility_request_intakes`** row for the org’s published request form with locked context from the **canonical asset**:
   - `propertyId` / labels from asset site  
   - `floorLabel`, `departmentLabel`, `roomLabel` from asset  
   - `facilityAssetId` + `facilityAssetLabel` from `facility_assets`  
2. QR encodes **only** the HTTPS `/request/{token}` URL (same as today).  
3. Optional: store intake id / token prefix reference on the asset for “print QR” UX; may also set/align `scan_code` as an opaque staff/print aid — **public resolution remains intake-token hash lookup**, not a second public resolver.  
4. On submit, certified path already writes `facility_asset_id` + label onto the WO (`public-request-service` → `createFacilityWorkOrder`).  
5. Asset service history automatically includes that WO.

### 8.3 Wendy / Chair #14 (reconciled)

```
Asset QR (intake context_kind=asset, Chair #14 locked)
  → public portal knows Main Clinic / Floor 3 / Cardiology / Chair #14
  → Wendy describes issue + photo
  → FR-… + facility WO submitted with facility_asset_id
  → Operations / My Work / routing / checklist / complete
  → Chair #14 history updated
```

No repeated location/asset entry. Browser never chooses `organization_id`.

### 8.4 Authorized staff scan

Staff may open **asset detail** (FAC-003) with contextual actions: Report Problem (staff WO with asset prefilled) **or** “Open public intake QR” / copy link for posted codes. Prefer one Create path with prefill (docs/208).

### 8.5 Public vs staff visibility

Unchanged from ADR-034: public sees form + locked labels only; no open-work list, internals, or assignee. Staff see full asset + history.

---

## 9. Public-request integration (certified contract)

| Concern | Integration |
|---------|-------------|
| Forms admin | `/facility/settings/request-forms` — reuse |
| Entitlement | `facility.request_forms` — managers only |
| Submission | Immediate WO + snapshot — reuse |
| Tracking | `/request/status/{statusToken}` — reuse |
| Notify | `work_order.public_submitted` — reuse; deep-link per docs/208 |
| Templates | Optional staff apply template **after** intake WO exists (triage), or default template id on form (Owner decision) — do not break immutable snapshot |
| Routing | Apply on/after public submit (auto) or at triage (suggest) |
| Search | Index FR number + WO + asset (docs/208) |

**Confirmation:** docs/204 remains **APPROVED**; ADR-034 remains the **public-request ADR (Accepted)**; docs/205 remains **IMPLEMENTED IN-REPO / certified**; docs/206 remains **PRODUCTION RELEASE SUCCESSFUL**.

---

## 10. Notifications

Reuse lifecycle notify. Deep-link to WO / My Work / Operations / request detail — never generic dashboard only. PM due / routing assign / blocked signals as in prior design.

---

## 11. RBAC

Managers: assets, PM schedules, templates, routing, request forms (existing). Technicians: My Work + assigned WO execute + read linked assets; no form/schedule/rule admin. Public: token-gated intake only. Complete: ADR-033 effective FO scope. Prefer reuse entitlements; new keys only with Owner Approve (`facility.pm`, `facility.templates`, `facility.routing`).

---

## 12. Schema (design-level)

Evolve: `facility_assets` (QR/print metadata linking to intake id if approved), WO checklist snapshot / `pm_schedule_id` / execution flags without new statuses.  
New: PM occurrences, work templates + items, WO checklist instances, routing rules (+ audits).  
**Reuse:** all `facility_request_*` tables from docs/205 — do not duplicate.

---

## 13. Lifecycle examples

1. **Public asset QR** — §8.3  
2. **PM generation** — schedule → occurrence → WO → route → My Work → checklist → close → asset history  
3. **Staff from asset** — Report Problem → WO with asset id → same spine  
4. **Idempotent PM** — second cron no-ops on same occurrence_key  

---

## 14. Mobile UX

My Work + public `/request/*` (already mobile-first in docs/205) + asset contextual actions. Online-required Phase 1. Preserve Canopy.

---

## 15. Tests (after Approve)

Idempotent PM; checklist gate; routing first-match; **asset intake locks facilityAssetId through to WO**; public cannot forge asset id; staff QR print uses existing token rules; technician home RBAC; no second portal routes.

---

## 16. Implementation slices

| Slice | Scope |
|-------|-------|
| FO-EFF-S0 | Schema + events |
| FO-EFF-S1 | Templates + checklist on facility WOs |
| FO-EFF-S2 | Technician My Work |
| FO-EFF-S3 | Asset registry polish + **Asset QR via facility_request_intakes** + contextual actions |
| FO-EFF-S4 | PM schedules + generation |
| FO-EFF-S5 | Routing rules |

Interleave with docs/208 SIM slices (see § final recommendation).

---

## 17. Risks

| Risk | Mitigation |
|------|------------|
| Second public QR system | Forbidden — extend intakes only |
| ADR number collision | ADR-036/037; ADR-034 untouched |
| Doc number collision | 207/208; 188/189 are tenant payments |
| `main` lag vs certified line | This branch bases on certified tip; merge to `main` is Owner release concern — not this package |
| Status-machine creep | Events/flags only |
| Feature accumulation | Measure clicks / duplicate entry / time-to-next-action per slice |

---

## 18. Owner decisions

1. Approve docs/207 + Accept ADR-036?  
2. Asset QR Phase 1 = mint `facility_request_intakes` (`context_kind=asset`) only — **recommended yes**?  
3. Store intake reference on `facility_assets` for reprint?  
4. PM initial WO status after generate?  
5. Category-only PM without asset allowed?  
6. New entitlement keys vs reuse?  
7. Suggest vs Auto routing default?  
8. Apply routing automatically on public submit?  
9. Default template on request form vs triage-only?  
10. Offline tech mode? (**no** Phase 1)  
11. Merge certified line (`188–206`) to `main` as separate Owner action?  

---

## Final recommended implementation order (reconciled)

Highest user-efficiency first; dependencies respected; **public intake already shipped**:

1. **Templates/checklists + Technician My Work**  
2. **Mission Control attention + notification deep links** (docs/208)  
3. **Asset registry polish + Asset QR via existing request intakes + contextual actions**  
4. **Global Search + Quick Create + Recent**  
5. **Preventive Maintenance generation**  
6. **Deterministic routing rules**

Every package must improve: **clicks to complete**, **repeated data entry**, **time to next action**.

---

## Owner approval gate

- docs/207 **Approved**  
- ADR-036 **Accepted**  
- docs/208 / ADR-037 as needed for SIM slices that bind FO UX  
- Explicit slice Authorize before any implement  
- **No implement / deploy / Production mutation from this record**

---

**FO OPERATIONAL EFFICIENCY DESIGN RECONCILED — APPROVAL REQUIRED**

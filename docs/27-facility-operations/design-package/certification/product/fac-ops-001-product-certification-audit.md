# FAC-OPS-001 — Product Certification Audit (Code Inspection)

**Package:** FAC-OPS-001 Approved · ADR-018 Accepted  
**Branch audited:** `cursor/facility-operations-certification-f5dd` (based on E.6 complete)  
**Tip commit at audit:** `c7cf561` — `feat(fac-ops-001): complete Facility Operations Phase E.6 foundation`  
**Date:** 2026-08-07  
**Mode:** CERTIFICATION ONLY — no product code changes  
**Evidence class:** Code-verified (static). Staging Master Admin Pass **not** witnessed in this audit.

**Canonical deliverables:** [Product certification package index](./index.md) · [Final GO / NO-GO](./go-no-go.md)

---

## Verdict (executive)

| Gate | Recommendation |
|------|----------------|
| FO Operational GO (staging MA Pass certification) | **CONDITIONAL GO** — authorize staging MA witness of J-F0–J-F8; do **not** claim Pass without live evidence |
| Complete Platform GO | **CONDITIONAL** — dual MC + launcher + route honesty code-verified; requires staging dual-SKU smoke |
| Capital | **NO-GO** — future gate; `planned` / entitlement off |

**Honesty rule applied:** No journey is marked **Pass**. Runtime MA Pass is required for product-level Operational GO per [11-acceptance-criteria-and-certification.md](../../11-acceptance-criteria-and-certification.md).

---

## Capability matrix

| # | Capability | Status | Evidence (paths / routes) | Gaps / honesty notes | Priority if gap |
|---|------------|--------|---------------------------|----------------------|-----------------|
| 1 | Site Profiles | **Implemented** | UI: `/facility/sites`, `/facility/sites/[siteId]`, `/facility/overview`, `/settings/facility-sites` · API: `/api/facility/sites`, activate · Services: `apps/web/src/lib/facility/site-service.ts` · Components: `site-create-wizard.tsx`, `sites-directory.tsx`, `site-profile-page.tsx` | Lifecycle draft→active (+ archive patterns in E.1). Staging MA Pass not recorded here. | — |
| 2 | Assets | **Partial** | UI: `/facility/assets`, `/facility/assets/[assetId]` · API: `/api/facility/assets`, lifecycle, PATCH update, search · `asset-service.ts`, `asset-command-center.tsx`, `asset-create-wizard.tsx` | Intake / hierarchy / criticality / decommission **yes**. **Transfer/relocate UI missing** (PATCH `locationId` exists; Command Center has no relocate). **No location history table** (J-F6). | **P1** (relocate + history) |
| 3 | Building Systems | **Implemented** | UI: `/facility/building-systems`, `/facility/building-systems/[systemId]` · API: `/api/facility/systems*` · `system-service.ts`, `systems-directory.tsx`, `system-command-center.tsx` | Status incl. `down` → MC attention. Automation beyond manual status out of E.2 scope. Staging MA needed. | — |
| 4 | Corrective Facility Work | **Implemented** | UI: `/facility/operations` · API: `/api/facility/operations*` · `operations-service.ts`, `operations-execution.ts`, `operations-queue.tsx` | Shared WO `product_context=facility`. FO queue shows site/asset/system. FO-only execution via FO APIs (E3-5). Staging MA needed. | — |
| 5 | Preventive Maintenance | **Implemented** | UI: `/facility/preventive-maintenance` · API: `/api/facility/preventive*` · `pm-service.ts`, `pm-programs-directory.tsx` | Schedule, generate (idempotent), transition, overdue MC. Staging MA needed. | — |
| 6 | Inventory & Parts | **Implemented** | UI: `/facility/inventory`, `/facility/parts` · API: inventory receive/issue/adjust/return/thresholds + parts* · `inventory-service.ts`, `inventory-directory.tsx`, `parts-catalog.tsx` | Stockout MC; movements audited. Staging MA needed. | — |
| 7 | Inspections | **Partial** | UI: `/facility/inspections` · API: programs + runs start/complete/cancel + search · `inspection-service.ts`, `inspections-directory.tsx` · Migration E.6 | Fail → facility WO wired. **No in-desk document attach UI** (Documents entity types exist in `document-service.ts`; no upload/attach controls in inspections UI). | **P1** (docs attach UX) |
| 8 | Safety | **Partial** | UI: `/facility/safety` · API: report/triage/spawn-work/close + search · `safety-service.ts`, `safety-desk.tsx` | High severity notify + MC. **No document attach UI** on Safety desk. Staging MA needed. | **P2** (docs UX; P1 if E6-4 interpreted as in-desk attach) |
| 9 | Compliance | **Partial** | UI: `/facility/compliance` · API: create/satisfy/waive + search · `compliance-service.ts`, `compliance-desk.tsx` | Overdue MC + satisfy with evidence. Evidence UX is **document UUID paste**, not upload picker. Schema + attach-to-entity logic present. | **P2** (UX honesty) |
| 10 | Search | **Implemented** | Global: `global-search.tsx`, `command-palette.tsx` · Per-domain `/api/facility/*/search` · Catalog: `route-entitlements.ts` `searchCatalogForSku` | Entitlement-filtered. Staging smoke recommended. | — |
| 11 | Timeline | **Implemented** | MC timeline (`mission-control-service.ts`); Asset/System Command Centers (`TimelineView`); domain events via `events-audit.ts` | Event write path solid. Customer “Audit workspace” is platform/MA evidence, not a FO-only audit module. | — |
| 12 | Audit | **Implemented** | `writeFacilityAudit` → `audit_events`; MA panels E1–E6 load audit/event evidence | No dedicated FO Audit page (by design — platform reuse). Staging MA must witness records. | — |
| 13 | Notifications | **Implemented** | Keys: `packages/shared/src/facility/notifications.ts` · Writes: `facility_notifications` · Unified inbox: `communications-service.ts` merges FO rows · Shell: `notification-center.tsx` | Fan-out depends on manager memberships. Staging witness for safety/compliance/PM keys. | — |
| 14 | Assistant | **Implemented** | Recommendation strings on MC + desks/queues/command centers; MA panels assert presence | Rule/template recommendations — not generative AI. Adequate for certification promise. | — |
| 15 | Mission Control | **Implemented** | `/facility/mission-control` · `/api/facility/mission-control` · Attention: `packages/shared/src/facility/attention.ts` (setup, system_down, WO emergency/critical, PM due/overdue, stockout, safety_open, compliance_overdue) | Empty-state honesty present. Staging needed to prove live ranking. | — |
| 16 | Master Admin (E1–E6 on launch-readiness) | **Implemented** | `/admin/launch-readiness` mounts `E1`…`E6CertificationPanel` · APIs `/api/admin/facility/e1`…`e6` · MA nav workspaces from `COMMERCIAL_MODULES` | Panels ready; **Pass not recorded** without staging org run. Impersonation remains `planned` in MA testing nav. | **P1** (staging Pass recording) |

---

## Commercial alignment

| Check | Result | Evidence |
|-------|--------|----------|
| `modules.ts` readiness — all FO modules except Capital | **Pass (code)** | Every FO module `aligned` except `capital_projects` = `planned` (`packages/shared/src/commercial/modules.ts`) |
| SKU entitlements `facility.*` present | **Pass (code)** | `FACILITY_ENTITLEMENTS` in `entitlements.ts`; granted for FO + Complete; Capital in `FUTURE_FACILITY_ENTITLEMENTS` off by default |
| FO-only vs PM-only honesty (routes) | **Pass (code)** | `evaluatePathEntitlement` tests deny FO routes for PM SKU and PM routes for FO SKU (`commercial.test.ts`, `route-entitlements.ts`) |
| Capital remains planned/off | **Pass (code)** | Nav omits Capital; page is `ModuleAlignmentPage` planned stub (`/facility/capital-projects`); entitlement not granted |

**Note:** `ModuleAlignmentPage` remains **only** for Capital Projects under `/facility/*` — not a leftover stub for E.1–E.6 modules.

---

## Journey quick map

| Journey | Result | Reason | Evidence class |
|---------|--------|--------|----------------|
| **J-F0** First week / Guided Setup | **Conditional** | Guided Setup FO home + site activate + assets/systems paths exist; full “operable site” needs staging | Code-verified; **staging MA** for Pass |
| **J-F1** Daily operations | **Conditional** | MC attention ranking + deep-links implemented; clear-via-real-state needs live witness | Code-verified; **staging MA** |
| **J-F2** Emergency | **Conditional** | Safety high severity + emergency WO + MC severity wired; execution context visibility gaps (see J-F11) | Code-verified; **staging MA** |
| **J-F3** Preventive | **Conditional** | Schedules, generate, advance, overdue MC present | Code-verified; **staging MA** |
| **J-F4** Inspection program | **Conditional** | Program/run/fail→WO present; document attach UI weak | Code-verified; **staging MA** |
| **J-F5** Inventory & parts | **Conditional** | Locations, receive/issue, stockout MC present | Code-verified; **staging MA** |
| **J-F6** Asset lifecycle | **Conditional** | Intake / operate / decommission **yes**. **Transfer/relocate + location history Missing** (API can PATCH location; no UI; no history entity) | Code-verified gap; staging cannot invent history |
| **J-F7** Compliance calendar | **Conditional** | Obligations, overdue MC, satisfy/waive; evidence via UUID paste | Code-verified; **staging MA** |
| **J-F8** Safety program | **Conditional** | Report → triage → spawn WO → close | Code-verified; **staging MA** |
| **J-F9** Capital | **Out of scope / NO-GO** | Future gate | N/A |
| **J-F10** Maintenance Manager accepts FO work | **Conditional** | Shared WO + FO Operations execution + PM Maintenance product_context filter. **Honesty gap:** Maintenance CC list/detail still labels Resident · Property even for facility filter; facility joins loaded in service but not rendered in UI type | Code-verified; **staging MA** for handoff |
| **J-F11** Technician / Vendor execution | **Conditional** | Assign/progress via shared Maintenance. **Vendor portal** (`vendor-maintenance-portal.tsx`) shows property/unit only — **no site/asset/system**; copy still says “Property Manager Maintenance”. No FO-specific technician portal (design: reuse) | Code-verified gap |
| **J-F12** Executive posture | **Conditional** | FO Mission Control summary usable as posture home. **No FO Reports / export** surface (design allows honesty “later slice”) | Code-verified; staging optional for MC posture |
| **J-F13** Master Admin certification path | **Conditional** | E1–E6 panels on Launch Readiness. Pass requires live org script | Panel code-verified; **staging MA Pass required** |

---

## Quality gaps (UI inspection)

| Area | Finding |
|------|---------|
| Empty / loading / error | Present across FO desks (Skeleton + EmptyState + error text): MC, sites, assets, systems, operations, PM, inventory, parts, inspections, safety, compliance |
| Mobile | Responsive `p-4 md:p-6` / grid breakpoints; no FO-specific mobile execution surface (journeys note technician mobile later) |
| Dead stubs | Capital only uses `ModuleAlignmentPage` (`planned`). E.1–E.6 routes are real desks — **not** planned stubs |
| Reports / export (J-F12) | **Missing** FO Reports workspace and export/share |
| Vendor / technician facility context | **Gap** — FO Operations shows context; Maintenance filter + Vendor portal do not surface site/asset/system |
| Asset transfer / relocate (J-F6) | **Missing UI + location history**; silent API update only |
| Inspection documents | Entity types + shared Documents support; **attach UI absent** on Inspections (Compliance: UUID paste only) |

---

## Remaining P1 issues

1. **Staging MA Pass not recorded** for E.1–E.6 / journeys J-F0–J-F8 (blocks FO Operational GO claim).  
2. **J-F6 transfer/relocate incomplete** — no relocate UX; no location history model.  
3. **J-F10 / J-F11 facility context visibility** — Maintenance Command Center and Vendor portal omit site/asset/system in UI despite service selecting them.  
4. **Inspection document attach UX** — E6-4 “Documents attached & auditable” is only partially customer-honest without in-flow attach (schema/API path exists; desk UI does not).

## Remaining P2 polish

1. FO **Reports / export** for executive posture (J-F12 honesty already allowed).  
2. Compliance (and Safety) **document picker** vs raw UUID paste.  
3. **Facility Overview** copy still says “Phase E.1 covers sites and locations only” (`facility-overview-page.tsx`) — stale vs E.2–E.6.  
4. Maintenance facility-context **labeling** (Resident · Property) when `productContext=facility`.  
5. Broader **mobile** execution polish beyond responsive padding.  
6. Asset Command Center lacks general **edit** surface (PATCH API exists).

---

## Final GO / NO-GO recommendation

### FO Operational GO — staging MA Pass certification

**CONDITIONAL GO to enter staging MA Pass certification** (not a claim that Operational GO is already earned).

Proceed to staging with entitled FO org when:
- E1–E6 panels can load org evidence, and  
- MA witnesses J-F0–J-F8 scripts per [09-master-admin-testing-plan.md](../../09-master-admin-testing-plan.md),  

**with explicit Conditional notes** on:
- J-F6 relocate/history,  
- J-F10/J-F11 context visibility,  
- Inspection/compliance document UX honesty.

Do **not** mark FO Operational GO **Pass** until staging MA evidence is filed.

### Complete Platform GO

**CONDITIONAL** — code shows dual product homes, launcher groups, and mutual route denial. Requires staging smoke: Complete org opens both MCs; FO-only lacks PM leasing; PM-only lacks FO assets.

### Capital

**NO-GO** — remains future / planned / entitlement off. No Implement authorize.

---

## What requires live staging MA evidence vs code-verified

| Class | Items |
|-------|-------|
| **Code-verified in this audit** | Module readiness; entitlements; route honesty; Capital planned; presence of desks/APIs/services; attention builders; search wiring; notification merge; E1–E6 panel mounts; known UI gaps above |
| **Requires staging MA witness** | Actual Pass on E1–E6 panels; end-to-end J-F0–J-F8 (and J-F10 handoff); notification delivery to managers; MC attention with real data; document evidence on satisfy; dual-SKU Complete Platform smoke; PM regression green |

---

## STOP

No product code changes in this certification pass. Next product claims require staging MA Pass artifacts under this `certification/product/` folder (or per-slice folders) before FO Operational GO can flip from Conditional to Pass.

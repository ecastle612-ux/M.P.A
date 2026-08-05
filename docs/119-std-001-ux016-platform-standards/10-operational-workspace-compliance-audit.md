# 10 — Operational Workspace STD-001 Compliance Audit

**Standard:** STD-001 · ADR-033  
**Source initiative:** UX-016 (**CLOSED · CERTIFIED**)  
**Audit type:** Compliance only — **no new UX · no implementation**  
**Date:** 2026-08-05  
**Scope:** Every authenticated **primary operational home** (role AUTH landings + role/module command canvases), beyond the Admin-only audit in [06](./06-admin-surface-compliance-audit.md)  
**Related:** [01](./01-permanent-ux-standard.md) · [02](./02-dashboard-standard.md) · [05](./05-future-development-rule.md) · UX-016 [03 — Role specializations](../118-ux-016-dashboard-navigation-optimization/03-role-dashboard-specializations.md) · AUTH home resolver `assignedSurfaceHome`

---

## 1. Audit method

### Binding law

| Source | Requirement |
|--------|-------------|
| [01 — Permanent UX Standard](./01-permanent-ux-standard.md) | Home composition: Greeting → Assistant → Waiting on Me/Others → Immediate Attention → Today’s Mission → Recommended Actions → Quick Actions → Timeline → Insights |
| [02 — Dashboard Standard](./02-dashboard-standard.md) | Universal Dashboard Framework mandatory for **module / role homes** |
| [05 — Future Development Rule](./05-future-development-rule.md) | Every operational home inherits STD-001; no parallel dashboards without governance |
| UX-016 §03 | Role specializations change **content**, not **anatomy** |
| ADR-033 | No parallel dashboard / nav patterns without governance |

### What counts as a primary operational home

A route is in scope when **any** of the following is true:

1. It is the deterministic **AUTH landing** from `assignedSurfaceHome()` for a membership role.  
2. It is a **role / module command canvas** the product treats as that user’s day-start work home (even if a list tool is also reachable).  
3. UX-016 §03 / STD-001 §02 names it as a role or module home that must mount UDF.

Out of scope for UDF composition (shell rules still apply where relevant):

- Class **L** launchers (Portal Launcher, Surface Switcher, Workspace catalog)  
- Class **T** lists · details · forms · settings · tokenized job cards  
- Marketing · auth entry · retirement notices that are not work homes  
- Stub portals whose real AUTH home is already a certified surface

### Applicability classes

| Class | Meaning | UDF required? |
|-------|---------|---------------|
| **H — Home** | Role / module command home | ✅ Yes |
| **H-gap** | AUTH landing is a **tool** with no UDF role home | ❌ Non-compliant (missing home) |
| **L — Launcher** | Portal / surface launcher | ◯ N/A |
| **T — Tool** | List · detail · form · settings · token job | ◯ N/A |
| **D — Divergent** | Home-like dashboard **not** on UDF | ❌ Non-compliant |
| **Stub / Notice** | Placeholder or retired access page | ◯ N/A (not a work home) |

---

## 2. Executive verdict

| Metric | Result |
|--------|--------|
| Admin / module homes already on UDF ([06](./06-admin-surface-compliance-audit.md)) | **5 / 5 PASS** |
| Role AUTH landings that inherit certified UDF | **2 / 6** (Org Admin PM-org + Property Manager + Master Admin counted in Admin set; Owner · Resident · Leasing · Technician do **not**) |
| Primary operational homes **not** inheriting certified workspace experience | **5** |
| Divergent non-admin dashboards (Class D) | **3** (`/portal/tenant` · `/portal/owner` · `/facility`) |
| Tool-as-home AUTH gaps (Class H-gap) | **2** (`/leases` · `/maintenance`) |
| Overall operational-workspace compliance | ❌ **FAIL** — Admin closed; role homes remain open |

**Bottom line:** Admin command homes are STD-001 compliant. The remaining gap is every **non-admin primary operational home**: Resident, Owner, Leasing Agent, Facility Technician (AUTH landing + Facility command canvas).

---

## 3. AUTH home inventory (source of truth)

Resolver: `apps/web/src/lib/auth/ops-shell-access.ts` → `assignedSurfaceHome()`.

| Primary role | AUTH home | Expected STD-001 class | Current reality |
|--------------|-----------|------------------------|-----------------|
| `organization_admin` (PM org) | `/dashboard` | **H** | ✅ UDF (`OpsUniversalDashboard`) |
| `organization_admin` (owner org) | `/portal/owner` | **H** | ❌ Divergent Owner dashboard |
| `property_manager` | `/dashboard` | **H** | ✅ UDF |
| `leasing_agent` | `/leases` | **H** | ❌ Tool-as-home (`LeasesTable`) |
| `facility_technician` | `/maintenance` | **H** | ❌ Tool-as-home (`WorkOrdersTable`) |
| `property_owner` | `/portal/owner` | **H** | ❌ Divergent Owner dashboard |
| `tenant` | `/portal/tenant` | **H** | ❌ Divergent Tenant home |
| `vendor` | `/vendor-access` | Stub / Notice | ◯ Portal retired; work via `/v/[token]` (**T**) |
| Master Admin (no membership) | `/master-admin` | **H** | ✅ UDF |
| none | `/unauthorized` | — | — |

---

## 4. Certified homes (already inherit UDF)

Carried forward from [06](./06-admin-surface-compliance-audit.md) / [09](./09-compliance-remediation-implementation.md). Included so this audit is a complete operational-workspace register.

| Route | Audience | Component | Mapper | Verdict |
|-------|----------|-----------|--------|---------|
| `/dashboard` | Org Admin (PM) · Property Manager | `DashboardShell` → `OpsUniversalDashboard` | `buildUniversalDashboardViewModel` | ✅ PASS |
| `/master-admin` | Master Admin | `OperationsCenterView` | `buildMasterAdminUniversalDashboardViewModel` | ✅ PASS |
| `/master-admin/commercial` | MA / CS module home | `CommercialUniversalDashboard` | `buildCommercial…` + `assembleUniversalHome` | ✅ PASS |
| `/financials` | Financial module home | `FinancialUniversalDashboard` | `buildFinancial…` + `assembleUniversalHome` | ✅ PASS |
| `/migration` | Migration module home | `MigrationUniversalDashboard` | `buildMigration…` + `assembleUniversalHome` | ✅ PASS |

UDF mount points in code today: **only** the five surfaces above. No tenant / owner / leasing / technician UDF mappers exist.

---

## 5. Gap register — primary homes not inheriting certified experience

These are the pages that function as a user’s primary operational home (or designed role command home) but do **not** mount the Universal Dashboard Framework.

### G-1 — Resident portal home · Class D

| Field | Value |
|-------|-------|
| Route | `/portal/tenant` |
| AUTH roles | `tenant` |
| Component | `TenantPortalHome` |
| Class | **H → D** |
| Actual anatomy | Greeting → “For you” attention → Today cards → Quick Actions |
| Missing vs STD-001 | M.P.A. Assistant · Waiting on Me/Others · named Immediate Attention · Today’s Mission · Recommended Actions · Operational Timeline · Insights (Insights may omit on calm portals; Assistant may calm-collapse — **anatomy still required**) |
| Evidence | `apps/web/src/app/(portals)/portal/tenant/page.tsx` · `components/portal/tenant-portal-home.tsx` |
| UX-016 §03 | Resident specialization defined — **not implemented on UDF** |

**Verdict:** ❌ **NON-COMPLIANT** — real AUTH home with parallel anatomy.

---

### G-2 — Owner portal home · Class D

| Field | Value |
|-------|-------|
| Route | `/portal/owner` |
| AUTH roles | `property_owner` · `organization_admin` when org type is owner |
| Component | `OwnerPortalDashboard` |
| Class | **H → D** |
| Actual anatomy | Welcome → Needs attention → **KPI metric wall** → statement / activity lists |
| Missing vs STD-001 | Full UDF order; **KPI wall above work** is an explicit STD-001 anti-pattern |
| Evidence | `apps/web/src/app/(portals)/portal/owner/page.tsx` · `components/portal/owner-portal-dashboard.tsx` |
| UX-016 §03 | Owner specialization defined — **not implemented on UDF** |

**Verdict:** ❌ **NON-COMPLIANT** — real AUTH home; metrics-first composition.

---

### G-3 — Leasing Agent AUTH landing · Class H-gap

| Field | Value |
|-------|-------|
| Route | `/leases` |
| AUTH roles | `leasing_agent` |
| Component | `LeasesTable` |
| Class | **H-gap** (tool used as home) |
| Actual anatomy | Lease list / filters only |
| Missing vs STD-001 | Entire home composition — no Greeting / Assistant / Waiting / Attention / Mission / Recommended / Quick Actions / Timeline |
| Evidence | `assignedSurfaceHome` → `/leases` · `apps/web/src/app/(app)/leases/page.tsx` |
| UX-016 §03 | Leasing Agent home specialization defined — **no dedicated UDF home route** |

**Verdict:** ❌ **NON-COMPLIANT** — primary operational landing is a Class T tool.

---

### G-4 — Facility Technician AUTH landing · Class H-gap

| Field | Value |
|-------|-------|
| Route | `/maintenance` |
| AUTH roles | `facility_technician` |
| Component | `WorkOrdersTable` |
| Class | **H-gap** (tool used as home) |
| Actual anatomy | Work-order list / filters only |
| Missing vs STD-001 | Entire home composition |
| Evidence | `assignedSurfaceHome` → `/maintenance` · `apps/web/src/app/(app)/maintenance/page.tsx` |
| UX-016 §03 | Technician specialization defined — AUTH does **not** land on a UDF home |

**Verdict:** ❌ **NON-COMPLIANT** — primary operational landing is a Class T tool.

---

### G-5 — Facility command canvas · Class D

| Field | Value |
|-------|-------|
| Route | `/facility` |
| Audience | Facility / technician command surface (`facility:dashboard`) |
| Component | `TechnicianDashboard` |
| Class | **D** (home-like; not AUTH primary) |
| Actual anatomy | Title → Today / Overdue / Waiting buckets + create actions |
| Missing vs STD-001 | Parallel bucket dashboard; not `UniversalDashboard`; not wired as AUTH home |
| Evidence | `apps/web/src/app/(app)/facility/page.tsx` · `components/facility/technician-dashboard.tsx` |
| Note | Closest existing technician “command” surface — still divergent from UDF; technicians AUTH-land on `/maintenance` (G-4) |

**Verdict:** ❌ **NON-COMPLIANT** as a role command home. If remounted onto UDF, it is the natural candidate to become the technician AUTH home (Extend Before Create — do not invent a third surface).

---

## 6. Surfaces reviewed and **not** Class H gaps

| Route | Role / purpose | Class | Why not a UDF gap |
|-------|----------------|-------|-------------------|
| `/portal/manager` | Manager portal stub | Stub | Real PM home is `/dashboard` (PASS); page is `FutureReleaseNotice` |
| `/vendor-access` | Vendor AUTH notice | Notice | Portal retired; not a work home |
| `/v/[token]` | Vendor job card | **T** | Tokenized job tool; UDF N/A for job cards (attention→action order still desirable inside the card) |
| `/portal` · `/master-admin/dashboards` | Launchers | **L** | Approved Slice B / NAV-001 launcher patterns |
| `/properties` · `/tenants` · `/vendors` · settings · reports · etc. | Ops tools | **T** | Not AUTH homes; UDF N/A until a module **home** is productized |
| `/ai-operations` | AI workspace tool | **T** | Not an AUTH landing; not audited as a role home |

---

## 7. Portal Launcher vs AUTH honesty (informational)

Launcher cards may deep-link tools; compliance for STD-001 homes is judged on **AUTH / command homes**, not every launcher `openHref`.

| Launcher intent | `openHref` (typical) | True AUTH home | STD-001 home status |
|-----------------|----------------------|----------------|---------------------|
| Property / Regional Manager | `/dashboard` | `/dashboard` | ✅ |
| Resident | `/portal/tenant` | `/portal/tenant` | ❌ G-1 |
| Owner | `/portal/owner` | `/portal/owner` | ❌ G-2 |
| Leasing Agent / Manager | `/leases` | `/leases` | ❌ G-3 |
| Maintenance / Technician | `/maintenance` | `/maintenance` | ❌ G-4 |
| Vendor | `/vendors` (directory) | `/vendor-access` | Notice / T only |
| Organization Admin | `/settings` (tool) | `/dashboard` or `/portal/owner` | Home PASS or G-2 |
| Accounting / Financials | `/financials` | N/A (module home) | ✅ |
| Mission Control | `/master-admin` | `/master-admin` | ✅ |

---

## 8. Compliance scorecard

| Segment | Expected on UDF | On UDF | Gap IDs |
|---------|-----------------|--------|---------|
| Admin / module homes | 5 | 5 | — |
| Resident AUTH home | 1 | 0 | G-1 |
| Owner AUTH home | 1 | 0 | G-2 |
| Leasing Agent AUTH home | 1 | 0 | G-3 |
| Facility Technician AUTH home | 1 | 0 | G-4 |
| Facility command canvas (designed tech home) | 1 | 0 | G-5 |
| Vendor authenticated home | 0 (retired) | — | — |
| Manager portal as home | 0 (stub; real = `/dashboard`) | — | — |
| **Primary homes missing certified experience** | | | **G-1 … G-5** |

| Category | Score |
|----------|-------|
| Certified Admin/module homes | **5 / 5 PASS** |
| Role AUTH homes on UDF | **2 role families PASS** (Org Admin PM + PM + MA); **Owner · Resident · Leasing · Technician FAIL** |
| Divergent non-admin dashboards | **3** |
| Tool-as-home AUTH landings | **2** |
| New UX invented by this audit | **None** |

---

## 9. Recommended remediation posture (audit only — not authorized)

Per Implementation Gate and Extend Before Create. **No implementation in this document.**

| Priority | Gap | Recommended direction |
|----------|-----|------------------------|
| P0 | G-1 Resident | Remount `/portal/tenant` onto UDF with calm Resident specialization (Assistant may calm-collapse) |
| P0 | G-2 Owner | Remount `/portal/owner` onto UDF; move KPI metrics to Insights (below fold) |
| P1 | G-3 Leasing | Introduce thin Leasing UDF home (or remount a single leasing command route) and point `assignedSurfaceHome` at it — keep `/leases` as tool |
| P1 | G-4 + G-5 Technician | Remount `/facility` onto UDF as technician command home; consider AUTH landing → `/facility` (single home; `/maintenance` remains tool) |

Constraints for any future authorize phrase:

- Presentation remount only unless AUTH landing change is separately designed/approved  
- Reuse `UniversalDashboard` + `assembleUniversalHome` / Assistant helpers  
- Do **not** reopen UX-016; cite STD-001 + ADR-033  
- Do **not** invent parallel homes when Extend → Remount suffices  

Suggested authorize phrase (when Product is ready — not issued here):

```
AUTHORIZE STD-001 OPERATIONAL HOME REMEDIATION – Resident · Owner · Leasing · Technician
```

---

## 10. Evidence pointers

| Artifact | Path |
|----------|------|
| AUTH resolver | `apps/web/src/lib/auth/ops-shell-access.ts` |
| AUTH home tests | `apps/web/src/lib/auth/ops-shell-access.test.ts` · `lib/auth/roles/certification.ts` |
| UDF framework | `apps/web/src/components/dashboard-framework/` |
| Assembler | `apps/web/src/lib/std001/assemble-universal-home.ts` |
| Resident home | `apps/web/src/components/portal/tenant-portal-home.tsx` |
| Owner home | `apps/web/src/components/portal/owner-portal-dashboard.tsx` |
| Facility dashboard | `apps/web/src/components/facility/technician-dashboard.tsx` |
| Role specializations | `docs/118-ux-016-dashboard-navigation-optimization/03-role-dashboard-specializations.md` |
| Prior Admin audit | [06](./06-admin-surface-compliance-audit.md) |

---

## 11. Sign-off

| Role | Finding |
|------|---------|
| Audit | Admin primary homes remain PASS (Class D = 0). **Five** non-admin primary operational surfaces do not inherit the certified workspace experience. |
| Implementation | 🔒 Locked — Design → Document → Approve required before remounts |
| Next | Product review of gap register G-1…G-5; issue scoped authorize phrase; remount onto UDF without reopening UX-016 |

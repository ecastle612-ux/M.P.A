# 06 — Admin Surface UX-016 / STD-001 Compliance Audit

**Standard:** STD-001 · ADR-033  
**Source initiative:** UX-016 (**CLOSED · CERTIFIED**)  
**Audit type:** Compliance only — **no new UX**  
**Date:** 2026-08-05  
**Scope:** Authenticated Admin surfaces (Master Admin · Organization Admin · named admin destinations)  
**Migration plan:** [07](./07-admin-surface-migration-plan.md)

---

## 1. Audit method

### Binding law audited against

| Source | Requirement |
|--------|-------------|
| [01 — Permanent UX Standard](./01-permanent-ux-standard.md) | Home composition: Greeting → Assistant → Waiting on Me/Others → Immediate Attention → Today’s Mission → Recommended Actions → Quick Actions → Timeline → Insights |
| [02 — Dashboard Standard](./02-dashboard-standard.md) | Universal Dashboard Framework mandatory for **module / role homes** |
| [03 — Navigation Standard](./03-navigation-standard.md) | Permanent sidebar model + mobile bottom nav ≤ 5 |
| ADR-033 | No parallel dashboard / nav patterns without governance |

### Applicability classes (critical)

STD-001 / UX-016 bind the **Universal Dashboard Framework to homes / command canvases**, not to every list, detail, form, or settings tool.

| Class | Meaning | UDF composition required? | Shell (Sidebar + Mobile Nav) required? |
|-------|---------|---------------------------|----------------------------------------|
| **H — Home** | Role / module command home | ✅ Yes (full checklist) | ✅ Yes |
| **L — Launcher** | Portal / surface launcher (Slice B approved pattern) | ❌ N/A (not a work home) | ✅ Yes |
| **T — Tool** | List · detail · form · settings · diagnostics | ❌ N/A (must not invent a competing home) | ✅ Yes |
| **D — Divergent dashboard** | Home-like dashboard **not** on UDF | ❌ **Non-compliant** | Usually yes |

Legend for checklists:

| Mark | Meaning |
|------|---------|
| ✅ | Present / compliant |
| ❌ | Required and missing |
| ◯ | Not applicable for class (not a defect) |
| ⚠ | Partial / variant (explained) |

---

## 2. Executive verdict

| Metric | Result |
|--------|--------|
| Admin **homes** on Universal Dashboard Framework | **2 / 2** primary homes PASS (`/dashboard`, `/master-admin`) |
| Divergent Admin **dashboards** (Class D) | **3** NON-COMPLIANT (commercial · financials home · migration) |
| Tool / settings Admin pages missing shell | **0** under `(app)` layout |
| Dedicated routes missing for Roles / Audit / Organizations (as named URLs) | Concepts aliased to existing tools — not a UDF defect |
| Overall Admin home compliance | **PASS with residual Class D debt** |

**Bottom line:** UX-016 certified homes are live for Organization Admin (`/dashboard`) and Master Admin Mission Control (`/master-admin`). Remaining Admin debt is **secondary divergent dashboards** and ensuring tool pages stay shell-native without inventing parallel homes.

---

## 3. Named Admin surfaces (requested inventory)

### 3.1 Master Admin / Mission Control

| Field | Value |
|-------|-------|
| Route | `/master-admin` |
| Component | `OperationsCenterView` → `UniversalDashboard` (`buildMasterAdminUniversalDashboardViewModel`) |
| Class | **H** |
| Shell | ApplicationShell · HQ/ops sidebar · OpsMobileBottomNav |

| Checklist item | Result |
|----------------|--------|
| Universal Dashboard Framework | ✅ |
| Greeting | ✅ |
| M.P.A. Assistant | ✅ |
| Waiting on Me | ✅ (omit when empty) |
| Waiting on Others | ✅ (omit when empty) |
| Immediate Attention | ✅ |
| Today’s Mission | ✅ |
| Recommended Actions | ✅ |
| Timeline | ✅ (Operational Timeline) |
| Insights | ✅ (below fold) |
| Universal Sidebar | ✅ (Master Admin–only variant when HQ-only; else ops groups) |
| Mobile Navigation | ✅ |

**Verdict:** ✅ **COMPLIANT**

---

### 3.2 Organization Admin (home)

| Field | Value |
|-------|-------|
| Route | `/dashboard` (AUTH home for org ops roles) · Portal Launcher card “Organization Admin” → `/settings` |
| Component | `DashboardShell` → `OpsUniversalDashboard` → `UniversalDashboard` |
| Class | **H** (home) · settings landing is **T** |

| Checklist item | `/dashboard` | `/settings` (redirect hub) |
|----------------|--------------|----------------------------|
| Universal Dashboard Framework | ✅ | ◯ |
| Greeting | ✅ | ◯ |
| M.P.A. Assistant | ✅ | ◯ |
| Waiting on Me | ✅ | ◯ |
| Waiting on Others | ✅ | ◯ |
| Immediate Attention | ✅ | ◯ |
| Today’s Mission | ✅ | ◯ |
| Recommended Actions | ✅ | ◯ |
| Timeline | ✅ | ◯ |
| Insights | ✅ | ◯ |
| Universal Sidebar | ✅ | ✅ |
| Mobile Navigation | ✅ | ✅ |

**Verdict:** ✅ **COMPLIANT** for Organization Admin **home**. Settings hub is a tool redirect (shell-compliant).

---

### 3.3 Organizations

| Role view | Route | Component | Class |
|-----------|-------|-----------|-------|
| Org Admin | `/settings/organization` | `OrganizationSettingsPanel` | **T** |
| Master Admin | `/master-admin/impersonation` (nav label “Organizations”) | `ImpersonationCenter` | **T** |

| Checklist | Org settings | MA Organizations |
|-----------|--------------|------------------|
| UDF / Greeting / Assistant / Waiting / Attention / Mission / Recommended / Timeline / Insights | ◯ | ◯ |
| Universal Sidebar | ✅ | ✅ |
| Mobile Navigation | ✅ | ✅ |

**Verdict:** ✅ **Shell-compliant tool** (UDF N/A). No dedicated `/organizations` route.

---

### 3.4 Properties

| Route | Component | Class |
|-------|-----------|-------|
| `/properties` | `PropertiesTable` | **T** |
| `/properties/new` · `/[id]` · `/[id]/edit` | forms / detail layouts | **T** |

| Checklist | Result |
|-----------|--------|
| UDF composition | ◯ (list/detail — not a home) |
| Universal Sidebar | ✅ |
| Mobile Navigation | ✅ |

**Verdict:** ✅ **Shell-compliant tool**. Properties module does **not** currently ship a Properties “home” on UDF (acceptable until a module home is introduced — then Class H rules apply).

---

### 3.5 Users

| Route | Component | Class |
|-------|-----------|-------|
| `/settings/team` | `TeamSettingsPanel` | **T** |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tool. No `/users` route.

---

### 3.6 Roles

| Route | Component | Class |
|-------|-----------|-------|
| *(none dedicated)* | Managed inside `TeamSettingsPanel` on `/settings/team` | **T** |

**Verdict:** ✅ Concept covered by Users tool. No legacy Roles dashboard found.

---

### 3.7 Billing

| Route | Component | Class |
|-------|-----------|-------|
| `/settings/billing` | `CompanyBillingCenter` | **T** |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tool.

---

### 3.8 Settings

| Route | Component | Class |
|-------|-----------|-------|
| `/settings` | Redirect via `resolveSettingsLandingHref` | **T** |
| `/settings/preferences` · documents · payouts · appearance/notifications redirects | Various panels | **T** |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tools.

---

### 3.9 Integrations

| Route | Component | Class |
|-------|-----------|-------|
| `/settings/integrations` | `ProviderStatusCenter` | **T** |
| `/master-admin/providers` | Redirect → `/settings/integrations` | **T** |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tool.

---

### 3.10 Support

| Concept | Route | Component | Class |
|---------|-------|-----------|-------|
| Support Dashboard (launcher) | `/master-admin/recovery` | `AuthRecoveryPanel` | **T** |
| Support / Portals (subnav) | `/portal` | `PortalAvailabilityHub` | **L** |

| Checklist | Recovery | Portal hub |
|-----------|----------|------------|
| UDF composition | ◯ | ◯ (launcher) |
| Universal Sidebar | ✅ | ✅ |
| Mobile Navigation | ✅ | ✅ |

**Verdict:** ✅ Shell-compliant. Portal hub is an approved **Launcher** pattern (Slice B), not a competing work home.

---

### 3.11 Audit

| Concept | Route | Component | Class |
|---------|-------|-----------|-------|
| Audit Explorer (catalog alias) | `/master-admin/impersonation` | `ImpersonationCenter` | **T** |

No `/audit` page. Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant alias tool.

---

### 3.12 Reports

| Route | Component | Class |
|-------|-----------|-------|
| `/financials/reports` | `ReportsView` | **T** |
| `/facility/reports` | Facility reports | **T** (ops-adjacent) |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tools (Insights deep-links may target these).

---

### 3.13 Feature Flags

| Route | Component | Class |
|-------|-----------|-------|
| `/master-admin/flags` | Inline Card snapshot | **T** |

Shell ✅ · UDF ◯ · **Verdict:** ✅ Shell-compliant tool.

---

### 3.14 Mission Control

Same as §3.1 `/master-admin` — ✅ **COMPLIANT**.

---

## 4. Full Master Admin route matrix

| Route | Component | Class | UDF | Sidebar | Mobile | Verdict |
|-------|-----------|-------|-----|---------|--------|---------|
| `/master-admin` | `OperationsCenterView` / `UniversalDashboard` | H | ✅ | ✅ | ✅ | ✅ PASS |
| `/master-admin/dashboards` | `PortalLauncher` | L | ◯ | ✅ | ✅ | ✅ PASS (launcher) |
| `/master-admin/health` | Health Card list | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/notifications` | `PushDiagnosticsPanel` | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/impersonation` | `ImpersonationCenter` | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/recovery` | `AuthRecoveryPanel` | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/testing` | `TestingUtilitiesPanel` | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/flags` | Flags Card | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/providers` | Redirect | T | ◯ | ✅ | ✅ | ✅ Shell PASS |
| `/master-admin/commercial` | `CommercialDashboardPanel` + `CommercialOpsPanel` | **D** | ❌ | ✅ | ✅ | ❌ **NON-COMPLIANT** |

---

## 5. Legacy / divergent layouts (Class D)

These pages present **dashboard-like** canvases outside the Universal Dashboard Framework.

### D-1 — Master Admin Commercial

| Field | Value |
|-------|-------|
| Route | `/master-admin/commercial` |
| Component | `CommercialDashboardPanel`, `CommercialOpsPanel` |
| Reason | Competing commercial “dashboard” panels; not remounted on UDF / Assistant |
| Missing UX-016 elements | Universal Dashboard Framework · Greeting · M.P.A. Assistant · Waiting on Me · Waiting on Others · Immediate Attention · Today’s Mission · Recommended Actions · Operational Timeline · Insights (UDF order) |
| Shell | ✅ Sidebar + Mobile present |

### D-2 — Financials module home

| Field | Value |
|-------|-------|
| Route | `/financials` |
| Component | `FinancialOverview` (+ `PmBillingPanel`) |
| Reason | Module home uses legacy overview/KPI composition instead of Universal Dashboard Framework |
| Missing UX-016 elements | UDF · Greeting · Assistant · Waiting · Immediate Attention · Today’s Mission · Recommended Actions · Timeline · Insights-below-fold discipline |
| Shell | ✅ |

### D-3 — Migration Center

| Field | Value |
|-------|-------|
| Route | `/migration` |
| Component | `MigrationSwitchingExperience` / `MigrationDashboard` |
| Reason | Migration “dashboard” experience parallel to UDF |
| Missing UX-016 elements | UDF composition sections listed above |
| Shell | ✅ |

---

## 6. Shell compliance notes

| Surface family | Sidebar | Mobile bottom nav |
|----------------|---------|-------------------|
| `(app)/**` including all settings & master-admin | ✅ `ApplicationShell` → `Sidebar` | ✅ `OpsMobileBottomNav` |
| Master Admin–only operator | ✅ HQ variant (`MASTER_ADMIN_ONLY_NAVIGATION_GROUPS`: Dashboard → My Work → Administration) | ✅ Home → My Work → Search → Notifications → Profile |
| `/portal` Portal Launcher | ✅ wraps `ApplicationShell` | ✅ |
| `/portal/manager` | ⚠ Role portal frame (not ops ApplicationShell) — portal stub / future notice; **out of Ops Admin shell** | ⚠ Not ops mobile nav |

HQ sidebar variant is **authorized** under UX-016 Slice C (Master Admin–only shell keeps HQ-focused groups).

---

## 7. Gaps that are not UDF defects

| Observation | Classification |
|-------------|----------------|
| No `/roles`, `/audit`, `/users`, `/organizations` dedicated URLs | Naming/aliasing — tools exist under settings / impersonation |
| Tool pages lack Greeting / Assistant | **Expected** under STD-001 (homes only) |
| Portal Launcher / Surface Switcher lack UDF | **Expected** (Class L — Slice B) |
| Properties list is not a UDF home | Acceptable until a Properties module home is productized |

---

## 8. Compliance scorecard (Admin)

| Category | Score |
|----------|-------|
| Primary Admin homes (Org + Mission Control) | **2 / 2 PASS** |
| Approved launchers | **PASS** |
| Admin tools shell inheritance | **PASS** |
| Divergent Admin/module dashboards | **3 FAIL** (commercial · financials · migration) |
| New UX invented by this audit | **None** (docs only) |

---

## 9. Evidence pointers

| Artifact | Path |
|----------|------|
| Org home | `apps/web/src/app/(app)/dashboard/page.tsx` · `components/ops/ops-universal-dashboard.tsx` |
| Mission Control | `apps/web/src/app/(app)/master-admin/page.tsx` · `components/master-admin/operations-center-view.tsx` |
| Shell | `apps/web/src/app/(app)/layout.tsx` · `components/shell/application-shell.tsx` |
| Nav | `components/shell/navigation-config.ts` |
| Commercial debt | `apps/web/src/app/(app)/master-admin/commercial/page.tsx` |
| Financials debt | `apps/web/src/app/(app)/financials/page.tsx` |
| Migration debt | `apps/web/src/app/(app)/migration/page.tsx` |

---

## 10. Sign-off

| Role | Finding |
|------|---------|
| Audit | Admin **homes** certified-path compliant; **3** divergent dashboards remain |
| Next | Execute [07 — Migration plan](./07-admin-surface-migration-plan.md) under CORE-004 / authorized remediation slices — **not** a new UX initiative |

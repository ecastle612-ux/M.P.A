# Navigation Certification

**Parent:** [Commercial Experience Certification](./index.md)

---

## Information architecture verdict

**The platform is moving toward one operating system, but still feels like multiple layers stitched together.**

| Layer | Feels like |
|-------|------------|
| Commercial app (`/launcher`, `/pm/*`, `/facility/*`, `/billing`) | Emerging product OS |
| Role portals (`/portal/manager|owner|tenant|vendor`) | Separate older foundation shell |
| Foundation Settings org panel | Scaffold utilities, not product journey |
| Module alignment pages | Internal documentation pages inside the product |
| Master Admin | Separate OS (correct), but shallow |

**Overall IA grade: Conditional Fail for “one cohesive OS.”**

---

## Sidebar

| Check | Result |
|-------|--------|
| Grouped by commercial product | Pass |
| Plan context in sidebar header | Pass |
| Hides non-entitled product group | Pass |
| Marks Planned modules | Pass |
| Duplicate “Mission Control” label (Complete) | Conditional — disambiguated by group title only |
| No-SKU state guidance | Conditional — message present; Launcher nav item inconsistently filtered |

### No-SKU inconsistency (defect)

- `CommercialProvider` grants `platform.launcher` when SKU is null  
- `navigationGroupsForSku(null)` does **not** include `platform.launcher` in its entitlement set  
- Result: authenticated users land on `/launcher` (root redirect) but **may not see Launcher in the sidebar**

---

## Workspace Launcher

| Check | Result |
|-------|--------|
| Organized by commercial product | Pass |
| SKU-specific workspaces | Pass |
| No-SKU points to Setup + Billing | Pass |
| Removes need to hunt modules | Conditional — still overlaps heavily with sidebar |

---

## Search

| Check | Result |
|-------|--------|
| Header search | **Fail** — non-functional placeholder |
| Entitlement-aware results | **Fail** — N/A (no results engine) |
| ⌘K command palette | Conditional Pass — entitlement-filtered navigation only |

**Search certification: Fail.**

---

## Quick Actions

| Check | Result |
|-------|--------|
| Present | Conditional — only via ⌘K |
| Entitlement-aware | Pass for listed actions |
| Product-aware create actions | Fail — no “Create property / work order” style actions (acceptable for alignment phase, but checklist item unmet as a real QA surface) |

---

## Routes

| Check | Result |
|-------|--------|
| Logical namespaces `/pm`, `/facility`, `/shared`, `/admin` | Pass |
| Default home by SKU | Pass (`defaultHomeForSku`) |
| Legacy `/dashboard` redirects | Pass |
| Entitlement route guards | **Fail** |
| Portal routes still first-class | Conditional — competes with commercial home |

---

## Disconnected areas (must call out)

1. **`/portal/*` vs commercial app** — two homes for managers  
2. **Alignment module pages** — read like blueprint excerpts, not workspaces  
3. **Settings Organization Foundation panel** — create-org duplicate of Guided Setup  
4. **Header Search vs ⌘K** — two “search” affordances; one dead  
5. **Profile → Master Admin** for non-operators — false door  
6. **Billing “Full commercial catalog”** — shows all modules even to PM-only (educational, but can look like they own Facility names)

---

## Navigation certification verdict

**Conditional Pass** for product-grouped chrome.  
**Fail** for search, route gating, and cohesive single-OS feeling.

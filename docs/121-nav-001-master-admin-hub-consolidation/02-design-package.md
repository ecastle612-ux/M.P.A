# 02 — Design Package: Retire Standalone Master Admin Portals Launcher

**Package:** NAV-001  
**Status:** Draft — Design (not authorized to implement)  
**Date:** 2026-08-05  
**Depends on:** [01 — Review](./01-navigation-simplification-review.md) recommendation = Consolidate  
**Constraint:** Presentation / IA only. No permissions, auth, portal-test contract, or impersonation logic changes.

---

## 1. Problem

Master Admin has **one command center** and **two full portal launcher pages** plus multiple nav synonyms. Operators click through Mission Control to reach capabilities that should live on the hub. Maintenance must keep duplicate mounts in sync.

---

## 2. Goals

| ID | Goal |
|----|------|
| G1 | One Master Admin operational hub: `/master-admin` |
| G2 | Open Portal · View As · Test Mode available without leaving Mission Control |
| G3 | Role grouping preserved from certified catalog |
| G4 | Fewer nav labels / fewer clicks |
| G5 | Security unchanged |
| G6 | Non–Master Admin `/portal` availability preserved |

---

## 3. Target information architecture

```
/master-admin  (Mission Control — single hub)
├── Universal Dashboard Framework (STD-001 — unchanged order)
├── Operational Workspaces (existing supportive catalog)
└── Portal Launch  (embedded PortalLauncher — NEW mount location)
        ├── Groups (Operations … Internal)
        └── Card actions: Open Portal · View As · Launch in Test Mode

/master-admin/impersonation  — View As people picker (unchanged)
/portal/tenant|owner|manager — portal destinations (unchanged)
/portal                      — non-MA availability hub (unchanged)
                             — Master Admin → redirect to hub#portal-launch
/master-admin/dashboards     — redirect → /master-admin#portal-launch (deprecate)
```

### First-viewport discipline (STD-001)

Portal Launch mounts **below** Insights (or inside Operational Workspaces as a dedicated workspace tab) — **not** as a competing first-viewport dashboard and **not** as a second Greeting/Assistant.

Preferred placement: Operational Workspaces → workspace id `portals` / `surfaces` that renders `PortalLauncher` inline (replaces “Open → `/portal`” list items).

---

## 4. Preserve matrix (acceptance)

| Preserve | How |
|----------|-----|
| Open Portal | Same `openHref` from `portal-launcher-catalog` |
| View As | Same `viewAsHref` → `/master-admin/impersonation` |
| Test Mode | Same client call to `POST /api/master-admin/portal-test` |
| Role grouping | Same `PORTAL_LAUNCHER_GROUPS` |
| Security | `requireMasterAdmin*` gates · existing session modes · no API enum expansion |
| Permissions / business logic | Untouched |

---

## 5. Navigation changes (proposed)

### Remove / collapse (Master Admin shell)

| Current label | Action |
|---------------|--------|
| Portals (`/portal`) in ops shell | Hide for `master_admin` **or** retarget → `/master-admin#portal-launch` |
| Portal Testing | Remove — capability on hub |
| Surface Switcher | Remove from nav — redirect route retained temporarily |
| Support subnav → `/portal` | Retarget Mission Control portal section or remove synonym |
| Quick Action “Open Portal Launcher” | Replace with in-page Portal Launch (no external hop) |

### Keep

| Label | Route |
|-------|-------|
| Mission Control | `/master-admin` |
| Organizations / Impersonation | `/master-admin/impersonation` |
| Import / Migration · Health · Flags · etc. | existing tools |

---

## 6. Deprecation plan

| Phase | Change | Notes |
|-------|--------|-------|
| D0 | Approve NAV-001 | Gate |
| D1 | Authorize implementation slice | Presentation only |
| D2 | Embed `PortalLauncher` on Mission Control | Preserve all card actions |
| D3 | Master Admin `/portal` → redirect to hub anchor | Bookmarks safe |
| D4 | `/master-admin/dashboards` → redirect | Drop nav label |
| D5 | Remove duplicate Quick Action / nav synonyms | After soak |
| D6 | Re-audit Master Admin nav against “one hub” | Docs update STD-001 audit note |

No hard delete of portal destination routes in this package.

---

## 7. Non-goals

| Forbidden | Why |
|-----------|-----|
| New launcher UX / new card anatomy | STD-001 — reuse certified component |
| Expanding `portal-test` enum | Security-sensitive; separate authorize |
| Merging Impersonation into launcher cards beyond View As deep link | Slice B security boundary |
| Removing non-MA `/portal` availability | Different audience |
| Changing AUTH assigned homes | Out of scope |

---

## 8. Acceptance criteria (post-authorize)

| ID | Criterion |
|----|-----------|
| N1 | Mission Control exposes Open Portal · View As · Test Mode without navigating to `/portal` |
| N2 | Role groups match current catalog |
| N3 | Master Admin sidebar has ≤ 1 entry that opens portal launch (ideally 0 — it’s on the hub) |
| N4 | `/portal` MA hit redirects to hub; non-MA behavior unchanged |
| N5 | `/master-admin/dashboards` redirects or is removed from nav |
| N6 | No API / permission / session contract changes |
| N7 | STD-001 home order on `/master-admin` remains compliant |

---

## 9. Implementation sketch (for Approve / later Authorize — not to build now)

1. `OperationsCenterView`: add Portal Launch section rendering existing `PortalLauncher`.  
2. `navigation-config.ts`: collapse Portals / Portal Testing / Surface Switcher for MA.  
3. `/portal` page: if `isMasterAdmin` → `redirect("/master-admin#portal-launch")`.  
4. `/master-admin/dashboards` page: same redirect.  
5. Update workspace catalog links that pointed at `/portal` for MA.  
6. Docs: STD-001 audit note + UX-016 historical routes remain for provenance.

---

## 10. Open questions (resolve at Approve)

| # | Question | Suggestion |
|---|----------|------------|
| Q1 | Embed as workspace tab vs always-visible section below Insights? | Workspace tab `Surfaces` keeps first viewport calm |
| Q2 | Keep `/master-admin/dashboards` redirect permanently? | Yes for 1 release, then optional delete |
| Q3 | Should ops-shell “Portals” remain for non-MA org admins? | Yes — only MA path consolidates |

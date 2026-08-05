# 01 — Navigation Simplification Review

**Package:** NAV-001  
**Status:** Draft — Design  
**Date:** 2026-08-05  
**Objective:** One Master Admin operational hub — reduce duplicate launchers, maintenance, and clicks.

---

## 1. Current state (as built)

Master Admin operators currently reach portal-launch capabilities through **multiple parallel entry points**:

| Entry | Route | What it is |
|-------|-------|------------|
| Mission Control | `/master-admin` | UDF command center — **links out** to Portal Launcher; does not embed Open / View As / Test Mode |
| Portals / Portal Testing | `/portal` | Full `PortalLauncher` for Master Admin (`PortalAvailabilityHub`) |
| Surface Switcher | `/master-admin/dashboards` | **Same** `PortalLauncher` component mirrored |
| Impersonation Center | `/master-admin/impersonation` | Real-user View As + emergency Test Mode |
| Mission Control Quick Action | link → `/portal` | Extra hop labeled “Open Portal Launcher” |
| HQ sidebar | “Portal Testing” → `/portal` | Duplicate of Portals |
| Ops sidebar | “Portals” → `/portal` | Visible whenever ops shell renders |
| Master Admin subnav | “Support” → `/portal` | Another synonym entry |

**Verdict today:** Mission Control is the command center, but portal launch is **not** integrated into it. The standalone Portals page and Surface Switcher duplicate each other. Operators take an extra click from Mission Control to reach Open / View As / Test Mode.

---

## 2. Navigation comparison

### 2.1 Capability matrix

| Capability | `/portal` (MA) | `/master-admin/dashboards` | `/master-admin` today | `/master-admin/impersonation` |
|------------|----------------|----------------------------|-----------------------|-------------------------------|
| Open Portal (role cards) | ✅ | ✅ (identical) | ❌ (link only) | ◯ (redirect after impersonate) |
| View As | ✅ → Impersonation | ✅ → Impersonation | ❌ (link only) | ✅ primary |
| Launch in Test Mode | ✅ `portal-test` API | ✅ same | ❌ (link only) | ✅ emergency |
| Role grouping catalog | ✅ 9 groups | ✅ same | ❌ | ◯ people-centric |
| Platform health / attention | ◯ | ◯ | ✅ UDF home | ◯ |
| Waiting / Mission / Insights | ◯ | ◯ | ✅ | ◯ |
| Shell (sidebar / mobile / search) | ✅ | ✅ | ✅ | ✅ |

### 2.2 Duplicate nav labels (Master Admin–facing)

| Label variants | Target | Redundancy |
|----------------|--------|------------|
| Portals · Portal Testing · Support (subnav) | `/portal` | **Triple synonym** for one launcher |
| Surface Switcher | `/master-admin/dashboards` | **Same UI** as `/portal` for Master Admin |
| Open Portal Launcher (Quick Action) | `/portal` | Extra hop from hub that should own the capability |

### 2.3 What `/portal` uniquely does for non–Master Admin

| Audience | Behavior |
|----------|----------|
| Master Admin | Full Portal Launcher |
| Org ops with portal roles | Role-gated cards (Resident / Owner / Manager availability) |
| Portal-only roles | Assigned surface home (not this review’s retire target) |

**Important:** Retiring the **Master Admin standalone launcher page** is not the same as deleting the `/portal` route family. Resident/Owner/Manager destinations and non-MA availability must remain.

---

## 3. User journey comparison

### Journey A — Launch Resident Portal in Test Mode (today)

```
Mission Control
  → click “Open Portal Launcher” (or sidebar Portals / Portal Testing / Surface Switcher)
    → /portal or /master-admin/dashboards
      → find Residents group
        → Launch in Test Mode
```

**Clicks to action:** typically **3–4** (hub → launcher page → card action).  
**Cognitive load:** choose among 3–4 nav synonyms for the same tool.

### Journey B — Same goal (proposed)

```
Mission Control
  → Portal Launch section (below UDF Insights or in Operational Workspaces)
    → Residents → Launch in Test Mode
```

**Clicks to action:** typically **2**.  
**Cognitive load:** one hub; no launcher-page fork.

### Journey C — View As a real user (today vs proposed)

| Today | Proposed |
|-------|----------|
| Launcher card View As → Impersonation Center → pick user | Same View As deep link from hub-embedded launcher → Impersonation Center |
| Or sidebar Organizations / Impersonation directly | Unchanged — Impersonation remains the security boundary |

View As **security model stays** on Impersonation Center + existing session APIs. Consolidation does not invent a parallel impersonation engine (UX-016 Slice B constraint preserved).

### Journey D — Open Portal (production surface)

Unchanged destination routes (`/portal/tenant`, `/portal/owner`, `/dashboard` / manager surfaces, HQ tools). Only the **launch chrome** moves closer to Mission Control.

---

## 4. Maintenance impact

| Area | Today | After consolidation |
|------|-------|---------------------|
| Launcher UI | Two pages mount `PortalLauncher` (`/portal` MA path + `/master-admin/dashboards`) | **One** primary mount on Mission Control; optional thin redirect |
| Nav config | Portals + Portal Testing + Surface Switcher + Support synonym + Quick Action link | Collapse to Mission Control (+ Impersonation for people) |
| Catalog | Single catalog (`portal-launcher-catalog`) already shared — good | Remains single source of truth |
| Docs / training | “Use Portals or Surface Switcher or Mission Control link” | “Everything starts at Mission Control” |
| Regression surface | Two routes must stay visually in sync | One composition to certify |
| Risk if rushed | Breaking non-MA `/portal` hub | Mitigate with audience-specific retirement (below) |

**Net:** Lower maintenance and fewer synonym bugs; small redirect debt during deprecation window.

---

## 5. Security & preserve requirements

| Requirement | Assessment |
|-------------|------------|
| Preserve Open Portal | Keep catalog actions; relocate mount |
| Preserve View As | Keep href → Impersonation Center |
| Preserve Test Mode | Keep `POST /api/master-admin/portal-test` — no contract change |
| Preserve role grouping | Keep `PORTAL_LAUNCHER_GROUPS` inventory |
| Preserve security | Master Admin gate, portal-test session mode, impersonation validation unchanged |
| No permission / business logic changes | Presentation + IA only |

---

## 6. Relationship to UX-016 / STD-001

UX-016 Slice B **authorized** an expanded Portal Launcher and listed routes `/master-admin`, `/portal`, `/master-admin/dashboards`. That was correct for shipping capability quickly.

STD-001 / ADR-033 now make Mission Control the permanent Master Admin **home**. Holding a **second full launcher page** (and a third mirror) conflicts with the product goal of **one operational hub**.

This package does **not** reopen UX-016 UX invention. It proposes an **IA consolidation** that inherits the already-certified launcher component inside the certified hub.

---

## 7. Recommendation

### Primary recommendation: **Consolidate — deprecate standalone Master Admin Portals launcher**

Integration is clearly superior for Master Admin operators because:

1. Mission Control already claims to be the command center but forces an extra hop for the highest-frequency operator actions (Open / View As / Test Mode).  
2. `/portal` and `/master-admin/dashboards` are the **same component** for Master Admin — pure duplication.  
3. Multiple nav synonyms increase training cost and click count without adding capability.  
4. Security and preserve requirements are met by **relocating** `PortalLauncher`, not rewriting it.

### Recommended target shape

| Surface | Fate |
|---------|------|
| `/master-admin` | **Single hub** — UDF + embedded Portal Launcher (grouped) below Insights / in Operational Workspaces |
| `/master-admin/dashboards` | Deprecate as primary nav; redirect → `/master-admin#portal-launch` (or retire after soak) |
| `/portal` for Master Admin | Redirect → Mission Control portal section (preserve bookmarks) |
| `/portal` for non–Master Admin | **Keep** role-gated availability hub (out of MA consolidation scope) |
| `/portal/tenant` · `/owner` · `/manager` | **Keep** — destinations, not launchers |
| Impersonation Center | **Keep** — View As security boundary |
| Sidebar labels Portals / Portal Testing / Surface Switcher | Remove or collapse to Mission Control |

### Do **not** claim Mission Control “already provides” Open / View As / Test Mode today

It provides **links**, not the capabilities inline. Consolidation is justified because duplication exists among launcher pages — and because the hub should own the capability — not because the hub is already complete.

---

## 8. Decision

| Question | Answer |
|----------|--------|
| Is standalone Portals needed as a Master Admin home? | **No** — deprecate after hub embed |
| Is `/portal` route family deletable? | **No** — destinations + non-MA hub remain |
| Prepare Design package to retire MA standalone launcher? | **Yes** — see [02](./02-design-package.md) |

# PX-006.07 — AI Guidance Surfaces (Existing Data Only)

**Status:** Proposed  
**Priority:** P2

---

## Principle

Surface intelligent guidance using **data already available** in dashboard snapshots, entity detail pages, and Phase 11 AI modules. No new AI backend, models, or API routes.

---

## Guidance types

| Type | Example | Data source |
|------|---------|-------------|
| Recommended next action | "Create units for PMX Harbor" | Setup progress + operational tasks |
| AI suggestion | Link to existing insight card | `lib/ai/server.ts` dashboard data |
| Did you know? | "You can generate rent charges from active leases" | Static tips keyed by page/module |
| Potential issue | "3 units vacant > 30 days" | Dashboard snapshot KPIs |
| Upcoming deadline | "Lease renewal in 14 days" | Lease end dates from existing lease API |

---

## Placement

| Surface | Guidance |
|---------|------------|
| Dashboard | Top of operational tasks — one highlighted recommendation |
| Create forms (context rail) | Page-specific tip + next step |
| Detail pages (context rail) | Entity-specific alerts from loaded record |
| Post-success panel | Recommended next action (primary CTA) |

---

## Component: `GuidanceCard`

Lightweight presentation wrapper — icon, title, body, optional link. Uses Canopy tokens.

**Not in scope:**

- New LLM calls
- New insight generation pipelines
- Chat interface changes

---

## Static tips catalog

Maintain a small `lib/guidance/tips.ts` map of page → tip strings for "Did you know?" content. Presentation-only constants file.

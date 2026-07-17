# PX-006 Stage D — Human Experience Audit Results

**Date:** 2026-07-16  
**Scope:** Presentation-only polish across M.P.A. web application  
**Constraints honored:** No schema, API, RLS, permissions, or business logic changes

---

## Screens Audited

| Module | List | Detail | Create/Edit | Notes |
|--------|------|--------|-------------|-------|
| Operations Center / Dashboard | ✓ | — | — | Portfolio empty state, activity timeline |
| Setup Wizard | ✓ | — | — | Existing human copy preserved |
| Properties | ✓ | ✓ | ✓ | Empty state + context rail |
| Units | ✓ | ✓ | ✓ | Empty state |
| Tenants | ✓ | ✓ | ✓ | Empty state + context rail |
| Leases | ✓ | ✓ | ✓ | Progressive metrics + guidance |
| Maintenance | ✓ | ✓ | ✓ | Empty state + context rail |
| Vendors | ✓ | ✓ | ✓ | Progressive metrics (hide rating until data) |
| Financials | ✓ | ✓ | ✓ | Onboarding when no activity |
| Communications | ✓ | ✓ | ✓ | Empty state |
| AI Operations | ✓ | — | — | Single onboarding card vs. 3 empty panels |
| Organization | ✓ | — | — | Invitations empty copy |
| Authentication | ✓ | — | — | No changes required this pass |

---

## P0 — Human Language

- Replaced generic "No X yet" titles with action-oriented headlines (e.g. **Build your portfolio**, **Add residents to your portfolio**)
- Removed technical phrasing ("canonical tenant records", "portfolio sync", "No active recommendations")
- Context rail empty messages centralized in `lib/experience/context-rail-empty.ts`
- Organization invitations: **Invite your team so everyone can collaborate in one place**

---

## P0 — Empty States

**New infrastructure:**
- `lib/experience/empty-states.ts` — module copy, examples, CTAs, filtered messages
- `components/experience/experience-empty-state.tsx` — consistent renderer
- `@mpa/ui` `EmptyState` — supports `examples[]` and `secondaryAction`

**Modules upgraded:** Properties, Units, Tenants, Leases, Maintenance, Vendors, Rent Charges, Expenses, Owner Statements, Announcements

Each empty state now includes: purpose, explanation, typical examples, primary CTA, optional secondary action.

---

## P0 — Progressive Disclosure

| Surface | Before | After |
|---------|--------|-------|
| AI insight cards | 3 empty analytics panels | Single onboarding card when no insights |
| Financial overview | Zero KPIs with no context | Onboarding card + guidance tip when no activity |
| Vendor list metrics | Avg rating "—" always shown | Rating hidden until vendors are rated |
| Lease list metrics | Renewal/rent metrics at zero | Hidden until active leases exist |
| List workspace headers | Generic AI placeholders | Contextual guidance copy |

---

## P1 — Consistency

- All list tables use `ExperienceEmptyState` + `getFilteredEmptyMessage()`
- Context rails share `CONTEXT_RAIL_EMPTY` copy
- `GuidanceTip` component for optional contextual tips (Financials, extensible)

---

## P2 — Friendly Guidance

`lib/experience/guidance-tips.ts` — tips for lease, maintenance, financials, property, tenant, vendor, communications, AI.

Applied to: Financial overview (no activity), lease list header (active leases), vendor list (no preferred vendors).

---

## Files Added

- `apps/web/src/lib/experience/empty-states.ts`
- `apps/web/src/lib/experience/guidance-tips.ts`
- `apps/web/src/lib/experience/context-rail-empty.ts`
- `apps/web/src/components/experience/experience-empty-state.tsx`
- `apps/web/src/components/experience/guidance-tip.tsx`

## Files Modified (high level)

- All `*-table.tsx` list components (10 modules)
- Context rail components (6)
- `ai-insight-cards.tsx`, `ai-recommendation-cards.tsx`, `ai-activity-feed.tsx`
- `financial-overview.tsx`, `operations-center-view.tsx`
- `organization-foundation-panel.tsx`
- `packages/ui/src/components/empty-state.tsx`

---

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## Screenshots

Manual authenticated walkthrough recommended. Playwright capture blocked without running dev server + login session.

---

## Next Step (per product plan)

**Competitive UX pass** — side-by-side with AppFolio, Buildium, DoorLoop, Yardi after Stage D closeout.

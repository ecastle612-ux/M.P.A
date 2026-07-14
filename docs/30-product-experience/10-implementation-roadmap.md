# 30.10 — PX-001 Implementation Roadmap

## Status

**Proposed (design/documentation complete; awaiting implementation approval)**

## Gate Reminder

PX-001 implementation must follow:

Design -> Document -> Approve -> Implement

This package satisfies the design/documentation step only.

## Implementation Constraints (Mandatory)

- Preserve architecture and boundaries
- Preserve API contracts and route structure
- Preserve database and RLS behavior
- Preserve business logic and capability checks
- Do not introduce Phase 5 functionality

## Workstreams

### Workstream A — Shell & Layout Foundation

- Sidebar/topnav/mobile nav consistency pass
- Content width and spacing rhythm normalization
- Page header and section header standardization

### Workstream B — Navigation & Command Surface

- Workflow-aligned nav taxonomy within existing routes
- Mobile nav parity
- Command palette cleanup for implemented actions only

### Workstream C — Dashboard Experience

- Operational hierarchy refinement
- KPI and stream card consistency
- Task/quick-action visual system
- Empty/loading/error state polish

### Workstream D — Design System Consolidation

- Primitive token alignment (buttons, cards, forms, tables, badges)
- Shared composition components
- Visual consistency and density tuning

### Workstream E — Accessibility & Motion

- Focus and keyboard behavior hardening
- Landmark/ARIA consistency pass
- Motion token rollout and reduced-motion compliance

## Suggested Execution Sequence

1. Primitive normalization in `packages/ui`
2. Shell/navigation polish in `apps/web/src/components/shell`
3. Dashboard experience pass
4. Form/table consistency pass (properties/units/profile/auth)
5. Accessibility and interaction QA pass

## Verification Plan (Required)

After approved implementation, run:

1. `pnpm check:boundaries`
2. `pnpm check:circular`
3. `pnpm deps:validate`
4. `pnpm lint`
5. `pnpm typecheck`
6. `pnpm build`
7. `pnpm test`

## Definition of Done (PX-001)

- Visual system is coherent across existing modules
- Dashboard presents operational hierarchy cleanly
- Navigation and command interactions are consistent
- Accessibility baseline issues resolved for primary flows
- No business behavior regressions
- No Phase 5 scope leakage

## Approval Prompt

Once this package is reviewed, move status to Approved and authorize
implementation for PX-001 foundation changes only.


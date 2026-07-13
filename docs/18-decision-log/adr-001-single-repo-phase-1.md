# ADR-001: Single Repository for Phase 1 (Defer Monorepo)

## Status
Superseded by ADR-009

## Date
2026-07-11

## Context
The initial architecture proposal recommended a Turborepo monorepo with `apps/web`, `apps/mobile`, `packages/ui`, `packages/shared`, and other packages from day one. Mobile development is not planned for 6–12 months. The team is pre-development.

## Decision
Start with a **single Next.js repository** with folder boundaries (`design-system/`, `domains/`, `workflows/`) that extract cleanly into a monorepo when mobile development begins.

## Consequences
**Easier:** Faster initial development, simpler CI, lower onboarding friction, no empty package coordination.

**More difficult:** Must enforce folder boundaries via code review (no tooling enforcement). Monorepo migration requires a dedicated sprint later.

## Alternatives Considered
- **Turborepo from day one:** Rejected — premature complexity with no mobile app to justify shared packages.
- **Two repos (web + supabase):** Rejected — Supabase functions and migrations belong with application code for atomic changes.

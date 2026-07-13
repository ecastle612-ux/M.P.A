# ADR-013: Experience Architecture Before UI Implementation

## Status
Accepted

## Date
2026-07-13

## Context
Canopy defines how M.P.A. looks. Without a parallel definition of how M.P.A. *feels*, UI implementation risks producing a visually premium product that still creates stress, confusion, or role-inappropriate emotion. Stakeholder Phase 1.6 requires Experience Architecture documentation before any UI components.

## Decision
Adopt **Experience Architecture** (`docs/21-experience-architecture/`) as a mandatory gate alongside Canopy:

- Permanent Experience Principles
- Emotional Design Guide
- Role emotional journeys
- First-five-minute experiences
- Zero-learning goal
- Micro-interaction emotional outcomes

No UI component or portal shell implementation until Phase 1.5 (Canopy) **and** Phase 1.6 (Experience) are explicitly approved.

## Consequences
**Easier:** Shared emotional QA language; role-appropriate density and copy; fewer “looks fine, feels wrong” rewrites.  
**More difficult:** Slower path to first pixels; requires dual approval discipline.

## Alternatives Considered
- **Ship UI from Canopy alone:** Rejected — appearance ≠ experience.
- **Discover feelings in production:** Rejected — emotional debt is expensive with multi-sided users.

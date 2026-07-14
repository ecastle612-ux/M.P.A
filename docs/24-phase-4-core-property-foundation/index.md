# 24 — Phase 4 Core Property Foundation

## Status

**Accepted and implemented**

## Purpose

Define the first production business module foundation for M.P.A.: properties,
units, and operations dashboard architecture for property managers, built on top
of the completed identity and multi-tenant platform.

This phase establishes the permanent data and interaction model that future
leasing, maintenance, financial, documents, and communications modules will
depend on.

## Scope

1. Core property foundation domain model (organization-owned)
2. Core unit foundation domain model (property-owned)
3. Professional operations dashboard architecture
4. Navigation and information architecture for Property Manager workflows
5. UX and interaction standards for production SaaS behavior
6. Database architecture design for properties and units
7. Row-level security strategy for property and unit access
8. API architecture for property/unit and dashboard read models
9. Future extension points for subsequent roadmap phases
10. Verification gate for implementation readiness

## Explicitly Out of Scope

- Leasing workflow implementation
- Maintenance workflow implementation
- Payments/accounting implementation
- Document management implementation
- Messaging implementation
- AI workflow implementation
- Marketplace workflow implementation

## Documents

| Document | Purpose |
|----------|---------|
| [Core Property Foundation Specification](./core-property-foundation-spec.md) | Functional and architectural phase contract |
| [Property Domain Model](./property-domain-model.md) | Canonical property aggregate and lifecycle |
| [Unit Domain Model](./unit-domain-model.md) | Canonical unit aggregate and lifecycle |
| [Dashboard Architecture](./dashboard-architecture.md) | Production dashboard composition and data widgets |
| [Navigation & Information Architecture](./navigation-information-architecture.md) | Route/map and information hierarchy |
| [UX & Interaction Standards](./ux-interaction-standards.md) | Interaction quality standards for this phase |
| [Database Architecture](./database-architecture.md) | Implemented schema and relational contracts |
| [Row Level Security Strategy](./row-level-security-strategy.md) | Implemented RLS model and policy boundaries |
| [API Architecture](./api-architecture.md) | API surface, contracts, and responsibility split |
| [Extension Points for Future Phases](./extension-points-future-phases.md) | Forward-compatible architecture hooks |
| [Phase 4 Verification Gate](./phase-4-verification-gate.md) | Mandatory checks for phase close and release readiness |

## Gate Condition

Phase 4 design/documentation/approval gates are closed, implementation is
complete, and release hardening verification is required before tagging.

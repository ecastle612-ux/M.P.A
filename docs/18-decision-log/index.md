# 18 — Decision Log (ADR)

## Purpose

Architecture Decision Records (ADRs) document **why** significant technical choices were made. When a senior engineer joins, when a decision is questioned months later, or when we need to reverse a choice — the ADR is the authoritative record.

---

## ADR Format

```markdown
# ADR-{number}: {Title}

## Status
{Proposed | Accepted | Deprecated | Superseded by ADR-XXX}

## Date
{YYYY-MM-DD}

## Context
What is the issue that we're seeing that motivates this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this change?

## Alternatives Considered
What other options were evaluated and why were they rejected?
```

---

## Decision Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./adr-001-single-repo-phase-1.md) | Single Repository for Phase 1 (Defer Monorepo) | Superseded by ADR-009 | 2026-07-11 |
| [ADR-002](./adr-002-single-schema-namespacing.md) | Single PostgreSQL Schema with Table Prefix Namespacing | Accepted | 2026-07-11 |
| [ADR-003](./adr-003-four-plane-authorization.md) | Four-Plane Authorization Model | Accepted | 2026-07-11 |
| [ADR-004](./adr-004-vendor-marketplace-first-class.md) | Vendor Marketplace as First-Class Domain | Accepted | 2026-07-11 |
| [ADR-005](./adr-005-domain-events.md) | Domain Event System for Workflow Connectivity | Accepted | 2026-07-11 |
| [ADR-006](./adr-006-embedded-ai-not-chatbot.md) | Embedded AI Strategy (Not Chatbot-First) | Accepted | 2026-07-11 |
| [ADR-007](./adr-007-edge-functions-own-mutations.md) | Edge Functions Own Business Mutations | Accepted | 2026-07-11 |
| [ADR-008](./adr-008-workflow-first-organization.md) | Workflow-First Code Organization | Accepted | 2026-07-11 |
| [ADR-009](./adr-009-turborepo-monorepo-day-one.md) | Turborepo Monorepo from Day One | Accepted (supersedes ADR-001) | 2026-07-11 |
| [ADR-010](./adr-010-defer-accounting-not-reject.md) | Defer Full Accounting — Prepare Architecture | Accepted | 2026-07-11 |
| [ADR-011](./adr-011-canopy-design-system.md) | Canopy Design System as Permanent Visual Identity | Accepted | 2026-07-13 |
| [ADR-012](./adr-012-design-document-approve-implement.md) | Design → Document → Approve → Implement | Accepted | 2026-07-13 |
| [ADR-013](./adr-013-experience-architecture-before-ui.md) | Experience Architecture Before UI Implementation | Accepted | 2026-07-13 |
| [ADR-014](./adr-014-phase-3-identity-multitenant-foundation.md) | Phase 3 Identity & Multi-Tenant Foundation | Accepted | 2026-07-13 |
| [ADR-015](./adr-015-three-commercial-products-master-admin.md) | Three Commercial Products + Master Admin OS | Accepted | 2026-08-06 |
| [ADR-016](./adr-016-financial-operations-operational-finance.md) | Financial Operations as Operational Finance (PM) | Accepted | 2026-08-06 |
| [ADR-017](./adr-017-launch-001-customer-promise-journeys.md) | LAUNCH-001 Customer Promise Journeys | Accepted | 2026-08-06 |
| [ADR-018](./adr-018-self-service-commercial-platform.md) | Self-Service Commercial Platform (COM-002) | Accepted (packaging amended by ADR-019) | 2026-08-07 |
| [ADR-019](./adr-019-product-constitution.md) | M.P.A. Product Constitution | Accepted | 2026-08-08 |
| [ADR-022](./adr-022-master-admin-complimentary-access.md) | Master Admin Complimentary Access (Entitlement Sources) | Accepted | 2026-08-13 |

---

## Process

1. **Propose** — Author writes ADR with status `Proposed`
2. **Review** — Lead Architect + at least one engineer review
3. **Accept** — Status changed to `Accepted`; decision is binding
4. **Implement** — Code reflects the decision
5. **Deprecate** — If reversed, status `Superseded by ADR-XXX` with explanation

### When to Write an ADR

- New technology or dependency adoption
- Data model structural changes
- Authorization model changes
- API contract changes
- Infrastructure changes
- Anything that would surprise a new senior engineer

### When NOT to Write an ADR

- Bug fixes
- UI tweaks within established standards
- Dependency patch updates
- Adding a field to an existing table (unless structural impact)

---

## Related Documents

- **08** Software Architecture
- **08** Architecture Improvements
- **08** Architecture Review

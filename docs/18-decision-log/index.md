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
| [ADR-015](./adr-015-phase-4-core-property-foundation.md) | Phase 4 Core Property Foundation | Accepted | 2026-07-14 |
| [ADR-016](./adr-016-phase-5-tenant-lease-foundation.md) | Phase 5 Tenant & Lease Foundation | Accepted | 2026-07-14 |
| [ADR-017](./adr-017-onesignal-as-primary-push-provider.md) | OneSignal as Primary Push Notification Provider | Accepted | 2026-07-17 |
| [ADR-018](./adr-018-resend-as-primary-transactional-email-provider.md) | Resend as the Primary Transactional Email Provider | Accepted | 2026-07-20 |
| [ADR-019](./adr-019-adaptive-two-logo-brand-system.md) | Adaptive Two-Logo Brand System | Accepted | 2026-07-20 |
| [ADR-020](./adr-020-premium-mobile-navigation-architecture.md) | Premium Mobile Navigation Architecture | Accepted | 2026-07-20 |
| [ADR-021](./adr-021-permanent-brandlogo-rendering-architecture.md) | Permanent BrandLogo Rendering Architecture | Accepted | 2026-07-20 |
| [ADR-022](./adr-022-perception-based-brand-certification.md) | Perception-Based Brand Certification | Accepted | 2026-07-20 |
| [ADR-023](./adr-023-stripe-connect-express-owner-payouts.md) | Stripe Connect Express for Owner Payouts | Accepted | 2026-07-22 |
| [ADR-024](./adr-024-saas-stripe-billing-separation.md) | SaaS Stripe Billing Separated from Property Money Rails | Accepted | 2026-07-22 |
| [ADR-025](./adr-025-tokenized-vendor-work-order-access.md) | Tokenized Vendor Work-Order Access (No Login) | Accepted | 2026-07-22 |
| [ADR-026](./adr-026-organization-provisioning-username-identity.md) | Organization Provisioning & Username-First Identity | Accepted | 2026-07-23 |
| [ADR-027](./adr-027-customer-lifecycle-commercial-operations.md) | Customer Lifecycle & Commercial Operations (COM-001) | Accepted | 2026-07-23 |
| [ADR-028](./adr-028-platform-operations-backbone.md) | Platform Operations Backbone (OPS-001) | Accepted | 2026-07-23 |
| [ADR-029](./adr-029-platform-experience-design-system.md) | Platform Experience & Design System (UX-012) | Accepted | 2026-07-23 |
| [ADR-030](./adr-030-signwell-as-primary-esign-provider.md) | SignWell as Primary Electronic Signature Provider (V1.0) | Accepted | 2026-07-27 |
| [ADR-031](./adr-031-ux-013-modules-first-contextual-navigation.md) | Modules-First Acquisition & Contextual Navigation (UX-013) | Accepted | 2026-07-28 |
| [ADR-032](./adr-032-ux-016-dashboard-navigation-optimization.md) | Dashboard & Navigation Optimization (UX-016) | Accepted | 2026-08-05 |

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

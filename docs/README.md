# MPA Blueprint

The permanent source of truth for M.P.A. (My Property Assistant).

This blueprint defines how M.P.A. is designed, built, and evolved. Every engineer, designer, and product contributor should treat these documents as authoritative until superseded by an approved Decision Log entry.

**Current status:** Phase 2.1 Foundation Hardening complete; Phase 3 Identity
Foundation documented and awaiting approval. Implementation Gate in force.

---

## Implementation Gate (Permanent)

**Nothing gets implemented until it has been designed, documented, and approved.**

```
Design → Document → Approve → Implement
```

Full policy: [00 Governance — Implementation Gate](./00-governance/implementation-gate.md) · [ADR-012](./18-decision-log/adr-012-design-document-approve-implement.md)

---

## How to Use This Blueprint

1. Read **01 Vision** through **05 Business Workflows** to understand *why* we build.
2. Read **06 Design Language (Canopy)** through **07 UX Principles** to understand *how it should feel*.
3. Read **08 Software Architecture** through **16 Testing Standards** to understand *how it is built*.
4. Consult **17 Development Roadmap** for sequencing.
5. Check **18 Decision Log** before proposing architectural changes.
6. Reference **19** and **20** for long-term platform direction.

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Vision](./01-vision/index.md) | Company mission, platform definition, long-term ambition |
| 02 | [Product Philosophy](./02-product-philosophy/index.md) | What we build and what we refuse to build |
| 03 | [User Personas](./03-user-personas/index.md) | Who we serve and how their needs differ |
| 04 | [Property Manager Pain Points](./04-property-manager-pain-points/index.md) | Problems the platform must eliminate |
| 05 | [Business Workflows](./05-business-workflows/index.md) | End-to-end operational flows (primary organizing principle) |
| 06 | [Design Language — Canopy](./06-design-language/index.md) | Permanent visual identity (Phase 1.5) |
| 07 | [UX Principles](./07-ux-principles/index.md) | Interaction patterns and experience rules |
| 21 | [Experience Architecture](./21-experience-architecture/index.md) | How M.P.A. should *feel* (Phase 1.6) |
| 22 | [Phase 2 Foundation Hardening](./22-phase-2-scaffold-review/index.md) | Readiness hardening and quality assessment |
| 23 | [Phase 3 Identity Foundation](./23-phase-3-identity-foundation/index.md) | Identity and multi-tenant foundation design package |
| 24 | [Production Hardening (EP-008 / PR-003)](./24-production-hardening/index.md) | Draft design package — production reliability/security/observability (Proposed, gate open) |
| 08 | [Software Architecture](./08-software-architecture/index.md) | System design, layers, infrastructure |
| 09 | [Database Architecture](./09-database-architecture/index.md) | Schema, tenancy, RLS, data lifecycle |
| 10 | [API Standards](./10-api-standards/index.md) | Contracts, Edge Functions, integration boundaries |
| 11 | [Coding Standards](./11-coding-standards/index.md) | TypeScript, naming, git, review expectations |
| 12 | [Component Standards](./12-component-standards/index.md) | UI composition, design system rules |
| 13 | [AI Strategy](./13-ai-strategy/index.md) | Embedded AI capabilities across the platform |
| 14 | [Security Standards](./14-security-standards/index.md) | Auth, authorization, compliance posture |
| 15 | [Performance Standards](./15-performance-standards/index.md) | Speed, scale, reliability targets |
| 16 | [Testing Standards](./16-testing-standards/index.md) | Quality gates and test pyramid |
| 17 | [Development Roadmap](./17-development-roadmap/index.md) | Phased delivery plan (workflow-ordered) |
| 18 | [Decision Log (ADR)](./18-decision-log/index.md) | Recorded architectural decisions |
| 19 | [Future Native Mobile Strategy](./19-future-native-mobile-strategy/index.md) | iOS/Android path without backend rewrite |
| 20 | [Future Integrations](./20-future-integrations/index.md) | Third-party systems and marketplace expansion |

### 21 Experience Architecture (Phase 1.6)

| Document | Purpose |
|----------|---------|
| [Experience Principles](./21-experience-architecture/experience-principles.md) | Permanent experience laws |
| [Emotional Design Guide](./21-experience-architecture/emotional-design-guide.md) | Confidence, stress, urgency, success/failure/wait |
| [Role Journeys](./21-experience-architecture/role-journeys.md) | Emotional journeys per role |
| [First Five Minutes](./21-experience-architecture/first-five-minutes.md) | Opening trust window |
| [Zero Learning Goal](./21-experience-architecture/zero-learning-goal.md) | Understandable without training |
| [Micro Interaction Philosophy](./21-experience-architecture/micro-interaction-philosophy.md) | Emotional outcomes of key actions |
| [Recommendations Before Implementation](./21-experience-architecture/recommendations-before-implementation.md) | Experience gate |

### Governance & gates

| Document | Purpose |
|----------|---------|
| [Implementation Gate](./00-governance/implementation-gate.md) | Design → Document → Approve → Implement (permanent) |

### 06 Design Language — Canopy (Phase 1.5)

| Document | Purpose |
|----------|---------|
| [Visual Identity Guide](./06-design-language/visual-identity-guide.md) | Brand character and recognizability |
| [Design Token System](./06-design-language/design-token-system.md) | Typography, HEX color, space, radius, motion tokens |
| [Component Philosophy](./06-design-language/component-philosophy.md) | Shared UI family rules |
| [Operations Console](./06-design-language/operations-console.md) | Signature PM experience (not a dashboard) |
| [Role Experiences](./06-design-language/role-experiences.md) | PM / Tenant / Owner / Vendor shells |
| [Improvements Before Implementation](./06-design-language/improvements-before-implementation.md) | Design gate before UI code |

### Supplementary

- [Architecture Improvements Before Development](./08-software-architecture/architecture-improvements.md) — Required changes before writing production code
- [Architecture Review (Critical)](./08-software-architecture/architecture-review.md) — Honest assessment of the initial proposal
- [Phase 2 Hardening Review](./22-phase-2-scaffold-review/index.md) — Foundation quality hardening and readiness grading

---

## Governance

| Action | Requirement |
|--------|-------------|
| **Any implementation** | Designed → Documented → Approved ([Implementation Gate](./00-governance/implementation-gate.md)) |
| New feature | Must map to a workflow in **05** and a goal in **02** |
| Schema change | Migration + RLS tests + Decision Log if structural |
| New dependency | ADR if it affects architecture or bundle size materially |
| AI capability | Must align with **13** — no standalone chatbot features |
| UI component | Must follow **06** Canopy, **07**, **21** Experience, and **12** — tokens + experience approved before primitives |

---

## Version

| Field | Value |
|-------|-------|
| Blueprint version | 0.4.0 |
| Last updated | 2026-07-13 |
| Phase | 2.1 Foundation Hardening |

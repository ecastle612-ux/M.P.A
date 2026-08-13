# MPA Blueprint

The permanent source of truth for M.P.A. (My Property Assistant).

This blueprint defines how M.P.A. is designed, built, and evolved. Every engineer, designer, and product contributor should treat these documents as authoritative until superseded by an approved Decision Log entry.

**Current status:** Product Architecture Reset **Approved**. Commercial Experience
Hardening P0 **Pass**. FIN-OPS-001 **Approved** (ADR-016 Accepted); slices **S0–
S3 delivered** and **paused** (S4+ NO-GO). LAUNCH-001 Customer Promise Roadmap
**Approved** (ADR-017); journey-gated — **J0–J2 delivered**, J3–J8 not authorized.
CORE-004 remains stopped. Facility Operations feature Implement authorize (2026-08-07)
**refused** pending workflows + schema design package ([27](./27-facility-operations/index.md)).
Implementation Gate in force.

---

## Implementation Gate (Permanent)

**Nothing gets implemented until it has been designed, documented, and approved.**

```
Design → Document → Approve → Implement
```

Full policy: [00 Governance — Implementation Gate](./00-governance/implementation-gate.md) · [Product Constitution](./00-governance/product-constitution.md) · [Infrastructure Verification](./00-governance/infrastructure-verification-policy.md) · [ADR-012](./18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-019](./18-decision-log/adr-019-product-constitution.md)

---

## How to Use This Blueprint

1. Read **01 Vision** through **05 Business Workflows** to understand *why* we build.
2. Read **06 Design Language (Canopy)** through **07 UX Principles** to understand *how it should feel*.
3. Read **08 Software Architecture** through **16 Testing Standards** to understand *how it is built*.
4. Read **24 Product Architecture** for commercial packaging (three offerings + Master Admin).
5. Read **25 FIN-OPS-001** for Financial Operations (S0–S3 delivered; paused).
6. Read **26 LAUNCH-001** for Customer Promise roadmap (Approved; authorize each journey before code).
7. Consult **17 Development Roadmap** for sequencing (reconcile to 24 after approval).
8. Check **18 Decision Log** before proposing architectural changes.
9. Reference **19** and **20** for long-term platform direction.

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
| 24 | [Product Architecture (Commercial Reset)](./24-product-architecture/index.md) | Three offerings, ownership, nav, subscriptions, entitlements |
| 25 | [FIN-OPS-001 Financial Operations](./25-fin-ops-001/index.md) | Operational finance (Approved; S0–S3 delivered; paused) |
| 26 | [LAUNCH-001 Customer Promise Roadmap](./26-launch-001-onboarding/index.md) | Approved; journey-gated launch (J0–J2 delivered; J3+ blocked) |
| 29 | [BUG-001 Public Homepage Routing](./29-bug-001-public-homepage-routing/index.md) | **CLOSED** — public marketing at `/`; prod SHA `79ade03` |
| 31 | [BUG-003/004 Landing & Acquisition](./31-bug-003-004-landing-acquisition/index.md) | **CLOSED** — enterprise landing + Confirm Plan funnel |
| 33 | [PR #46 Pre-Merge Review](./33-pr-46-pre-merge-review/index.md) | Required B1–B5 before merge |
| 34 | [PR #46 Blocking Remediation](./34-pr-46-blocking-remediation/index.md) | B1–B5 commercial honesty |
| 35 | [PR #46 R1 Remediation](./35-pr-46-r1-remediation/index.md) | Account creation copy |
| 36 | [PR #46 Merge Closeout](./36-pr-46-merge-closeout/index.md) | Merged; Production `3d081ad`; BUG-003/004 CLOSED |
| 37 | [COM-002 Self-Service Commercial](./37-com-002-self-service-commercial/index.md) | **Approved** · ADR-018 Accepted · Slice A authorized |
| 38 | [COM-002 Architecture Review](./38-com-002-architecture-review/index.md) | Review complete; amendments incorporated in 37 |
| 39 | [COM-002 Slice A](./39-com-002-slice-a/index.md) | Commercial foundation implementation + verification |
| 40 | [COM-002 Slice B](./40-com-002-slice-b/index.md) | Live Demo Platform implementation + verification |
| 41 | [COM-002 Slice C](./41-com-002-slice-c/index.md) | Stripe SaaS Checkout implementation + verification |
| 42 | [COM-002 Slice D](./42-com-002-slice-d/index.md) | Automatic Provisioning implementation + verification |
| 43 | [COM-002 Slice E](./43-com-002-slice-e/index.md) | Subscription Lifecycle implementation + verification |
| 45 | [COM-002 Production Integration](./45-com-002-production-integration/index.md) | **Merged + deployed** · Production SHA `097a1a7` · live routes Pass |
| 46 | [BUG-005 COM-002 Public Experience](./46-bug-005-com-002-public-experience/index.md) | **Closed** · Production `71bc62f` · www commercial experience Pass |
| 47 | [BUG-006 Restore Commercial Experience](./47-bug-006-restore-commercial-experience/index.md) | **Merged** · Production synchronized (see BUG-008) |
| 48 | [BUG-008 Production Sync & Constitution](./48-bug-008-production-sync/index.md) | **Audited** · Constitution PASS · Demos FAIL |
| 49 | [BUG-009 Demo Platform Recovery](./49-bug-009-demo-platform-recovery/index.md) | **Fixed** · Production `3af2916` · all three demos Pass |
| 50 | [BUG-010 / BUG-012 Checkout Onboarding](./50-bug-010-stripe-checkout-onboarding/bug-012-execution-report.md) | Onboarding certification · see BUG-012 report |
| 51 | [Phase 3 Production Polish](./51-phase-3-production-polish/index.md) | Sprint 1 Public Experience — Authorized · polish only |
| 52 | [Phase 4 Master Admin](./52-phase-4-master-admin/index.md) |
| 53 | [Phase 4 Property Manager Workspace](./53-phase-4-property-manager-workspace/index.md) | Sprint 3 PM UX · LIVE / Owner-accepted |
| 54 | [Phase 4 Facility Operations Workspace](./54-phase-4-facility-operations-workspace/index.md) | Sprint 4 FO UX · LIVE |
| 55 | [Phase 4 Resident Dashboard](./55-phase-4-resident-dashboard/index.md) | Sprint 5 Resident UX · LIVE |
| 56 | [Phase 4 Document Intelligence](./56-phase-4-document-intelligence/index.md) | Sprint 6 Document Intelligence Center · LIVE |
| 57 | [Phase 4 Reporting & Analytics](./57-phase-4-reporting-analytics/index.md) | Sprint 7 Reporting & Analytics Center · implementing |
| 58 | [V1 Capital Projects CF cleanup](./58-v1-capital-projects-cf-cleanup/index.md) | Capital CF removed + Background Screening Planned messaging · Owner LIVE accepted (PR #99) |
| 73 | [MEDIA-001 Universal Media Attachment](./73-media-001-universal-media-attachment/index.md) | **Approved** · Universal media framework (ADR-023) |
| 74 | [MEDIA-001 Implementation Certification](./74-media-001-implementation-certification/index.md) | Phase 1 foundation + FO work orders · no Production deploy |
| 76 | [Complete Plan Validation Remediation](./76-complete-plan-validation-remediation/index.md) | MEDIA-001 + API/surface isolation · **READY FOR COMPLETE PLAN CUSTOMER TESTING** · no deploy |
| 77 | [Complete Plan Production Certification Readiness](./77-complete-plan-production-certification-readiness/index.md) | RC validation · prior **BLOCKED** (merge/Preview) · no deploy |
| 78 | [Vercel Preview Font Remediation](./78-vercel-preview-font-remediation/index.md) | Self-host IBM Plex · **READY** · Preview green · no Production deploy |
| 79 | [Final Release Certification Readiness](./79-final-release-certification-readiness/index.md) | Combined RC · **BLOCKED** (#175/#177 not on main) · no Production deploy |
| 84 | [Authenticated Production User Acceptance Test](./84-authenticated-production-user-acceptance-test/index.md) | **BLOCKED** — `main` @ `dac469a`; FO login invalid; PM login OK but no org; approved **M.P.A. UAT Clinic Demo** missing on `mpa-prod` |
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

### 24 Product Architecture (Commercial Reset)

| Document | Purpose |
|----------|---------|
| [Index & Audit Verdict](./24-product-architecture/index.md) | Stop notice, audit summary, approval checklist |
| [Master Product Architecture](./24-product-architecture/master-product-architecture.md) | Commercial model and boundary rules |
| [Module Ownership Matrix](./24-product-architecture/module-ownership-matrix.md) | PM / Facility / Shared / Master Admin / Unknown |
| [Property Manager Module Map](./24-product-architecture/property-manager-module-map.md) | Definitive PM modules, nav, workspaces, workflows |
| [Facility Operations Module Map](./24-product-architecture/facility-operations-module-map.md) | Definitive Facility ownership (no implementation) |
| [Complete Platform Composition](./24-product-architecture/complete-platform-composition.md) | Union without duplicate homes |
| [Master Admin Capability Map](./24-product-architecture/master-admin-capability-map.md) | Operator OS gaps and target IA |
| [Navigation Map](./24-product-architecture/navigation-map.md) | Sidebar, launcher, Mission Control, routes, search |
| [Subscription Matrix](./24-product-architecture/subscription-matrix.md) | SKU inclusion matrix |
| [Entitlement Matrix](./24-product-architecture/entitlement-matrix.md) | Capability keys by SKU |
| [Launch Readiness](./24-product-architecture/launch-readiness.md) | Customer #1 clarity verdict |
| [Implementation Order After Reset](./24-product-architecture/implementation-order-after-reset.md) | Post-approval sequence only |
| [Phase 1 Alignment Verification](./24-product-architecture/phase-1-alignment-verification.md) | Architectural alignment verification |
| [Commercial Experience Certification](./24-product-architecture/certification/index.md) | Hardening P0 Pass; FO design authorized; FO impl NO-GO |
| [Commercial Hardening Report](./24-product-architecture/certification/commercial-hardening-report.md) | P0 checklist and verification |

### 25 FIN-OPS-001 (Financial Operations)

| Document | Purpose |
|----------|---------|
| [Package Index](./25-fin-ops-001/index.md) | Authoritative FO package (Approved) |
| [Product Vision & Scope](./25-fin-ops-001/product-vision-and-scope.md) | Vision, boundaries, Launch / Phase 2 / Post-launch |
| [Workflows & State Machines](./25-fin-ops-001/workflows-and-state-machines.md) | Canonical FO workflows and states |
| [Ownership, Permissions & Integrations](./25-fin-ops-001/ownership-permissions-integrations.md) | SKU, permissions, property/resident/vendor |
| [Stripe & Ledger Architecture](./25-fin-ops-001/stripe-and-ledger-architecture.md) | Connect, Checkout, ledger, SaaS boundary |
| [Surfaces & Cross-cutting UX](./25-fin-ops-001/surfaces-dashboard-notifications-search-mobile.md) | Dashboard, notifications, audit, search, mobile |
| [Delivery & Certification](./25-fin-ops-001/delivery-acceptance-risks-slices-certification.md) | Acceptance, risks, slices, cert plan |
| [S0 Certification](./25-fin-ops-001/s0/index.md) | Foundation slice reports |
| [S1 Certification](./25-fin-ops-001/s1/index.md) | Resident billing & rent collection |
| [S2 Certification](./25-fin-ops-001/s2/index.md) | Delinquency, late fees & vendor AP |
| [S3 Certification](./25-fin-ops-001/s3/index.md) | Command Center & owner reporting |
| [ADR-016](./18-decision-log/adr-016-financial-operations-operational-finance.md) | Accepted — operational finance decision |

### 26 LAUNCH-001 (Customer Promise Roadmap)

| Document | Purpose |
|----------|---------|
| [Package Index](./26-launch-001-onboarding/index.md) | Customer Promise roadmap — Approve before code |
| [Promise Evaluation Framework](./26-launch-001-onboarding/promise-evaluation-framework.md) | Six questions every ad must pass |
| [Capability Promises](./26-launch-001-onboarding/capability-promises.md) | All PM promises scored |
| [Customer Journeys](./26-launch-001-onboarding/customer-journeys.md) | Outcome order (replaces eng slices) |
| [Master Admin Certification Console](./26-launch-001-onboarding/master-admin-certification-console.md) | How operators certify each promise |
| [Launch Readiness Gate](./26-launch-001-onboarding/launch-readiness-gate.md) | GO only when journeys work unaided |

### Governance & gates

| Document | Purpose |
|----------|---------|
| [Implementation Gate](./00-governance/implementation-gate.md) | Design → Document → Approve → Implement (permanent) |
| [Product Constitution](./00-governance/product-constitution.md) | Three products; Enterprise sales motion only; binding commercial flow (ADR-019) |
| [Infrastructure Verification](./00-governance/infrastructure-verification-policy.md) | Do not re-request configured secrets; stop only for new vars/migrations/proven gaps |

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
| Blueprint version | 0.5.0 |
| Last updated | 2026-08-06 |
| Phase | Product Architecture Alignment Phase 1 |

# MPA Blueprint

The permanent source of truth for M.P.A. (My Property Assistant).

This blueprint defines how M.P.A. is designed, built, and evolved. Every engineer, designer, and product contributor should treat these documents as authoritative until superseded by an approved Decision Log entry.

**Current status:** Phase 4 Core Property Foundation completed. Phase 5 Tenant &
Lease Foundation planning package is now proposed and awaiting approval.
Implementation Gate remains in force.

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
7. Consult **31 Product Requirements Registry** before implementing any phase — verify [Implementation Checklist](./31-product-requirements/implementation-checklist.md).

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
| 24 | [Phase 4 Core Property Foundation](./24-phase-4-core-property-foundation/index.md) | Property/unit/dashboard phase design package |
| 25 | [Phase 5 Tenant & Lease Foundation](./25-phase-5-tenant-lease-foundation/index.md) | Tenant and lease phase planning package |
| 30 | [Product Experience Initiative (PX-001)](./30-product-experience/01-product-vision.md) | Dashboard experience and design system foundation package |
| 31 | [Product Requirements Registry (PRR)](./31-product-requirements/index.md) | Permanent registry of agreed product requirements |
| 43 | [MHF-001 Unified Communication Platform](./43-mhf-001-unified-communication-platform/README.md) | Messaging + in-app notification foundation (OneSignal deferred) |
| 44 | [API-001 OneSignal Notification Foundation](./44-api-001-onesignal-notification-foundation/README.md) | Push provider design package (Approved · Implemented) |
| 45 | [API-001A Push Enrollment & Device Registration](./45-api-001a-push-enrollment-device-registration/README.md) | Enrollment UX extension of API-001 (Approved · Implemented) |
| 46 | [API-002A Universal Media Upload Foundation](./46-api-002a-universal-media-foundation/README.md) | Storage + MediaUpload platform (Approved · Implemented slices 0–4) |
| 47 | [QA-001 Automated Quality Assurance](./47-qa-001-automated-quality-assurance/README.md) | Internal Playwright QA platform (Approved · Implemented) |
| 48 | [API-003 Background Screening](./48-api-003-background-screening/README.md) | ScreeningService / Checkr provider platform (Approved · Implemented) |
| 49 | [DEV-004A Migration History Reconciliation](./49-dev-004a-migration-history-reconciliation/README.md) | Local↔remote Supabase migration history integrity repair |
| 50 | [API-004 Electronic Signatures](./50-api-004-electronic-signatures/README.md) | SignatureService / Dropbox Sign platform (Approved · Implemented) |
| 51 | [API-005 Resident Payments & Billing](./51-api-005-resident-payments-billing/README.md) | BillingService / PaymentProvider / Stripe-first platform (Approved · Implemented) |
| 52 | [RC-001 Beta Readiness & Design Partner Certification](./52-rc-001-beta-readiness/README.md) | Design Partner GO (constrained) · guides · checklist |
| 56 | [DX-001 Design Partner Experience Polish](./56-dx-001-design-partner-polish/00-executive-summary.md) | Usability / trust polish (Complete) |
| 57 | [DX-002 Customer Switching Experience](./57-dx-002-customer-switching/00-executive-summary.md) | Switching / Migration Center experience |
| 60 | [DX-003 Zero Friction Daily Operations](./60-dx-003-zero-friction-daily-operations/README.md) | Daily ops click audit · workflow elimination (Draft — Ready for Approval) |
| 61 | [DX-004 Five-Minute Rule (OS UX)](./61-dx-004-five-minute-rule/README.md) | Operating System UX · ≤5 min common jobs (Draft — Ready for Approval) |
| 62 | [IA-001 Intelligent Property Operations](./62-ia-001-intelligent-property-operations/README.md) | Proactive AI ops manager · human-gated (Draft — Ready for Approval) |
| 63 | [MOAT-001 Competitive Advantage Blueprint](./63-moat-001-competitive-advantage-blueprint/README.md) | Sustainable moats · why switch / why stay (Draft — Ready for Approval) |
| 66 | [DP-001 Design Partner Readiness](./66-dp-001-design-partner-readiness/README.md) | OPS-003 P0 readiness surfaces (Complete) |
| 67 | [PR-001 Production Readiness & Domain Launch](./67-pr-001-production-readiness/README.md) | Domain · env separation · provider audit · Private Beta (EP-006) |
| 68 | [PR-002 Production Deployment & Domain Activation](./68-pr-002-production-deployment/README.md) | Vercel prod deploy · DNS/SSL · certification (EP-007) |
| 68 | [PR-003 Production Environment Audit](./68-pr-003-production-environment-audit.md) | Zod/env inventory · Vercel checklist · build failure root cause |
| 69 | [UX-001 Zero Friction Hardening](./69-ux-001-zero-friction-hardening/README.md) | PM friction · Master Admin Slice A (EP-004 Approved) |
| 70 | [UX-005 Authentication Experience](./70-ux-005-authentication-experience/README.md) | Auth presentation redesign (EP-004) |
| 71 | [ADMIN-001 Master Admin Impersonation](./71-admin-001-master-admin-impersonation/README.md) | Portal Test Mode + Impersonation Center + audit (**Approved**) |
| 72 | [WF-004 Workflow Intelligence](./72-wf-004-workflow-intelligence/README.md) | Context forms · suggestions · completion (EP-006) |
| 73 | [UX-003 Trust & Validation](./73-ux-003-trust-validation/README.md) | Validation · confirm · undo · loading (EP-007) |
| 74 | [MIG-001 Design Partner Migration](./74-mig-001-design-partner-migration/README.md) | Guided portfolio import UX (EP-010) |
| 75 | [PM-001 Property Manager Certification](./75-pm-001-property-manager-certification/README.md) | Full-day PM workflow certification (EP-011) |
| 76 | [CP-001 Live Provider Certification](./76-cp-001-live-provider-certification/README.md) | Provider health · Commercial Pilot readiness (EP-012) |
| 80 | [EP-018 Root Cause Recovery](./80-ep-018-root-cause-recovery/README.md) | Auth/login regression recovery |
| 81 | [EML-001 Transactional Email Experience](./81-eml-001-transactional-email-experience/README.md) | Premium branded transactional email (Priority 6) |
| 82 | [UX-006 Mobile Workflow Optimization](./82-ux-006-mobile-workflow-optimization/README.md) | Reduce mobile scroll / taps (awaiting Approve) |
| 83 | [UX-007 Adaptive Logo System](./83-ux-007-adaptive-logo-system/README.md) | Two-logo adaptive branding architecture (Approved) |
| 87 | [EP-019 Performance & Speed Certification](./87-ep-019-performance-speed-certification/README.md) | Evidence-first speed certification (**Paused** behind UX-009 / DPX-001) |
| 88 | [UX-009 Cognitive Load & Workflow Optimization](./88-ux-009-cognitive-load-workflow-optimization/README.md) | Reduce thinking / hunting / scrolling (**Approved** · DPX-001 execution vehicle) |
| 89 | [SH-001 Shell Stability Certification](./89-sh-001-shell-stability-certification/README.md) | Shell stability audit + first fixes |
| 90 | [SH-002 Native Shell Stability](./90-sh-002-native-shell-stability/README.md) | Focus loss + AI isolation + native shell (**PASS**) |
| 91 | [SH-003 Runtime Verification & Deployment](./91-sh-003-runtime-verification-deployment/README.md) | Deploy + verify before PASS (**PASS** · User Verified) |
| 92 | [DPX-001 Design Partner Experience](./92-dpx-001-design-partner-experience/README.md) | Phase 6 — operator experience philosophy (**Approved** · Amendments A–G) |
| 93 | [DPX-002 Complete Daily Workflow](./93-dpx-002-complete-daily-workflow/README.md) | Gold-standard reference workflow (**Approved** · Amendments A–G) |
| 93 | [AI-001 Global Copilot Runtime Certification](./93-ai-001-global-copilot-runtime-certification/README.md) | Floating AI OS launcher runtime (**Awaiting User Verification**) |
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
| [Product Requirements Registry](./31-product-requirements/index.md) | Must-have features, roadmaps, competitive advantages |
| [Definition of Done](./00-governance/definition-of-done.md) | Mandatory completion criteria for every phase/feature |

### 31 Product Requirements Registry

| Document | Purpose |
|----------|---------|
| [PRR Index](./31-product-requirements/index.md) | Registry overview and ID conventions |
| [Must-Have Features](./31-product-requirements/must-have-features.md) | Binding requirements (MHF-001–015) |
| [Future Enhancements](./31-product-requirements/future-enhancements.md) | Approved backlog (FEH-*) |
| [Integration Roadmap](./31-product-requirements/integration-roadmap.md) | Third-party integration requirements (INT-*) |
| [Automation Roadmap](./31-product-requirements/automation-roadmap.md) | Workflow automation requirements (AUT-*) |
| [Communication Platform](./31-product-requirements/communication-platform.md) | MHF-001 resident communication specification |
| [AI Roadmap](./31-product-requirements/ai-roadmap.md) | Embedded AI capability requirements (AI-*) |
| [Mobile Roadmap](./31-product-requirements/mobile-roadmap.md) | Mobile and PWA requirements (MOB-*) |
| [Competitive Advantages](./31-product-requirements/competitive-advantages.md) | Strategic differentiators (CA-001–011) |
| [Implementation Checklist](./31-product-requirements/implementation-checklist.md) | Pre-implementation gate for agents and engineers |

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
| **Before every phase** | [Implementation Checklist](./31-product-requirements/implementation-checklist.md) + relevant [PRR](./31-product-requirements/index.md) IDs |
| **Before marking complete** | [Definition of Done](../00-governance/definition-of-done.md) — all applicable criteria pass |
| New feature | Must map to a workflow in **05**, a goal in **02**, and a PRR requirement ID in **31** |
| Schema change | Migration + RLS tests + Decision Log if structural |
| New dependency | ADR if it affects architecture or bundle size materially |
| AI capability | Must align with **13** — no standalone chatbot features |
| UI component | Must follow **06** Canopy, **07**, **21** Experience, and **12** — tokens + experience approved before primitives |

---

## Version

| Field | Value |
|-------|-------|
| Blueprint version | 0.7.0 |
| Last updated | 2026-07-14 |
| Phase | 5 Tenant & Lease Foundation (Planning / Proposed) |

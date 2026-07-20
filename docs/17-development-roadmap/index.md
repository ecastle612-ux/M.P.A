# 17 — Development Roadmap

## Roadmap Philosophy

Delivery is sequenced by **business workflow priority** and **pain point severity** (04) — not by module completeness. Each phase delivers a **usable workflow segment**, not a half-built feature.

Every phase produces something a property manager can use to eliminate a real headache.

---

## Phase 0: Blueprint Approval

**Status:** Architecture approved

| Deliverable | Status |
|-------------|--------|
| MPA Blueprint documentation | ✅ Complete |
| Architecture review | ✅ Complete |
| Stakeholder architecture approval | ✅ Complete |

---

## Phase 1.5: Design Language & Visual Identity

**Status:** ✅ Approved (v1.0)  
**Gate:** Closed.

| Deliverable | Status |
|-------------|--------|
| Design Language (Canopy) | ✅ Approved |
| Design Token System | ✅ Approved |
| Stakeholder design approval | ✅ Complete |

**Docs:** [06 Design Language](../06-design-language/index.md)

---

## Phase 1.6: Experience Architecture

**Status:** ✅ Approved (v1.0)  
**Gate:** Closed.

| Deliverable | Status |
|-------------|--------|
| Experience Architecture | ✅ Approved |
| Emotional Design Guide | ✅ Approved |
| Role Journey Documentation | ✅ Approved |
| First Five Minute Experience | ✅ Approved |
| Experience Principles | ✅ Approved |
| Micro Interaction Philosophy | ✅ Approved |
| Zero Learning Goal | ✅ Approved |
| Recommendations before implementation | ✅ Approved |
| Stakeholder experience approval | ✅ Complete |

**Docs:** [21 Experience Architecture](../21-experience-architecture/index.md)

---

## Phase 1: Foundation

**Goal:** Platform skeleton that supports all future workflows.  
**Status:** ✅ Completed.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Repository scaffold (Turborepo monorepo) | All |
| Supabase project (staging) | All |
| Auth: signup, login, session | All |
| PM org creation + team invites | All |
| Four-plane authorization model + RLS | All |
| Domain event infrastructure | All |
| Design token system + primitives | All |
| Operations Console layout (empty) | All |
| Portal route groups (shells) | All |
| CI pipeline (lint, typecheck, RLS tests) | All |
| Environment configuration | All |

**Exit criteria:** PM can sign up, create org, invite team member, see empty operations console.

**Duration estimate:** 3–4 weeks

---

## Phase 2.1: Foundation Hardening

**Goal:** Production-quality hardening before business features.  
**Status:** ✅ Completed.

| Deliverable | Status |
|-------------|--------|
| Strict import boundaries + circular detection | ✅ Implemented |
| Strict TypeScript baseline + package API boundaries | ✅ Implemented |
| Security hardening (headers/CSP/cookie strategy review) | ✅ Implemented (CSP enforcement pending) |
| Accessibility hardening for primitives/shell | ✅ Implemented |
| CI quality gate hardening | ✅ Implemented |
| Observability architecture placeholders | ✅ Implemented |
| Foundation Readiness Assessment | ✅ Published |

**Docs:** [22 Phase 2 Foundation Hardening](../22-phase-2-scaffold-review/index.md)

---

## Phase 3: Identity & Multi-Tenant Foundation

**Goal:** Production-grade identity, organization, role, and authorization
foundation before business module implementation.  
**Status:** ✅ Completed (ADR-014 accepted and implemented).

| Deliverable | Status |
|-------------|--------|
| Authentication baseline (email/password, reset, persistence, logout, guards) | ✅ Implemented |
| Organization foundation (create/switch/invite/membership/active context) | ✅ Implemented |
| Multi-role support (PM/Owner/Tenant/Vendor across orgs) | ✅ Implemented |
| Extensible authorization + RLS-ready policy model | ✅ Implemented |
| Four portal shell foundation (no business pages) | ✅ Implemented |
| User profile foundation + org membership display | ✅ Implemented |
| Route guards + unauthorized + not-found handling | ✅ Implemented |
| Security verification and deterministic CI gate | ✅ Implemented |

**Out of scope:** Properties, leases, maintenance, payments, documents, messaging,
AI features, accounting, and workflow modules.

**Docs:** [23 Phase 3 Identity Foundation](../23-phase-3-identity-foundation/index.md)

---

## Phase 4: Core Property Foundation

**Goal:** First production property management operating surface on top of the
completed identity foundation.  
**Status:** ✅ Completed (ADR-015 accepted and implemented).

| Deliverable | Workflow Served |
|-------------|-----------------|
| Production operations dashboard (organization-scoped) | ✅ Operations |
| Property foundation (create/read/update/archive/soft-delete) | ✅ Property Operations |
| Unit foundation (create/read/update/archive/soft-delete) | ✅ Property Operations |
| Property-manager information architecture | ✅ Operations |
| UX quality baseline for business module surfaces | ✅ All |
| Property/unit API and security architecture | ✅ Platform Safety |

**Exit criteria:** Property Manager can sign in, access a professional dashboard,
manage properties and units, and navigate polished business surfaces with no
identity/tenant regressions.

**Duration estimate:** 2–3 weeks

**Docs:** [24 Phase 4 Core Property Foundation](../24-phase-4-core-property-foundation/index.md)

---

## Phase 5: Tenant & Lease Foundation

**Goal:** Establish tenant and lease as canonical operational contracts after
property and unit foundations.  
**Status:** ✅ Approved (ADR-016 accepted).  
**Gate:** Closed — implementation authorized.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Tenant domain model + lifecycle | Tenant Operations |
| Tenant CRUD surface (list/detail/create/edit/archive) | Tenant Operations |
| Lease domain model + lifecycle | Leasing |
| Lease CRUD surface (draft/upcoming/active/expired/terminated) | Leasing |
| Tenant/lease API + RLS architecture | Platform Safety |
| Dashboard occupancy and expiration extensions | Operations |

**Dependency rationale:** Properties and units must exist first so leases can be
anchored to a real inventory model and tenants can be tied to actual occupancy.

**Docs:** [25 Phase 5 Tenant & Lease Foundation](../25-phase-5-tenant-lease-foundation/index.md)

---

## Phase 6: Maintenance Operations Foundation

**Goal:** Introduce maintenance workflow after lease context exists.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Work order creation (PM + resident context) | Maintenance |
| Work order triage and assignment queue | Maintenance |
| Work order status lifecycle | Maintenance |
| Maintenance request intake in resident context | Maintenance |
| Domain events for maintenance lifecycle | Maintenance |

**Dependency rationale:** Maintenance priorities and accountability depend on
knowing active tenancy, lease dates, and unit occupancy context from Phase 5.

---

## Phase 7: Vendor Management Foundation

**Goal:** Add vendor operations once maintenance demand and workflows exist.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Vendor profiles and onboarding | Vendor Management |
| Vendor assignment and dispatch baseline | Maintenance, Vendor Management |
| Vendor portal job inbox | Vendor Management |
| Vendor quality and compliance tracking | Vendor Management |

**Dependency rationale:** Vendor workflows should be driven by real maintenance
jobs rather than speculative marketplace activity.

---

## Phase 8: Accounting & Rent Operations Foundation

**Goal:** Introduce financial operations after lease and vendor obligations are
defined.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Rent schedules per lease | Accounting, Rent Operations |
| Charge and payment lifecycle baseline | Accounting, Rent Operations |
| Ledger foundation (append-only) | Accounting |
| Payables baseline for vendor work | Accounting |
| Delinquency visibility and reminders | Accounting, Rent Operations |

**Dependency rationale:** Accurate accounting requires validated lease terms,
tenant occupancy, and vendor job obligations from earlier phases.

**Payment rails design:** Resident self-serve payments, AutoPay, Stripe/Plaid
abstraction, and Ops/Command Center money surfaces are designed in
[API-005](../51-api-005-resident-payments-billing/README.md) (Approve before implement).
Phase 8/10 deliverables remain the operational foundation; API-005 completes the rails.

---

## Phase 9: Owner Portal & Reporting Foundation

**Goal:** Deliver owner transparency powered by operational and financial truth.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Owner reporting model (operational + financial) | Owner Portal |
| Publish/review workflow for owner updates | Owner Portal |
| Owner portal dashboards and approvals | Owner Portal |
| Reporting data mart/materialized views | Owner Portal |

**Dependency rationale:** Owner visibility depends on stable accounting,
maintenance, leasing, and occupancy data pipelines.

---

## Phase 10: Resident Portal Foundation

**Goal:** Deliver resident self-service once lease, maintenance, and account
contracts are stable.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Resident lease visibility surfaces | Resident Portal |
| Resident maintenance request and tracking | Resident Portal |
| Resident account/balance visibility | Resident Portal |
| Resident profile and communication preferences | Resident Portal |

**Dependency rationale:** Resident portal quality depends on upstream domain
stability to avoid fragmented or contradictory resident experiences.

---

## Phase 11: AI Operations Foundation

**Goal:** Embed AI assistance after core operations generate consistent data.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Cross-workflow operational copilots | AI Operations |
| Predictive risk and prioritization models | AI Operations |
| Recommendation and automation rules | AI Operations |
| Natural language operations search | AI Operations |

**Dependency rationale:** AI quality depends on mature structured workflows and
historical data from prior phases; implementing AI earlier increases noise and
hallucinated guidance risk.

---

## Phase 12: Production Hardening & Launch Readiness

**Goal:** Commercial launch readiness and operational reliability.

| Deliverable | Detail |
|-------------|--------|
| PWA manifest + service worker hardening | Desktop install + resilience |
| Performance optimization pass | Meet 15 Performance Standards |
| Security audit | RLS + auth + abuse resistance |
| Observability and on-call readiness | Production alerts and triage |
| Feature flags and staged rollout controls | Safe deployment |
| Staging → production deployment gate | First paying customers |

**Dependency rationale:** Launch hardening is most effective after full workflow
surface is present and measurable.

---

## Timeline Summary

```
Phase 0: Blueprint Approved                  ████
Phase 1.5: Design Language Approved          ███
Phase 1.6: Experience Architecture Approved  ███
Phase 1: Foundation Completed                ████████
Phase 2.1: Hardening Completed               ████
Phase 3: Identity Completed                  ██████
Phase 4: Core Property Foundation Completed   ██████
Phase 5: Tenants + Leases                    ████████
Phase 6: Maintenance Ops                     ██████████
Phase 7: Vendor Management                   ████████
Phase 8: Accounting + Rent Ops               ██████████
Phase 9: Owner Portal                        ████████
Phase 10: Resident Portal                    ████████
Phase 11: AI Operations                      ████████████
Phase 12: Production Hardening               ████████
                                              ──────────────────
                                              ~35-45 weeks to commercial launch
```

---

## PX Initiatives (Presentation Layer)

Cross-cutting UX sprints that do not add business modules. Each follows the Implementation Gate.

| Initiative | Status | Focus |
|------------|--------|-------|
| [PX-001](../30-product-experience/01-product-vision.md) | Approved | Design system + dashboard experience foundation |
| [PX-003](../33-px-003-enterprise-ui-overhaul/README.md) | Implemented | Enterprise UI overhaul |
| [PX-005](../37-px-005-official-brand-asset-replacement/README.md) | Implemented | Official SVG brand asset |
| **[PX-006](../38-px-006-workflow-experience-enterprise-ux/README.md)** | **Complete** | **Product experience & workflow — setup wizard, continuity, density, context, human audit** |
| **[PX-007](../39-px-007-competitive-product-audit-beta-readiness/README.md)** | **Draft** | **Competitive product audit & beta readiness — no feature scope** |

**Recommended sequencing:** PX-007 audit → approve beta scope → Phase 12 production hardening for commercial launch.

---

## Decision Points

| Decision | Needed By | Options |
|----------|-----------|---------|
| Lease signing provider | Phase 5+ | Dropbox Sign recommended first — design: [API-004](../50-api-004-electronic-signatures/README.md) (DocuSign / Adobe / SignNow / PandaDoc later) |
| Tenant screening provider | Phase 5+ | [API-003](../48-api-003-background-screening/README.md) — Checkr recommended first; SmartMove / RentPrep / Equifax adapters |
| Resident payments provider | Phase 8+ | Stripe recommended first — design: [API-005](../51-api-005-resident-payments-billing/README.md) (Plaid ACH / Finix / Dwolla / Authorize.net later) |
| Vendor payout model | Phase 7/8 | Internal ledger vs external payout rail |
| Accounting integration strategy | Phase 8+ | Native ledger-first vs QuickBooks/Xero bridge — see ADR-010 + [API-005](../51-api-005-resident-payments-billing/README.md) |
| Monorepo extraction | Phase 12+ | When mobile development begins |

---

## Related Documents

- **04** Property Manager Pain Points — priority matrix
- **05** Business Workflows — workflow definitions
- **08** Architecture Improvements — pre-development blockers
- **19** Future Native Mobile Strategy

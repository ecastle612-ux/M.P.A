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

## Phase 2: Property Lifecycle Core

**Goal:** Property setup workflow complete.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Property + unit CRUD | Property Setup |
| Owner account + property access | Property Setup, Owner Reporting |
| Document upload (Storage) | Property Setup |
| Property timeline view | Property Setup |
| Owner portal shell (view property) | Owner Reporting |
| Basic property search | All |

**Exit criteria:** PM can add property, define units, link owner, upload documents. Owner can view their property.

**Duration estimate:** 2–3 weeks

---

## Phase 3: Maintenance + Vendor Marketplace (P0 Pain)

**Goal:** Core maintenance workflow with marketplace foundation.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Work order creation (PM + tenant) | Maintenance |
| Work order triage queue | Maintenance |
| Vendor marketplace profiles | Vendor Marketplace |
| Vendor onboarding + compliance docs | Vendor Marketplace |
| Vendor assignment (manual) | Maintenance, Vendor Assignment |
| Work order status lifecycle | Maintenance |
| Vendor portal (job inbox) | Vendor Marketplace |
| Tenant maintenance request portal | Maintenance |
| Domain events: work order lifecycle | Maintenance |
| AI: maintenance prioritization (basic) | Maintenance |

**Exit criteria:** Tenant submits request → PM triages → assigns vendor → vendor completes → work order closed.

**Duration estimate:** 4–5 weeks

---

## Phase 4: Vendor Marketplace Operations

**Goal:** Marketplace becomes a connected economic system.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Vendor matching (AI-ranked) | Vendor Assignment |
| Bid workflow | Vendor Marketplace |
| Vendor ratings + reputation | Vendor Marketplace |
| Stripe Connect vendor onboarding | Vendor Marketplace |
| Vendor invoicing | Vendor Assignment |
| Vendor payment (Connect payout) | Vendor Marketplace |
| PM-vendor communication (contextual) | Maintenance, Vendor Marketplace |
| AI: vendor matching | Vendor Assignment |

**Exit criteria:** PM posts job → vendors bid → PM selects → vendor completes → invoices → gets paid through platform.

**Duration estimate:** 4–5 weeks

---

## Phase 5: Leasing Pipeline

**Goal:** Vacancy-to-lease workflow.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Listing creation | Marketing |
| Application intake | Application |
| Application pipeline view | Application → Screening |
| Screening integration (build vs partner TBD) | Tenant Screening |
| Lease template + generation | Lease Signing |
| eSignature integration | Lease Signing |
| Move-in checklist workflow | Move In |
| AI: lease clause review | Lease Signing |
| AI: screening risk summary | Tenant Screening |

**Exit criteria:** PM lists unit → applicant applies → screening → lease signed → move-in completed.

**Duration estimate:** 5–6 weeks

---

## Phase 6: Rent Collection

**Goal:** Recurring financial operations.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Rent schedule per lease | Rent Collection |
| Stripe payment collection | Rent Collection |
| Tenant payment portal | Rent Collection |
| Late detection + reminders | Rent Collection |
| Delinquency workflow | Rent Collection |
| Financial ledger (append-only) | Rent Collection, Owner Reporting |
| AI: communication drafting (rent reminders) | Rent Collection |
| AI: delinquency risk detection | Rent Collection |

**Exit criteria:** Rent auto-charged → tenant pays → late tenants get reminders → PM sees collection status.

**Duration estimate:** 4–5 weeks

---

## Phase 7: Owner Reporting

**Goal:** Owner communication and transparency.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Report period scheduling | Owner Reporting |
| Data aggregation (financial + maintenance) | Owner Reporting |
| AI-generated owner summary drafts | Owner Reporting |
| PM review + publish workflow | Owner Reporting |
| Owner portal (reports + approvals) | Owner Reporting |
| Expense approval flow | Owner Reporting |
| Materialized views for report data | Owner Reporting |

**Exit criteria:** PM generates monthly report → reviews AI draft → publishes → owner views in portal.

**Duration estimate:** 3–4 weeks

---

## Phase 8: Move Out & Turnover

**Goal:** Complete the lifecycle loop.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Move-out notice workflow | Move Out |
| Move-out inspection + comparison | Move Out |
| Security deposit accounting | Move Out |
| Unit turn workflow (links to maintenance) | Move Out → Marketing |
| Re-list trigger | Marketing |

**Exit criteria:** Tenant moves out → inspection → deposit settled → unit turned → re-listed.

**Duration estimate:** 2–3 weeks

---

## Phase 9: AI Platform Maturity

**Goal:** Embedded AI across all workflows.

| Deliverable | Workflow Served |
|-------------|-----------------|
| Natural language search (⌘K) | All |
| Knowledge base + embeddings | All |
| Automation rules engine | All |
| Predictive maintenance | Maintenance |
| Advanced recommendations | All |
| AI feedback analytics | All |

**Duration estimate:** 4–6 weeks (ongoing)

---

## Phase 10: PWA + Production Hardening

**Goal:** Commercial launch readiness.

| Deliverable | Detail |
|-------------|--------|
| PWA manifest + service worker | Desktop install |
| Performance optimization pass | Meet 15 Performance Standards |
| Security audit | RLS pen-test |
| Observability (Sentry, monitoring) | Production alerts |
| Feature flags | Safe rollout |
| Staging → production deployment | First paying customers |

**Duration estimate:** 3–4 weeks

---

## Timeline Summary

```
Phase 0: Blueprint          ████ (current)
Phase 1: Foundation         ████████
Phase 2: Property Core      ██████
Phase 3: Maintenance        ██████████
Phase 4: Marketplace Ops    ██████████
Phase 5: Leasing            ████████████
Phase 6: Rent Collection    ██████████
Phase 7: Owner Reporting    ████████
Phase 8: Move Out           ██████
Phase 9: AI Maturity        ████████████
Phase 10: Production        ████████
                            ──────────────────
                            ~35-45 weeks to commercial launch
```

---

## Decision Points

| Decision | Needed By | Options |
|----------|-----------|---------|
| Screening provider | Phase 5 | Build vs TransUnion vs RentPrep |
| eSignature provider | Phase 5 | DocuSign vs PandaDoc vs HelloSign |
| Listing syndication | Phase 5 | Zillow API vs manual |
| Accounting integration | Phase 6+ | QuickBooks vs Xero |
| Monorepo extraction | Phase 10+ | When mobile development begins |

---

## Related Documents

- **04** Property Manager Pain Points — priority matrix
- **05** Business Workflows — workflow definitions
- **08** Architecture Improvements — pre-development blockers
- **19** Future Native Mobile Strategy

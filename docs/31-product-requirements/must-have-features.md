# Must-Have Features (MHF)

## Status

**Permanent — binding product requirements**

Must-Have Features (MHF) are non-negotiable product commitments. Every future phase must either satisfy, explicitly defer (with approval), or supersede (via ADR + registry update) these requirements.

Priority levels: **CRITICAL** · **HIGH** · **MEDIUM**

---

## MHF-001 — Resident Communication Platform

**Priority:** CRITICAL  
**Competitive anchor:** [CA-004 Digital Announcement Platform](./competitive-advantages.md#ca-004-digital-announcement-platform) · [CA-003 Resident QR Enrollment](./competitive-advantages.md#ca-003-resident-qr-enrollment)

### Requirement

Property managers must **never** have to physically post paper announcements for routine communication. M.P.A. must eventually provide a resident communication platform that replaces hallway bulletins, printed notices, and ad-hoc mass texting for operational announcements.

### Platform capabilities (required)

| Capability | Requirement |
|------------|-------------|
| Property announcements | Org-scoped broadcasts to all residents of a property |
| Building announcements | Scoped to building/floor/unit group where applicable |
| Emergency notifications | High-priority, immediate delivery with audit trail |
| Push notifications | Mobile/PWA push for time-sensitive resident updates |
| QR-code resident enrollment | Physical-world onboarding without manual data entry |
| Resident communication preferences | Channel, language, and category opt-in/out |
| Read receipts | Delivery and acknowledgment visibility for PM accountability |
| Scheduled announcements | Future-dated publishing for planned communications |
| Multi-language support | Message localization for diverse resident populations |
| Community bulletin board | Persistent resident-visible information surface |
| SMS/email fallback | Deliver when push/app unavailable |
| Analytics | Reach, read rates, and engagement per announcement |

### QR enrollment workflow (required)

QR codes must allow tenants/residents to:

1. Join a property (or unit context) under correct organization isolation
2. Install or open the app (PWA/native deep link)
3. Receive push notifications after enrollment
4. Access community information and bulletin content

### Product philosophy alignment

- **Headache eliminated:** Communication debt, fragmentation (04)
- **Five-goal filter:** Improve Communication, Save Time, Automate Repetitive Work (02)
- **Workflow:** Supports Move In, Rent Collection, Maintenance, Move Out parallel communication (05)

### Implementation notes (non-binding sequencing)

- Detailed specification: [Communication Platform](./communication-platform.md)
- Resident portal foundation: Roadmap Phase 10
- Push/SMS providers: [Integration Roadmap](./integration-roadmap.md)
- Mobile/PWA: [Mobile Roadmap](./mobile-roadmap.md)

**Signature feature:** This is a defining M.P.A. differentiator — not optional long-term.

---

## MHF-002 — Property Manager First

**Priority:** CRITICAL

### Requirement

Every feature must answer:

> **"What helps property managers complete work faster?"**

### Mandatory design outcomes

| Outcome | Meaning |
|---------|---------|
| Reduce clicks | Prefer chained workflows and smart defaults over multi-page CRUD hops |
| Reduce typing | Auto-fill, reuse canonical records, inline edits |
| Reduce confusion | Clear next action, visible status, no dead-end screens |
| Automate repetitive work | Rules, templates, and AI drafts for predictable labor |

### Sources

- [02 Product Philosophy](../02-product-philosophy/index.md) — Five-Goal Filter, Headache Elimination
- [04 Property Manager Pain Points](../04-property-manager-pain-points/index.md)
- [07 UX Principles](../07-ux-principles/index.md) — Action Before Analytics
- [30 PX-001 Product Vision](../30-product-experience/01-product-vision.md)
- PMX-001 workflow refinement precedent (Property → Unit → Tenant chaining)

### Acceptance test

Before shipping any surface, a PM must be able to complete the primary task in fewer steps than a generic CRUD admin template would require — or the feature fails this requirement.

---

## MHF-003 — Workflow First

**Priority:** CRITICAL  
**ADR alignment:** ADR-008 (Workflow-First Code Organization)

### Requirement

Build **workflows**, not isolated CRUD modules.

Every module must connect naturally with the rest of the platform. Users experience one operating system; they never wonder which "app" they are in.

### Mandatory properties

| Property | Requirement |
|----------|-------------|
| Lifecycle visibility | User knows where they are in the master lifecycle (05) |
| Cross-entity context | Property, unit, tenant, lease, maintenance visible without navigation churn |
| Chained creation flows | Setup flows hand off to next operational step (property → unit → tenant → lease) |
| Dashboard as operations console | Action queues and metrics reflect live workflow state — not onboarding-only scaffolding |
| No module silos | Data and UI patterns shared across domains |

### Anti-patterns (forbidden)

- Standalone list/detail CRUD with no upstream/downstream links
- Duplicate patterns per module when shared contracts exist
- Features that cannot name their workflow step in [05 Business Workflows](../05-business-workflows/index.md)

---

## MHF-004 — AI Philosophy

**Priority:** CRITICAL  
**ADR alignment:** ADR-006 (Embedded AI, Not Chatbot-First)

### Requirement

| Principle | Rule |
|-----------|------|
| AI assists | Embedded in workflow screens — never the whole product |
| Never overwhelms | Suggestions are dismissible; automation is auditable |
| Never replaces human decisions | High-stakes actions require human approval |
| Always saves time | Draft, prioritize, detect, recommend — reduce steps |

### Risk-tier behavior (required)

| Risk | AI behavior |
|------|-------------|
| Low | May auto-execute (e.g., categorization, reminders) |
| Medium | Suggest; human confirms |
| High | Draft only; human decides (eviction, lease terms, vendor hire) |

### Sources

- [02 Product Philosophy](../02-product-philosophy/index.md)
- [13 AI Strategy](../13-ai-strategy/index.md)
- ADR-006

Detailed capability map: [AI Roadmap](./ai-roadmap.md)

---

## MHF-005 — Enterprise Scalability

**Priority:** CRITICAL

### Requirement

Every architectural and product decision must support:

| Dimension | Requirement |
|-----------|-------------|
| Multi-tenant | Strict organization isolation; RLS-enforced data boundaries |
| Unlimited portfolios | No hard-coded limits that break at scale; pagination and aggregate queries |
| Role permissions | Four-plane authorization; capability-based grants (ADR-003) |
| API-first | Same contracts power web, mobile, integrations, and future plugins |
| Plugin-ready | Extension points and event-driven coupling (ADR-005, Phase 4 extensions) |
| Five-year growth | Schema and domain models avoid rewrites for Phases 6–12 |

### Sources

- [08 Software Architecture](../08-software-architecture/index.md)
- [09 Database Architecture](../09-database-architecture/index.md)
- [14 Security Standards](../14-security-standards/index.md)
- [15 Performance Standards](../15-performance-standards/index.md)
- Phase 3–5 RLS and capability patterns

---

## Additional Must-Have Features (Derived from Blueprint)

These requirements are binding and trace to established documentation. They complement MHF-001–005.

### MHF-006 — Implementation Gate Compliance

**Priority:** CRITICAL

Nothing ships without **Design → Document → Approve → Implement** (ADR-012, Implementation Gate).

### MHF-007 — Four-Plane Authorization

**Priority:** CRITICAL

Property Manager, Owner, Tenant, and Vendor experiences remain distinct authorization planes with RLS enforcement (ADR-003).

### MHF-008 — Domain Event Connectivity

**Priority:** HIGH

Workflow modules connect via domain events for automation and integration handoffs (ADR-005).

### MHF-009 — Vendor Marketplace as Core Infrastructure

**Priority:** HIGH

Vendors are first-class economic participants — not contact cards (ADR-004, 02).

### MHF-010 — Premium Enterprise UX (Canopy + Experience Architecture)

**Priority:** HIGH

All UI follows approved Canopy design language and Experience Architecture — no generic admin-template aesthetics (ADR-011, ADR-013, PX-001).

### MHF-011 — Operational Dashboard

**Priority:** HIGH

Dashboard surfaces live occupancy, vacancies, actionable tasks, and recent activity — not placeholder metrics (Phase 4, PX-001, CA-006).

### MHF-012 — Unified Property Operating Graph

**Priority:** HIGH

Property, unit, tenant, lease, maintenance, vendor, and financial records form one connected graph per organization (01 Vision, 05).

### MHF-013 — Auditability and Soft Lifecycle

**Priority:** HIGH

Business entities support archive, restore, soft delete, and audit fields — no silent data loss (Phase 4–5 patterns).

### MHF-014 — Accessibility by Default

**Priority:** HIGH

Keyboard navigation, focus visibility, semantic structure, and WCAG-aligned patterns on all primary surfaces (PX-001, 07, 30).

### MHF-015 — Build vs Integrate Discipline

**Priority:** MEDIUM

Own the workflow graph; integrate at boundaries for payments, screening, e-sign, syndication (02, 20).

---

## Traceability Matrix (MHF → Primary Source)

| ID | Primary sources |
|----|-----------------|
| MHF-001 | Product decision (CRITICAL); 04 Communication pain; Phase 10 |
| MHF-002 | Product decision; 02, 04, 07, 30 |
| MHF-003 | Product decision; ADR-008; 05, 01 |
| MHF-004 | Product decision; ADR-006; 13 |
| MHF-005 | Product decision; 08, 09, 14, 15 |
| MHF-006 | ADR-012; Implementation Gate |
| MHF-007 | ADR-003; Phase 3 |
| MHF-008 | ADR-005 |
| MHF-009 | ADR-004 |
| MHF-010 | ADR-011, ADR-013; 06, 21, 30 |
| MHF-011 | Phase 4; PX-001 |
| MHF-012 | 01, 05 |
| MHF-013 | Phase 4–5 database design |
| MHF-014 | 30, 07 |
| MHF-015 | 02, 20 |

---

## Related Documents

- [Future Enhancements](./future-enhancements.md)
- [Communication Platform](./communication-platform.md)
- [Implementation Checklist](./implementation-checklist.md)

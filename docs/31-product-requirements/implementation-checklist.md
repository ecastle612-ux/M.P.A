# Implementation Checklist

## Status

**Permanent — mandatory pre-implementation gate**

Every agent, engineer, and phase lead **must review this checklist** before implementing any new phase, feature, or material change. If a proposed implementation violates any item, **stop and recommend an alternative before writing code**.

This checklist complements — and does not replace — the [Implementation Gate](../00-governance/implementation-gate.md) (Design → Document → Approve → Implement).

---

## When to Use

| Trigger | Action |
|---------|--------|
| Starting a new roadmap phase | Full checklist |
| Adding a feature within an approved phase | Full checklist |
| Bug fix with no product/architecture change | Skip product items; verify ADR/UX if UI touched |
| Documentation-only work | Not required for code; update PRR if requirements change |

---

## Pre-Implementation Checklist

Copy this table into phase kickoff notes or PR description. Mark each item **Pass**, **Fail**, or **N/A** with brief evidence.

### 1. Product Vision Alignment

- [ ] Work advances [01 Vision](../01-vision/index.md) — unified property operating system for professional managers
- [ ] Work maps to at least one [05 Business Workflow](../05-business-workflows/index.md) step
- [ ] Work eliminates or reduces a documented [04 Pain Point](../04-property-manager-pain-points/index.md)
- [ ] Out-of-scope items explicitly listed with deferred PRR IDs

**Fail action:** Narrow scope or redesign to connect to vision/workflow.

---

### 2. Product Requirement Alignment

- [ ] All relevant [MHF IDs](./must-have-features.md) identified and satisfied
- [ ] No conflict with **CRITICAL** requirements (MHF-001–005)
- [ ] Future work correctly tagged with FEH/INT/AUT/AI/MOB IDs — not silently dropped
- [ ] [Communication Platform](./communication-platform.md) requirements respected if touching resident comms

**Fail action:** Update phase docs and registry before implementation; do not code around requirements.

---

### 3. ADR Compliance

- [ ] Reviewed [Decision Log](../18-decision-log/index.md) for binding ADRs
- [ ] No violation of: ADR-003 (four-plane auth), ADR-005 (domain events), ADR-006 (embedded AI), ADR-007 (edge mutations), ADR-008 (workflow-first org), ADR-012 (implementation gate)
- [ ] Phase-specific ADRs cited (e.g., ADR-014–016 for Phases 3–5)
- [ ] New architectural decisions documented as Proposed ADR before Accept

**Fail action:** Write or amend ADR; obtain acceptance.

---

### 4. Roadmap Compliance

- [ ] Work belongs in current phase per [17 Development Roadmap](../17-development-roadmap/index.md)
- [ ] Prerequisites from prior phases are implemented
- [ ] No skipping phases without explicit approved deferral
- [ ] Phase status in [00 Project State](../00-project-state.md) shows **Approved** for implementation

**Fail action:** Defer to correct phase or obtain roadmap amendment approval.

---

### 5. Workflow Consistency

- [ ] Feature connects to master lifecycle — not isolated CRUD (MHF-003)
- [ ] Cross-entity links present (property ↔ unit ↔ tenant ↔ lease ↔ maintenance)
- [ ] Chained flows hand off to next operational step where applicable
- [ ] Domain events emitted for downstream automation (ADR-005)

**Fail action:** Redesign UX and data flow for workflow continuity.

---

### 6. Enterprise Scalability

- [ ] Multi-tenant org isolation with RLS on all new tables (MHF-005)
- [ ] Pagination on list endpoints and UI — no unbounded loads
- [ ] Role/capability checks on all mutations (ADR-003)
- [ ] API contracts defined for web and future mobile consumers
- [ ] Extension points considered for plugins and integrations

**Fail action:** Revise schema, auth, and API design before migration.

---

### 7. UX Consistency

- [ ] Canopy design language followed ([06 Design Language](../06-design-language/index.md))
- [ ] Experience Architecture patterns applied ([21 Experience Architecture](../21-experience-architecture/index.md))
- [ ] [07 UX Principles](../07-ux-principles/index.md) — action before analytics, context attached, progressive disclosure
- [ ] [PX-001 Product Experience](../30-product-experience/01-product-vision.md) — premium enterprise feel, accessibility, loading/error states
- [ ] No generic admin-template patterns

**Fail action:** Align with design system before UI implementation.

---

### 8. Property-Manager-First Philosophy

- [ ] Primary task completable with fewer clicks than generic CRUD (MHF-002)
- [ ] Typing minimized via defaults, reuse, and inline edit
- [ ] Clear next action visible on every primary surface
- [ ] Repetitive work automated or templated where possible

**Fail action:** Simplify interaction design; add automation hooks.

---

### 9. AI Philosophy

- [ ] AI features embedded in workflow — not chatbot-first (ADR-006, MHF-004)
- [ ] Risk tier assigned: low / medium / high
- [ ] High-risk actions require human approval — no autonomous legal/financial decisions
- [ ] AI suggestions dismissible and auditable

**Fail action:** Redesign AI surface to assist-only pattern.

---

### 10. Existing Module Integration

- [ ] Reuses shared packages (`@mpa/ui`, `@mpa/shared`, Supabase patterns)
- [ ] Integrates with existing properties, units, tenants, dashboard — not parallel silos
- [ ] Follows established server patterns (Edge Functions, RLS, types)
- [ ] No duplicate abstractions when shared contracts exist

**Fail action:** Refactor to extend existing modules.

---

### 11. Definition of Done Readiness

Before marking any phase or feature **complete**, verify all applicable criteria in the [Definition of Done](../00-governance/definition-of-done.md):

- [ ] Database, APIs, RLS, validation complete
- [ ] Responsive, accessible UI complete
- [ ] Operations Center and Command Center integrated (where applicable)
- [ ] Documentation and PRR IDs updated
- [ ] Supabase MCP + Playwright MCP verified
- [ ] Full `pnpm` verification suite passes

**Fail action:** Do not mark phase complete; resolve failing DoD items first.

---

## Violation Protocol

When any checklist item **Fails**:

1. **Stop** — do not write application code, migrations, or API changes
2. **Document** the conflict (requirement ID, ADR, or principle violated)
3. **Recommend** at least one alternative that passes the checklist
4. **Escalate** for approval if the alternative requires scope or roadmap change
5. **Update** PRR, phase docs, or ADR before resuming implementation

---

## Quick Reference — Critical Requirements

| ID | One-line rule |
|----|---------------|
| MHF-001 | No paper announcements — digital resident comms platform required |
| MHF-002 | Every feature helps PMs work faster |
| MHF-003 | Workflows, not isolated CRUD |
| MHF-004 | AI assists; humans decide |
| MHF-005 | Multi-tenant, scalable, API-first, plugin-ready |
| MHF-006 | Design → Document → Approve → Implement |

---

## Sign-Off Template

```markdown
## Implementation Checklist — Phase {N} / {Feature}

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Product vision | Pass/Fail/N/A | |
| 2 | Product requirements | Pass/Fail/N/A | MHF-xxx |
| 3 | ADR compliance | Pass/Fail/N/A | |
| 4 | Roadmap compliance | Pass/Fail/N/A | |
| 5 | Workflow consistency | Pass/Fail/N/A | |
| 6 | Enterprise scalability | Pass/Fail/N/A | |
| 7 | UX consistency | Pass/Fail/N/A | |
| 8 | PM-first philosophy | Pass/Fail/N/A | |
| 9 | AI philosophy | Pass/Fail/N/A | |
| 10 | Module integration | Pass/Fail/N/A | |
| 11 | Definition of Done | Pass/Fail/N/A | DoD evidence |

**Gate status:** Approved for implementation / Blocked — see violations
**PRR IDs satisfied:** {list}
**PRR IDs deferred:** {list}
```

---

## Related Documents

- [Product Requirements Registry Index](./index.md)
- [Must-Have Features](./must-have-features.md)
- [Implementation Gate](../00-governance/implementation-gate.md)

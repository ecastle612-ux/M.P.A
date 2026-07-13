# Product Principles

## Authority

This document is the **permanent product philosophy** for M.P.A. It does not change with roadmap phases, technology choices, or market trends. Every feature — before design, before engineering, before AI — is evaluated against these principles.

If a proposed feature fails this evaluation, **it does not ship**.

Related: [02 Product Philosophy](../02-product-philosophy/index.md) (expanded narrative), [04 Pain Points](../04-property-manager-pain-points/index.md), [05 Business Workflows](../05-business-workflows/index.md).

---

## Core Belief

M.P.A. is not another property management application. It is an **AI Property Operations Platform**. The software exists to **eliminate headaches** for property managers, owners, tenants, and vendors.

---

## The Six-Goal Filter

Every feature must satisfy **at least one** of these goals:

| # | Goal | Definition | Pass Example |
|---|------|------------|--------------|
| 1 | **Save Time** | Removes manual steps, context switching, or duplicate data entry | Auto-generated owner report from live data |
| 2 | **Save Money** | Reduces cost, revenue leakage, or unnecessary spend | Vendor bid comparison; preventive maintenance alerts |
| 3 | **Reduce Risk** | Prevents legal, financial, or operational failure | Screening checklist enforcement; regulatory alerts |
| 4 | **Improve Communication** | Right message, right person, right time | Unified thread on work order; owner summary delivery |
| 5 | **Increase Occupancy** | Reduces vacancy duration or improves conversion | Application pipeline visibility; listing optimization |
| 6 | **Automate Repetitive Work** | Eliminates predictable human labor | Rent reminders; work order routing; report scheduling |

**Scoring rule:** A feature that scores zero on all six goals is rejected — regardless of how interesting, trendy, or technically impressive it sounds.

---

## Feature Evaluation Template

Before any feature enters the roadmap, complete this template:

```
Feature name:
Proposed by:
Workflow served (05):
Pain point addressed (04):

Goal scores (check all that apply):
  [ ] Save Time
  [ ] Save Money
  [ ] Reduce Risk
  [ ] Improve Communication
  [ ] Increase Occupancy
  [ ] Automate Repetitive Work

Headache type eliminated:
  [ ] Fragmentation  [ ] Uncertainty  [ ] Repetition
  [ ] Risk exposure  [ ] Communication debt

Competitive advantage supported (if any):
Pass / Fail:
Reviewer:
```

---

## Permanent Rules

### Workflow Unity, Product Navigation
- **Internally:** Engineering organizes around business workflows (ADR-008).
- **Externally:** Users navigate by product areas (Operations Center, Properties, Leasing, etc.).
- Workflows connect behind the scenes. Users never see "workflow stages" as primary navigation.

### Vendor Marketplace Is Core
Vendors are economic participants — not contact card entries. Marketplace capabilities are first-class, not add-ons.

### AI Is Embedded, Not a Gimmick
AI saves time, reduces risk, and automates work throughout the product. AI is not a standalone chatbot bolted onto legacy screens. The **AI Assistant** product area aggregates intelligence — it does not replace embedded AI across workflows.

### Premium Product Standard
M.P.A. is commercial software professionals pay for. Reliability, clarity, speed, and distinctive design are non-negotiable.

### Implementation Gate (Permanent)
**Nothing gets implemented until it has been designed, documented, and approved.**

Mandatory sequence: Design → Document → Approve → Implement.

See [Implementation Gate Policy](../00-governance/implementation-gate.md) and ADR-012. Code-first shipping is forbidden.

### Build the Workflow Graph; Integrate at Boundaries
M.P.A. owns operational workflows. Third parties own specialized capabilities (payment rails, eSignature, screening). See ADR-010 for accounting: deferred, not abandoned.

---

## What We Refuse to Build

| Anti-Pattern | Why |
|--------------|-----|
| Checkbox feature parity with legacy PM software | Bloat without headache elimination |
| Dashboards without actionable queues | Illusion of productivity |
| Orphan CRUD screens | Every screen serves a workflow |
| Module silos users can feel | Violates operating system vision |
| Features that score zero on the six-goal filter | Waste |

---

## Decision Escalation

When product and engineering disagree:

1. Return to the six-goal filter
2. Complete the feature evaluation template
3. Map to workflow impact (05)
4. Name the headache eliminated (04)
5. If still unclear — **defer**. Do not ship ambiguous value.

---

## Governance

| Action | Requirement |
|--------|-------------|
| **Any implementation** | **Designed → Documented → Approved** first ([Implementation Gate](./00-governance/implementation-gate.md), ADR-012) |
| New feature proposal | Feature evaluation template completed |
| Roadmap addition | At least one goal scored |
| AI capability | Must score on Save Time, Automate, or Reduce Risk |
| Engineering PR | Reference approving doc/ADR + workflow (05) and goal |

---

## Version

| Field | Value |
|-------|-------|
| Status | Permanent |
| Established | 2026-07-11 |
| Changes require | Stakeholder approval + Decision Log entry |

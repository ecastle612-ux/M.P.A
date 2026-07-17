# 31 — Product Requirements Registry (PRR)

## Status

**Permanent — binding governance artifact**

## Purpose

The Product Requirements Registry (PRR) is the **single permanent location** where every agreed product requirement for M.P.A. is tracked. Future phases, initiatives, and implementation work **must reference this registry before writing code**.

The PRR exists so important product ideas are never lost between roadmap conversations, phase documentation, ADRs, and implementation sessions.

## Relationship to Other Governance

| Artifact | Role | PRR relationship |
|----------|------|------------------|
| [Implementation Gate](../00-governance/implementation-gate.md) | Design → Document → Approve → Implement | PRR alignment is mandatory before Approve → Implement |
| [Development Roadmap](../17-development-roadmap/index.md) | Phase sequencing and delivery order | Roadmap phases must map to PRR requirements |
| [Decision Log (ADR)](../18-decision-log/index.md) | Architectural *how* | ADRs must not contradict PRR *what* |
| Phase docs (`docs/23–25`, etc.) | Scoped design packages | Phase scope must cite relevant PRR IDs |
| [Product Experience (PX-001)](../30-product-experience/01-product-vision.md) | Presentation standards | UX work must satisfy PRR philosophy requirements |

## Registry Structure

| Document | Contents |
|----------|----------|
| [Must-Have Features](./must-have-features.md) | Non-negotiable product requirements (MHF-*) |
| [Future Enhancements](./future-enhancements.md) | Approved future capability backlog (FEH-*) |
| [Integration Roadmap](./integration-roadmap.md) | Third-party and platform integration requirements (INT-*) |
| [Automation Roadmap](./automation-roadmap.md) | Workflow automation requirements (AUT-*) |
| [Communication Platform](./communication-platform.md) | Resident communication platform specification (MHF-001 detail) |
| [AI Roadmap](./ai-roadmap.md) | Embedded AI capability requirements (AI-*) |
| [Mobile Roadmap](./mobile-roadmap.md) | Mobile and PWA requirements (MOB-*) |
| [Competitive Advantages](./competitive-advantages.md) | Strategic differentiators M.P.A. is building |
| [Implementation Checklist](./implementation-checklist.md) | Mandatory pre-implementation review for every phase |
| [Definition of Done](../00-governance/definition-of-done.md) | Mandatory completion criteria for every phase/feature |

## Requirement ID Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| **MHF-** | Must-Have Feature — binding product requirement | MHF-001 Resident Communication Platform |
| **FEH-** | Future Enhancement — approved but not yet scheduled for current phase | FEH-012 Predictive maintenance |
| **INT-** | Integration requirement | INT-003 DocuSign lease signing |
| **AUT-** | Automation requirement | AUT-004 Rent reminder sequences |
| **AI-** | AI capability requirement | AI-007 Natural language operations search |
| **MOB-** | Mobile / PWA requirement | MOB-002 Vendor offline job capture |
| **CA-** | Competitive advantage anchor | CA-004 Digital Announcement Platform |

## How to Use This Registry

### Before starting any phase or initiative

1. Read [Implementation Checklist](./implementation-checklist.md).
2. Identify all PRR IDs relevant to the proposed scope.
3. Confirm phase documentation and ADRs reference those IDs.
4. If proposed work violates an MHF requirement, **stop** and recommend an alternative before implementation.

### When adding a new requirement

1. Propose the requirement with ID, priority, and source rationale.
2. Place it in the correct registry document (must-have vs future vs domain roadmap).
3. Link upstream sources (vision, workflow, ADR, pain point).
4. Update phase or roadmap docs if sequencing changes.
5. Record approval in Implementation Gate or ADR as appropriate.

### When implementing

- PRs and phase closeout reports should list satisfied PRR IDs.
- Out-of-scope items must explicitly note deferred PRR IDs — not silent omission.

## Source Corpus (Population Basis)

This registry was synthesized from authoritative repository documentation including:

- [01 Vision](../01-vision/index.md)
- [02 Product Philosophy](../02-product-philosophy/index.md)
- [04 Property Manager Pain Points](../04-property-manager-pain-points/index.md)
- [05 Business Workflows](../05-business-workflows/index.md)
- [06 Design Language (Canopy)](../06-design-language/index.md)
- [07 UX Principles](../07-ux-principles/index.md)
- [13 AI Strategy](../13-ai-strategy/index.md)
- [17 Development Roadmap](../17-development-roadmap/index.md)
- [18 Decision Log](../18-decision-log/index.md) (ADR-001 through ADR-016)
- [19 Future Native Mobile Strategy](../19-future-native-mobile-strategy/index.md)
- [20 Future Integrations](../20-future-integrations/index.md)
- [21 Experience Architecture](../21-experience-architecture/index.md)
- [24 Phase 4 Extension Points](../24-phase-4-core-property-foundation/extension-points-future-phases.md)
- [25 Phase 5 Tenant & Lease Foundation](../25-phase-5-tenant-lease-foundation/index.md)
- [30 Product Experience (PX-001)](../30-product-experience/01-product-vision.md)
- [38 PX-006 Product Experience & Workflow](../38-px-006-workflow-experience-enterprise-ux/README.md) — **Complete**
- [39 PX-007 Competitive Audit & Beta Readiness](../39-px-007-competitive-product-audit-beta-readiness/README.md) — **Draft** (audit phase)
- [Implementation Gate](../00-governance/implementation-gate.md)

## Current Implementation Snapshot (Reference Only)

As of registry creation, the following foundation is **implemented or in progress** per roadmap and project state:

| Area | Status |
|------|--------|
| Identity, org, authorization (Phase 3) | Implemented |
| Property, unit, dashboard (Phase 4) | Implemented |
| Tenant foundation (Phase 5A) | Implemented |
| Lease foundation (Phase 5B) | Planned — approved, not yet implemented |
| Resident communication platform (MHF-001) | Phase 9 foundation implemented — see [29-phase-9](../29-phase-9-resident-communication-foundation/README.md) |
| Maintenance, vendor, financial, AI (Phases 6–11) | Foundation implemented per codebase |
| Resident Experience — RX-001 Applicant Lifecycle | **Implemented** — [RX-001](../41-phase-12-resident-experience-digital-operations/RX-001-applicant-lifecycle.md); broader Phase 12 remains partial |
| Customer Migration Center — MX-001 | **Implemented** — [MX-001](../42-mx-001-customer-migration-center/README.md); CSV/Excel/ZIP import wizard, mapping, review queue, rollback |

This snapshot is informational. Authoritative delivery status remains in [00 Project State](../00-project-state.md) and [17 Development Roadmap](../17-development-roadmap/index.md).

## Enforcement

Agents and engineers **must**:

1. Consult this registry before implementing any new phase or material feature change.
2. Refuse implementation that violates an accepted MHF requirement without an approved superseding decision.
3. Recommend alternatives when a proposed implementation conflicts with PRR, ADR, or roadmap constraints.

Documentation updates to the PRR are always allowed. Application code for unapproved requirements is not.

## Related Documents

- [Implementation Gate](../00-governance/implementation-gate.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Must-Have Features](./must-have-features.md)

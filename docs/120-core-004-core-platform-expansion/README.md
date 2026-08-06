# CORE-004 — Core Platform Expansion

**Status:** ✅ **APPROVED** — program unlocked · per-slice Implement still gated  
**Initiative ID:** CORE-004  
**Priority:** CRITICAL (primary operational expansion program)  
**Type:** Core Platform Expansion — end-to-end operational workflows under permanent standards  
**Gate:** Design → Document → Approve → Implement → Verify → Certify (per slice)  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-035](../18-decision-log/adr-035-core-004-core-platform-expansion.md)  
**Approved:** 2026-08-05 — `APPROVE CORE-004 – Core Platform Expansion`  
**Date:** 2026-08-05  

**Prerequisites (verified):**

| Prerequisite | Status |
|--------------|--------|
| UX-016 Certified | ✅ |
| STD-001 Adopted | ✅ |
| ADR-033 Accepted | ✅ |
| NAV-001 Implemented | ✅ |
| ARCH-001 Adopted | ✅ |
| MAC-002 Production Certified (100/100) | ✅ |
| SignWell production platform (API-004 · ADR-030) | ✅ |
| Identity Foundation Complete (Phase 3 · ADR-014) | ✅ |

**UX / platform inheritance:** Automatic — every CORE-004 surface inherits STD-001, ADR-033, UX-016, NAV-001, ARCH-001, MAC-002 Hybrid C, Canopy, UDF, Assistant, Universal Sidebar / Search / Quick Actions / Waiting / Timeline / Insights.

> **Program Approved.** Do **not** implement a phase until `AUTHORIZE CORE-004 PHASE …` is issued.  
> Phase 1: [Design](./08-phase-1-property-lifecycle-design.md) · [Authorize](./09-phase-1-authorization.md) · [Certification](./10-phase-1-certification.md) · [Acceptance](./11-phase-1-acceptance.md).  
> Phase 2: [Authorize](./12-phase-2-authorization.md) · [Design](./13-phase-2-design.md) · [Certification](./14-phase-2-certification.md) · [Acceptance](./15-phase-2-acceptance.md).  
> Phase 3: [Authorize](./16-phase-3-authorization.md) · [Design](./17-phase-3-design.md) · [Certification](./18-phase-3-certification.md) · [Acceptance](./19-phase-3-acceptance.md).  
> Phase 4: [Authorize](./20-phase-4-authorization.md) · [Design](./21-phase-4-design.md) · [Certification](./22-phase-4-certification.md).

---

## Mission

Build the remaining M.P.A. platform through **complete operational workflows**.

- Do not build isolated features.  
- Every implementation slice must deliver an end-to-end operational capability.  
- The platform remains **workflow-first**.

---

## Implementation order (binding)

| Phase | Domain | Status |
|-------|--------|--------|
| **1** | Property Lifecycle | ✅ Authorized · Implemented · Certified · Accepted ([10](./10-phase-1-certification.md) · [11](./11-phase-1-acceptance.md)) |
| **2** | Maintenance Operations | ✅ Authorized · Implemented · Certified · Accepted ([14](./14-phase-2-certification.md) · [15](./15-phase-2-acceptance.md)) |
| **3** | Leasing Operations | ✅ Authorized · Implemented · Certified · Accepted ([18](./18-phase-3-certification.md) · [19](./19-phase-3-acceptance.md)) |
| **4** | Resident Operations | ✅ Authorized · Implemented · Certified ([20](./20-phase-4-authorization.md) · [21](./21-phase-4-design.md) · [22](./22-phase-4-certification.md)) · awaiting Accept |
| **5** | Vendor Operations | 🔒 Queued |
| **6** | Financial Operations | 🔒 Queued |
| **7** | Document Operations | 🔒 Queued |
| **8** | Communications | 🔒 Queued |
| **9** | Executive Operations | 🔒 Queued |

Detail: [06 — Implementation order](./06-implementation-order.md)

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Verdict, goals, non-goals |
| [01 — Scope and principles](./01-scope-and-principles.md) | Expansion principles + constraints |
| [02 — Inheritance contract](./02-ux-inheritance-contract.md) | Mandatory standards every slice inherits |
| [03 — Planning backlog seeds](./03-planning-backlog-seeds.md) | Historical seeds (superseded by phase order) |
| [04 — Approval checklist](./04-approval-checklist.md) | Prerequisites before Approve |
| [05 — Approval record](./05-approval-record.md) | `APPROVE CORE-004` record |
| [06 — Implementation order](./06-implementation-order.md) | Phases 1–9 binding sequence |
| [07 — Workflow requirement](./07-workflow-requirement.md) | End-to-end workflow checklist |
| [08 — Phase 1 Property Lifecycle design](./08-phase-1-property-lifecycle-design.md) | Phase 1 Design/Document |
| [09 — Phase 1 Authorization](./09-phase-1-authorization.md) | Authorize phrase + scope |
| [10 — Phase 1 Certification](./10-phase-1-certification.md) | Workflow certify · diagram · verify |
| [11 — Phase 1 Acceptance](./11-phase-1-acceptance.md) | Phase 1 accepted · Property Lifecycle authoritative |
| [12 — Phase 2 Authorization](./12-phase-2-authorization.md) | Authorize phrase + Phase 2 scope |
| [13 — Phase 2 Design](./13-phase-2-design.md) | Canonical maintenance state machine |
| [14 — Phase 2 Certification](./14-phase-2-certification.md) | Workflow certify · diagram · verify |
| [15 — Phase 2 Acceptance](./15-phase-2-acceptance.md) | Phase 2 accepted · Maintenance Operations authoritative |
| [16 — Phase 3 Authorization](./16-phase-3-authorization.md) | Authorize phrase + Phase 3 scope |
| [17 — Phase 3 Design](./17-phase-3-design.md) | Canonical leasing state machine |
| [18 — Phase 3 Certification](./18-phase-3-certification.md) | Workflow certify · diagram · verify |
| [19 — Phase 3 Acceptance](./19-phase-3-acceptance.md) | Phase 3 accepted · Leasing Operations authoritative |
| [20 — Phase 4 Authorization](./20-phase-4-authorization.md) | Authorize phrase + Phase 4 scope |
| [21 — Phase 4 Design](./21-phase-4-design.md) | Canonical resident state machine |
| [22 — Phase 4 Certification](./22-phase-4-certification.md) | Workflow certify · diagram · verify |

---

## Implementation gate

| Stage | Status |
|-------|--------|
| Design | ✅ Program design complete |
| Document | ✅ This package |
| Approve | ✅ **Issued** 2026-08-05 |
| Implement | 🔓 Program unlocked · **per-phase Authorize required** |
| Verify / Certify | Phase 1 ✅ · Phase 2 ✅ · Phase 3+ after Accept + Authorize |

### Unlock path (active)

1. ~~`APPROVE CORE-004`~~ ✅  
2. ~~`AUTHORIZE CORE-004 PHASE 1`~~ ✅ · Accepted  
3. ~~`AUTHORIZE CORE-004 PHASE 2 – Maintenance Operations`~~ ✅ · Certified  
4. `ACCEPT CORE-004 PHASE 2` then `AUTHORIZE CORE-004 PHASE 3 – Leasing Operations`  

---

## Explicit non-goals

- Opening UX-017 / extending UX-016  
- Replacing Canopy, AUTH dashboard assignment, or OPS priority engines  
- Parallel module home kits / custom dashboards  
- Isolated CRUD without workflow completion  
- Implementing Phase N before Authorize  
- Expanding Master Admin surface without ARCH-001 + Hybrid C  

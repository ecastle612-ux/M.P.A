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

> **Program Approved.** Do **not** implement a phase until `AUTHORIZE CORE-004 PHASE …` (or equivalent slice authorize) is issued.  
> First design package: [Phase 1 — Property Lifecycle](./08-phase-1-property-lifecycle-design.md) (Design/Document complete · awaiting Authorize).

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
| **1** | Property Lifecycle | 📝 Design documented · Implement 🔒 until Authorize |
| **2** | Maintenance Operations | 🔒 Queued |
| **3** | Leasing Operations | 🔒 Queued |
| **4** | Resident Operations | 🔒 Queued |
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
| [08 — Phase 1 Property Lifecycle design](./08-phase-1-property-lifecycle-design.md) | First phase Design/Document |

---

## Implementation gate

| Stage | Status |
|-------|--------|
| Design | ✅ Program design complete |
| Document | ✅ This package |
| Approve | ✅ **Issued** 2026-08-05 |
| Implement | 🔓 Program unlocked · **per-phase Authorize required** |
| Verify / Certify | Per phase after implementation |

### Unlock path (active)

1. ~~`APPROVE CORE-004`~~ ✅  
2. `AUTHORIZE CORE-004 PHASE 1 – Property Lifecycle` (or named slice)  
3. Implement only authorized phase/slice scope  
4. Verify → Certify → next phase Authorize  

---

## Explicit non-goals

- Opening UX-017 / extending UX-016  
- Replacing Canopy, AUTH dashboard assignment, or OPS priority engines  
- Parallel module home kits / custom dashboards  
- Isolated CRUD without workflow completion  
- Implementing Phase N before Authorize  
- Expanding Master Admin surface without ARCH-001 + Hybrid C  

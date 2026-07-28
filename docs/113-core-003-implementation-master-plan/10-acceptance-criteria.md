# 10 — Acceptance Criteria (CORE-003 governance)

**Package:** CORE-003  
**Note:** These accept the **plan**, not application features.

---

## CORE-003 is Acceptable when

1. All six brief packages (COM-001, AUTH-001, FIN-003, OPS-001, PMX-004, UX-012) have slice/phase inventories reflected in [01](./01-package-inventory.md).  
2. PAY-001 is explicitly called out as FIN-003 C predecessor.  
3. Dependency graph includes justifications ([02](./02-dependency-graph.md)).  
4. Critical path, parallel workstreams, risk matrix, resource plan, and milestone timeline exist.  
5. Master order M0–M6 is unambiguous about what may parallel and what is blocked.  
6. Authorization protocol preserves per-package unlock phrases.  
7. Document states: **no application code, schema, API, or UI** is authorized by CORE-003 alone.  
8. Product Owner + Lead Architect can Approve via [11](./11-approval-checklist.md).

---

## CORE-003 is Complete (as governance) when

1. ✅ Approved ([12](./12-approval-record.md)).  
2. ✅ Linked from [docs/README.md](../README.md) and [project-roadmap-status.md](../00-governance/project-roadmap-status.md).  
3. First M1 package Authorizes cite CORE-003 order (pending M0).  
4. No competing “implementation order” doc claims authority without amendment.

---

## Out of scope for CORE-003 acceptance

- Shipping any slice  
- Closing CORE-002 Blocker 4  
- PMX-004 COMPLETE  
- UX or OPS product demos  

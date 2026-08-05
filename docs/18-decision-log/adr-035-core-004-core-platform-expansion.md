# ADR-035: CORE-004 Core Platform Expansion

## Status
Accepted

## Date
2026-08-05

## Approved
2026-08-05 — issued with `APPROVE CORE-004 – Core Platform Expansion`

## Context
UX-016 is closed and certified. STD-001 / ADR-033 make dashboard and navigation inheritance mandatory. NAV-001, ARCH-001, and MAC-002 (100/100) established Master Admin as Mission Control with Hybrid C. Identity Foundation and SignWell (API-004 / ADR-030) are production foundations.

Operational capability gaps remain. Expanding without a program gate risks isolated CRUD, parallel homes, and security regression.

## Decision
1. Approve **CORE-004** as the Core Platform Expansion program ([package 120](../120-core-004-core-platform-expansion/README.md)).  
2. Deliver capabilities as **end-to-end workflows** in binding phase order: Property Lifecycle → Maintenance → Leasing → Resident → Vendor → Financial → Documents → Communications → Executive.  
3. Every slice must answer the workflow questions (who starts, triggers, participants, automations, notifications, audit, dashboard, Assistant, completion) and ship Verify artifacts.  
4. Every surface inherits STD-001, ADR-033, UX-016 patterns, NAV-001, ARCH-001, MAC-002 Hybrid C, Canopy, UDF, Assistant, Universal Sidebar / Search / Quick Actions / Waiting / Timeline / Insights.  
5. Program Approve unlocks planning and per-phase Authorize; **Implement remains locked until** `AUTHORIZE CORE-004 PHASE …` (or named slice).  
6. Do not open UX-017 or extend UX-016; do not invent Master Admin launchers outside Mission Control.

## Consequences
**Easier:** Clear expansion path; reviewers share fail bars for workflow completion and inheritance.  
**More difficult:** Isolated feature PRs are rejected; phases cannot jump the queue without Product + Architect exception.

## Alternatives Considered
- **Continue UX polish (UX-017) before expansion:** Rejected — UX baseline is certified.  
- **Authorize all nine phases at once:** Rejected — too large; Verify/Certify per phase required.  
- **Feature-first CRUD delivery:** Rejected — violates workflow-first product law.

## References
- [CORE-004 package](../120-core-004-core-platform-expansion/README.md)  
- [05 — Approval record](../120-core-004-core-platform-expansion/05-approval-record.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md)  
- [ADR-033](./adr-033-ux016-platform-standards-mandatory.md)  
- [ADR-034](./adr-034-master-admin-single-hub.md)  
- [MAC-002 certification](../124-mac-002-master-admin-production-certification/03-certification-report.md)  

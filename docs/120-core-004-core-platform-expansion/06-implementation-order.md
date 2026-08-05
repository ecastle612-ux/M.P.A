# 06 — Implementation Order

**Package:** CORE-004  
**Status:** ✅ Approved — binding sequence  
**Date:** 2026-08-05

Phases are sequential for program governance. A later phase may begin Design/Document early, but **Implement** requires Authorize and should not jump ahead of an incomplete prior phase without explicit Product + Architect exception.

---

## Phase 1 — Property Lifecycle

| Stage | Outcome |
|-------|---------|
| Acquisition | Property pipeline / intake starts |
| Organization onboarding | Org ready to operate |
| Property onboarding | Property + units structured |
| Activation | Property live for ops |
| Occupancy lifecycle | Vacant ↔ occupied continuity |
| Turnover | Make-ready between residents |
| Disposition | Exit / sale / offboard |

**Design:** [08](./08-phase-1-property-lifecycle-design.md)  
**Implement:** 🔒 until `AUTHORIZE CORE-004 PHASE 1 – Property Lifecycle`

---

## Phase 2 — Maintenance Operations

Resident Request → Manager Review → Assignment → Scheduling → Technician → Vendor Dispatch → Completion → Resident Confirmation → Analytics

---

## Phase 3 — Leasing Operations

Lead → Inquiry → Tour → Application → Screening → Approval → Lease Generation → SignWell → Move-In → Renewal → Move-Out

---

## Phase 4 — Resident Operations

Resident Profile · Communications · Payments · Maintenance · Documents · Community · Notifications

---

## Phase 5 — Vendor Operations

Vendor Onboarding · Compliance · Insurance · Assignments · Invoices · Performance · Renewals

---

## Phase 6 — Financial Operations

Accounts Receivable · Accounts Payable · Budgets · Owner Distributions · Vendor Payments · Financial Reporting

---

## Phase 7 — Document Operations

Templates · Generation · Approvals · SignWell · Vault · Retention · Audit

---

## Phase 8 — Communications

Resident Messaging · Vendor Messaging · Owner Messaging · Announcements · Broadcasts · Notifications

---

## Phase 9 — Executive Operations

Portfolio Health · Financial Health · Occupancy · Maintenance KPIs · Resident Satisfaction · Operational Trends

---

## Cross-cutting rules

- Every phase inherits [02](./02-ux-inheritance-contract.md).  
- Every slice answers [07](./07-workflow-requirement.md).  
- Reuse existing foundations (Phase 4 property, Phase 5 lease, API-004 SignWell, COM/AUTH, OPS) — ARCH-001: Extend → Reuse → Consolidate → Create.  
- Do not invent parallel homes or MA launchers.  

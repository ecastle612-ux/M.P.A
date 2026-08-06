# 26 — LAUNCH-001 Customer Promise Roadmap

**Status:** Draft (planning only — **no implementation**)  
**Gate:** Design → Document → **Approve** → Implement  
**Date:** 2026-08-06  
**Supersedes:** Engineering-slice framing in v0.1 (L0–L6 module order)

---

## Mission

Every advertised capability in the **Property Manager** subscription must be executable by a brand-new customer **without guidance**.

Implementation order follows **customer outcomes** — not technical modules.

**Success:** Launch ready only when every advertised workflow can be demonstrated start-to-finish **without workarounds**.

---

## Context

| Workstream | Status |
|------------|--------|
| FIN-OPS-001 | **Paused after S3** — money loop exists; not the whole product promise |
| Commercial hardening | **Pass** — what you bought is clearer; execution is not |
| Facility Operations | **Out of this package** — not a Property Manager promise |
| LAUNCH-001 | **Customer Promise roadmap** — docs only until Approve |

---

## Promise evaluation (mandatory)

For every advertised capability, answer:

1. Can a first-time customer **discover** it?  
2. Can they complete it **without documentation**?  
3. Can they complete it **without contacting support**?  
4. Does the workflow have a clear **beginning and end**?  
5. Does it **match what we advertise**?  
6. Can **Master Admin validate** the workflow?

Framework: [Promise Evaluation Framework](./promise-evaluation-framework.md)

---

## Package contents

| Document | Purpose |
|----------|---------|
| [Promise Evaluation Framework](./promise-evaluation-framework.md) | Six questions + scoring |
| [Capability Promises](./capability-promises.md) | All PM promises: journey, status, friction, blockers, fix, verify |
| [Customer Journeys](./customer-journeys.md) | Outcome-ordered journeys (replaces engineering slices) |
| [Master Admin Certification Console](./master-admin-certification-console.md) | How operators certify every promise |
| [Launch Readiness Gate](./launch-readiness-gate.md) | GO only when every journey completes unaided |
| [Appendix — Prior audit](./appendix-prior-audit.md) | Earlier blockers/improvements retained for reference |

---

## Advertised Property Manager capabilities

| Capability | Nav / catalog promise | Launch verdict today |
|------------|----------------------|----------------------|
| Property Management | Properties + Mission Control | **Fail** |
| Leasing | Vacancy → lease | **Fail** |
| Residents | Resident operational records | **Fail** |
| Maintenance | Unit / resident work orders | **Fail** |
| Vendor Management | Assign & manage vendors | **Fail** |
| Financial Operations | Rent, charges, collections | **Conditional** (works if discovered) |
| Documents | Leases, agreements, evidence | **Fail** |
| Communications | Threads, notices, notifications | **Fail** |

Detail: [Capability Promises](./capability-promises.md)

---

## Hard stops

| Instruction |
|-------------|
| **Do not implement** until `APPROVE LAUNCH-001` |
| **Do not** resume engineering slices L0–L6 as the primary plan — use [Customer Journeys](./customer-journeys.md) |
| **Do not authorize FIN-OPS-001 S4** from this package |
| **Do not begin Facility Operations features** |
| **Do not advertise** a capability that cannot be completed unaided |

---

## Related

| Package | Role |
|---------|------|
| [24 Property Manager Module Map](../24-product-architecture/property-manager-module-map.md) | What we advertise |
| [24 Subscription Matrix](../24-product-architecture/subscription-matrix.md) | SKU inclusion |
| [25 FIN-OPS-001](../25-fin-ops-001/index.md) | Money capability (partial promise met) |
| [Implementation Gate](../00-governance/implementation-gate.md) | Design → Document → Approve → Implement |

---

## Version

| Field | Value |
|-------|-------|
| Package | LAUNCH-001 Customer Promise Roadmap |
| Version | 0.2.0-draft |
| Implementation | **Blocked** |

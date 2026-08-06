# 26 — LAUNCH-001 Customer Promise Roadmap

**Status:** Approved  
**Gate:** Design → Document → **Approve** → Implement  
**Date:** 2026-08-06  
**ADR:** [ADR-017](../18-decision-log/adr-017-launch-001-customer-promise-journeys.md)  
**Supersedes:** Engineering-slice framing in v0.1 (L0–L6 module order)

---

## Mission

Every advertised capability in the **Property Manager** subscription must be executable by a brand-new customer **without guidance**.

Implementation order follows **customer outcomes** — not technical modules.

**Success:** Launch ready only when every advertised workflow can be demonstrated start-to-finish **without workarounds**.

**Governing launch program** until Customer #1 successfully completes onboarding and daily operations without assistance.

---

## Governing launch rule

> If we advertise it, a customer must be able to discover it, complete it, and understand it without friction.

---

## Context

| Workstream | Status |
|------------|--------|
| FIN-OPS-001 | **Paused after S3** — money loop exists; not the whole product promise |
| Commercial hardening | **Pass** — what you bought is clearer; execution is the launch work |
| Facility Operations | **Out of this package** — not a Property Manager promise |
| LAUNCH-001 | **Approved** — journey-driven implementation; authorize per journey |

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
| [J0 Certification](./j0/certification.md) | Purchase → trusted home Pass script |
| [J1 Certification](./j1/certification.md) | First property Pass script |
| [J2 Certification](./j2/certification.md) | Build your team Pass script |
| [J3 Certification](./j3/certification.md) | First resident Pass script |
| [J4 Certification](./j4/certification.md) | First lease Pass script |
| [J5 Certification](./j5/certification.md) | Collect first rent Pass script |
| [J6 Certification](./j6/certification.md) | First maintenance request Pass script |
| [J7 Certification](./j7/certification.md) | Daily operations Pass script |
| [J8 Certification](./j8/certification.md) | Owner portfolio review Pass script |
| [Property Manager Customer Promise Certification](./property-manager-customer-promise-certification.md) | Final GO / NO-GO for Customer #1 |
| [Master Admin Certification Console](./master-admin-certification-console.md) | How operators certify every promise |
| [Launch Readiness Gate](./launch-readiness-gate.md) | GO only when every journey completes unaided |
| [Appendix — Prior audit](./appendix-prior-audit.md) | Earlier blockers/improvements retained for reference |

---

## Authorization log

| Authorization | Scope | Status |
|---------------|-------|--------|
| `APPROVE LAUNCH-001` | Customer Promise framework + journey model | **Approved** |
| `AUTHORIZE LAUNCH-001 JOURNEY J0` | Purchase → First Login / trusted home | **Authorized + delivered** — certified |
| `AUTHORIZE LAUNCH-001 JOURNEY J1` | First property | **Authorized + delivered** — certified |
| `AUTHORIZE LAUNCH-001 JOURNEY J2` | Build your team | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J3` | First resident | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J4` | First lease | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J5` | Collect first rent | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J6` | First maintenance request | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J7` | Daily operations | **Authorized + delivered** — MA cert script ready |
| `AUTHORIZE LAUNCH-001 JOURNEY J8` | Owner portfolio review | **Authorized + delivered** — MA cert script ready |

**Hard rule:** No feature work may bypass an incomplete customer journey.

---

## Advertised Property Manager capabilities

| Capability | Nav / catalog promise | Launch verdict today |
|------------|----------------------|----------------------|
| Property Management | Properties + Mission Control | **Pass** (J0–J1 + J7) |
| Leasing | Vacancy → lease (launch path) | **Pass** (J3–J4 path; full pipeline deferred) |
| Residents | Resident operational records | **Pass** (J3) |
| Maintenance | Unit / resident work orders | **Pass** (J6) |
| Vendor Management | Assign & manage vendors | **Conditional** (MCC assign + FO AP) |
| Financial Operations | Rent, charges, collections, owner summary | **Pass** (J5 + FO S0–S3 + J8) |
| Owner portfolio | Owner portal health view | **Pass** (J8) |
| Documents | Leases, agreements, evidence | **Fail / de-advertise** |
| Communications | Threads, notices, notifications | **Fail / de-advertise** |

Detail: [Capability Promises](./capability-promises.md) · Final: [PM Customer Promise Certification](./property-manager-customer-promise-certification.md)

---

## Hard stops

| Instruction |
|-------------|
| **STOP** after J8 — no new platform capabilities without a new authorization |
| **Do not** resume engineering slices L0–L6 as the primary plan — use [Customer Journeys](./customer-journeys.md) |
| **Do not authorize FIN-OPS-001 S4** from this package |
| **Do not begin Facility Operations features** |
| **Do not advertise** Documents or Communications as launch-ready |
| **Do not** bypass an incomplete journey with unrelated feature work |

---

## Related

| Package | Role |
|---------|------|
| [24 Property Manager Module Map](../24-product-architecture/property-manager-module-map.md) | What we advertise |
| [24 Subscription Matrix](../24-product-architecture/subscription-matrix.md) | SKU inclusion |
| [25 FIN-OPS-001](../25-fin-ops-001/index.md) | Money capability (partial promise met) |
| [Implementation Gate](../00-governance/implementation-gate.md) | Design → Document → Approve → Implement |
| [ADR-017](../18-decision-log/adr-017-launch-001-customer-promise-journeys.md) | Accepted launch governance |

---

## Version

| Field | Value |
|-------|-------|
| Package | LAUNCH-001 Customer Promise Roadmap |
| Version | 1.0.0-approved |
| Implementation | **Journey-gated** (J0–J2 delivered; J3+ blocked) |

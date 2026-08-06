# 26 — LAUNCH-001 Customer Onboarding

**Status:** Draft (audit & planning only)  
**Gate:** Design → Document → **Approve** → Implement  
**Date:** 2026-08-06  
**Authorization:** Documentation only — **do not implement** until `APPROVE LAUNCH-001` (or equivalent)

---

## Context

| Workstream | Status |
|------------|--------|
| FIN-OPS-001 | **Paused after S3** — S0–S3 certified; S4+ not authorized |
| Commercial Experience Hardening | **Pass** (entitlements, Guided Setup chrome, fail-closed nav) |
| Facility Operations features | **Stopped / deferred** |
| LAUNCH-001 | **Audit & planning** — this package |

Financial Operations is sufficiently complete for launch **planning**. The next launch-critical initiative is whether a brand-new customer can become operational **without assistance**.

---

## Mission

Determine whether a brand-new customer can successfully become operational without assistance.

**This package does not authorize code.**

---

## Deliverables

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Customer Onboarding Blueprint](./customer-onboarding-blueprint.md) | Canonical journey + target experience |
| 2 | [Onboarding Blockers](./onboarding-blockers.md) | Confusion and hard stops today |
| 3 | [Recommended Onboarding Improvements](./recommended-improvements.md) | Prioritized fixes (design intent) |
| 4 | [Implementation Slices](./implementation-slices.md) | Certifiable slices after approval |
| 5 | [Customer #1 Readiness Assessment](./customer-1-readiness-assessment.md) | GO / NO-GO for unaided launch |

---

## Related packages

| Package | Relationship |
|---------|--------------|
| [24 Product Architecture](../24-product-architecture/index.md) | Commercial model, nav, entitlements |
| [24 Launch Readiness](../24-product-architecture/launch-readiness.md) | Commercial clarity bar (Approved; historically Not ready) |
| [24 Onboarding certification](../24-product-architecture/certification/customer-onboarding-certification.md) | Baseline commercial walkthrough |
| [25 FIN-OPS-001](../25-fin-ops-001/index.md) | Money path S0–S3 (delivered); not full ops onboarding |
| [21 First Five Minutes](../21-experience-architecture/first-five-minutes.md) | Experience intent (Draft) |
| [ADR-015](../18-decision-log/adr-015-three-commercial-products.md) | Stopped LAUNCH until commercial model clear |
| [Implementation Gate](../00-governance/implementation-gate.md) | Permanent Design → Document → Approve → Implement |

---

## Hard stops

| Instruction |
|-------------|
| **Do not implement** onboarding code until this package is Approved |
| **Do not authorize FIN-OPS-001 S4** from this workstream |
| **Do not begin Facility Operations features** |
| **Do not modify CORE-004** |

---

## Version

| Field | Value |
|-------|-------|
| Package | LAUNCH-001 Customer Onboarding |
| Version | 0.1.0-draft |
| Authoritative for planning | Yes (until Approved) |
| Implementation | **Blocked** |

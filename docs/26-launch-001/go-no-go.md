# LAUNCH-001 — GO / NO-GO Review

**Status:** Draft desk recommendation  
**Date:** 2026-08-06  
**Program:** [LAUNCH-001](./index.md)  
**Evidence:** rc1 Limited Beta cert · Launch Board 🔴 open · Role journeys · Audits

---

## Scores

| Category | Score | Rating | Rationale |
|----------|------:|:------:|-----------|
| **Overall Launch Readiness** | **52 / 100** | **FAIL** | Product depth high; commercial cutover + legal + observability open |
| **Commercial Readiness** | **48 / 100** | **FAIL** | SaaS card path / activation unproven; SignWell prod noop; claim control unsigned |
| **UX Readiness** | **68 / 100** | **WARNING** | Strong portals/shell; PM nav overload; dual homes; Facility breadth |
| **Operational Readiness** | **70 / 100** | **WARNING** | WO/lease/property loops exist; daily attention + email proof incomplete |
| **Security Readiness** | **72 / 100** | **WARNING** | RLS/auth mature on candidate; prod secrets/bootstrap/webhook matrix must re-attest |
| **Performance Readiness** | **65 / 100** | **WARNING** | Budgets exist; launch-bar re-measure on prod SHA required |
| **Production Readiness** | **45 / 100** | **FAIL** | Monitoring/logging/Sentry/backups/legal pages incomplete; ship-tree coherence risk |

### Rating key

| Rating | Meaning |
|--------|---------|
| **PASS** | Ready for unsupervised Customer #1 in this category |
| **WARNING** | Usable with Known Limitations + closeout plan |
| **FAIL** | Must not onboard paying Customer #1 until remediated |

---

## Decision matrix

| Target | Decision | Conditions |
|--------|----------|------------|
| **Authorize LAUNCH-001 program** | **GO** | Approve ADR-017; freeze non-blocker features |
| **Begin CORE-004 Phase 6** | **NO-GO** | Remains frozen until Customer #1 GO |
| **Limited / supervised Design Partner** | **CONDITIONAL GO** | Per rc1 Limited Beta + Known Limitations; not unsupervised paid GA |
| **Unsupervised first paying Customer #1** | **NO-GO** | Until all 🔴 → 🟢 and checklist PASS |
| **Facility / CORE expansion** | **NO-GO** | 🔵 Post Launch |

---

## Why Overall = FAIL (not catastrophe)

This is a **launch-cutover FAIL**, not a “platform is empty” FAIL.

| Strong | Weak |
|--------|------|
| Property, Maintenance, Leasing, Resident, Vendor token, portals on rc1 | Live SaaS billing operator proof |
| Rent/SaaS/SignWell **code** paths | SignWell **prod config** noop |
| Acquisition + Setup engineering | Privacy/Terms pages missing |
| Master Admin support surfaces | Sentry/monitoring/backup drills |
| Architecture clarity (Facility ≠ Maintenance) | Ship-tree / docs drift (`main` vs rc1) |

---

## Flip-to-GO criteria (Customer #1)

All must be true:

1. Launch Board: **zero open 🔴** (LB-01…LB-22)  
2. [Customer #1 Checklist](./customer-one-checklist.md) **PASS** on production  
3. Known Limitations **signed** by Product + Support  
4. No FAIL remaining in Commercial or Production readiness categories  
5. UX/Ops/Security/Performance at **PASS** or accepted **WARNING** with named Limitations  

Then update this document:

| Field | On GO |
|-------|-------|
| Overall | PASS |
| Decision | **GO — Customer #1** |
| Date / SHA | _record_ |

---

## Official recommendation

1. **Authorize LAUNCH-001** as governing program (ADR-017).  
2. **Do not** begin CORE-004 Phase 6 or any non-blocker feature work.  
3. Execute blocker order in the [Report](./launch-readiness-report.md) §6.  
4. Keep Facility first-class in architecture; keep Facility **expansion** post-launch.  
5. Re-run this GO/NO-GO after LB-22.

**Signed recommendation (desk):** **NO-GO for Customer #1 today. GO to run LAUNCH-001.**

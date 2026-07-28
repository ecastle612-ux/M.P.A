# 24 — CORE-003 Amendment: M0 Performance Framework Limit

**Amendment ID:** `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT`  
**Status:** ✅ **APPROVED**  
**Decision date:** 2026-07-24  
**Package:** CORE-003  
**Evidence:** [22](./22-m0-performance-option-c.md) · [23](./23-m0-framework-limit-governance-review.md)  
**Code / UX-012:** ❌ Not authorized by this amendment

---

## Official decision

| Field | Decision |
|-------|----------|
| Amendment | `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` |
| Status | ✅ **APPROVED** |
| Prior hard gate | Lighthouse Performance ≥95 on `/login` as indefinite M0 blocker |
| Replacement gate | **Best Achievable Within Approved Architecture** |
| Performance gate status | **CONDITIONALLY SATISFIED** (engineering due diligence complete) |
| M0 overall | ❌ **NO-GO** (other mandatory gates remain) |
| UX-012 Slice A | 🔒 Forbidden until M0 **GO** + explicit authorize phrase |

---

## Binding replacement text

### Performance Gate — Best Achievable Within Approved Architecture

Acceptance requires **ALL** of the following:

1. Engineering due diligence completed  
2. Bundle analysis completed  
3. Shared-chunk investigation completed  
4. Framework limitations documented  
5. No significant application-controlled bottlenecks remain  
6. Accessibility ≥95  
7. Best Practices =100  
8. No unacceptable regression risk introduced attempting further optimization  

Remaining framework runtime overhead shall be treated as **continuous improvement** work and **SHALL NOT** indefinitely block implementation.

### Continuous improvement

Performance optimization does not end. Future improvements remain encouraged when Next.js / React upgrades, better code splitting, Server Components evolution, or new platform capabilities emerge. Those items are **backlog**, not M0 implementation blockers.

---

## What this amendment does not change

The following M0 blockers remain **mandatory**:

1. PMX-004 Phase 1 real-device certification  
2. PAY-001 verification  
3. Infrastructure validation  
4. Authenticated regression validation for **implemented** roles ([33](./33-core-003-amd-m0-auth-role-cert-defer.md) — Org Admin / Leasing / Facility Tech deferred to AUTH-001 Slice D)  
5. Final M0 Production Readiness review  

**M0 remains NO-GO** until those gates pass.

Serial authorize discipline, Implementation Gate (Design → Document → Approve → Implement), and the unlock phrase `AUTHORIZE UX-012 SLICE A` are unchanged.

---

## Next authorized action (binding)

Complete remaining M0 gates in order:

1. PMX-004 Phase 1 real-device certification  
2. PAY-001 verification  
3. Infrastructure validation  
4. Authenticated regression for **implemented** roles ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
5. Final M0 Production Readiness review  

Only after **all** remaining M0 gates pass may M0 transition **NO-GO → GO**.  
Only after M0 = **GO** may the first implementation authorization be issued: **`AUTHORIZE UX-012 SLICE A`**.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Product Owner / Governance authority | ✅ **APPROVED** | 2026-07-24 |
| Engineering evidence package | [22](./22-m0-performance-option-c.md) · [23](./23-m0-framework-limit-governance-review.md) | 2026-07-24 |

---

## Document map

| Doc | Role after amendment |
|-----|----------------------|
| This file | Authoritative amendment record |
| [05](./05-master-implementation-order.md) | M0 performance gate subsection |
| [09](./09-authorization-protocol.md) | Execution status row |
| [12](./12-approval-record.md) | Amendment pointer |
| [23](./23-m0-framework-limit-governance-review.md) | Review → APPROVED |
| [18](./18-m0-lighthouse-recovery.md)–[22](./22-m0-performance-option-c.md) | Historical measurement; gate superseded by this AMD |

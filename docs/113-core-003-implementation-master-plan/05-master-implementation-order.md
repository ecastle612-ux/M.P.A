# 05 — Master Implementation Order

**Package:** CORE-003  
**Status:** ✅ **APPROVED** (2026-07-23) — see [12-approval-record.md](./12-approval-record.md)  
**Authority:** This document is the **only approved cross-package implementation order** for M.P.A.  
**Does not replace:** Per-package `AUTHORIZE …` phrases, verification, or certification.  
**Does not authorize code:** CORE-003 Approve binds order only.

Phases below are **program phases (M0–M6)**, not FIN/PMX phase letters.

**Serial authorize rule (binding):** Do **not** begin multiple slices simultaneously. Authorize one unit at a time; validate (or complete the named gate) before the next Authorize in the active phase sequence unless a formal CORE-003 amendment says otherwise.

---

## M0 — Production Readiness

**Type:** Gates / verification — not a greenfield feature slice wave.

| # | Unit | Exit |
|---|------|------|
| M0.1 | **PMX-004 Phase 1 Final Device Certification** | Final PASS on real devices ([17](../106-pmx-004-native-pwa-parity/17-phase-1-production-validation.md)) — evidence form from 2026-07-24: signed owner checklist ([18](../106-pmx-004-native-pwa-parity/18-pmx-004-amd-device-cert-owner-checklist.md) · [37](./37-pmx-004-amd-device-cert-owner-checklist-pointer.md)) |
| M0.2 | **PAY-001 Verification** | PAY-001 Verified path advanced per PAY-001 board (required before FIN-003 C in M4; track actively in M0) |
| M0.3 | **Infrastructure Validation** | Deploy/runtime/env readiness for upcoming M1 implementation (no new architecture packages) |
| M0.4 | **Performance (amended)** | **CONDITIONALLY SATISFIED** — Best Achievable Within Approved Architecture ([24](./24-core-003-amd-m0-perf-framework-limit.md)) |
| M0.5 | **Authenticated regression validation** | Affirmative regression for **implemented** roles only — Org Admin / Leasing Agent / Facility Technician **Deferred Until AUTH-001 Slice D** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| M0.6 | **Final Production Readiness review** | M0 **GO** / **NO-GO** published |

**Also complete at M0 (governance):** CORE-003 Approved · architecture baseline packages remain Approved · capacity assigned.

### M0 Performance Gate (binding — amended)

**Amendment:** `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` ✅ **APPROVED** (2026-07-24) · [24](./24-core-003-amd-m0-perf-framework-limit.md)

**Gate name:** Best Achievable Within Approved Architecture  

**Hard Lighthouse Performance ≥95** is **superseded** as an indefinite M0 implementation blocker. Framework runtime overhead (Next.js App Router / react-dom / Flight) is continuous-improvement backlog after due diligence, not a permanent serial gate.

**Acceptance (all required):** engineering due diligence · bundle analysis · shared-chunk investigation · framework limitations documented · no significant application-controlled bottlenecks remain · Accessibility ≥95 · Best Practices =100 · no unacceptable regression risk from further in-architecture chasing.

**Current status:** **CONDITIONALLY SATISFIED** (evidence [22](./22-m0-performance-option-c.md) · [23](./23-m0-framework-limit-governance-review.md)).

**Does not waive:** M0.1 · M0.2 · M0.3 · M0.5 · M0.6. **M0 remains NO-GO** until those pass.

### M0 Authenticated Regression Gate (binding — amended)

**Amendment:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ **APPROVED** (2026-07-24) · [33](./33-core-003-amd-m0-auth-role-cert-defer.md)

**Policy:** M0 certifies **only implemented production capabilities**. Approved-but-deferred architecture does not block M0.

**M0.5 mandatory roles:** Master Administrator · Property Manager · Property Owner · Vendor · Tenant (+ REG-ACL-001 Production verify · storage · org isolation for those roles).

**Deferred to AUTH-001 Slice D (not M0 exit criteria):** Organization Administrator · Leasing Agent · Facility Technician.

**Exit:** PMX-004 Phase 1 **Certified (Final PASS)**; PAY-001 verification status published; infrastructure validation recorded; authenticated regressions complete for **implemented** roles; final readiness **GO**.  
**Do not Authorize application slices until M0 = GO** (then `AUTHORIZE UX-012 SLICE A`).

---

## M1 — Foundation

**Prerequisite:** M0.1 Final PASS (PMX-004 Phase 1 Certified).

| Order | Unit | Authorize only after |
|-------|------|----------------------|
| M1.1 | **UX-012 Slice A** | M0 complete for device cert; `AUTHORIZE UX-012 SLICE A` — **recommended first implementation** |
| M1.2 | **OPS-001 Slice A** | UX-012 Slice A **Validated** |
| M1.3 | **AUTH-001 Slice A** | OPS-001 Slice A **Validated** (or after UX-A Validated if OPS-A deferred by written amendment — default is UX → OPS → AUTH) |
| M1.4 | **PMX-004 Phase 1 (Certified)** | Confirmed carried from M0 — not a new build wave |

**Exit:** UX-A, OPS-A, AUTH-A each Validated; PMX-004 Phase 1 remains Certified.

**Next Authorized Action (official):** ✅ PMX-004 Phase 8 **IMPLEMENTED** ([§82](./82-pmx-004-phase-8-implementation.md) · [PMX-004 §42](../106-pmx-004-native-pwa-parity/42-phase-8-implementation.md)). Next → **`VALIDATE PMX-004 PHASE 8`**. PMX Phases 9–11 · UX-C–E · OPS-C–E · FIN-003 C–E · partner marketplace UI remain locked until each explicit authorize.

---

## M2 — Provisioning, activation, notify, components, install

| Order | Unit | Depends on |
|-------|------|------------|
| M2.1 | **AUTH-001 Slice B** | AUTH-A Validated |
| M2.2 | **COM-001 Slice A** | COM Approved; integrates with AUTH-B (validate handoff with AUTH-B) |
| M2.3 | **OPS-001 Slice B** | OPS-A Validated |
| M2.4 | **UX-012 Slice B** | UX-A Validated |
| M2.5 | **PMX-004 Phase 2** | PMX-004 Phase 1 Certified + `AUTHORIZE PMX-004 PHASE 2` |

**Serial rule:** Authorize one at a time within M2; prefer AUTH-B before or tightly paired with COM-A validation; UX-B before heavy PMX-2 UI if both contend for FE.

**Exit:** AUTH-B, COM-A, OPS-B, UX-B Validated; PMX Phase 2 authorized work complete/verified per package.

---

## M3 — Invites, trial, tasks, role chrome

| Order | Unit | Depends on |
|-------|------|------------|
| M3.1 | **AUTH-001 Slice C** | AUTH-B Validated |
| M3.2 | **COM-001 Slice B** | COM-A Validated |
| M3.3 | **OPS-001 Slice C** | OPS-B Validated |
| M3.4 | **UX-012 Slice C** | UX-B Validated |

**Exit:** AUTH-C, COM-B, OPS-C, UX-C Validated (Command Center data completeness may still depend on later OPS-E — do not claim Universal Command Center COMPLETE until OPS-E + UX validation in M5).

---

## M4 — Authz, health, AI ops, a11y, money-out start

| Order | Unit | Depends on |
|-------|------|------------|
| M4.1 | **AUTH-001 Slice D** | AUTH-C Validated |
| M4.2 | **COM-001 Slice C** | COM-B Validated |
| M4.3 | **OPS-001 Slice D** | OPS-C Validated |
| M4.4 | **UX-012 Slice D** | UX-C Validated |
| M4.5 | **FIN-003 Phase C** | **PAY-001 Verified** + FIN-003 Phase C Authorize — **only after PAY-001 Verified** |

**Exit:** AUTH-D, COM-C, OPS-D, UX-D Validated; FIN-C Certified if entered.

---

## M5 — Recovery, offboarding, Command Center, payout UX

| Order | Unit | Depends on |
|-------|------|------------|
| M5.1 | **AUTH-001 Slice E** | AUTH-D Validated |
| M5.2 | **COM-001 Slice D** | COM-C Validated |
| M5.3 | **OPS-001 Slice E** | OPS-D Validated |
| M5.4 | **UX-012 Validation** | UX-D Validated; OPS-E data available for Command Center validate |
| M5.5 | **FIN-003 Phase D** | FIN-C Certified |

**Exit:** AUTH-E, COM-D, OPS-E Validated; UX-012 validation PASS for M5 scope; FIN-D Certified if entered.

---

## M6 — Commercial dashboard, polish, payout cert, PWA COMPLETE, launch

| Order | Unit | Depends on |
|-------|------|------------|
| M6.1 | **COM-001 Slice E** | COM-D Validated; ADMIN-003 alignment |
| M6.2 | **UX-012 Slice E** | UX-012 M5 validation PASS |
| M6.3 | **FIN-003 Phase E** | FIN-D Certified |
| M6.4 | **PMX-004 Phase 11** | Prior PMX phases / Phase 10 per PMX-004 |
| M6.5 | **Production Launch Validation** | Program spine exits + commercial readiness evidence |

**Exit:** COM-E Validated; UX-012 Slice E / package acceptance met; FIN-E Certified (Blocker 4 CLOSE eligible); PMX-004 COMPLETE checklist; production launch validation recorded.

---

## Compact official sequence card

```
M0  PMX-004 P1 Final Device Cert · PAY-001 Verification · Infrastructure Validation
    · Perf gate CONDITIONALLY SATISFIED (AMD-M0-PERF-FRAMEWORK-LIMIT)
    · Authenticated regressions · Final readiness review → GO
M1  UX-012 A → OPS-001 A → AUTH-001 A · (requires M0 GO)

M2  AUTH-001 B · COM-001 A · OPS-001 B · UX-012 B · PMX-004 Phase 2
M3  AUTH-001 C · COM-001 B · OPS-001 C · UX-012 C
M4  AUTH-001 D · COM-001 C · OPS-001 D · UX-012 D · FIN-003 C (after PAY-001 Verified)
M5  AUTH-001 E · COM-001 D · OPS-001 E · UX-012 Validation · FIN-003 D
M6  COM-001 E · UX-012 E · FIN-003 E · PMX-004 Phase 11 · Production Launch Validation
```

---

## Amendments vs draft plan

| Topic | Draft | Approved |
|-------|-------|----------|
| M0 | Governance unlock only | **Production Readiness** (device cert, PAY verify, infra) |
| M1 parallel | UX/OPS/AUTH parallel OK | **Serial:** UX-A first, then OPS-A, then AUTH-A |
| Multi-slice start | Allowed in marked parallel sets | **Forbidden** without amendment — one Authorize at a time |
| Program freeze | Not stated | **Baseline complete** — no new top-level architecture packages except listed exceptions |

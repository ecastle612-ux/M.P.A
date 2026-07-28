# 09 — Authorization Protocol

**Package:** CORE-003  
**Status:** ✅ **Accepted** (2026-07-23)

CORE-003 Approve makes the **order** binding. It does **not** start coding.

---

## Two-layer unlock

| Layer | What it unlocks | Artifact |
|-------|-----------------|----------|
| **CORE-003** | Cross-package sequence M0–M6 | [12-approval-record.md](./12-approval-record.md) |
| **Package** | Specific slice/phase **implementation** | e.g. `AUTHORIZE UX-012 SLICE A` |

Both required. Package Authorize **shall not** be issued outside the Master Order without a CORE-003 amendment.

---

## Implementation protocol (mandatory)

Before any implementation begins, **all** of the following must be true:

| # | Condition |
|---|-----------|
| 1 | Package Approved |
| 2 | Slice / phase explicitly Authorized (`AUTHORIZE …`) |
| 3 | Dependencies satisfied |
| 4 | Blocking milestones complete (e.g. M0 device cert before M1 code) |
| 5 | Previous slice in sequence Validated (where applicable) |
| 6 | Regression gates passed |

No implementation may bypass these requirements.

**Serial rule:** Do **not** begin multiple slices simultaneously.

---

## Authorize eligibility (CTO checklist)

1. CORE-003 is Approved.  
2. Unit is next (or explicitly next-eligible) in [05](./05-master-implementation-order.md).  
3. Hard dependencies Validated / Certified / PASS.  
4. No second slice already Authorized and unfinished (unless amendment).  
5. Package-local readiness docs satisfied.  
6. For FIN-003 C: PAY-001 Verified + Phase C Authorize GO.

---

## Next Authorized Action (current)

| Step | Action | Status |
|------|--------|--------|
| 0 | M0 execution authorized | ✅ [13](./13-m0-authorization.md) |
| 1 | M0 — PMX-004 Phase 1 Final Device Certification | ❌ **BLOCKED** — devices not run ([14](./14-m0-production-readiness-report.md)) |
| 2 | M0 — PAY-001 Verification | ✅ **VERIFIED** (package) · [26](./26-pay-001-production-closeout.md) · live destination enable still ops-gated |
| 3 | M0 — Infrastructure Validation | ✅ **PASS** · [27](./27-m0-infrastructure-closeout.md) |
| 3b | M0 Lighthouse recovery | ✅ Execution restored · plan in [18](./18-m0-lighthouse-recovery.md) |
| 3c | M0-PERF-001 remediation | ✅ Authorized batch done · Perf **67** (historical) · [19](./19-m0-performance-remediation.md) |
| 3d | M0-PERF-002 shared-chunk forensics | ✅ Report done · [20](./20-m0-shared-chunk-forensics.md) |
| 3e | M0-PERF Option B | ✅ Done · Perf **71** · [21](./21-m0-performance-option-b.md) |
| 3f | M0-PERF Option C | ✅ Done · Perf **73** · framework limit evidenced · [22](./22-m0-performance-option-c.md) |
| 3g | `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` | ✅ **APPROVED** · Perf gate **CONDITIONALLY SATISFIED** · [24](./24-core-003-amd-m0-perf-framework-limit.md) |
| 4 | M0 — Authenticated Regression | ✅ **PASS** (implemented roles) · [28](./28-m0-authenticated-regression-certification.md) · [34](./34-reg-acl-001-production-verification.md) · three AUTH roles ⏸ Deferred Slice D |
| 4a | M0-REG-001 REG-STOR-001 | ✅ **PASS** · [29](./29-reg-stor-001-remediation.md) · prod deploy verified |
| 4b | M0 remaining gates | ✅ Closed for M0 · PAY destination enable remains ops-gated (non-blocking) |
| 5 | M0 final certification | ✅ **GO** · [36](./36-final-m0-governance-review.md) (re-run) · [25](./25-final-m0-production-readiness.md) historical NO-GO preserved |
| 6 | **`AUTHORIZE UX-012 SLICE A`** | ✅ **ISSUED** · [38](./38-ux-012-slice-a-authorization.md) · [UX-012 §30](../112-ux-012-platform-experience-design-system/30-slice-a-authorization.md) |
| 6a | Implement UX-012 Slice A | ✅ Done · [UX-012 §31](../112-ux-012-platform-experience-design-system/31-slice-a-implementation.md) |
| 6a2 | `VALIDATE UX-012 SLICE A` | ✅ **PASS** · [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) |
| 6b | After UX-A Validated → `AUTHORIZE OPS-001 SLICE A` | ✅ **ISSUED** · [39](./39-ops-001-slice-a-authorization.md) · [OPS-001 §30](../111-ops-001-platform-operations-architecture/30-slice-a-authorization.md) |
| 6b1 | Implement OPS-001 Slice A | ✅ Done · [OPS-001 §31](../111-ops-001-platform-operations-architecture/31-slice-a-implementation.md) |
| 6b1a | `VALIDATE OPS-001 SLICE A` | ❌ FAIL (historical) · [OPS-001 §32](../111-ops-001-platform-operations-architecture/32-slice-a-validation.md) |
| 6b1b | Remediate OPS-001 Slice A (R1–R3) | ✅ Done · [OPS-001 §33](../111-ops-001-platform-operations-architecture/33-slice-a-remediation.md) |
| 6b1c | `VALIDATE OPS-001 SLICE A` (re-run) | ✅ **PASS** · [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) |
| 6b2 | `AUTHORIZE UX-012 SLICE B` | 🔒 Deps met · deferred until after COM-A Validated · see step 8d |
| 6b3 | `AUTHORIZE OPS-001 SLICE B` | 🔒 Deps met · deferred until after COM-A Validated · see step 8c |
| 7 | After OPS-A Validated → `AUTHORIZE AUTH-001 SLICE A` | ✅ **ISSUED** · [40](./40-auth-001-slice-a-authorization.md) · [AUTH-001 §33](../109-auth-001-organization-provisioning-authentication/33-slice-a-authorization.md) |
| 7a | Implement AUTH-001 Slice A | ✅ **Done** · [AUTH-001 §34](../109-auth-001-organization-provisioning-authentication/34-slice-a-implementation.md) |
| 7a2 | `VALIDATE AUTH-001 SLICE A` | ✅ **PASS** · [AUTH-001 §35](../109-auth-001-organization-provisioning-authentication/35-slice-a-validation.md) |
| 7a3 | `AUTHORIZE AUTH-001 SLICE B` | ✅ **ISSUED** · [41](./41-auth-001-slice-b-authorization.md) · [AUTH-001 §36](../109-auth-001-organization-provisioning-authentication/36-slice-b-authorization.md) |
| 7a4 | Implement AUTH-001 Slice B | ✅ **Done** · [AUTH-001 §37](../109-auth-001-organization-provisioning-authentication/37-slice-b-implementation.md) |
| 7a5 | `VALIDATE AUTH-001 SLICE B` | ❌ **FAIL** (historical) · [AUTH-001 §38](../109-auth-001-organization-provisioning-authentication/38-slice-b-validation.md) |
| 7a6 | Remediate AUTH-001 Slice B (R1–R2) | ✅ **Done** · [AUTH-001 §39](../109-auth-001-organization-provisioning-authentication/39-slice-b-remediation.md) |
| 7a7 | Re-run `VALIDATE AUTH-001 SLICE B` | ✅ **PASS** · [AUTH-001 §40](../109-auth-001-organization-provisioning-authentication/40-slice-b-validation-rerun.md) |
| 7a8 | `AUTHORIZE AUTH-001 SLICE C` | ✅ **ISSUED** · [42](./42-auth-001-slice-c-authorization.md) · [AUTH-001 §41](../109-auth-001-organization-provisioning-authentication/41-slice-c-authorization.md) |
| 7a9 | Implement AUTH-001 Slice C | ✅ **Done** · [AUTH-001 §42](../109-auth-001-organization-provisioning-authentication/42-slice-c-implementation.md) |
| 7a10 | `VALIDATE AUTH-001 SLICE C` | ✅ **PASS** · [AUTH-001 §43](../109-auth-001-organization-provisioning-authentication/43-slice-c-validation.md) |
| 7b | `AUTHORIZE AUTH-001 SLICE D` (deferred roles) | ✅ **ISSUED** · [43](./43-auth-001-slice-d-authorization.md) · [AUTH-001 §44](../109-auth-001-organization-provisioning-authentication/44-slice-d-authorization.md) |
| 7b1 | Implement AUTH-001 Slice D | ✅ **Done** · [AUTH-001 §45](../109-auth-001-organization-provisioning-authentication/45-slice-d-implementation.md) |
| 7b2 | `VALIDATE AUTH-001 SLICE D` | ✅ **PASS** · [AUTH-001 §46](../109-auth-001-organization-provisioning-authentication/46-slice-d-validation.md) |
| 7c | `AUTHORIZE AUTH-001 SLICE E` | ✅ **ISSUED** · [44](./44-auth-001-slice-e-authorization.md) · [AUTH-001 §47](../109-auth-001-organization-provisioning-authentication/47-slice-e-authorization.md) |
| 7c1 | Implement AUTH-001 Slice E | ✅ **Done** · [AUTH-001 §48](../109-auth-001-organization-provisioning-authentication/48-slice-e-implementation.md) |
| 7c2 | `VALIDATE AUTH-001 SLICE E` | ✅ **PASS** · [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) |
| 8 | `AUTHORIZE COM-001 SLICE A` | ✅ **ISSUED** · [46](./46-com-001-slice-a-authorization.md) · [COM-001 §28](../110-com-001-customer-lifecycle-commercial-operations/28-slice-a-authorization.md) |
| 8a | Implement COM-001 Slice A | ⏳ **Next** — within COM-001 §28 scope |
| 8b | `VALIDATE COM-001 SLICE A` | 🔒 Pending |
| 8c | `AUTHORIZE OPS-001 SLICE B` | 🔒 After COM-A Validated per M2 order |
| 8d | `AUTHORIZE UX-012 SLICE B` | 🔒 After COM-A / OPS-B peers per M2 |

---

## Package unlock phrases (reference)

| Package | Phrase |
|---------|--------|
| UX-012 | `AUTHORIZE UX-012 SLICE A` (**first code unlock**) |
| OPS-001 | `AUTHORIZE OPS-001 SLICE A` |
| AUTH-001 | `AUTHORIZE AUTH-001 SLICE A` |
| COM-001 | `AUTHORIZE COM-001 SLICE A` |
| PMX-004 | `AUTHORIZE PMX-004 PHASE 2` (after Phase 1 Certified) |
| FIN-003 | Phase C Authorize after PAY-001 Verified |
| PAY-001 | Per PAY-001 Slice Authorize docs |

---

## Exception path

1. Document amendment to CORE-003.  
2. Re-Approve amendment.  
3. Then issue package Authorize.

Silence / chat agreement is not an exception.

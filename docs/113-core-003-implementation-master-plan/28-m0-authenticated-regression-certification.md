# 28 — M0 Authenticated Regression Certification

**Package:** CORE-003 · M0 · Authenticated Regression  
**Latest verification:** Implemented-Role Regression Rerun ✅ ([28a](./28a-implemented-role-regression-rerun.md)) · REG-ACL-001 Production ✅ ([34](./34-reg-acl-001-production-verification.md))  
**Amendment in force:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
**Date:** 2026-07-24  
**Production URL:** `https://www.my-property-assistant.com`  
**Evidence:**  
- Regression rerun: [`m0-reg-003-rerun/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003-rerun/) · [28a](./28a-implemented-role-regression-rerun.md)  
- REG-ACL Deploy: [`m0-reg-acl-001-deploy/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001-deploy/) · [31a](./31a-reg-acl-001-deployment.md)  
- REG-ACL Production Verification: [`m0-reg-acl-001/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001/) · [34](./34-reg-acl-001-production-verification.md)  
- QA fixtures: [`m0-reg-003/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003/) · [30](./30-reg-cov-001-qa-fixture-certification.md)  
- Role model: [31](./31-role-model-reconciliation.md)  
**Prior gates:** PAY-001 ✅ · Infrastructure ✅ · Perf CONDITIONALLY SATISFIED · REG-STOR-001 ✅ · REG-ACL Deploy ✅ · REG-ACL Production Verification ✅ · Implemented-Role Regression Rerun ✅

> UX-012 / OPS / AUTH / COM / FIN-003 · Final M0 Review: 🔒 not authorized.  
> **M0.5 scope:** implemented roles only — Master Admin · PM · Owner · Vendor · Tenant.  
> PMX-004 real-device certification was **not** begun under the regression authorization.

---

## Final Certification Result

| Field | Result |
|-------|--------|
| **Overall (implemented roles)** | ✅ **PASS** |
| **REG-STOR-001 in Production** | ✅ **VERIFIED PASS** |
| **REG-ACL-001 Deploy** | ✅ **COMPLETE** ([31a](./31a-reg-acl-001-deployment.md)) |
| **REG-ACL-001 in Production** | ✅ **VERIFIED PASS** ([34](./34-reg-acl-001-production-verification.md)) |
| **Implemented-Role Regression Rerun** | ✅ **PASS** ([28a](./28a-implemented-role-regression-rerun.md)) |
| **QA fixtures (implemented roles)** | ✅ Provisioned ([30](./30-reg-cov-001-qa-fixture-certification.md)) |
| **REG-COV-001 (three AUTH-001 roles)** | ⏸ **DEFERRED TO AUTH-001 SLICE D** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) — not an M0 blocker |
| **HIGH / CRITICAL open for M0.5** | **None** |
| **M0 overall** | ❌ Still **NO-GO** — PMX-004 real-device certification remains |
| **Recommend UX-012 unlock?** | ❌ **NO** |

### Success criteria checklist (amended M0.5 scope)

| Criterion | Met? |
|-----------|:----:|
| No HIGH regressions (implemented surfaces) | ☑ |
| No CRITICAL regressions | ☑ |
| Implemented multi-role validation complete | ☑ |
| Org Admin / Leasing / Facility Tech | ⏸ Deferred Slice D — **not required for M0** |
| Storage validated | ☑ |
| Core workflows validated | ☑ |
| Organization / portal isolation validated | ☑ |
| REG-ACL-001 Deploy | ☑ |
| REG-ACL-001 Production Verification | ☑ |
| Implemented-Role Regression Rerun | ☑ |

---

## Production deployment version

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf` |
| Deployment URL | `https://m-p-a-3uhuplb8c-ecastle612-uxs-projects.vercel.app` |
| Target | **production** |
| Status | **READY** |
| Aliases | `www.my-property-assistant.com` · `my-property-assistant.com` · `m-p-a-web.vercel.app` |
| REG-ACL-001 included | ✅ Ops-shell middleware + `(app)` layout gate |

---

## Coverage achieved (implemented roles)

| Area | Coverage |
|------|----------|
| Password login / logout / session | ✅ |
| Master Administrator | ✅ Mission Control |
| Property Manager ops surfaces | ✅ |
| Owner / Tenant / Vendor portals | ✅ |
| Portal roles denied Ops shell | ✅ Immediate redirect to role home |
| Wrong-portal ACL | ✅ unauthorized |
| Anon protected routes | ✅ → login |
| Storage API (prod) | ✅ REG-STOR-001 |
| Org Admin / Leasing / Facility Tech | ⏸ Deferred Slice D |
| Authenticated PWA standalone / offline | ❌ Device gate (PMX-004) |

---

## Test Group A — Authentication

| Check | Result |
|-------|--------|
| Login / logout / refresh / expiration | ✅ PASS ([28a](./28a-implemented-role-regression-rerun.md)) |
| Protected routes (anon) | ✅ PASS |
| Organization / portal isolation | ✅ PASS |

**Group A:** ✅ **PASS**

---

## Test Group B — Role validation (M0.5 amended)

| Role | Result |
|------|--------|
| Master Administrator | ✅ PASS |
| Property Manager | ✅ PASS |
| Property Owner | ✅ PASS |
| Vendor | ✅ PASS |
| Tenant | ✅ PASS |
| Organization Administrator | ⏸ Deferred Slice D |
| Leasing Agent | ⏸ Deferred Slice D |
| Facility Technician | ⏸ Deferred Slice D |

**Group B:** ✅ **PASS** (amended scope)

---

## Test Group C — Core workflows

| Surface | Result |
|---------|--------|
| PM ops routes | ✅ PASS |
| Owner / Tenant / Vendor portals | ✅ PASS |
| QA dataset visible | ✅ PASS (requalified under [28a](./28a-implemented-role-regression-rerun.md)) |

**Group C:** ✅ **PASS**

---

## Test Group D — Storage

| Check | Result |
|-------|--------|
| `media-private` | ✅ PASS (REG-STOR-001) |

**Group D:** ✅ **PASS**

---

## Test Group E — PWA

| Check | Result |
|-------|--------|
| Real-device / standalone / offline | ❌ Not this gate — PMX-004 |

**Group E:** ⏸ Deferred to device certification (not part of M0.5 auth suite PASS)

---

## Test Group F — Error / ACL handling

| Check | Result |
|-------|--------|
| Portal → Ops immediate deny/redirect | ✅ PASS |
| Wrong portal | ✅ PASS |
| Non-route `/admin` | ✅ PAGE MISSING without Ops shell |

**Group F:** ✅ **PASS**

---

## Remaining regressions

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| **REG-STOR-001** | High | ✅ **CLOSED** | Production verified |
| **REG-ACL-001** | High | ✅ **CLOSED** | Production verified ([34](./34-reg-acl-001-production-verification.md)) |
| **REG-COV-001** | Coverage | ⏸ **DEFERRED Slice D** | Not an M0 blocker ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| **REG-AUTH-001** | Medium | OPEN | Smoke selector vs Sign up (non-blocking for M0.5) |

---

## PASS / FAIL matrix (implemented-role M0.5)

| Group | Result |
|-------|--------|
| A Authentication | ✅ PASS |
| B Role validation | ✅ PASS |
| C Core workflows | ✅ PASS |
| D Storage | ✅ PASS |
| E PWA | ⏸ Device gate |
| F Error / ACL | ✅ PASS |
| **M0.5 Authenticated Regression** | ✅ **PASS** |

---

## Next gate

**STOP** for implementation slices.

Authenticated Regression (implemented roles) is **PASS**.

1. **Only remaining M0 gate:** PMX-004 Real Device Certification — wait for explicit authorization.  
2. After device cert PASS → Final M0 Production Readiness Review.  
3. If all remaining gates PASS → M0 = **GO** → then `AUTHORIZE UX-012 SLICE A` may be issued.  
4. Do **not** authorize UX-012 / OPS / AUTH / COM / FIN-003 from this document.

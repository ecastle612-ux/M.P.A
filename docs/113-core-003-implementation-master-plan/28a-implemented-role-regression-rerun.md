# 28a — Implemented-Role Regression Rerun

**Package:** CORE-003 · M0 · Authenticated Regression  
**Authorization:** Implemented-Role Regression Rerun (LIMITED) · **ACTIVE**  
**Date:** 2026-07-24  
**Amendment in force:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
**Production URL:** `https://www.my-property-assistant.com`  
**Deploy under test:** `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf` (REG-ACL-001 included)  
**Prerequisites:** Deploy ✅ ([31a](./31a-reg-acl-001-deployment.md)) · REG-ACL Production Verification ✅ ([34](./34-reg-acl-001-production-verification.md))  
**Evidence:** [`m0-reg-003-rerun/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003-rerun/)  
**Harness:** `qa/e2e/scripts/run-m0-reg-003-regression.ts`  
**Related:** [28](./28-m0-authenticated-regression-certification.md)

> PMX-004 · Final M0 Review · UX-012 · AUTH deferred roles: 🔒 **not begun**.  
> Implemented roles only: Master Admin · Property Manager · Property Owner · Vendor · Tenant.  
> Verification only — no product code changes.

---

## Final result

| Field | Result |
|-------|--------|
| **Implemented-Role Regression Rerun** | ✅ **PASS** |
| **Automated checks** | 57 PASS / 2 FAIL (adjudicated) / 3 SKIP |
| **Adjudicated overall** | ✅ **PASS** (`adjudication.json`) |
| **REG-ACL-001 regressions** | **None** |
| **Required fixes** | **None** |
| **M0 overall** | ❌ Still **NO-GO** |
| **Recommend PMX-004 Device Certification?** | ✅ **YES** |
| **Recommend UX-012 / Final M0?** | ❌ **NO** (not this gate) |

---

## 1. Scope

| Included | Excluded |
|----------|----------|
| Master Administrator | Organization Administrator (Slice D) |
| Property Manager | Leasing Agent (Slice D) |
| Property Owner | Facility Technician (Slice D) |
| Vendor | PMX-004 device / standalone / offline |
| Tenant | UX-012 / new features |

---

## 2. Authentication

| Check | Result |
|-------|--------|
| Login all implemented roles (storage states) | ✅ PASS |
| Fresh PM login | ✅ PASS → `/dashboard` |
| Session refresh (reload) | ✅ PASS (all roles) |
| Session expiration (cookies cleared) | ✅ PASS → `/login` |
| Logout API + redirect + post-logout API 401 | ✅ PASS |
| Re-login PM | ✅ PASS |
| Anonymous protected routes / API | ✅ PASS → login / 401 |

---

## 3. Navigation

| Check | Result |
|-------|--------|
| Correct landings (5 roles) | ✅ PASS |
| Portal → Ops `/properties` redirect home | ✅ PASS (no Ops shell, no SetupGate) |
| History after Ops deep-link | ✅ PASS |
| PM → Master Admin deny | ✅ PASS |
| Tenant → Owner portal | ✅ `/unauthorized` |
| PM → Tenant portal | ✅ `/unauthorized` |

---

## 4. Permissions & isolation

| Check | Result |
|-------|--------|
| Allowed PM Ops surfaces functional | ✅ PASS |
| Restricted Master Admin / wrong portals blocked | ✅ PASS |
| Org isolation (QA property visible; Isolation Control absent) | ✅ PASS (requalified) |
| No Ops privilege escalation for portal roles | ✅ PASS |

---

## 5. Core workflows

| Surface | Result |
|---------|--------|
| PM: dashboard, properties, units, tenants, maintenance, vendors, leases, financials, communications, settings | ✅ PASS |
| PM: QA Certification Property visible | ✅ PASS (requalified; initial harness race) |
| Owner portal + sub-routes | ✅ PASS |
| Tenant portal + loading resolved | ✅ PASS |
| Vendor portal | ✅ PASS |
| Master Admin Mission Control | ✅ PASS |

---

## 6. API behavior

| Actor | `/api/properties` | Result |
|-------|-------------------|--------|
| Anonymous | 401 | ✅ |
| Post-logout | 401 | ✅ |
| PM | 200 | ✅ |
| Owner / Tenant / Vendor | 200 (Phase 4 `property:read` grants) | ✅ Expected — not Ops UI escalation |

---

## 7. UI stability

| Check | Result |
|-------|--------|
| Material console / page errors | ✅ PASS (React #418 hydration excluded as non-blocking, same as [34](./34-reg-acl-001-production-verification.md)) |
| Broken navigation from REG-ACL-001 | ✅ None |
| Blocking loading states | ✅ Tenant loading resolved |

---

## 8. Failures & required fixes

| Automated FAIL | Disposition |
|----------------|-------------|
| `C.pm.qa_property_visible` | **False positive** — client list race; requal PASS (`pm-properties-requal.json`, API 200 with QA property) |
| `E.org_isolation.pm_properties` | **False positive** — same race; requal PASS (QA visible, Isolation Control absent) |

**Required product fixes:** none.

---

## 9. PASS / FAIL recommendation

| Gate | Result |
|------|--------|
| Authentication | ✅ PASS |
| Navigation / ACL | ✅ PASS |
| Permissions / isolation | ✅ PASS |
| Core workflows | ✅ PASS |
| API | ✅ PASS |
| UI stability | ✅ PASS |
| **Implemented-Role Regression Rerun** | ✅ **PASS** |

---

## 10. Checklist

See [`verification-checklist.md`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003-rerun/verification-checklist.md).

---

## Next gate

1. ✅ Implemented-Role Regression Rerun **PASS** (this document).  
2. ❌ PMX-004 Device Certification **FAIL / BLOCKED** ([35](./35-pmx-004-real-device-certification.md)) — awaiting physical operators.  
3. After device cert PASS → Final M0 Production Readiness Review.  
4. M0 remains **NO-GO**. Do **not** issue `AUTHORIZE UX-012 SLICE A`.

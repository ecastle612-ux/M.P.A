# 34 — REG-ACL-001 Production Verification

**Package:** CORE-003 · M0 · Authenticated Authorization  
**Authorization:** M0 — REG-ACL-001 Production Verification (LIMITED) · **ACTIVE**  
**Date:** 2026-07-24  
**Amendment in force:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
**Production URL:** `https://www.my-property-assistant.com`  
**Deploy prerequisite:** ✅ COMPLETE ([31a](./31a-reg-acl-001-deployment.md))  
**Evidence:** [`m0-reg-acl-001/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001/)  
**Harness:** `qa/e2e/scripts/run-m0-reg-acl-001-prod.ts`  
**Related:** [28](./28-m0-authenticated-regression-certification.md) · [31](./31-role-model-reconciliation.md) · [31a](./31a-reg-acl-001-deployment.md)

> UX-012 / OPS / AUTH / COM / FIN-003 · PMX-004 device certification · Implemented-Role Regression Rerun: 🔒 **not begun** by this authorization.  
> Deferred roles (Org Admin / Leasing Agent / Facility Technician): **not** M0 blockers.  
> No product fixes implemented under this authorization.

---

## Final result

| Field | Result |
|-------|--------|
| **REG-ACL-001 Production** | ✅ **PASS** |
| **Automated checks** | 58 PASS / 1 FAIL (adjudicated non-blocking) / 0 SKIP |
| **Adjudicated overall** | ✅ **PASS** (`adjudication.json`) |
| **Unauthorized Ops shell reached?** | **No** |
| **SetupGate late-denial path?** | **No** (portal roles redirected to role home) |
| **Required fixes** | **None** for REG-ACL-001 |
| **M0 overall** | ❌ Still **NO-GO** |
| **Recommend Implemented-Role Regression Rerun?** | ✅ **YES** |
| **Recommend UX-012 / PMX-004?** | ❌ **NO** (not this gate) |

---

## 1. Deployment under test

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf` |
| Status | **READY** |
| Aliases | `www.my-property-assistant.com` · `my-property-assistant.com` · `m-p-a-web.vercel.app` |
| REG-ACL-001 included | ✅ Middleware + `(app)` layout ops-shell gate |
| Confirmed | `vercel inspect` · deploy artifacts |

---

## 2. Role matrix (implemented only)

| Role | Landing | Dashboard / surface | Result |
|------|---------|---------------------|--------|
| Master Administrator | `/master-admin` | Mission Control | ✅ PASS |
| Property Manager | `/dashboard` | Operations Center | ✅ PASS |
| Property Owner | `/portal/owner` | Owner portal | ✅ PASS |
| Vendor | `/portal/vendor` | Vendor portal | ✅ PASS |
| Tenant | `/portal/tenant` | Tenant portal | ✅ PASS |
| Organization Administrator | — | Deferred Slice D | ⏸ N/A |
| Leasing Agent | — | Deferred Slice D | ⏸ N/A |
| Facility Technician | — | Deferred Slice D | ⏸ N/A |

---

## 3. Authentication verification

| Check | Result | Evidence |
|-------|--------|----------|
| Anonymous → protected routes | ✅ → `/login` | `anon.route/*` |
| Login (all implemented roles) | ✅ storage states saved | `auth.login_storage_states` |
| Session refresh (reload) | ✅ stays on assigned surface | `auth.session_refresh.*` |
| Session expiration (cookies cleared) | ✅ → `/login` | `auth.session_expired` |
| Logout API | ✅ 200 | `auth.logout.api` |
| Logout redirect | ✅ → `/login` | `auth.logout.redirect` |
| Post-logout API | ✅ `/api/properties` 401 | `auth.logout.api_properties` |
| Re-login (PM) | ✅ → `/dashboard` | `auth.relogin.pm` |

---

## 4. Route protection

### Anonymous

| Route | Result |
|-------|--------|
| `/dashboard` `/properties` `/setup` `/portal/tenant` `/master-admin` | ✅ → `/login` |

### Portal roles → Ops (REG-ACL-001)

| Actor | `/dashboard` | `/properties` | `/maintenance` | `/setup` | `/profile` | `/admin` |
|-------|:------------:|:-------------:|:--------------:|:--------:|:----------:|:--------:|
| Tenant | ✅ → tenant | ✅ → tenant | ✅ → tenant | ✅ → tenant | ✅ → tenant | ✅ PAGE MISSING (no Ops shell) |
| Vendor | ✅ → vendor | ✅ → vendor | ✅ → vendor | ✅ → vendor | ✅ → vendor | ✅ PAGE MISSING (no Ops shell) |
| Owner | ✅ → owner | ✅ → owner | ✅ → owner | ✅ → owner | ✅ → owner | ✅ PAGE MISSING (no Ops shell) |

History navigation after Ops deep-link: ✅ no Ops shell / no SetupGate.

### Staff / Master

| Check | Result |
|-------|--------|
| PM `/dashboard` `/properties` `/maintenance` | ✅ Ops allowed |
| PM `/master-admin` | ✅ No Mission Control (redirected to Ops home) |
| Master Admin `/master-admin` | ✅ Mission Control |

### Isolation

| Check | Result |
|-------|--------|
| Tenant → `/portal/owner` | ✅ `/unauthorized` |
| PM → `/portal/tenant` | ✅ `/unauthorized` |

---

## 5. API protection

| Actor | `/api/properties` | Result |
|-------|-------------------|--------|
| Anonymous | **401** | ✅ PASS |
| After PM logout | **401** | ✅ PASS |
| PM (authenticated, pre-logout) | **200** | ✅ PASS (authorized) |
| Owner | **200** + org-scoped items | ✅ Expected (`property:read` grant) |
| Tenant / Vendor | **200** + org-scoped items | ✅ Expected (Phase 4 grants include `property:read`); **not** Ops UI escalation |

No API contract changes. No privilege escalation into Operations shell via routes.

---

## 6. Authorization behavior

| Layer | Result |
|-------|--------|
| Role resolution → assigned home | ✅ PASS |
| Ops membership allow-list (`property_manager` + Master Admin) | ✅ PASS |
| Portal-only deny Ops shell | ✅ PASS |
| Organization / portal isolation redirects | ✅ PASS |
| Access denial (`/unauthorized`) | ✅ PASS |
| RLS / membership CHECKs | ✅ Unchanged (no REG-ACL migrations) |

---

## 7. Production integrity

| Check | Result |
|-------|--------|
| Auth regressions | ✅ None observed |
| Broken navigation from REG-ACL-001 | ✅ None — landings and denies correct |
| Runtime / console | ⚠ React #418 hydration on time-based greeting — **adjudicated non-blocking** for REG-ACL (`adjudication.json`) |
| REG-ACL-caused errors | ✅ None |

---

## 8. Failures & required fixes

| Item | Disposition |
|------|-------------|
| `integrity.console_errors` (React #418) | **False positive for REG-ACL-001** — hydration text mismatch; not Ops escalation. No REG-ACL fix required. |
| Product code changes | **None** under this authorization |

---

## 9. PASS / FAIL recommendation

| Gate | Result |
|------|--------|
| Deployment READY + REG-ACL present | ✅ PASS |
| Authentication flows | ✅ PASS |
| Route protection (anon + role) | ✅ PASS |
| API protection | ✅ PASS |
| Authorization / isolation | ✅ PASS |
| No unauthorized Ops shell | ✅ PASS |
| **REG-ACL-001 Production Verification** | ✅ **PASS** |

### Stop condition

**Not triggered.** No unauthorized user reached the Operations shell or SetupGate late-denial path.

---

## 10. Verification checklist

See [`verification-checklist.md`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001/verification-checklist.md).

---

## Next gate

1. ✅ REG-ACL-001 Production Verification **PASS** (this document).  
2. ✅ Implemented-Role Regression Rerun **PASS** ([28a](./28a-implemented-role-regression-rerun.md)).  
3. **Next:** Authorize **PMX-004 Real Device Certification** — do **not** begin from this document.  
4. M0 remains **NO-GO**. Do **not** issue `AUTHORIZE UX-012 SLICE A`.

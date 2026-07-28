# 31a — REG-ACL-001 Deployment

**Package:** CORE-003 · M0 · Authorization remediation deploy  
**Authorization:** Deploy REG-ACL-001 (LIMITED)  
**Date:** 2026-07-24  
**Architecture SoT:** [31 — Role Model Reconciliation](./31-role-model-reconciliation.md)  
**Amendment in force:** `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ ([33](./33-core-003-amd-m0-auth-role-cert-defer.md))  
**Evidence:** [`m0-reg-acl-001-deploy/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001-deploy/) · prior ship log [`m0-reg-acl-001/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001/)

> M0 remains **NO-GO**.  
> UX-012 / Organization Admin / Leasing Agent / Facility Technician / future slices: 🔒 **not authorized**.  
> **Production Verification is not begun by this document.**

---

## Final result

| Field | Result |
|-------|--------|
| **REG-ACL-001 Deployment** | ✅ **COMPLETE** |
| **Production status** | ✅ **READY** · aliased |
| **Migrations required** | None |
| **Env / configuration changes** | None |
| **New features / roles** | None |
| **Recommend Production Verification?** | ✅ **YES** — may proceed under separate authorization |
| **M0 overall** | ❌ Still **NO-GO** |
| **Recommend UX-012 unlock?** | ❌ **NO** |

---

## 1. Deployment summary

REG-ACL-001 remediation is **live on Production**. No redeploy was executed under this authorization because Production already serves the REG-ACL-001 ship (`dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`), and a working-tree redeploy would risk shipping unrelated local changes outside REG-ACL-001 scope.

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf` |
| Deployment URL | `https://m-p-a-3uhuplb8c-ecastle612-uxs-projects.vercel.app` |
| Target | **production** |
| Status | **READY** |
| Aliases | `www.my-property-assistant.com` · `my-property-assistant.com` · `m-p-a-web.vercel.app` |
| Created | 2026-07-23 ~23:45 CDT |
| Inspector | https://vercel.com/ecastle612-uxs-projects/m-p-a-web/HFdpfdy5jS8kdQKSUKa6iKcU4hBf |
| Includes | Ops-shell access helpers · middleware membership gate · `(app)` layout belt-and-suspenders · portal hub / SetupGate / shell-context hardening |

---

## 2. Files changed (REG-ACL-001 scope)

| File | Change |
|------|--------|
| `apps/web/src/lib/auth/ops-shell-access.ts` | **New** — Ops shell eligibility, assigned surface home, path classification |
| `apps/web/src/lib/auth/ops-shell-access.test.ts` | **New** — unit coverage for Ops allow/deny + landings |
| `apps/web/src/middleware.ts` | Membership role evaluation before Ops paths; Master Admin HQ deny for non–Master Admin |
| `apps/web/src/app/(app)/layout.tsx` | Belt-and-suspenders redirect — never render Ops shell for portal-only roles |
| `apps/web/src/app/(portals)/portal/page.tsx` | Portal hub (Ops shell) blocked for portal-only roles |
| `apps/web/src/components/setup/setup-gate.tsx` | Never funnel `/portal/*` into `/setup` |
| `apps/web/src/lib/auth/get-shell-context.ts` | Stop inventing `property_manager` for empty memberships |

**Out of scope (not introduced by REG-ACL-001):** Organization Admin / Leasing Agent / Facility Technician membership roles, AUTH-001 slices, UX-012, API contract changes, schema changes.

---

## 3. Migrations executed

| Item | Result |
|------|--------|
| New Supabase migrations for REG-ACL-001 | **None** |
| Membership role CHECK changes | **None** — still `property_manager` · `property_owner` · `tenant` · `vendor` |
| New RLS policies | **None** |

REG-ACL-001 is an application-layer Ops-shell gate on top of existing Phase 3 authorization / RLS. Existing RLS and `role_permission_grants` remain authoritative for data plane access.

---

## 4. Environment / configuration changes

| Item | Result |
|------|--------|
| Vercel env vars | **No change** |
| Supabase Auth redirect allow-list | **No change** |
| Feature flags | **No change** |
| DNS / aliases | **No change** — existing Production aliases retained |

---

## 5. Deployment steps (executed / confirmed)

1. REG-ACL-001 remediation implemented per [31](./31-role-model-reconciliation.md) (middleware + layout + helpers).  
2. Production ship previously executed via Vercel Production deploy → `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf` (READY).  
3. This authorization **confirmed** current Production alias still points at that deployment (`vercel inspect www.my-property-assistant.com`).  
4. **No additional Production redeploy** — avoids shipping unrelated dirty working-tree changes.  
5. Unit tests for `ops-shell-access` executed locally — **4/4 PASS**.  
6. Anonymous route / API protection probes recorded under `m0-reg-acl-001-deploy/`.

---

## 6. Verification performed (deploy gate — not Production Verification)

### 6.1 Code / unit

| Check | Result |
|-------|--------|
| `ops-shell-access` unit tests | ✅ 4/4 PASS |
| Ops membership allow-list | ✅ `property_manager` only (+ Master Admin capability) |
| Portal role assigned homes | ✅ owner / tenant / vendor → `/portal/{role}` |
| No invented `property_manager` for empty roles | ✅ Present in `get-shell-context` |

### 6.2 Route protection (anonymous)

| Route | Expected | Observed |
|-------|----------|----------|
| `/properties` | → `/login` | ✅ 307 `location: /login` |
| `/dashboard` | → `/login` | ✅ 307 `location: /login` |
| `/setup` | → `/login` | ✅ 307 `location: /login` |
| `/master-admin` | → `/login` | ✅ 307 `location: /login` |
| `/portal/tenant` | → `/login` | ✅ 307 `location: /login` |

### 6.3 API protection (anonymous)

| Route | Expected | Observed |
|-------|----------|----------|
| `/api/properties` | Unauthorized | ✅ **401** |

### 6.4 RLS / authorization / permissions (config validation)

| Layer | Status | Notes |
|-------|--------|-------|
| RLS | ✅ Unchanged / intact | No REG-ACL migration; existing org-scoped policies remain |
| Membership role model | ✅ Unchanged | Four implemented roles only |
| `requireRole` / permission grants | ✅ Unchanged | No API contract break |
| Middleware Ops gate | ✅ Deployed | Evaluates `organization_memberships.roles` before Ops UI |
| `(app)` layout gate | ✅ Deployed | Second line of defense if middleware bypassed |
| SetupGate portal funnel | ✅ Deployed | `/portal/*` never forced to `/setup` |

Authenticated role-matrix probes (tenant/vendor/owner → Ops redirect home, PM Ops allow, Master Admin HQ) are **reserved for Production Verification** and were **not** executed under this authorization.

---

## 7. Regression observations (deploy-level)

| Area | Observation |
|------|-------------|
| Anonymous protection | No regression — Ops / portal / Master Admin still require login |
| API anonymous access | No regression — `/api/properties` remains 401 |
| Role model | No expansion — deferred AUTH roles not invented |
| Breaking API changes | None |
| Product behavior | Tightened only: portal-only roles cannot enter Ops shell (approved REG-ACL-001 intent) |

Full authenticated implemented-role regression remains a **Production Verification** / [28](./28-m0-authenticated-regression-certification.md) concern — not closed by this deploy document.

---

## 8. Known risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Authenticated ACL matrix not re-probed under this auth | Medium | Proceed to Production Verification before treating REG-ACL as M0-closed |
| Working tree contains unrelated local changes | Medium | This auth did **not** redeploy; future deploys must isolate scope |
| `/admin` 404 copy may mention Operations Center | Low | Not an Ops shell render; adjudicate under Production Verification if re-seen |
| Middleware depends on membership read via anon key + user session | Low | Same pattern as existing auth; RLS still bounds data |

---

## 9. Rollback procedure

1. In Vercel → Project `m-p-a-web` → Deployments, open the prior Production deployment (`dpl_HKHS54QHqS6w5d6NaMqBGr5qF53o` or latest known-good pre–REG-ACL).  
2. **Promote** that deployment to Production (re-alias `www.my-property-assistant.com`).  
3. Confirm anonymous `/properties` still → `/login`.  
4. Re-run authenticated portal → Ops probes under a new authorization if rollback is retained.  
5. No database rollback required (no REG-ACL-001 migrations).

---

## 10. Blockers

| Blocker | Status |
|---------|--------|
| Production deploy missing REG-ACL-001 | ✅ **None** — deploy live |
| Migration / env blocker | ✅ **None** |
| Scope creep into AUTH-001 / UX-012 | ✅ **Avoided** |
| Authenticated Production ACL proof | ⏳ **Not this gate** — requires Production Verification authorization |

---

## 11. Verification checklist (deploy)

- [x] REG-ACL-001 code present (helpers + middleware + layout + SetupGate + shell-context)
- [x] Production deployment READY
- [x] Correct Production aliases
- [x] No REG-ACL migrations pending
- [x] No env changes required
- [x] Unit tests PASS
- [x] Anonymous route protection intact
- [x] Anonymous API protection intact
- [x] No new roles / no AUTH-001 Slice D implementation
- [x] No UX-012 begun
- [x] Deployment summary recorded
- [ ] Authenticated role ACL matrix — **deferred to Production Verification**
- [ ] Implemented-role regression re-run — **deferred to Production Verification**

---

## Next gate

1. ✅ **Deploy REG-ACL-001** — COMPLETE (this document).  
2. ✅ **REG-ACL-001 Production Verification** — ✅ **PASS** ([34](./34-reg-acl-001-production-verification.md)).  
3. **Next:** Authorize **Implemented-Role Regression Rerun** — do not begin PMX-004 / UX-012 from deploy.  
4. M0 remains **NO-GO**. Do **not** issue `AUTHORIZE UX-012 SLICE A`.

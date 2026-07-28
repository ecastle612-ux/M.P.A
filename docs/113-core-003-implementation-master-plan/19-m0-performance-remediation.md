# 19 — M0 Performance Remediation

**Package:** CORE-003 · M0-PERF-001  
**Authorization:** LIMITED to M0 Performance Remediation (2026-07-24)  
**Source plan:** [18 §7](./18-m0-lighthouse-recovery.md)  
**Status:** Batch complete · Historical Perf **67** · Hard ≥95 later **superseded** by [24](./24-core-003-amd-m0-perf-framework-limit.md) · M0 ❌ **NO-GO** (other gates)  
**UX-012 / OPS / AUTH / COM / FIN:** Not started  

---

## 8. GO / NO-GO Decision (executive)

| Field | Result (at batch close) |
|-------|--------|
| Performance (lab) | **67** (historical hard ≥95 later superseded — [24](./24-core-003-amd-m0-perf-framework-limit.md)) |
| Accessibility (lab) | **91** (later recovered to 100 in Option B/C) |
| Best Practices 100 | ✅ **YES** |
| PWA 100 | ⚠ N/A as LH12 category — not claimed |
| Critical regressions from this batch | None observed in build/typecheck/unit |
| **M0 Production Readiness** | ❌ **NO-GO** |
| **Authorize UX-012 Slice A?** | ❌ **NO** |

**Stop rule applied (at the time):** Further gains toward historical ≥95 required aggressive auth-route JS isolation (plan R1/R2), classified **medium/high regression risk**. Those continued via authorized Option B/C; hard ≥95 gate later amended.

---

## 1. Files Modified

| Path | Change |
|------|--------|
| `apps/web/src/components/branding/auth-brand-shell.tsx` | Converted to **Server Component**; WebP LCP via `next/image`; removed client BrandLogo from auth chrome |
| `apps/web/src/components/branding/brand-logo.tsx` | `<picture>` WebP + PNG fallback |
| `apps/web/src/components/shell/login-form.tsx` | Dynamic `import()` of auth client on submit only |
| `apps/web/src/components/pwa/register-service-worker.tsx` | Idle-deferred SW registration |
| `apps/web/src/app/providers.tsx` | Dynamic `AuthSessionSync`; idle-deferred debug trace |
| `apps/web/src/app/layout.tsx` | Reduced Google font weights (400/600 sans; 400 mono) |
| `apps/web/src/lib/branding.ts` | Re-export WebP path helpers |
| `packages/shared/src/branding.ts` | `MPA_LOGO_*_WEBP_PATH` + `logoWebpPathForTone` |
| `packages/shared/src/branding.test.ts` | WebP mapping tests |
| `apps/web/public/branding/logo-light.webp` | **Added** (~8.5 KiB vs 62 KiB PNG) |
| `apps/web/public/branding/logo-dark.webp` | **Added** (~8.9 KiB vs 55 KiB PNG) |
| Lighthouse artifacts | `artifacts/.../lighthouse/login-m0-perf-remediation.report.{json,html,metrics.json}` |

**Not modified:** APIs, schema, auth business logic, workflows, UX-012/OPS/AUTH/COM/FIN packages.

---

## 2. Optimizations Implemented

| ID | From plan | Implemented | Risk taken |
|----|-----------|-------------|------------|
| R3 | Logo / LCP WebP + avoid dual fetch | ✅ Auth shell WebP only; BrandLogo `<picture>` | Low |
| R4 | Font trim (CSS partition deferred) | ✅ Font weight reduction only | Low |
| R1 subset | Defer non-critical main-thread work | ✅ Idle SW register; idle debug trace; dynamic AuthSessionSync | Low |
| R1 subset | Lazy auth client | ✅ `createAuthClient` on submit | Low |
| R2 subset | Auth chrome out of client bundle | ✅ AuthBrandShell → RSC | Low |
| R1/R2 full | Aggressive shared-chunk / provider isolation | ❌ **Stopped** — medium/high regression risk | — |

---

## 3. Before / After Lighthouse Scores

| Run | Host | Perf | A11y | BP | SEO |
|-----|------|-----:|-----:|---:|----:|
| Baseline (doc 18) | Production `www` | **66** | 96 | 100 | 61 |
| After remediation | Local `next start` `:3010` | **67** | 91 | 100 | 69 |

**Artifacts:**  
`docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/lighthouse/login-m0-perf-remediation.*`

**Note:** Production URL was **not** redeployed in this session. Local production build is the post-change measurement. Lab variance applies (local TBT measured **worse** than prod baseline despite code wins on images/deferral).

### Lab metrics (after, local)

| Metric | Value |
|--------|-------|
| FCP | 1.0 s |
| LCP | 1.9 s (improved vs 2.6 s prod baseline) |
| **TBT** | **7,400 ms** (still critical) |
| CLS | 0 |
| SI | 4.6 s |
| TTI | 10.6 s |

---

## 4. Performance Gains

| Area | Result |
|------|--------|
| LCP / images | Improved (WebP + RSC mark; LCP 2.6s → 1.9s in local lab) |
| Dual logo download on login | Removed for auth chrome (light mark only) |
| Login client surface | Shell no longer a client tree |
| Supabase on first paint | Deferred until submit / dynamic session sync |
| SW registration | Deferred to idle |
| **Overall Performance score** | **+1 point (66 → 67)** — **insufficient for ≥95** |
| Remaining bottleneck | Large shared JS chunks (`3o8…`, `3as…`) still dominate TBT |

---

## 5. Regression Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` (apps/web) | ✅ PASS |
| ESLint on touched files | ✅ PASS (0 errors) |
| `packages/shared` branding tests | ✅ 4/4 PASS |
| `pnpm build` (apps/web) | ✅ PASS |
| Authenticated product regression suite | ❌ Not run (requires device/session; remains M0 blocker) |
| Full-repo `pnpm lint` | ⚠ Not completed (tooling timeout); scoped eslint used |

**Functional intent preserved:** same login form, same auth API calls (timing of client load changed), same SW URL/scope, theme providers retained.

---

## 6. Remaining M0 Blockers

| ID | Status |
|----|--------|
| Performance ≥95 | ❌ Open (67) |
| PMX-004 Phase 1 real-device cert | ❌ Open |
| PAY-001 verification | ❌ Open |
| Infrastructure full attestation | ⚠ Conditional |
| Authenticated regression validation | ❌ Open |
| Production redeploy + prod LH re-measure | ⏳ Pending ops deploy of this batch |

---

## 7. Updated Production Readiness Score (perf dimension)

| Dimension | Prior (doc 14/18) | After M0-PERF-001 |
|-----------|------------------:|------------------:|
| Performance | 5 | **5** (still far from ≥95) |
| Accessibility (lab) | 9 | **8** (91; contrast/ARIA findings on auth chrome) |
| Overall M0 | NO-GO | **NO-GO** |

---

## Deferred work (requires new authorize if pursued)

To approach ≥95 without guessing:

1. **Profile** production `/login` Performance panel → map `3o8…` / `3as…` modules.  
2. **Auth-route provider boundary** (full R2) — Theme/Toast/`@mpa/ui` surface for `(auth)` only — **medium/high risk**.  
3. Redeploy and re-run [run-lighthouse-m0.sh](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/lighthouse/run-lighthouse-m0.sh) against production.

Do **not** begin UX-012 Slice A.

---

## Validation commands used

```bash
pnpm typecheck
pnpm exec eslint <touched files>
cd packages/shared && pnpm exec vitest run src/branding.test.ts
cd apps/web && pnpm build
pnpm exec next start -p 3010
# lighthouse → login-m0-perf-remediation.*
```

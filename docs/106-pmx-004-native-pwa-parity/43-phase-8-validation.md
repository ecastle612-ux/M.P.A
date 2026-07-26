# 43 — PMX-004 Phase 8 Validation

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 8 — Performance Optimization  
**Authorization:** [41](./41-phase-8-authorization.md)  
**Implementation:** [42](./42-phase-8-implementation.md)  
**Status:** ✅ **PASS**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 8
```

**Program record:** [CORE-003 §83](../113-core-003-implementation-master-plan/83-pmx-004-phase-8-validation.md)

> Validation only. No application-code changes in this record.  
> Prior Phase 6–7 validation trail preserved.  
> PMX-004 Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** authorized under this phrase.

---

## 1. Deployment summary

| Field | Value |
|-------|--------|
| **Branch** | `checkpoint/pre-phase5` |
| **Production ship SHA** | `f988ae5b1168c6bbc8d09750700d20bc8eb938bc` (`f988ae5`) |
| **Ship commits** | `fdbbabc` (Phase 8 OPT) · `dbda7f4` (TS build fix) · `f988ae5` (outbox exactOptionalPropertyTypes fix) |
| **Deployment ID** | `dpl_FJyvRpYAeTYEvJL7P8admpkgupfZ` |
| **Deploy target** | Production · project `m-p-a-web` |
| **Ready state** | ● Ready |
| **Production URL** | https://www.my-property-assistant.com |
| **Method** | Clean worktree at ship SHA → `vercel deploy --prod` (unrelated AUTH/COM WIP excluded) |
| **Schema / migrations** | None in ship range `52f1605..f988ae5` |

---

## 2. Final determination

| Field | Result |
|-------|--------|
| **Phase 8 Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 8` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** |
| **Phase 8 approved for program progression?** | ✅ **YES** — Phase 8 **Validated / Approved** |
| **A11** | ✅ Satisfied via measured gates + Product-accepted waivers (**PERF-WAIVER-P8-01** · **PWA-WAIVER-P8-01**) |
| **Recommend `AUTHORIZE PMX-004 PHASE 9`?** | ✅ **Eligible** — recommend next dedicated session |
| **Issue `AUTHORIZE PMX-004 PHASE 9` in this session?** | ❌ **NO** |
| **Begin Phase 9 / UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** until each authorize |
| **Claim package COMPLETE?** | ❌ **NO** — Phase 11 gate |

---

## 3. Production verification

| Check | Evidence | Result |
|-------|----------|--------|
| Correct deployed SHA | Ship SHA `f988ae5` · deploy `dpl_FJyvRpYAeTYEvJL7P8admpkgupfZ` READY · Production aliases live | ✅ |
| Expected OPT present | Fontshare absent · IBM Plex `next/font` preload · `data-mpa-shell="auth"` · CSP intact | ✅ |
| No deployment regression | `/login` HTTP 200 · login UI intact · security headers present | ✅ |
| Routes preserved | Auth login + forgot-password link · manifest · icons unchanged | ✅ |
| PMX functionality preserved | Install meta · SW scripts · Phase 7 outbox hooks in `sw-offline.js` | ✅ |
| Service Worker unchanged (behavior) | `OneSignalSDKWorker.js` `no-cache, no-store` · `mpa-outbox-sync` / `MPA_REQUEST_SYNC` present | ✅ |

---

## 4. Evidence method (this session)

| Method | Used |
|--------|------|
| Production deploy (scoped Phase 8 SHA) | ✅ `dpl_FJyvRpYAeTYEvJL7P8admpkgupfZ` |
| Production HTTP / HTML / SW probes | ✅ |
| Lighthouse 12.6.0 mobile simulate — baseline + after | ✅ `/login` |
| Optimization log OPT-01…08 + after deltas | ✅ |
| Static review of ship commits vs [41](./41-phase-8-authorization.md) | ✅ |
| Schema / migration scan of ship range | ✅ None |
| Scope scan (Phases 9–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace) | ✅ Absent from ship |

---

## 5. Lighthouse / Core Web Vitals (Production `/login`)

**Profile:** Mobile simulate · Lighthouse **12.6.0** · same as baseline.

| Metric | Baseline | After (Production) | Delta |
|--------|----------|--------------------|-------|
| Performance | **47** | **69** | **+22** |
| Accessibility | **96** | **96** | 0 |
| Best Practices | **100** | **100** | 0 |
| LCP | 4,770 ms | 1,795 ms | **−2,975 ms** |
| FCP | 1,150 ms | 1,045 ms | −105 ms |
| CLS | 0 | 0 | 0 |
| TBT | 9,327 ms | 7,070 ms | **−2,257 ms** |
| Speed Index | 6,237 ms | 2,931 ms | **−3,306 ms** |

Artifacts:

- Baseline: [baseline-login.metrics.json](./artifacts/phase-8-lighthouse/baseline-login.metrics.json) · [baseline-login.report.html](./artifacts/phase-8-lighthouse/baseline-login.report.html)  
- After: [after-login.metrics.json](./artifacts/phase-8-lighthouse/after-login.metrics.json) · [after-login.report.html](./artifacts/phase-8-lighthouse/after-login.report.html)  
- Log: [optimization-log.md](./artifacts/phase-8-lighthouse/optimization-log.md)

---

## 6. Product-accepted A11 waivers

| ID | Gate | Rationale | Status |
|----|------|-----------|--------|
| **PERF-WAIVER-P8-01** | Performance ≥ 95 | Mobile-throttled Perf remains constrained by Next.js app-router + auth SDK + OneSignal shell (M0 historical `/login` Perf ~59–67). Phase 8 delivered material LCP/TBT/SI gains (+22 Perf, −3.0 s LCP, −2.3 s TBT) without feature removal or security weakening. Score chasing via stripping OneSignal/auth would violate non-negotiables. | ✅ **Product Accept** (this validation) |
| **PWA-WAIVER-P8-01** | LH PWA ≥ 100 numeric | LH 12.6 run with selected categories did not emit a numeric `pwa` score. Installability remains certified under Phase 2 **VALIDATED PASS** ([21](./21-phase-2-validation.md)); Production manifest / Apple meta / SW paths verified this session. | ✅ **Product Accept** (this validation) |

Accessibility **96** (≥ 95) and Best Practices **100** met without waiver.

---

## 7. Acceptance criteria — P8-01 … P8-10

| ID | Criterion | Evidence | Result |
|----|-----------|----------|--------|
| **P8-01** | Baseline captured | Production `/login` LH artifacts before OPT ([baseline-login.*](./artifacts/phase-8-lighthouse/)) | ✅ **PASS** |
| **P8-02** | Optimization log | OPT-01…08 with reason · before · after · delta ([optimization-log.md](./artifacts/phase-8-lighthouse/optimization-log.md)) | ✅ **PASS** |
| **P8-03** | Image pipeline | `MediaImage` → `next/image` · Supabase `remotePatterns` · signed URL `unoptimized` (`media-image.tsx` · `next.config.ts` in ship) | ✅ **PASS** |
| **P8-04** | Code-splitting | `dynamic()` FloatingAiCopilot · ImageEditorModal · NotificationCenter (+ preserved CommandCenter / AuthSessionSync) | ✅ **PASS** |
| **P8-05** | Hydration / server boundaries | Root `AppProviders` removed; Production auth shell `data-mpa-shell="auth"`; providers via `ShellProviders` post-login | ✅ **PASS** |
| **P8-06** | Font / cache / animation | Fontshare removed · IBM Plex preload · SW `no-store` preserved · `prefers-reduced-motion` scroll gates | ✅ **PASS** |
| **P8-07** | A11 Lighthouse gates | a11y 96 · BP 100 met; Perf 69 + **PERF-WAIVER-P8-01**; PWA via **PWA-WAIVER-P8-01** + Phase 2 | ✅ **PASS** |
| **P8-08** | A11y / security non-regression | a11y unchanged 96; CSP / security headers present; no score chasing via CSP weakening | ✅ **PASS** |
| **P8-09** | Regression / non-negotiables | Phases 1–7 SW/install/shell/outbox preserved; OneSignal primary; AUTH/COM/OPS A–B/UX A–B not expanded in ship; no schema | ✅ **PASS** |
| **P8-10** | Docs & scope boundaries | [42](./42-phase-8-implementation.md) + this report; no Phases 9–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace · EP-019 CLOSE · IA redesign | ✅ **PASS** |

**Score:** **10 / 10 PASS**

---

## 8. Exit criteria roll-up ([41](./41-phase-8-authorization.md) §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P8-01–P8-10 PASS | ✅ |
| 2 | A11 satisfied (targets or Product waivers) | ✅ |
| 3 | Baseline + post-optimization artifacts filed | ✅ |
| 4 | Accessibility / security non-regression | ✅ |
| 5 | Phases 1–7 / OneSignal / no schema | ✅ |
| 6 | Docs updated (implement + validation + boards) | ✅ (this session) |
| 7 | Governance recommendation recorded | ✅ §9 |
| 8 | Phrase recorded | ✅ |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Approve Phase 8 as Validated?** | ✅ **YES** |
| **Remediation required?** | ❌ **None** |
| **Eligible to authorize Phase 9?** | ✅ **YES** — Premium Native Features becomes the next PMX authorize unit |
| **Issue `AUTHORIZE PMX-004 PHASE 9` in this session?** | ❌ **NO** — separate governance phrase required |
| **Authorize UX-012 C–E / OPS-001 C–E / FIN-003 C–E / marketplace?** | ❌ **NO** |

**Next (recommended, not issued):** Dedicated session → **`AUTHORIZE PMX-004 PHASE 9`**.

---

## 10. Residual notes (non-blocking)

1. Residual mobile-throttled TBT remains dominated by framework/auth/push shell — accepted under **PERF-WAIVER-P8-01**; further Perf work belongs to EP-019 or a later authorize, not Phase 8 scope expansion.  
2. Lab-only after-scores were not used; Validation used Production remeasure on the live ship SHA.  
3. Unrelated AUTH/COM WIP in the working tree was excluded from the Production ship.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **PASS** — `VALIDATE PMX-004 PHASE 8` | 2026-07-26 |
| Remediation | ❌ Not required | — |
| Phase 8 program status | ✅ **Validated / Approved** | 2026-07-26 |
| Phase 9 authorize | 🔒 Eligible · **not issued** this session | — |

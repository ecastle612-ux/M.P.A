# 82 — PMX-004 Phase 8 Implementation (program record)

**Program:** CORE-003  
**Package:** PMX-004 Phase 8 — Performance Optimization  
**Package summary:** [106 §42](../106-pmx-004-native-pwa-parity/42-phase-8-implementation.md)  
**Authorization:** [§81](./81-pmx-004-phase-8-authorization.md) · [106 §41](../106-pmx-004-native-pwa-parity/41-phase-8-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED PASS** ([§83](./83-pmx-004-phase-8-validation.md))  
**Date:** 2026-07-26  
**Production ship SHA:** `f988ae5b1168c6bbc8d09750700d20bc8eb938bc`  
**Deployment ID:** `dpl_FJyvRpYAeTYEvJL7P8admpkgupfZ`  

---

## Scope shipped

Measure-first Lighthouse baseline · Fontshare removal · root provider hydration cut · MediaImage/`next/image` · dynamic splits (AI / cropper / notifications) · font token align · reduced-motion scroll. Evidence under [PMX-004 artifacts/phase-8-lighthouse](../106-pmx-004-native-pwa-parity/artifacts/phase-8-lighthouse/).

**Not shipped:** Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · marketplace UI · schema · EP-019 Approve · IA redesign.

---

## Metrics (Production `/login`)

| | Perf | a11y | BP | LCP | TBT |
|--|------|------|----|-----|-----|
| Baseline | 47 | 96 | 100 | 4.8 s | 9.3 s |
| After ship | **69** | **96** | **100** | **1.8 s** | **7.1 s** |

Validation: [§83](./83-pmx-004-phase-8-validation.md) · waivers PERF-WAIVER-P8-01 · PWA-WAIVER-P8-01 Product Accept.

---

## Next gate

| Step | Phrase | Status |
|------|--------|--------|
| Validate Phase 8 | `VALIDATE PMX-004 PHASE 8` | ✅ **PASS** ([§83](./83-pmx-004-phase-8-validation.md)) |
| Authorize Phase 9 | `AUTHORIZE PMX-004 PHASE 9` | 🔒 Eligible · **not issued** |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** | 2026-07-26 |
| Validation | ✅ **PASS** | 2026-07-26 |

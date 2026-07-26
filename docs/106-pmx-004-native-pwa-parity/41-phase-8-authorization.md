# 41 — PMX-004 Phase 8 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **8 — Performance Optimization**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([42](./42-phase-8-implementation.md)) · ✅ **VALIDATED PASS** ([43](./43-phase-8-validation.md))  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 8
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 8
```

**Program record:** [CORE-003 §81](../113-core-003-implementation-master-plan/81-pmx-004-phase-8-authorization.md)  
**Prior gate:** [40 — Phase 7 Validation](./40-phase-7-validation.md) · ✅ **PASS** · [CORE-003 §80](../113-core-003-implementation-master-plan/80-pmx-004-phase-7-validation.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 8  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 8 · [06 — Acceptance criteria](./06-acceptance-criteria.md) (phase minimum = **A11**) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) §7 · [00 — Purpose & scope](./00-purpose-and-scope.md) · [03 — Risk assessment](./03-risk-assessment.md) R12 · [04 — Regression risks](./04-regression-risks.md)  
**Measurement discipline:** Aligns with [EP-019](../87-ep-019-performance-speed-certification/README.md) evidence-first rules — **does not** Approve or authorize the full EP-019 package  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — performance work must preserve Canopy / `--mpa-*` tokens; **no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 7 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 8` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.  
> This session is **governance only** — no application code under this authorize document.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| PMX-004 Approved with Amendments | [12](./12-approval-checklist.md) · Amendments 01–03 | ✅ |
| Phase 1 Final PASS / Certified | [17](./17-phase-1-production-validation.md) · [CORE-003 §35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) | ✅ |
| Phase 2 Validated PASS | [21](./21-phase-2-validation.md) · [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md) | ✅ |
| Phase 3 Validated PASS | [24](./24-phase-3-validation.md) · [CORE-003 §65](../113-core-003-implementation-master-plan/65-pmx-004-phase-3-validation.md) | ✅ |
| Phase 4 Validated PASS | [28](./28-phase-4-validation.md) · [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md) | ✅ |
| Phase 5 Validated PASS | [31](./31-phase-5-validation.md) · [CORE-003 §71](../113-core-003-implementation-master-plan/71-pmx-004-phase-5-validation.md) | ✅ |
| Phase 6 Validated PASS | [37](./37-phase-6-validation-rerun-3.md) · [CORE-003 §77](../113-core-003-implementation-master-plan/77-pmx-004-phase-6-validation-rerun-3.md) | ✅ |
| Phase 7 Validated PASS | [40](./40-phase-7-validation.md) · [CORE-003 §80](../113-core-003-implementation-master-plan/80-pmx-004-phase-7-validation.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| Next PMX authorize unit = Phase 8 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 7 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX slice blocking this phrase | Phase 7 Validated · no open authorize ahead of Phase 8 | ✅ |
| PMX-004 Phase 9–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Full EP-019 package Approve | Not required for this authorize (Phase 8 uses EP-019 **discipline** only) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 8?** ❌ **None.**

**Order note:** Package [05](./05-implementation-order.md) Phase 8 is Performance Optimization after Offline Reliability. Program sequence authorizes Phase 8 after Phase 7 Validated. This phrase authorizes **PMX-004 Phase 8 (Performance Optimization)** only. Peers remain separately gated.

**Collision guard:** No Phase 9–11 authorize/implement docs present at issue time. Doc slots: package §41 = this authorize · CORE-003 §81 = program record (does not collide with Phase 7 §38–§40 / §78–§80).

---

## 2. Authorization scope

### In scope (Phase 8 — Performance Optimization)

Binding work list from [05](./05-implementation-order.md) Phase 8 and [08](./08-testing-strategy.md) §7 — **measure first · evidence-only optimization · A11 Lighthouse gates · no redesign**:

| Deliverable | Binding source |
|-------------|----------------|
| **Baseline measurement** — Lighthouse + Web Vitals on agreed reference profiles (mid-tier Android + iPhone / mobile-throttled lab as documented); cold authenticated dashboard; soft nav; media-heavy LCP surface | [05](./05-implementation-order.md) · [08](./08-testing-strategy.md) §7 |
| **Optimization log** — before/after for each change (EP-019-style); no speculative micro-optimizations without evidence | [05](./05-implementation-order.md) · EP-019 discipline |
| **`next/image` / MediaImage adoption** on media surfaces where safe (coordinate existing media pipeline) | [05](./05-implementation-order.md) |
| **Route-level / interaction `dynamic()`** for heavy panels that evidence shows hurt TTI/INP/bundle | [05](./05-implementation-order.md) |
| **Hydration reduction** where safe (server components / client boundary shrink) without breaking interactivity | [05](./05-implementation-order.md) |
| **Font / cache verification** — confirm existing font and static cache strategy; fix regressions only | [05](./05-implementation-order.md) |
| **Animation performance** — prefer transform/opacity; avoid layout-thrashing motion regressions from Phase 5 polish | [05](./05-implementation-order.md) |
| **A11 targets** — Performance ≥ 95 · Accessibility ≥ 95 · Best Practices ≥ 100 · PWA ≥ 100 on agreed profiles **or** documented Product-accepted waivers | [06](./06-acceptance-criteria.md) A11 · [05](./05-implementation-order.md) Done when |
| **Preserve Phases 1–7** — unified SW · install · shell · standalone · UX polish · push · offline outbox remain intact | Phases 1–7 Validated |
| **Provider / schema constraint** — OneSignal primary retained; **no database schema migrations** under this authorize | Package non-negotiables |

### Implementation boundaries

1. Work is limited to **Performance Optimization** (Phase 8) — not Phase 9 premium APIs, Phase 10 regression matrix, or Phase 11 pilot.  
2. **Evidence-first** — baseline before optimize; every meaningful change logged with before/after.  
3. **DO NOT** redesign the application, change IA, remove features, or restyle Canopy.  
4. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker / Phases 2–7 surfaces (including offline outbox).  
5. **DO NOT** introduce schema migrations under this authorize.  
6. **DO NOT** weaken accessibility or security to chase Performance score (R12).  
7. **DO NOT** treat this phrase as Approve of the full EP-019 package.  
8. Material scope beyond Phase 8 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Baseline Lighthouse / Web Vitals capture on agreed profiles  
- Targeted code-splitting, image pipeline, hydration, font/cache, and animation fixes justified by evidence  
- Accessibility non-regression (score must not drop without waiver)  
- Artifact filing under `artifacts/lighthouse/` (or EP-019-aligned path)  
- Implementation summary + validation evidence under **P8-01…P8-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 9 — Premium Native Features | Separate authorize |
| PMX-004 Phase 10 — Production Validation | Separate authorize |
| PMX-004 Phase 11 — Real-World Pilot / package COMPLETE | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| OPS-001 Slices C–E | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full EP-019 package Approve / commercial CLOSE | Separate package gate |
| Full offline CRUD expansion | Forbidden / Phase 7 scope only |
| Navigation IA redesign · role-home redesign · Command Center productization | Forbidden under this phase / separate packages |
| Schema migrations · provider swap / VAPID primary | Forbidden |
| Feature removal to inflate Lighthouse | Forbidden |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phases 1–7 Validated | Substrate preserved under optimization |
| M0 = GO | Program unlock |
| UX-012 Slice A + B Validated | Token / component substrate must not regress |
| [08] Testing strategy §7 | Lighthouse protocol |
| EP-019 discipline (measurement + optimization log) | Evidence rules — package itself not Approved |
| CORE-003 Phase 8 eligibility | Program sequence (next PMX unit after Phase 7 Validated) |

**Does not depend on:** PMX-004 Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · EP-019 Approve · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 8) — P8-01 … P8-10

| ID | Criterion |
|----|-----------|
| **P8-01** | **Baseline captured** — Lighthouse (+ Web Vitals where practical) recorded for agreed reference profiles **before** material optimization; artifacts filed. |
| **P8-02** | **Optimization log** — each material change documents reason · before · after · delta (EP-019-style); no drive-by speculative edits. |
| **P8-03** | **Image pipeline** — media surfaces adopt `next/image` / MediaImage (or documented equivalent) where evidence justifies; LCP-sensitive routes addressed. |
| **P8-04** | **Code-splitting** — heavy panels use route/interaction `dynamic()` (or equivalent) where justified; no broken import boundaries ([04](./04-regression-risks.md)). |
| **P8-05** | **Hydration / server boundaries** — safe hydration reduction applied where evidenced; interactive surfaces remain correct. |
| **P8-06** | **Font / cache / animation** — font & static cache verified; animations prefer transform/opacity; no Phase 5 motion regressions introduced. |
| **P8-07** | **A11 Lighthouse gates** — Performance ≥ 95 · Accessibility ≥ 95 · Best Practices ≥ 100 · PWA ≥ 100 on agreed profiles **or** Product-accepted waivers recorded with rationale ([06](./06-acceptance-criteria.md) A11). |
| **P8-08** | **A11y / security non-regression** — accessibility score does not drop without waiver; CSP/security posture not weakened for score chasing (R12). |
| **P8-09** | **Regression / non-negotiables** — Phases 1–7 SW/install/shell/standalone/UX/push/outbox preserved; OneSignal primary retained; Auth/Supabase/Stripe preserved; **no schema** / IA redesign under this authorize. |
| **P8-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no Phases 9–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized EP-019 CLOSE shipped under this authorize. |

Maps to package phase minimum: **A11** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 8 exits **Validated** only when **all** are true:

1. Acceptance criteria **P8-01–P8-10** PASS.  
2. A11 satisfied — Lighthouse targets met **or** Product-accepted waivers recorded.  
3. Baseline + post-optimization artifacts filed.  
4. Accessibility / security non-regression evidenced.  
5. Phases 1–7 foundations not regressed; OneSignal primary preserved; no schema migrations.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 8
```

Until Validation is recorded: PMX-004 Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 8` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P8-xx / A11).  
3. Produce a **remediation** record limited to fixing authorized Phase 8 defects — no scope expansion into Phases 9–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 8 guidance (revert dynamic import boundaries that break routes; keep analyzer artifacts).  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 8`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  

---

## 8. Deferred / outside Phase 8

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 9–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full EP-019 Approve / commercial CLOSE | Separate package |
| Premium native APIs / pilot COMPLETE | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 8?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **Eligible** in a dedicated implement session within this scope |
| **Validation?** | ✅ **PASS** ([43](./43-phase-8-validation.md)) |
| **Authorize Phases 9–11 / UX-C / OPS-C / FIN-C / marketplace UI / EP-019?** | ❌ **NO** (Phase 9 authorize **eligible** — not issued here) |

**Next:** Dedicated session → recommend **`AUTHORIZE PMX-004 PHASE 9`** (not issued under this authorize).

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 8** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([42](./42-phase-8-implementation.md)) | 2026-07-26 |
| Validation | ✅ **PASS** — `VALIDATE PMX-004 PHASE 8` ([43](./43-phase-8-validation.md)) | 2026-07-26 |

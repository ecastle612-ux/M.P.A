# 32 — PMX-004 Phase 6 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **6 — Push Notification Certification**  
**Status:** ✅ **AUTHORIZED** · Implementation 🔒 until dedicated implementation session · Validation 🔒 until `VALIDATE PMX-004 PHASE 6`  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 6
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 6
```

**Program record:** [CORE-003 §72](../113-core-003-implementation-master-plan/72-pmx-004-phase-6-authorization.md)  
**Prior gate:** [31 — Phase 5 Validation](./31-phase-5-validation.md) · ✅ **PASS** · [CORE-003 §71](../113-core-003-implementation-master-plan/71-pmx-004-phase-5-validation.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 6  
**Push SoT:** [PUSH-001 §10 — Pass criteria](../99-push-001-pwa-push-commercial-certification/10-pass-criteria.md) (G1–G10) · package deep-link / device matrices under PUSH-001  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 6 · [06 — Acceptance criteria](./06-acceptance-criteria.md) (phase minimum = PUSH-001 G1–G10 or accepted deferrals) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md) · [26 — Auth deep-link notes](./26-auth-deep-link-notes.md) (push deep-link context)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — any diagnostic UI chrome uses `--mpa-*` / Canopy; **no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 5 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 6` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
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
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| PUSH-001 package Approved (cert substrate) | [PUSH-001 README](../99-push-001-pwa-push-commercial-certification/README.md) · G1–G10 SoT | ✅ |
| Next PMX authorize unit = Phase 6 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 5 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX slice blocking this phrase | Phase 5 Validated · no open authorize ahead of Phase 6 | ✅ |
| PMX-004 Phase 7–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 6?** ❌ **None.**

**Order note:** CORE-003 marks PMX Phase 6 **eligible** after Phase 5 Validated. Package [05](./05-implementation-order.md) depends Phase 6 on Phase 1 + PUSH-001. This phrase authorizes **PMX-004 Phase 6 (Push Notification Certification)** only. Peers (OPS-001 Slice C · UX-012 Slice C · etc.) remain separately gated and are **not** unlocked here.

**Collision guard:** No Phase 7–11 authorize/implement docs present at issue time. Doc slots: package §32 = this authorize · CORE-003 §72 = program record (does not collide with Phase 5 §29–§31 / §69–§71).

---

## 2. Authorization scope

### In scope (Phase 6 — Push Notification Certification)

Binding work list from [05](./05-implementation-order.md) Phase 6 and [PUSH-001 §10](../99-push-001-pwa-push-commercial-certification/10-pass-criteria.md) — **certify + evidence · limited SW/deep-link repair only if required**:

| Deliverable | Binding source |
|-------------|----------------|
| **Real-device push matrix** — Android Chrome, Samsung Internet, Pixel, iPhone (installed PWA) | [05](./05-implementation-order.md) · PUSH-001 G1–G2 · G9 |
| **Lifecycle / environment states** — app closed, locked, background, poor network, Wi‑Fi, LTE, battery saver (as applicable per platform) | [05](./05-implementation-order.md) · [08](./08-testing-strategy.md) |
| **Tap → deep link correctness** — notification tap opens the correct destination (never wrong generic dashboard dump) | [05](./05-implementation-order.md) · PUSH-001 G5 · [26](./26-auth-deep-link-notes.md) |
| **Evidence packaging** — device / deep-link / diagnostics evidence under `artifacts/` (no secrets) | [05](./05-implementation-order.md) · PUSH-001 deliverables |
| **SW-related PUSH-001 gap close** — only repairs required to close remaining SW / registration / deep-link gaps after Phase 1 unified worker | [05](./05-implementation-order.md) · Phase 1 Certified substrate |
| **PUSH-001 G1–G10** — PASS or explicit Product-accepted deferral for non-blocking cells | [06](./06-acceptance-criteria.md) §3 · [PUSH-001 §10](../99-push-001-pwa-push-commercial-certification/10-pass-criteria.md) |
| **Preserve Phases 1–5** — unified SW · install · shell · standalone · mobile UX polish remain intact | Phases 1–5 Validated |
| **Provider constraint** — OneSignal remains primary (ADR-017); no VAPID / provider swap | Package non-negotiables · ADR-017 |

### Implementation boundaries

1. Work is limited to **Push Notification Certification** (Phase 6) — not Phase 7 offline outbox, Phase 8 Lighthouse gates, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot.  
2. **Primary mode is ops/certification evidence** on real devices; product-code changes are **limited** to SW / enrollment / deep-link repairs required to achieve G1–G10 (or accepted deferrals).  
3. **DO NOT** redesign the application, change IA, remove features, or expand the notification product catalog.  
4. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker / Phases 2–5 surfaces.  
5. **DO NOT** introduce schema migrations under this authorize.  
6. **DO NOT** commit secrets in `artifacts/` or docs.  
7. Material scope beyond Phase 6 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Real-device push delivery matrix (Android Chrome · Samsung Internet · Pixel · iPhone installed PWA)  
- State coverage (closed / locked / background / network / battery where testable)  
- Deep-link correctness verification + evidence  
- Packaging under `docs/106-pmx-004-native-pwa-parity/artifacts/` (and/or PUSH-001 artifact paths) without secrets  
- Targeted SW / deep-link / diagnostics fixes only if needed for G1–G10  
- Implementation summary + validation evidence under **P6-01…P6-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 7 — Offline Reliability / outbox | Separate authorize |
| PMX-004 Phase 8 — Performance Optimization | Separate authorize |
| PMX-004 Phase 9 — Premium Native Features | Separate authorize |
| PMX-004 Phase 10 — Production Validation | Separate authorize |
| PMX-004 Phase 11 — Real-World Pilot / package COMPLETE | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| OPS-001 Slices C–E | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Navigation IA redesign · role-home redesign · Command Center productization | Forbidden under this phase / separate packages |
| New notification feature catalog / provider swap / VAPID primary | Forbidden (ADR-017 · PUSH-001 constraint) |
| Full Native UX matrix closeout (A14 final) | Phase 11 |
| Product redesign / schema / unrelated workflow changes | Forbidden package-wide |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified root-scope SW + OneSignal coexistence |
| Phases 2–5 Validated | Install / shell / standalone / UX polish preserved |
| M0 = GO | Program unlock |
| PUSH-001 Approved + G1–G10 criteria | Certification SoT |
| API-001 / API-001A / ADR-017 | Enrollment + OneSignal primary |
| UX-012 Slice A + B Validated | Token substrate if any diagnostic UI chrome |
| CORE-003 Phase 6 eligibility | Program sequence (next PMX unit) |

**Does not depend on:** PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 6) — P6-01 … P6-10

| ID | Criterion |
|----|-----------|
| **P6-01** | **Device matrix executed** — push delivery exercised on Android Chrome, Samsung Internet (or documented Samsung-class Android), Pixel (or documented Pixel-class), and iPhone installed PWA ([05](./05-implementation-order.md)). |
| **P6-02** | **Closed / background delivery** — at least one primary Android path proves delivery with app closed or backgrounded; iPhone installed PWA proves within Apple-supported capabilities (PUSH-001 G1–G2). |
| **P6-03** | **Environment / state coverage** — matrix notes Wi‑Fi and/or LTE; locked / battery-saver cells recorded as PASS · FAIL · N/A with rationale where OS blocks testing. |
| **P6-04** | **Deep-link correctness** — tap opens the correct destination for exercised notification types; no unexpected generic dashboard dump (PUSH-001 G5). |
| **P6-05** | **Duplicate / diagnostics hygiene** — no duplicate notifications for the same event key on exercised paths; diagnostics show healthy registrations where applicable (G6–G7). |
| **P6-06** | **Master Admin / test send path** — test notification path succeeds from Master Admin (or documented equivalent ops path) (G8). |
| **P6-07** | **Evidence packaged** — device + deep-link evidence under `artifacts/` (or PUSH-001 artifact paths) with **no secrets**; dates/devices/outcomes recorded. |
| **P6-08** | **PUSH-001 G1–G10** — all gates PASS **or** non-blocking cells explicitly deferred with Product Accept recorded (package phase minimum). |
| **P6-09** | **Regression / non-negotiables** — Phases 1–5 SW/install/shell/standalone/UX preserved; OneSignal primary retained; Auth/Supabase/Stripe preserved; no IA redesign / schema under this authorize; package fail conditions not violated. |
| **P6-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no Phases 7–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **PUSH-001 G1–G10 (or accepted deferrals)** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 6 exits **Validated** only when **all** are true:

1. Acceptance criteria **P6-01–P6-10** PASS.  
2. Real-device matrix evidence present for required platforms (or Accepted deferral documented).  
3. Deep-link correctness evidenced for exercised notification types.  
4. PUSH-001 G1–G10 PASS or Product-accepted non-blocking deferrals recorded.  
5. Artifacts contain no secrets.  
6. Phases 1–5 foundations not regressed; OneSignal primary preserved.  
7. Documentation updated (implementation summary + validation report + board status).  
8. Governance recommendation recorded.  
9. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 6
```

Until Validation is recorded: PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 6` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P6-xx / PUSH-001 G-IDs).  
3. Produce a **remediation** record limited to fixing authorized Phase 6 defects — no scope expansion into Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 6 (ops-first; revert deep-link builder only if code regressions introduced).  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 6`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 6

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 7–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Phase 11 re-proof of push on four pilot devices | Phase 11 consumes Phase 6 evidence; does not replace Phase 6 |
| Offline outbox / Lighthouse ≥95 / premium APIs | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 6?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **YES** — in a dedicated implementation/certification session, Phase 6 scope only |
| **Begin implementation in this governance session?** | ❌ **NO** — stop after authorization |
| **Begin validation now?** | ❌ **NO** — after implementation / evidence packaging |
| **Authorize Phases 7–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Next session:** Implement / certify PMX-004 Phase 6 per this authorize → then `VALIDATE PMX-004 PHASE 6`.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 6** | 2026-07-26 |
| Implementation | 🔒 Pending dedicated implementation / certification session | — |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 6` | — |

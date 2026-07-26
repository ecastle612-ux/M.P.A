# 22 — PMX-004 Phase 3 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **3 — Native Application Shell**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([23](./23-phase-3-implementation.md)) · Validation 🔒 until `VALIDATE PMX-004 PHASE 3`  
**Authorization date:** 2026-07-26  
**Implementation date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 3
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 3
```

**Program record:** [CORE-003 §63](../113-core-003-implementation-master-plan/63-pmx-004-phase-3-authorization.md)  
**Prior gate:** [21 — Phase 2 Validation](./21-phase-2-validation.md) · ✅ **PASS** · [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 3  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 3 · [02 — Proposed architecture](./02-proposed-architecture.md) §5 Native shell · [06 — Acceptance criteria](./06-acceptance-criteria.md) (A7) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — shell chrome uses `--mpa-*` / Canopy; no parallel design system; **no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 2 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) next-action eligibility)

> Phrase **`AUTHORIZE PMX-004 PHASE 3` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 4–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.  
> This session is **governance only** — no application code under this authorize document.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| PMX-004 Approved with Amendments | [12](./12-approval-checklist.md) · Amendments 01–03 | ✅ |
| Phase 1 Final PASS / Certified | [17](./17-phase-1-production-validation.md) · [CORE-003 §35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) | ✅ |
| Phase 2 Validated PASS | [21](./21-phase-2-validation.md) · [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| Next PMX authorize unit = Phase 3 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 2 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX/UX/OPS slice blocking this phrase | Phase 2 Validated · no open authorize ahead of Phase 3 | ✅ |
| PMX-004 Phase 4–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 3?** ❌ **None.**

**Order note:** CORE-003 marks PMX Phase 3 **eligible** after Phase 2 Validated. This phrase authorizes **PMX-004 Phase 3 (Native Application Shell)** only. M3 peers (OPS-001 Slice C · UX-012 Slice C) remain separately gated and are **not** unlocked here.

---

## 2. Authorization scope

### In scope (Phase 3 — Native Application Shell)

Binding work list from [05](./05-implementation-order.md) Phase 3 and [02](./02-proposed-architecture.md) §5:

| Deliverable | Binding source |
|-------------|----------------|
| **Viewport + theme metadata** — Next.js `viewport` · `themeColor` · `appleWebApp` metadata | [05](./05-implementation-order.md) · [02](./02-proposed-architecture.md) §5 |
| **`viewport-fit=cover` + safe-area insets** — top/bottom (and applicable sides) on primary shells: PM ops shell, portals, vendor token surfaces where applicable | [05](./05-implementation-order.md) · A7 |
| **Status bar / theme-color** — alignment with Canopy brand (navy / approved theme tokens) | [05](./05-implementation-order.md) |
| **Cold-start flash reduction** — verify/harden PWA cold start so standalone opens branded (not white flash / wrong theme); reuse existing theme init | [05](./05-implementation-order.md) |
| **Overscroll / scroll containment** — shell chrome containment where appropriate; preserve accessible content scroll | [05](./05-implementation-order.md) · [02](./02-proposed-architecture.md) §5 |
| **Keyboard avoidance** — `visualViewport` handling for bottom-fixed UI (e.g. owner/portal bottom nav, sticky actions) | [05](./05-implementation-order.md) |
| **Chrome zoom hygiene** — reduce accidental double-tap zoom on chrome controls **without** disabling pinch-zoom globally | [05](./05-implementation-order.md) · [02](./02-proposed-architecture.md) §5 |
| **Splash / background consistency** — manifest `background_color` / theme alignment for install splash feel | [05](./05-implementation-order.md) |
| **Token / UX compliance** — shell chrome uses UX-012 / Canopy `--mpa-*`; no parallel visual system; **do not rebuild navigation IA** | UX-012 A/B · package non-negotiables |
| **Preserve Phases 1–2** — unified SW / install experience / funnel / checklist remain intact | [09](./09-unified-service-worker-design.md) · [19](./19-phase-2-authorization.md) · [21](./21-phase-2-validation.md) |

### Implementation boundaries

1. Work is limited to **Native Application Shell** (Phase 3) — not Phase 4 standalone exits, Phase 5 UX matrix polish, Phase 6 push matrix, Phase 7 offline queue, Phase 8 performance, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot.  
2. **DO NOT** redesign the application, change IA, remove features, or change business workflows.  
3. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker / Phase 2 install onboarding.  
4. **DO NOT** introduce schema migrations under this authorize.  
5. Safe-area and keyboard work apply to **existing** shell chrome — extend patterns; do not invent new navigation architecture.  
6. Prefer UX-012 tokens for any new shell CSS / metadata theme values.  
7. Material scope beyond Phase 3 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Viewport / appleWebApp / themeColor metadata wiring  
- Safe-area insets on primary authenticated shells (ops + portals + applicable vendor surfaces)  
- Cold-start / flash mitigation verification and hardening  
- Overscroll containment on shell chrome  
- `visualViewport` keyboard avoidance for bottom-fixed UI  
- Double-tap zoom mitigation on chrome controls (pinch-zoom remains)  
- Manifest background / splash consistency  
- Implementation summary + validation evidence under **P3-01…P3-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 4 — Standalone Compliance (exit inventory, Stripe/doc windowing) | Separate authorize |
| PMX-004 Phase 5 — Native Mobile UX / full matrix | Separate authorize |
| PMX-004 Phase 6 — Push Notification Certification matrix | Separate authorize |
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
| App Store / Play Store listing · Firefox parity · full offline CRUD | Out of package / non-criteria ([06](./06-acceptance-criteria.md) §4) |
| Product redesign / schema / provider swaps | Forbidden package-wide |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified SW substrate |
| Phase 2 Validated | Install experience preserved; shell builds on installed/standalone paths |
| M0 = GO | Program unlock |
| UX-012 Slice A + B Validated | Token / component substrate for shell chrome |
| Existing app / portal / vendor shells | Implementation substrate |
| CORE-003 Phase 3 eligibility | Program sequence (next PMX unit) |

**Does not depend on:** PMX-004 Phases 4–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 3) — P3-01 … P3-10

| ID | Criterion |
|----|-----------|
| **P3-01** | **Viewport metadata** — Next.js `viewport` includes `viewportFit: "cover"` (or equivalent) and theme color wiring for PWA shells ([05](./05-implementation-order.md) · [02](./02-proposed-architecture.md) §5). |
| **P3-02** | **Apple web app metadata** — `appleWebApp` (capable / status bar style as approved) present for install/standalone presentation. |
| **P3-03** | **Safe-area insets** — primary shells (PM ops · portals · applicable vendor surfaces) apply `env(safe-area-inset-*)` so notch / Dynamic Island / home indicator do not clip critical chrome (package A7). |
| **P3-04** | **Theme / status bar alignment** — theme-color / status presentation aligned to Canopy / UX-012 tokens (no ad-hoc brand hex systems). |
| **P3-05** | **Cold-start flash** — standalone/PWA cold start shows branded surface (not persistent white flash / wrong theme); theme init path verified/hardened. |
| **P3-06** | **Overscroll containment** — shell chrome uses appropriate overscroll/scroll containment without breaking accessible content scrolling. |
| **P3-07** | **Keyboard avoidance** — bottom-fixed UI (sticky actions / bottom nav) remains usable under soft keyboard via `visualViewport` (or equivalent) handling. |
| **P3-08** | **Zoom hygiene** — chrome controls mitigate accidental double-tap zoom **without** globally disabling pinch-zoom. |
| **P3-09** | **Regression / non-negotiables** — Phases 1–2 SW/install/funnel preserved; Auth/Supabase/OneSignal/Stripe preserved; no IA redesign / schema under this authorize; package fail conditions not violated. |
| **P3-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no Phases 4–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **A7** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 3 exits **Validated** only when **all** are true:

1. Acceptance criteria **P3-01–P3-10** PASS.  
2. Safe-area / viewport-fit evidenced on primary shells (device or documented layout evidence).  
3. Cold-start / theme flash mitigation evidenced.  
4. Keyboard avoidance evidenced for at least one primary bottom-fixed surface.  
5. No unresolved **critical** defects; Phases 1–2 foundations not regressed.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 3
```

Until Validation is recorded: PMX-004 Phases 4–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 3` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P3-xx / A7 / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Phase 3 defects — no scope expansion into Phases 4–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 3 shell-meta rollback if production shell chrome is harmful.  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 3`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 3

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 4–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Standalone exit inventory / Stripe return interstitial | Phase 4 |
| Full Native UX matrix | Phase 5 |
| Offline outbox / Lighthouse ≥95 / pilot | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 3?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **YES** — in a dedicated implementation session, Phase 3 scope only |
| **Begin implementation in this governance session?** | ❌ **NO** — stop after authorization |
| **Begin validation now?** | ❌ **NO** — after implementation |
| **Authorize Phases 4–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Next session:** Implement PMX-004 Phase 3 per this authorize → then `VALIDATE PMX-004 PHASE 3`.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 3** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([23](./23-phase-3-implementation.md)) | 2026-07-26 |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 3` | — |

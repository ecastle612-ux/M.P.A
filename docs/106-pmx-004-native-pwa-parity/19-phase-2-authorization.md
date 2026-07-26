# 19 — PMX-004 Phase 2 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **2 — Native Installation Experience**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **IMPLEMENTED** ([20](./20-phase-2-implementation.md)) · Validation ✅ **PASS** ([21](./21-phase-2-validation.md))  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 2
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 2
```

**Program record:** [CORE-003 §61](../113-core-003-implementation-master-plan/61-pmx-004-phase-2-authorization.md)  
**Prior gate:** [17 — Phase 1 Production Validation](./17-phase-1-production-validation.md) · ✅ **Final PASS** (signed owner checklist) · [CORE-003 §35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 2  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 2 · [14 — Installation success funnel](./14-installation-success-funnel.md) · [06 — Acceptance criteria](./06-acceptance-criteria.md) (A4–A6 · A15 in progress) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — install/onboarding UI consumes `--mpa-*` / Canopy; no parallel design system  
**Program order:** CORE-003 **M2.5** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) · after UX-012 Slice B ✅ **VALIDATED** ([UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · [CORE-003 §60](../113-core-003-implementation-master-plan/60-ux-012-slice-b-validation.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 2` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 3–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.  
> This session is **governance only** — no application code under this authorize document.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| PMX-004 Approved with Amendments | [12](./12-approval-checklist.md) · Amendments 01–03 | ✅ |
| Phase 1 code + prod deploy | [16](./16-phase-1-verification.md) · [17](./17-phase-1-production-validation.md) | ✅ |
| Phase 1 Production Validation Final PASS | [17](./17-phase-1-production-validation.md) §10 · ✅ **PASS** | ✅ |
| Device certification (signed owner checklist) | [18](./18-pmx-004-amd-device-cert-owner-checklist.md) · [CORE-003 §35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** · [CORE-003 §60](../113-core-003-implementation-master-plan/60-ux-012-slice-b-validation.md) | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| CORE-003 M2.5 next incomplete unit | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) · after M2.4 UX-B Validated | ✅ |
| No unfinished Authorized slice blocking serial rule | UX-B Validated · no open authorize ahead of M2.5 | ✅ |
| PMX-004 Phase 3–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 2?** ❌ **None.**

**Order note:** CORE-003 lists **PMX-004 Phase 2 at M2.5** (depends on Phase 1 Certified + authorize phrase). UX-B (M2.4) is Validated. This phrase authorizes **PMX-004 Phase 2 (M2.5)** only.

---

## 2. Authorization scope

### In scope (Phase 2 — Native Installation Experience)

Binding work list from [05](./05-implementation-order.md) Phase 2 and [14](./14-installation-success-funnel.md):

| Deliverable | Binding source |
|-------------|----------------|
| **Platform detection** — Android Chrome, iOS Safari, desktop utilities for install eligibility | [05](./05-implementation-order.md) |
| **`beforeinstallprompt` + Install CTA** — capture prompt; non-blocking in-app Install path when browser allows | [05](./05-implementation-order.md) · A4 |
| **iOS A2HS sheet** — Canopy / UX-012 tokenized step-by-step Add to Home Screen guidance (no app redesign) | [05](./05-implementation-order.md) · A5 |
| **Standalone detection** — `display-mode` + `navigator.standalone` | [05](./05-implementation-order.md) |
| **Post-install notifications** — prompt after install; reuse API-001A enrollment path | [05](./05-implementation-order.md) · [14](./14-installation-success-funnel.md) |
| **Camera readiness (lazy)** — mark ready on first camera intent or Permissions query; **never** blanket prompt during onboarding | [05](./05-implementation-order.md) · [14](./14-installation-success-funnel.md) |
| **First-run checklist UI** — Installed · Notifications Enabled · Offline Ready · Camera Ready | [05](./05-implementation-order.md) · A6 |
| **Persistence + Settings re-entry** — checklist completion dismissed across sessions; Settings path to re-open help | [05](./05-implementation-order.md) · A6 |
| **Installation funnel events** — Landing → … → Setup Completed per [14](./14-installation-success-funnel.md); capturable for KPI reporting (A15 in progress) | [14](./14-installation-success-funnel.md) · A15 |
| **Token / UX compliance** — install/onboarding chrome uses UX-012 / Canopy `--mpa-*`; no parallel visual system | UX-012 A/B · package non-negotiables |
| **Preserve Phase 1** — unified SW / push / offline foundations remain intact | [09](./09-unified-service-worker-design.md) · [17](./17-phase-1-production-validation.md) |

### Implementation boundaries

1. Work is limited to **Native Installation Experience** (Phase 2) — not Phase 3 shell chrome, Phase 4 standalone exits, Phase 5 UX matrix polish, Phase 6 push matrix, Phase 7 offline queue, Phase 8 performance, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot.  
2. **DO NOT** redesign the application, change IA, remove features, or change business workflows ([README](./README.md) non-negotiables).  
3. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker.  
4. **DO NOT** introduce schema migrations under this authorize (funnel may use privacy-safe diagnostics / existing logging without new tables — [14](./14-installation-success-funnel.md); a later table requires separate Approve).  
5. Camera permission is **lazy by design** — not requested during install onboarding by default.  
6. Install UX must remain **non-blocking** for core PM work (no hard walls).  
7. Prefer UX-012 shared primitives / tokens for new install chrome.  
8. Material scope beyond Phase 2 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Platform detection + Android BIP install path + iOS A2HS instructions  
- Standalone detection + first-run checklist + persistence + Settings help re-entry  
- Post-install notification enrollment (existing API-001A)  
- Lazy camera readiness signaling  
- Funnel event emission sufficient for KPI capture / documentation start (A15 in progress)  
- Implementation summary + validation evidence under **P2-01…P2-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 3 — Native Application Shell | Separate authorize |
| PMX-004 Phase 4 — Standalone Compliance | Separate authorize |
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
| App Store / Play Store listing · Firefox parity · full offline CRUD | Out of package / non-criteria ([06](./06-acceptance-criteria.md) §4) |
| Product redesign / schema / provider swaps | Forbidden package-wide |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified SW substrate |
| M0 = GO | Program unlock |
| UX-012 Slice A + B Validated | Token / component substrate for install UI |
| API-001A / OneSignal enrollment | Post-install notification path |
| CORE-003 M2.5 order | Program sequence slot |

**Does not depend on:** PMX-004 Phases 3–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

**Program sequencing note:** AUTH-B · COM-A · OPS-B · UX-B peers in M2 are complete/validated as applicable; Phase 2 is the next incomplete M2 unit.

---

## 5. Acceptance criteria (Phase 2) — P2-01 … P2-10

| ID | Criterion |
|----|-----------|
| **P2-01** | **Platform detection** — utilities distinguish Android Chrome / iOS Safari / desktop eligibility for install UX ([05](./05-implementation-order.md)). |
| **P2-02** | **Android install path** — `beforeinstallprompt` captured; in-app Install CTA works when the browser offers BIP (package A4). |
| **P2-03** | **iOS A2HS** — Canopy/tokenized step-by-step sheet available and completable without leaving users in a confused browser-only state (package A5). |
| **P2-04** | **Standalone detection** — `display-mode` / `navigator.standalone` correctly drives installed state. |
| **P2-05** | **Post-install notifications** — after install, notification enrollment uses existing API-001A path; prompt timing follows [14](./14-installation-success-funnel.md) (after install, not before). |
| **P2-06** | **First-run checklist** — Installed · Notifications · Offline Ready · Camera Ready UI; completion persists and does not reappear every session; Settings can re-open help (package A6). |
| **P2-07** | **Lazy camera** — no blanket camera permission request during install onboarding; readiness marked on first intent / Permissions query / Settings. |
| **P2-08** | **Funnel instrumentation** — events for Landing → Setup Completed (per [14](./14-installation-success-funnel.md)) fire and are capturable; A15 started (full KPI report may complete later toward package COMPLETE). |
| **P2-09** | **Regression / non-negotiables** — Phase 1 SW/push/offline not broken; Auth/Supabase/OneSignal/Stripe preserved; no product redesign / schema under this authorize; package fail conditions not violated. |
| **P2-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no Phases 3–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **A4–A6 + funnel instrumentation started (A15 in progress)** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 2 exits **Validated** only when **all** are true:

1. Acceptance criteria **P2-01–P2-10** PASS.  
2. Android install path and iOS A2HS path evidenced (device or documented browser-capability constraints recorded).  
3. Checklist persistence + Settings re-entry evidenced.  
4. Funnel events evidenced as capturable.  
5. No unresolved **critical** defects; Phase 1 foundations not regressed.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 2
```

Until Validation is recorded: PMX-004 Phases 3–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 2` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P2-xx / A4–A6 / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Phase 2 defects — no scope expansion into Phases 3–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 2 onboarding rollback if production install UX is harmful.  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 2`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 2

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 3–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full install funnel KPI report toward COMPLETE (A15 final) | May continue after Phase 2 Validated; package COMPLETE still requires Phase 11 |
| Native shell / standalone exits / offline queue / Lighthouse ≥95 | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 2?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ Completed ([20](./20-phase-2-implementation.md)) |
| **Begin validation now?** | ✅ Completed — **PASS** ([21](./21-phase-2-validation.md)) |
| **Authorize Phases 3–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Follow-on:** `VALIDATE PMX-004 PHASE 2` → ✅ **PASS** ([21](./21-phase-2-validation.md)).

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 2** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([20](./20-phase-2-implementation.md)) | 2026-07-26 |
| Validation | ✅ **PASS** · `VALIDATE PMX-004 PHASE 2` ([21](./21-phase-2-validation.md)) | 2026-07-26 |

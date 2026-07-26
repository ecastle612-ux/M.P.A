# 29 — PMX-004 Phase 5 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **5 — Native Mobile UX**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([30](./30-phase-5-implementation.md)) · ✅ **VALIDATED PASS** ([31](./31-phase-5-validation.md))  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 5
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 5
```

**Program record:** [CORE-003 §69](../113-core-003-implementation-master-plan/69-pmx-004-phase-5-authorization.md)  
**Prior gate:** [28 — Phase 4 Validation](./28-phase-4-validation.md) · ✅ **PASS** · [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 5  
**Matrix SoT:** [13 — Native UX Acceptance Matrix](./13-native-ux-acceptance-matrix.md) (living — first pass under this phase; full matrix PASS required by Phase 11 / COMPLETE)  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 5 · [13](./13-native-ux-acceptance-matrix.md) · [06 — Acceptance criteria](./06-acceptance-criteria.md) (phase minimum · A14 underway) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — polish uses `--mpa-*` / Canopy; **polish only — no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 4 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 5` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 6–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
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
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice B Validated (peer · not a Phase 5 unlock) | [OPS-001 §37](../111-ops-001-platform-operations-architecture/37-slice-b-validation.md) · **PASS** | ✅ (already complete · not expanded here) |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| Next PMX authorize unit = Phase 5 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 4 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX slice blocking this phrase | Phase 4 Validated · no open authorize ahead of Phase 5 | ✅ |
| PMX-004 Phase 6–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 5?** ❌ **None.**

**Order note:** CORE-003 marks PMX Phase 5 **eligible** after Phase 4 Validated. Package [05](./05-implementation-order.md) depends Phase 5 on Phase 3 (soft-overlap peers 5/8/9 after Phase 1 proven); program serial authorize still requires this explicit phrase. This phrase authorizes **PMX-004 Phase 5 (Native Mobile UX)** only. Peers (OPS-001 Slice C · UX-012 Slice C · etc.) remain separately gated and are **not** unlocked here.

**Collision guard:** No Phase 6–11 authorize/implement docs present at issue time. Doc slots: package §29 = this authorize · CORE-003 §69 = program record (does not collide with Phase 4 §25–§28 / §66–§68).

---

## 2. Authorization scope

### In scope (Phase 5 — Native Mobile UX)

Binding work list from [05](./05-implementation-order.md) Phase 5 and [13](./13-native-ux-acceptance-matrix.md) — **polish only · no redesign**:

| Deliverable | Binding source |
|-------------|----------------|
| **Touch targets** — primary interactive controls (Buttons, icon buttons, list rows) ≥ 44×44 CSS px on critical mobile paths | [05](./05-implementation-order.md) · Matrix T1 / A4 |
| **Spacing rhythm** — dense mobile lists use token-consistent spacing (no cramped hit areas) | [05](./05-implementation-order.md) · Matrix T2–T3 |
| **Loading polish** — prefer skeletons / structured loading over full-shell spinners (align EP-019 H5) | [05](./05-implementation-order.md) · Matrix L1–L2 |
| **Motion** — subtle route/section transitions; honor `prefers-reduced-motion` | [05](./05-implementation-order.md) · Matrix N3 · P1 |
| **Haptics (optional)** — `navigator.vibrate` only for confirm/destructive where supported; off when reduced motion | [05](./05-implementation-order.md) |
| **Long-press / context menu** — only where it duplicates an existing explicit action (no gesture-only paths) | [05](./05-implementation-order.md) · Matrix T4 |
| **Bottom sheets / drawers** — scroll-lock + focus trap on existing Drawer patterns (extend, do not invent IA) | [05](./05-implementation-order.md) |
| **No new navigation IA** — do not invent new nav structures, role homes, or Command Center productization | [05](./05-implementation-order.md) · package non-negotiables |
| **Native UX Acceptance Matrix — first pass** — execute matrix for **critical paths**; remediate FAILs; record evidence; leave non-critical / remaining rows for Phase 11 final PASS (A14 underway → A14 full at Phase 11) | [13](./13-native-ux-acceptance-matrix.md) · [06](./06-acceptance-criteria.md) §3 |
| **Preserve Phases 1–4** — unified SW · install · native shell · standalone compliance remain intact | Phases 1–4 Validated |
| **Token / UX compliance** — polish uses UX-012 / Canopy `--mpa-*`; no parallel design system | UX-012 A/B |

### Implementation boundaries

1. Work is limited to **Native Mobile UX** (Phase 5) — not Phase 6 push matrix, Phase 7 offline queue, Phase 8 performance Lighthouse gates, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot / full matrix closeout.  
2. **DO NOT** redesign the application, change IA, remove features, or change business workflows.  
3. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker / Phase 2 install / Phase 3 shell / Phase 4 standalone dispositions.  
4. **DO NOT** introduce schema migrations under this authorize.  
5. Prefer shared UX-012 primitives / tokens for touch, skeleton, and motion polish.  
6. Full matrix Overall PASS for **every** major screen remains a **Phase 11 / COMPLETE** requirement (A14); Phase 5 requires **critical-path first pass underway** with FAIL remediation on those paths.  
7. Material scope beyond Phase 5 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Touch-target audit + remediation on PM / portal critical paths  
- Dense-list spacing rhythm (token-consistent)  
- Skeleton / structured loading preference over full-shell spinners on primary loading surfaces  
- Subtle transitions + `prefers-reduced-motion` honor  
- Optional haptics for confirm/destructive only  
- Long-press only as duplicate of explicit actions  
- Drawer / bottom-sheet scroll-lock + focus-trap hardening  
- Native UX matrix first-pass execution + FAIL remediation for critical paths + evidence notes  
- Implementation summary + validation evidence under **P5-01…P5-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 6 — Push Notification Certification matrix | Separate authorize |
| PMX-004 Phase 7 — Offline Reliability / outbox | Separate authorize |
| PMX-004 Phase 8 — Performance Optimization (Lighthouse ≥95 gate) | Separate authorize |
| PMX-004 Phase 9 — Premium Native Features | Separate authorize |
| PMX-004 Phase 10 — Production Validation | Separate authorize |
| PMX-004 Phase 11 — Real-World Pilot / package COMPLETE / full A14 closeout | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| OPS-001 Slices C–E | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Navigation IA redesign · role-home redesign · Command Center productization | Forbidden under this phase / separate packages |
| Full offline CRUD · App Store / Play Store · Firefox parity · Universal Links | Out of package / later or non-criteria |
| Product redesign / schema / provider swaps | Forbidden package-wide |
| Claiming package COMPLETE from Phase 5 polish alone | Forbidden — Phase 11 gate |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified SW substrate |
| Phase 2 Validated | Install / standalone detection preserved |
| Phase 3 Validated | Native shell chrome (primary Phase 5 dependency per package 05) |
| Phase 4 Validated | Standalone dispositions preserved (matrix S4) |
| M0 = GO | Program unlock |
| UX-012 Slice A + B Validated | Token / component substrate for polish |
| Native UX matrix [13] | Living checklist SoT |
| CORE-003 Phase 5 eligibility | Program sequence (next PMX unit) |

**Does not depend on:** PMX-004 Phases 6–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 5) — P5-01 … P5-10

| ID | Criterion |
|----|-----------|
| **P5-01** | **Touch targets** — primary interactive controls on audited critical paths meet ≥ 44×44 CSS px (Buttons, icon buttons, list rows) or documented Accepted waiver with Product note ([13](./13-native-ux-acceptance-matrix.md) T1). |
| **P5-02** | **Spacing rhythm** — dense mobile lists on critical paths show token-consistent spacing; no cramped adjacent hit areas (T2–T3). |
| **P5-03** | **Loading polish** — primary critical-path loading surfaces prefer skeletons / structured loading over unnecessary full-shell spinners (L1–L2 · EP-019 H5 alignment). |
| **P5-04** | **Motion** — subtle route/section transitions present where implemented; `prefers-reduced-motion` honored (N3 · reduced-motion safe). |
| **P5-05** | **Haptics discipline** — if vibrate used, limited to confirm/destructive and disabled under reduced motion; otherwise explicitly unused / N/A with note. |
| **P5-06** | **Gesture discipline** — long-press / swipe never the sole path to an action; only duplicates explicit controls where present (T4). |
| **P5-07** | **Drawer / sheet a11y** — existing bottom sheets / drawers used on critical paths have scroll-lock + focus trap behavior (extend existing Drawer; no new IA). |
| **P5-08** | **UX matrix first pass** — critical-path rows in [13](./13-native-ux-acceptance-matrix.md) exercised; Overall PASS or remediated FAIL→PASS (or listed Accepted waiver); A14 marked **underway** (full matrix PASS deferred to Phase 11). |
| **P5-09** | **Regression / non-negotiables** — Phases 1–4 SW/install/shell/standalone preserved; Auth/Supabase/OneSignal/Stripe correctness preserved; **no IA redesign** / schema under this authorize; no new a11y Sev-1 regressions; package fail conditions not violated. |
| **P5-10** | **Documentation & scope** — implementation summary + validation evidence recorded; matrix evidence pointers updated; no Phases 6–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **Touch/a11y audit; UX matrix first pass underway (A14)** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 5 exits **Validated** only when **all** are true:

1. Acceptance criteria **P5-01–P5-10** PASS.  
2. Touch audit PASS (or Accepted waiver) on PM / portal **critical paths**.  
3. No new unresolved **critical** a11y defects introduced by Phase 5 polish.  
4. UX matrix first pass underway with critical-path Overall PASS (or Accepted waiver); remaining rows explicitly deferred to Phase 11.  
5. Motion / reduced-motion discipline evidenced where transitions were added.  
6. Phases 1–4 foundations not regressed.  
7. Documentation updated (implementation summary + validation report + board status + matrix evidence notes).  
8. Governance recommendation recorded.  
9. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 5
```

Until Validation is recorded: PMX-004 Phases 6–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 5` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P5-xx / matrix category IDs / A14).  
3. Produce a **remediation** record limited to fixing authorized Phase 5 defects — no scope expansion into Phases 6–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 5 UX polish rollback (selective CSS/component size revert; no data impact) if production UX is worse than baseline.  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 5`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 5

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 6–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full Native UX matrix Overall PASS (every major screen) | Phase 11 / COMPLETE (A14 final) |
| Lighthouse Perf ≥95 / offline outbox / push device matrix / pilot | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 5?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **DONE** — [30](./30-phase-5-implementation.md) |
| **Begin validation now?** | ✅ **DONE** — [31](./31-phase-5-validation.md) · **PASS** |
| **Authorize Phases 6–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Next session:** Phase 6 **eligible** for a future `AUTHORIZE PMX-004 PHASE 6` — not issued here.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 5** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([30](./30-phase-5-implementation.md)) | 2026-07-26 |
| Validation | ✅ **PASS** ([31](./31-phase-5-validation.md)) | 2026-07-26 |

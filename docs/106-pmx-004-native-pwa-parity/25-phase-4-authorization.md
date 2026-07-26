# 25 — PMX-004 Phase 4 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **4 — Standalone Compliance**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **done** ([27](./27-phase-4-implementation.md)) · Validation 🔒 until `VALIDATE PMX-004 PHASE 4`  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 4
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 4
```

**Program record:** [CORE-003 §66](../113-core-003-implementation-master-plan/66-pmx-004-phase-4-authorization.md)  
**Prior gate:** [24 — Phase 3 Validation](./24-phase-3-validation.md) · ✅ **PASS** · [CORE-003 §65](../113-core-003-implementation-master-plan/65-pmx-004-phase-3-validation.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 4  
**Inventory SoT:** [10 — Standalone Exit Inventory](./10-standalone-exit-inventory.md) (living — re-scan at implementation start)  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 4 · [02 — Proposed architecture](./02-proposed-architecture.md) §6 Standalone compliance · [06 — Acceptance criteria](./06-acceptance-criteria.md) (A8–A9) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — any new confirm/viewer chrome uses `--mpa-*` / Canopy; **no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 3 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 4` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 5–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
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
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| Next PMX authorize unit = Phase 4 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 3 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX slice blocking this phrase | Phase 3 Validated · no open authorize ahead of Phase 4 | ✅ |
| PMX-004 Phase 5–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 4?** ❌ **None.**

**Order note:** CORE-003 marks PMX Phase 4 **eligible** after Phase 3 Validated. This phrase authorizes **PMX-004 Phase 4 (Standalone Compliance)** only. Peers (OPS-001 Slice C · UX-012 Slice C · etc.) remain separately gated and are **not** unlocked here.

---

## 2. Authorization scope

### In scope (Phase 4 — Standalone Compliance)

Binding work list from [05](./05-implementation-order.md) Phase 4, [02](./02-proposed-architecture.md) §6, and [10](./10-standalone-exit-inventory.md):

| Deliverable | Binding source |
|-------------|----------------|
| **Exit inventory disposition** — close E01–E13 (and re-scan deltas) as Mitigated · Same-tab · In-app viewer · or Accepted-with-return | [10](./10-standalone-exit-inventory.md) · A8 |
| **High-traffic document / report opens** — replace `target="_blank"` with in-app viewer or same-tab (owner docs/reports/statements · vault · tenant docs · facility · vendor invoice PDF · related) | [05](./05-implementation-order.md) · E01–E09 |
| **Report downloads** — replace `window.open` with same-window download / in-app viewer | [05](./05-implementation-order.md) · E11 |
| **Stripe return compliance** — absolute `success_url` / `return_url` / `cancel_url` to app; optional “Returning to M.P.A.…” interstitial; resident + company billing paths | [05](./05-implementation-order.md) · E12–E13 · A9 |
| **E-sign** — prefer same-window provider redirect + return deep link; else document Accepted-with-return with evidence | [05](./05-implementation-order.md) · E10 |
| **External leave confirm** — audit external http(s) exits; confirm sheet when leaving app (Pattern D); `rel=noopener` hygiene | [05](./05-implementation-order.md) · [02](./02-proposed-architecture.md) §6 |
| **Auth / invite / reset deep links** — document iOS standalone reopen limitation; prefer HTTPS app URLs that reopen PWA when OS allows (E15 note — no Universal Links required) | [05](./05-implementation-order.md) · [10](./10-standalone-exit-inventory.md) §3 |
| **Admin/dev exceptions** — E14 deployment badge may remain Acceptable external with documented disposition | [10](./10-standalone-exit-inventory.md) |
| **Preserve Phases 1–3** — unified SW · install onboarding · native shell chrome remain intact | Phases 1–3 Validated |
| **Token / UX compliance** — viewer / confirm UI uses UX-012 / Canopy `--mpa-*`; **no IA redesign** | UX-012 A/B |

### Implementation boundaries

1. Work is limited to **Standalone Compliance** (Phase 4) — not Phase 5 UX matrix polish, Phase 6 push matrix, Phase 7 offline queue, Phase 8 performance, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot.  
2. **DO NOT** redesign the application, change IA, remove features, or change business workflows.  
3. **DO NOT** break Auth / Supabase / OneSignal / Stripe payment correctness / unified service worker / Phase 2 install / Phase 3 shell.  
4. **DO NOT** introduce schema migrations under this authorize.  
5. Prefer Patterns A–D from [10](./10-standalone-exit-inventory.md); CSP changes only if required for in-app viewer and must be security-reviewed.  
6. Re-scan `apps/web` for new `_blank` / `window.open` exits at implementation start; disposition new finds under the same rules.  
7. Material scope beyond Phase 4 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- Living exit inventory update + dispositions for E01–E13 (+ re-scan)  
- In-app / same-tab document & report viewing for primary PM + portal paths  
- Same-window report download (no `window.open` for primary report flows)  
- Stripe absolute return URLs + optional return interstitial  
- E-sign same-window or documented Accepted-with-return  
- External-leave confirm for intentional outbound links  
- Auth deep-link / iOS reopen documentation  
- Implementation summary + validation evidence under **P4-01…P4-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
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
| App Store / Play Store listing · Firefox parity · full offline CRUD · Universal Links | Out of package / later or non-criteria |
| Product redesign / schema / provider swaps | Forbidden package-wide |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified SW substrate |
| Phase 2 Validated | Install / standalone detection preserved |
| Phase 3 Validated | Native shell chrome preserved |
| M0 = GO | Program unlock |
| UX-012 Slice A + B Validated | Token substrate for viewer / confirm UI |
| Exit inventory [10] | Living disposition list |
| Existing Stripe / e-sign / document flows | Implementation substrate |
| CORE-003 Phase 4 eligibility | Program sequence (next PMX unit) |

**Does not depend on:** PMX-004 Phases 5–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 4) — P4-01 … P4-10

| ID | Criterion |
|----|-----------|
| **P4-01** | **Inventory living & dispositioned** — E01–E13 (plus re-scan finds in Phase 4 scope) each marked Mitigated · Same-tab · In-app viewer · Accepted-with-return · or Acceptable (E14-class) with rationale ([10](./10-standalone-exit-inventory.md)). |
| **P4-02** | **Primary document opens stay in-app / same-tab** — high-traffic owner/vault/tenant/facility/vendor document opens no longer use unexpected `_blank` exit in standalone (E01–E09 class). |
| **P4-03** | **Primary report flows** — owner reports / statements / ops reports avoid unexpected `_blank` / `window.open` exits; download or in-app viewer used (E02–E03 · E11). |
| **P4-04** | **Stripe return compliance** — resident and/or company billing Checkout/Portal paths use absolute return URLs into authenticated M.P.A.; round-trip restores session (A9 · E12–E13). |
| **P4-05** | **Optional return interstitial** — “Returning to M.P.A.…” (or equivalent) present where implemented, or explicitly waived with documented Accepted-with-return still meeting A9. |
| **P4-06** | **E-sign path** — same-window redirect preferred; else Accepted-with-return documented with return deep link / evidence (E10). |
| **P4-07** | **External leave confirm** — intentional outbound http(s) exits use confirm Pattern D (or documented Acceptable exception such as E14); `rel=noopener` hygiene applied where applicable. |
| **P4-08** | **Auth deep-link notes** — invite / password-reset / email link standalone reopen limitation documented; HTTPS app URLs preferred (E15 · [10](./10-standalone-exit-inventory.md) §3). |
| **P4-09** | **Regression / non-negotiables** — Phases 1–3 SW/install/shell preserved; Auth/Supabase/OneSignal/Stripe correctness preserved; no IA redesign / schema under this authorize; package fail conditions not violated. |
| **P4-10** | **Documentation & scope** — implementation summary + validation evidence recorded; inventory updated; no Phases 5–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **A8–A9** + inventory closed ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 4 exits **Validated** only when **all** are true:

1. Acceptance criteria **P4-01–P4-10** PASS.  
2. Inventory E01–E13 (plus in-scope re-scan finds) dispositioned.  
3. Primary document/report standalone paths evidenced (device or documented layout/flow evidence).  
4. Stripe return evidenced for at least one primary billing path (resident or company) with absolute URLs.  
5. E-sign path dispositioned with evidence.  
6. No unresolved **critical** defects; Phases 1–3 foundations not regressed.  
7. CSP changes (if any) security-reviewed and recorded.  
8. Documentation updated (implementation summary + validation report + board status).  
9. Governance recommendation recorded.  
10. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 4
```

Until Validation is recorded: PMX-004 Phases 5–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 4` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P4-xx / A8–A9 / inventory E-IDs).  
3. Produce a **remediation** record limited to fixing authorized Phase 4 defects — no scope expansion into Phases 5–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 4 exit-mitigation rollback if production standalone exits are worse than baseline.  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 4`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 4

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 5–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Universal Links / App Links | Out of Phase 4 scope |
| Full Native UX matrix | Phase 5 |
| Offline outbox / Lighthouse ≥95 / pilot | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 4?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **YES** — in a dedicated implementation session, Phase 4 scope only |
| **Begin implementation in this governance session?** | ❌ **NO** — stop after authorization |
| **Begin validation now?** | ❌ **NO** — after implementation |
| **Authorize Phases 5–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Next session:** Implement PMX-004 Phase 4 per this authorize → then `VALIDATE PMX-004 PHASE 4`.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 4** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([27](./27-phase-4-implementation.md)) | 2026-07-26 |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 4` | — |

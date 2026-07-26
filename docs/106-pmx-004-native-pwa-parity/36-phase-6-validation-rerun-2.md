# 36 — PMX-004 Phase 6 Validation Re-Run #2

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 6 — Push Notification Certification  
**Authorization:** [32](./32-phase-6-authorization.md)  
**Implementation:** [33](./33-phase-6-implementation.md)  
**Prior validations (preserved):**  
- [34](./34-phase-6-validation.md) · ❌ **FAIL**  
- [35](./35-phase-6-validation-rerun.md) · ❌ **FAIL** (re-run)  
**Remediation:** ❌ **Not complete at this record** — R1 still open (later closed; see [37](./37-phase-6-validation-rerun-3.md))  
**Status:** ❌ **FAIL** (re-run #2) · ⚠️ **Historical** — live SoT [37](./37-phase-6-validation-rerun-3.md)  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 6
```

**Program record:** [CORE-003 §76](../113-core-003-implementation-master-plan/76-pmx-004-phase-6-validation-rerun-2.md)  
**Evidence pack:** [artifacts/phase-6-push-cert/](./artifacts/phase-6-push-cert/README.md)  

> Validation re-run only. No product-code changes in this record.  
> Historical FAIL reports [34](./34-phase-6-validation.md) · [35](./35-phase-6-validation-rerun.md) are **preserved**.  
> PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** authorized under this phrase.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 6 Validation (re-run #2)** | ❌ **FAIL** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 6` recorded (this document) |
| **Remediation required before PASS?** | ✅ **YES** — R1 still blocking |
| **Phase 6 approved for program progression?** | ❌ **NO** |
| **Recommend `AUTHORIZE PMX-004 PHASE 7`?** | ❌ **NO** — not eligible until Phase 6 Validated |
| **Begin Phase 7 / UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |
| **Claim package COMPLETE?** | ❌ **NO** |

---

## 2. Fresh verification (this session)

### 2.1 Production ship / R1

| Check | Result |
|-------|--------|
| Production URL | https://www.my-property-assistant.com |
| Production SHA (Phase 5 ship) | `fd1e31aca9448f4f68f2aaddc264c85768b80519` still ancestor of HEAD; no Phase 6 code deploy |
| Deploy | `dpl_Cx2jQ7nDt7EwyBeyrDg84YD1ETvU` (Phase 5 READY — unchanged) |
| HEAD `ownerReportsHref` | `/portal/owner` (pre-repair) |
| Working-tree repair | `/portal/owner/reports` — **uncommitted**, mixed with unrelated WIP |
| Phase 6 on Production? | ❌ **No** |

**R1 closed?** ❌ **No**

### 2.2 Service Worker (prod probe 2026-07-26 this session)

| Check | Result |
|-------|--------|
| `GET /OneSignalSDKWorker.js` | HTTP **200** |
| `Service-Worker-Allowed` | `/` |
| Unified Phase 1 worker | ✅ Header + OneSignal CDN + `/sw-offline.js` |
| Offline / install redesign | ❌ None (preserved) |
| Provider swap | ❌ None (OneSignal primary) |

### 2.3 Deep-link unit tests (local working tree)

| Suite | Result |
|-------|--------|
| `deep-links.test.ts` + `onesignal-provider.test.ts` | ✅ **10/10 PASS** (includes uncommitted Phase 6 expectations) |

### 2.4 Pre-existing TypeScript noise

AUTH / OPS `tsc` errors (`credentials/delivery.ts`, `identity/adapter.ts`, `roles/assignment.ts`, `master-admin/access.ts`, `ops/scheduler.ts`) remain **pre-existing** and **unrelated** to Phase 6 deep-link delta — confirmed not introduced by Phase 6 repair files.

### 2.5 Exclusions / collision

| Check | Result |
|-------|--------|
| Phase 7–11 authorize/implement docs | ❌ None present |
| UX-012 C–E / OPS-001 C–E / FIN-003 C–E / marketplace under this phrase | ❌ Not shipped |

---

## 3. Acceptance checklist (P6-01 … P6-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P6-01** | Device matrix | ✅ PASS | Phase 1 T4 + Samsung-class Accept ([device-matrix.md](./artifacts/phase-6-push-cert/devices/device-matrix.md)) |
| **P6-02** | Closed / background | ✅ PASS | Lifecycle matrix · T4 |
| **P6-03** | Environment / state | ✅ PASS | Wi‑Fi attested; LTE/battery Accept |
| **P6-04** | Deep-link correctness | ❌ **FAIL** | Prod HEAD still `/portal/owner`; claimed Phase 6 repair not shipped |
| **P6-05** | Duplicates / diagnostics | ✅ PASS | Idempotency · MA path · T4 enroll |
| **P6-06** | MA / test send | ✅ PASS | Path + T4 delivery |
| **P6-07** | Evidence packaged | ✅ PASS | Secret-free pack committed |
| **P6-08** | PUSH-001 G1–G10 | ❌ **FAIL** | G5 not Production-true while R1 open; G3/SI Accept OK |
| **P6-09** | Regression / non-negotiables | ❌ **FAIL** | Prod SW OK on Phase 5; Phase 6 delta unshipped |
| **P6-10** | Documentation & scope | ⚠️ Partial | FAIL trail complete; ship incomplete until R1 |

**Aggregate P6-01–P6-10:** ❌ **FAIL** (P6-04 · P6-08 · P6-09; P6-10 open until ship)

---

## 4. Exit criteria ([32] §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P6-01–P6-10 PASS | ❌ |
| 2 | Real-device matrix / Accept | ✅ |
| 3 | Deep-link correctness (prod) | ❌ R1 |
| 4 | G1–G10 / Accept | ❌ G5 prod gap |
| 5 | No secrets in artifacts | ✅ |
| 6 | Phases 1–5 / OneSignal preserved on prod | ✅ (Phase 5 deploy) |
| 7 | Documentation updated | ✅ this re-run |
| 8 | Governance recommendation | ✅ |
| 9 | Phrase recorded | ✅ |

---

## 5. Lifecycle / SW / deep-link summary

| Area | Disposition |
|------|-------------|
| Foreground / background / closed / click / permission | ✅ Attested via Phase 1 T4 + lifecycle pack |
| Dismissal | N/A OS-owned (Accept) |
| SW 200 + Allowed + unified worker | ✅ Fresh probe PASS |
| Deep-link tests 10/10 | ✅ Local WT only — not Production |
| AUTH-001 / org isolation | ✅ No auth redesign; same-origin absolute URLs preserved in code path |

---

## 6. Remediation required (unchanged — Phase 6 only)

1. Isolate Phase 6 files from unrelated WIP (`deep-links.ts` / tests · messaging helpers · onesignal export/test).  
2. Commit + Production ship Phase 6 scoped repair only.  
3. Record ship SHA / deploy READY.  
4. Confirm Production `ownerReportsHref` → `/portal/owner/reports`.  
5. Re-issue **`VALIDATE PMX-004 PHASE 6`**.  
6. ❌ Do not expand into Phases 7–11 · UX-C · OPS-C · FIN-C · marketplace.

---

## 7. Recommendation

| Field | Result |
|-------|--------|
| **Validate Phase 6?** | ❌ **FAIL** |
| **Approve Phase 6 for progression?** | ❌ **NO** |
| **Phase 7 eligible for authorization?** | ❌ **NO** |
| **Authorize UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |

**Next:** R1 remediation (scoped commit + Production READY) → re-issue `VALIDATE PMX-004 PHASE 6`.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation (re-run #2) | ❌ **`VALIDATE PMX-004 PHASE 6` → FAIL** | 2026-07-26 |
| Prior FAIL [34] · [35] | Preserved | 2026-07-26 |
| Phase 7 | 🔒 Locked | — |

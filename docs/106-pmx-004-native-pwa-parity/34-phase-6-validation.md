# 34 — PMX-004 Phase 6 Validation Report

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 6 — Push Notification Certification  
**Authorization:** [32](./32-phase-6-authorization.md)  
**Implementation:** [33](./33-phase-6-implementation.md)  
**Status:** ❌ **FAIL**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 6
```

**Program record:** [CORE-003 §74](../113-core-003-implementation-master-plan/74-pmx-004-phase-6-validation.md)  
**Evidence pack:** [artifacts/phase-6-push-cert/](./artifacts/phase-6-push-cert/README.md)  
**Push SoT:** [PUSH-001 §10](../99-push-001-pwa-push-commercial-certification/10-pass-criteria.md)  
**Package phase minimum:** PUSH-001 G1–G10 (or Product-accepted non-blocking deferrals) — [06](./06-acceptance-criteria.md) §3  

> Validation only. No product-code changes in this validation record.  
> PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI **not** authorized under this phrase.  
> Preserve this FAIL — do not rewrite history ([32](./32-phase-6-authorization.md) §7).

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 6 Validation** | ❌ **FAIL** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 6` recorded |
| **Remediation required before PASS?** | ✅ **YES** — R1 blocking (Production ship of scoped Phase 6 repair + commit closeout) |
| **Phase 6 approved for program progression?** | ❌ **NO** — not Validated until remediation + re-validation PASS |
| **Recommend `AUTHORIZE PMX-004 PHASE 7`?** | ❌ **NO** — blocked until Phase 6 Validated |
| **Begin Phase 7 / UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |
| **Claim package COMPLETE?** | ❌ **NO** |

---

## 2. Production / ship evidence (at validation)

| Field | Value |
|-------|-------|
| **Production SHA** | `fd1e31aca9448f4f68f2aaddc264c85768b80519` (**Phase 5** ship — not Phase 6) |
| **Deploy** | `dpl_Cx2jQ7nDt7EwyBeyrDg84YD1ETvU` |
| **State** | READY |
| **URL** | https://www.my-property-assistant.com |
| **Phase 6 code on Production?** | ❌ **No** |
| **HEAD `ownerReportsHref`** | `/portal/owner` (pre-repair) |
| **Working-tree repair** | `/portal/owner/reports` (uncommitted · mixed with unrelated WIP) |

**Canonical SW probe (prod):** `/OneSignalSDKWorker.js` HTTP 200 · `Service-Worker-Allowed: /` · Phase 1 unified worker body intact · OneSignal primary preserved.

---

## 3. Blocking defects

| ID | Severity | Criterion | Defect |
|----|----------|-----------|--------|
| **R1** | **Blocking** | P6-04 · P6-08 (G5) · P6-09 · P6-10 | Phase 6 scoped deep-link repair (`ownerReportsHref` → `/portal/owner/reports` · messaging helpers · onesignal absolute-url test) is **not committed** and **not deployed**. Production remains Phase 5 (`fd1e31a`). Claimed G5 “Phase 6 repair” is therefore **not Production-true**. |
| **R2** | Blocking companion | P6-10 | Implementation summary ([33](./33-phase-6-implementation.md)), program §73, and `artifacts/phase-6-push-cert/` were **untracked** at validation open — board still showed Phase 6 Implementation 🔒. Closeout docs must land with remediation (this validation commits the FAIL + evidence trail; ship remains open). |

Non-blocking notes (do **not** alone cause FAIL if R1 closed):

| Note | Disposition |
|------|-------------|
| Device matrix reuses Phase 1 T4 attestation | Allowed with Product Accept packaging ([device-matrix.md](./artifacts/phase-6-push-cert/devices/device-matrix.md)) |
| Samsung Internet / Desktop G3 / LTE·battery cells | Product Accept recorded ([product-accept-deferrals.md](./artifacts/phase-6-push-cert/product-accept-deferrals.md)) |
| Historical PUSH-001 commercial FAIL (2026-07-24) | Preserved — not silently rewritten |

---

## 4. Acceptance checklist (P6-01 … P6-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P6-01** | Device matrix executed | ✅ PASS (attested + Accept) | Galaxy Chrome · Pixel · iPhone from Phase 1 T4; Samsung Internet Accepted as Samsung-class |
| **P6-02** | Closed / background delivery | ✅ PASS (attested) | Phase 1 T4 Push PASS · lifecycle matrix |
| **P6-03** | Environment / state coverage | ✅ PASS (w/ Accept) | Wi‑Fi attested; LTE/battery Accepted / N/A |
| **P6-04** | Deep-link correctness | ❌ **FAIL** | Absolute URL + helpers evidenced in working tree/tests; **Production still routes owner reports to `/portal/owner`**; Phase 6 repair not shipped |
| **P6-05** | Duplicate / diagnostics hygiene | ✅ PASS (code + prior attest) | Idempotency keys · MA diagnostics path · T4 enroll |
| **P6-06** | Master Admin / test send path | ✅ PASS (path + T4) | Test API / Settings path present; T4 delivery covers exercised sends |
| **P6-07** | Evidence packaged (no secrets) | ✅ PASS (pack present) | `artifacts/phase-6-push-cert/` secret-free; was untracked until this closeout |
| **P6-08** | PUSH-001 G1–G10 | ❌ **FAIL** | G5 cannot be Production PASS while R1 open; other gates PASS or Accepted deferral in pack |
| **P6-09** | Regression / non-negotiables | ❌ **FAIL** (ship incomplete) | Prod SW/OneSignal OK on Phase 5 deploy; Phase 6 repair not on prod → cannot close regression/ship non-negotiable for claimed repair |
| **P6-10** | Documentation & scope | ❌ **FAIL** (open at validation) | §33 claimed CERTIFIED before Production ship; Phases 7–11 / peers correctly not shipped |

**Aggregate P6-01–P6-10:** ❌ **FAIL** (P6-04 · P6-08 · P6-09 · P6-10)

---

## 5. Exit criteria ([32] §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P6-01–P6-10 PASS | ❌ |
| 2 | Real-device matrix evidence present (or Accepted deferral) | ✅ |
| 3 | Deep-link correctness evidenced for exercised types | ❌ (prod gap R1) |
| 4 | G1–G10 PASS or Product-accepted deferrals | ❌ (G5 prod gap) |
| 5 | Artifacts contain no secrets | ✅ |
| 6 | Phases 1–5 not regressed; OneSignal primary | ✅ on current prod (Phase 5); Phase 6 delta not shipped |
| 7 | Documentation updated | ✅ this FAIL + board |
| 8 | Governance recommendation recorded | ✅ |
| 9 | Phrase recorded | ✅ |

---

## 6. Unit tests (local working tree — not Production)

| Suite | Result |
|-------|--------|
| `deep-links.test.ts` · `onesignal-provider.test.ts` | ✅ 10/10 PASS (includes uncommitted Phase 6 expectations) |

---

## 7. Remediation required (Phase 6 scope only)

1. **Isolate** Phase 6 code (`deep-links.ts` / tests · messaging helpers · onesignal export/test) from unrelated WIP.  
2. **Commit + ship Production** Phase 6 scoped repair only.  
3. Record ship SHA / deploy READY on remediation or re-validation doc.  
4. Confirm Production `ownerReportsHref` behavior matches `/portal/owner/reports` (code audit + tests on shipped SHA).  
5. Re-run **`VALIDATE PMX-004 PHASE 6`** (or labeled re-run) until **PASS**.  
6. ❌ Do **not** expand into Phases 7–11 · UX-C · OPS-C · FIN-C · marketplace.

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Validate Phase 6?** | ❌ **FAIL** |
| **Authorize Phase 7 under this phrase?** | ❌ **NO** |
| **Authorize UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |
| **Claim COMPLETE?** | ❌ **NO** |

**Next:** Phase 6 remediation (R1 ship) → re-issue `VALIDATE PMX-004 PHASE 6`.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ❌ **`VALIDATE PMX-004 PHASE 6` → FAIL** | 2026-07-26 |
| Production ship (Phase 6) | ❌ Pending remediation | — |

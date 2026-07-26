# 37 — PMX-004 Phase 6 Validation Re-Run #3 (Post-R1 Deployment)

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 6 — Push Notification Certification  
**Authorization:** [32](./32-phase-6-authorization.md)  
**Implementation:** [33](./33-phase-6-implementation.md)  
**Prior validations (preserved):**  
- [34](./34-phase-6-validation.md) · ❌ **FAIL**  
- [35](./35-phase-6-validation-rerun.md) · ❌ **FAIL** (re-run)  
- [36](./36-phase-6-validation-rerun-2.md) · ❌ **FAIL** (re-run #2)  
**Remediation:** ✅ **R1 CLOSED** — Production ship `5a6129c` / `dpl_9RNtpiWqc5pDXEa9dzrV26hnKcKp`  
**Status:** ✅ **PASS** (re-run #3 · authoritative)  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 6
```

**Program record:** [CORE-003 §77](../113-core-003-implementation-master-plan/77-pmx-004-phase-6-validation-rerun-3.md)  
**Evidence pack:** [artifacts/phase-6-push-cert/](./artifacts/phase-6-push-cert/README.md)  

> Validation re-run only. No product-code changes in this record.  
> Historical FAIL reports [34](./34-phase-6-validation.md) · [35](./35-phase-6-validation-rerun.md) · [36](./36-phase-6-validation-rerun-2.md) are **preserved**.  
> PMX-004 Phases 7–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** authorized under this phrase.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 6 Validation (re-run #3)** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 6` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** — R1 closed on Production |
| **Phase 6 approved for program progression?** | ✅ **YES** — Phase 6 **Validated** |
| **Recommend `AUTHORIZE PMX-004 PHASE 7`?** | ✅ **Eligible** after this Validation — subsequently **AUTHORIZED** ([38](./38-phase-7-authorization.md)) |
| **Begin Phase 7 / UX-C / OPS-C / FIN-C / marketplace?** | Phase 7 implement eligible under [38](./38-phase-7-authorization.md); UX-C / OPS-C / FIN-C / marketplace ❌ until each authorize |
| **Claim package COMPLETE?** | ❌ **NO** — Phase 11 gate |

---

## 2. Fresh verification (this session)

### 2.1 Production ship / R1

| Check | Result |
|-------|--------|
| Production URL | https://www.my-property-assistant.com |
| Production SHA | `5a6129c0e7371b18b004f2f49e326c6157d597ac` |
| Deploy | `dpl_9RNtpiWqc5pDXEa9dzrV26hnKcKp` |
| State | **READY** · target **production** |
| Aliases | `www.my-property-assistant.com` · `my-property-assistant.com` · `m-p-a-web.vercel.app` |
| Commit message (Vercel meta) | `Ship PMX-004 Phase 6 deep-link repair to Production (R1).` |
| `ownerReportsHref` on shipped SHA | `/portal/owner/reports` |
| Messaging helpers on shipped SHA | `tenantMessagingHref` · `staffMessagingHref` wired in `messaging/server.ts` |
| `absoluteNotificationUrl` | Exported (testability) |
| Files in remediation commit | 5 Phase 6 files only (no AUTH/COM/OPS WIP) |
| Phase 6 on Production? | ✅ **Yes** |

**R1 closed?** ✅ **Yes**

**Scoped files shipped:**

1. `apps/web/src/lib/notifications/deep-links.ts`  
2. `apps/web/src/lib/notifications/deep-links.test.ts`  
3. `apps/web/src/lib/messaging/server.ts`  
4. `apps/web/src/lib/integrations/notifications/onesignal-provider.ts`  
5. `apps/web/src/lib/integrations/notifications/onesignal-provider.test.ts`  

### 2.2 Service Worker (prod probe 2026-07-26 this session)

| Check | Result |
|-------|--------|
| `GET /OneSignalSDKWorker.js` | HTTP **200** |
| `Service-Worker-Allowed` | `/` |
| Unified Phase 1 worker | ✅ Header + OneSignal CDN + `/sw-offline.js` |
| Offline / install redesign | ❌ None (preserved) |
| Provider swap | ❌ None (OneSignal primary) |

### 2.3 Route regression probes (unauthenticated)

| Path | Result |
|------|--------|
| `/portal/owner/reports` | 200 → auth redirect `/login` (route present) |
| `/portal/owner` | 200 → `/login` (preserved) |
| `/portal/tenant/messages` | 200 → `/login` (preserved) |
| `/communications` | 200 → `/login` (preserved) |
| `/login` | 200 (preserved) |

### 2.4 Deep-link unit tests (shipped SHA content)

| Suite | Result |
|-------|--------|
| `deep-links.test.ts` + `onesignal-provider.test.ts` | ✅ **10/10 PASS** (prior ship-lane verification on clean `5a6129c` worktree; expectations match Production SHA) |

### 2.5 Exclusions / collision

| Check | Result |
|-------|--------|
| Phase 7–11 authorize/implement under this phrase | ❌ None issued / begun |
| UX-012 C–E / OPS-001 C–E / FIN-003 C–E / marketplace under this phrase | ❌ Not shipped |
| AUTH / COM / OPS WIP in remediation commit | ❌ Excluded (5-file scoped ship) |

---

## 3. Acceptance checklist (P6-01 … P6-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P6-01** | Device matrix | ✅ PASS | Phase 1 T4 + Samsung-class Accept ([device-matrix.md](./artifacts/phase-6-push-cert/devices/device-matrix.md)) |
| **P6-02** | Closed / background | ✅ PASS | Lifecycle matrix · T4 |
| **P6-03** | Environment / state | ✅ PASS | Wi‑Fi attested; LTE/battery Accept |
| **P6-04** | Deep-link correctness | ✅ **PASS** | Production SHA `ownerReportsHref` → `/portal/owner/reports`; messaging helpers live; absolute URL path preserved |
| **P6-05** | Duplicates / diagnostics | ✅ PASS | Idempotency · MA path · T4 enroll |
| **P6-06** | MA / test send | ✅ PASS | Path + T4 delivery |
| **P6-07** | Evidence packaged | ✅ PASS | Secret-free pack committed |
| **P6-08** | PUSH-001 G1–G10 | ✅ **PASS** | G5 Production-true on `5a6129c`; G3/SI Accept OK ([g1-g10-results.md](./artifacts/phase-6-push-cert/g1-g10-results.md)) |
| **P6-09** | Regression / non-negotiables | ✅ **PASS** | Phase 6 delta on prod; SW/OneSignal/Phases 1–5 preserved; no IA/schema under Phase 6 |
| **P6-10** | Documentation & scope | ✅ **PASS** | FAIL trail preserved ([34]–[36]); ship + this PASS recorded; Phases 7–11 not begun |

**Aggregate P6-01–P6-10:** ✅ **PASS**

---

## 4. Exit criteria ([32] §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P6-01–P6-10 PASS | ✅ |
| 2 | Real-device matrix / Accept | ✅ |
| 3 | Deep-link correctness (prod) | ✅ R1 closed |
| 4 | G1–G10 / Accept | ✅ G5 Production-true |
| 5 | No secrets in artifacts | ✅ |
| 6 | Phases 1–5 / OneSignal preserved on prod | ✅ |
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
| Deep-link tests 10/10 | ✅ On shipped SHA content |
| `ownerReportsHref` Production-true | ✅ `/portal/owner/reports` |
| Messaging helpers Production-true | ✅ `staffMessagingHref` / `tenantMessagingHref` |
| AUTH-001 / org isolation | ✅ No auth redesign; same-origin absolute URLs preserved |

---

## 6. Remediation required

**None** for Phase 6 Validation PASS.

---

## 7. Recommendation

| Field | Result |
|-------|--------|
| **Validate Phase 6?** | ✅ **PASS** |
| **Approve Phase 6 for progression?** | ✅ **YES** |
| **Phase 7 eligible for authorization?** | ✅ **YES** — subsequently **AUTHORIZED** ([38](./38-phase-7-authorization.md)) |
| **Authorize Phase 7 under this phrase?** | ❌ **NO** (issued separately) |
| **Authorize UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |
| **Claim COMPLETE?** | ❌ **NO** |

**Next (post-authorize):** Implement Phase 7 within [38](./38-phase-7-authorization.md) → `VALIDATE PMX-004 PHASE 7`. Do **not** begin UX-C / OPS-C / FIN-C / marketplace / Phases 8–11 without their phrases.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation (re-run #3 · post-R1) | ✅ **`VALIDATE PMX-004 PHASE 6` → PASS** | 2026-07-26 |
| Prior FAIL [34] · [35] · [36] | Preserved | 2026-07-26 |
| Production ship (Phase 6 R1) | ✅ `5a6129c` · `dpl_9RNtpiWqc5pDXEa9dzrV26hnKcKp` READY | 2026-07-26 |
| Phase 7 | ✅ **AUTHORIZED** ([38](./38-phase-7-authorization.md)) · implement pending | 2026-07-26 |

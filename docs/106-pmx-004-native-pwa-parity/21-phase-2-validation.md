# 21 — PMX-004 Phase 2 Validation Report

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 2 — Native Installation Experience  
**Authorization:** [19](./19-phase-2-authorization.md)  
**Implementation:** [20](./20-phase-2-implementation.md)  
**Status:** ✅ **VALIDATED** · **PASS**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 2
```

**Program record:** [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md)  
**Package phase minimum:** A4–A6 + funnel instrumentation started (A15 in progress) — [06](./06-acceptance-criteria.md) §3  
**Funnel SoT:** [14](./14-installation-success-funnel.md)

> Validation only. No product-code changes in this session.  
> At validation time: PMX-004 Phases 3–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI **not** authorized under this phrase.  
> **Follow-on:** Phase 3 subsequently **AUTHORIZED** — [22](./22-phase-3-authorization.md) · [CORE-003 §63](../113-core-003-implementation-master-plan/63-pmx-004-phase-3-authorization.md).  
> Historical governance records preserved.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 2 Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 2` recorded |
| **Remediation required before PASS?** | ❌ **No** |
| **Phase 2 approved for program progression?** | ✅ **YES** — Phase 2 **Validated** |
| **Recommend `AUTHORIZE PMX-004 PHASE 3`?** | ✅ **Eligible** after this Validation — phrase **not issued** here |
| **Begin Phase 3 / UX-C / OPS-C / FIN-C / marketplace?** | At validation: ❌ locked · **Follow-on:** Phase 3 ✅ authorized ([22](./22-phase-3-authorization.md)); UX-C / OPS-C / FIN-C / marketplace still locked |

---

## 2. Scope verified against [19] / [20]

| In-scope deliverable | Evidence | Result |
|----------------------|----------|--------|
| Platform detection | `lib/pwa/platform.ts` · tests | ✅ |
| BIP + Install CTA + dismiss backoff | `before-install-prompt.ts` · `PwaNativeOnboarding` · `dismissOnboardingWithBackoff` | ✅ |
| Org-scoped persistence | `mpa.pwa.onboarding.v1:<orgId>` · storage tests | ✅ |
| iOS A2HS sheet (tokenized) | `ios-a2hs-sheet.tsx` · `--mpa-*` tokens | ✅ |
| Standalone detection | `standalone.ts` · checklist Installed sync | ✅ |
| Post-install notifications (API-001A) | Onboarding notify surface · `obtainPushSubscription` / `registerDeviceWithServer` · banner deferral | ✅ |
| Lazy camera | No `getUserMedia` in PWA onboarding · Permissions sync · `mpa:pwa-camera-intent` | ✅ |
| Checklist + Settings re-entry | `InstallChecklist` · `PwaInstallSettingsPanel` on notifications settings | ✅ |
| Funnel events | `funnel.ts` · `pwa_funnel_*` · secret-free props | ✅ |
| No Phases 3–11 / unauthorized packages | No shell/viewport overhaul · no offline outbox · no UX-C/OPS-C/FIN-C/marketplace ship | ✅ |

**Browser-capability constraints (recorded):** Android BIP exists only when the browser fires `beforeinstallprompt` (Chrome family). iOS cannot programmatically install — success = standalone return after A2HS. Desktop BIP is optional/low urgency per [14](./14-installation-success-funnel.md).

---

## 3. Acceptance checklist (P2-01 … P2-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P2-01** | Platform detection | ✅ PASS | `detectPwaPlatform` → android-chrome · ios-safari · desktop · other; unit tests PASS |
| **P2-02** | Android BIP + Install CTA | ✅ PASS | `beforeinstallprompt` capture + `promptInstall` + Install CTA; CTA disabled until BIP on Android |
| **P2-03** | iOS A2HS | ✅ PASS | Tokenized Share → Add to Home Screen sheet; Remind me later / I added it |
| **P2-04** | Standalone detection | ✅ PASS | `display-mode: standalone` + `navigator.standalone` (+ related modes); syncs checklist Installed |
| **P2-05** | Post-install notifications | ✅ PASS | Notify surface after Installed; API-001A enroll; `shouldDeferPushUntilInstalled` on `PushEnrollmentBanner` |
| **P2-06** | First-run checklist + Settings | ✅ PASS | Four checklist items; org-scoped persistence; completed suppresses UI; Settings panel force-open |
| **P2-07** | Lazy camera | ✅ PASS | No onboarding camera permission request; Permissions sync + capture intents only |
| **P2-08** | Funnel instrumentation | ✅ PASS | Landing → Setup Completed events via `trackEvent`; A15 started (full KPI report later toward COMPLETE) |
| **P2-09** | Regression / non-negotiables | ✅ PASS | Phase 1 `OneSignalSDKWorker.js` / `sw-offline.js` intact; no schema; no AUTH/COM/OPS redesign; 9/9 tests PASS |
| **P2-10** | Documentation & scope | ✅ PASS | [20] + this report; Phases 3–11 / UX-C–E / OPS-C–E / FIN-C–E / marketplace not shipped |

**All P2-01–P2-10:** ✅ **PASS**

---

## 4. Detailed verification

### 4.1 Native Installation Experience

| Check | Result |
|-------|--------|
| BIP capture (`preventDefault` + deferred prompt) | ✅ |
| Install CTA after shell idle (non-blocking) | ✅ |
| Eligibility via platform + not-standalone | ✅ |
| Dismiss backoff 1d → 3d → 7d → 30d | ✅ |
| Org-scoped storage key | ✅ `mpa.pwa.onboarding.v1:<orgId\|none>` |

### 4.2 iOS Add to Home Screen

| Check | Result |
|-------|--------|
| iOS platform detection | ✅ `ios-safari` |
| Share → Add to Home Screen steps | ✅ |
| Tokenized presentation (`--mpa-*`) | ✅ |
| Standalone transition → Installed | ✅ |

### 4.3 Standalone Detection

| Check | Result |
|-------|--------|
| `display-mode: standalone` | ✅ |
| `navigator.standalone` | ✅ |
| `appinstalled` / media change subscription | ✅ |
| Checklist Installed sync + funnel installed | ✅ |

### 4.4 Post-install Notifications

| Check | Result |
|-------|--------|
| Prompt after install (not before) | ✅ |
| API-001A path (`obtainPushSubscription` + device register) | ✅ |
| Generic banner deferred while coaching active | ✅ |
| Secret-free (no new secrets / PII in enroll props) | ✅ |

### 4.5 Lazy Camera

| Check | Result |
|-------|--------|
| No onboarding `getUserMedia` / camera prompt | ✅ |
| Capture intent event on media/vendor capture inputs | ✅ |
| Permissions API granted → Camera Ready | ✅ |
| Not required for Setup Completed KPI | ✅ |

### 4.6 Checklist

| Item | Persistence |
|------|-------------|
| Installed | ✅ |
| Notifications | ✅ |
| Offline Ready (`MPA_GET_STATUS` / `MPA_STATUS`) | ✅ |
| Camera Ready (enrichment) | ✅ |
| Idempotent completion | ✅ |
| Settings re-open help | ✅ |

### 4.7 Funnel Analytics

| Event | Present |
|-------|---------|
| `pwa_funnel_landing` | ✅ |
| `pwa_funnel_install_prompt_viewed` | ✅ |
| `pwa_funnel_install_accepted` | ✅ |
| `pwa_funnel_installed` | ✅ |
| `pwa_funnel_notifications_granted` | ✅ |
| `pwa_funnel_camera_granted` | ✅ |
| `pwa_funnel_setup_completed` | ✅ |

Payloads limited to `platform` · `standalone` · `role` · `organizationId` (no email/phone). Emitted via existing `trackEvent` → structured logs (doc 14 allowed path; no schema migration).

### 4.8 Regression

| Check | Result |
|-------|--------|
| Phase 1 unified SW preserved | ✅ |
| Offline module (`sw-offline.js`) preserved | ✅ |
| AUTH / COM / OPS integrations not redesigned | ✅ |
| Unit tests | ✅ **9/9 PASS** |
| No breaking API / schema under Phase 2 | ✅ |
| Unauthorized Phase 3+ surfaces not shipped | ✅ |

---

## 5. Automated evidence

| Check | Result |
|-------|--------|
| `platform.test.ts` · `onboarding-storage.test.ts` · `funnel.test.ts` | ✅ **9/9 PASS** (2026-07-26 validation session) |

---

## 6. Exit criteria ([19] §6)

| Criterion | Result |
|-----------|--------|
| P2-01–P2-10 satisfied | ✅ |
| Android + iOS paths evidenced (code + browser-capability constraints) | ✅ |
| Checklist persistence + Settings re-entry | ✅ |
| Funnel events capturable | ✅ |
| No unresolved critical defects; Phase 1 not regressed | ✅ |
| Documentation updated | ✅ |
| Governance recommendation recorded | ✅ |
| `VALIDATE PMX-004 PHASE 2` recorded | ✅ |

---

## 7. Remediation

| Severity | Item | Action |
|----------|------|--------|
| Critical | — | None |
| High | — | None |
| Low (optional) | Full KPI measurement window / dashboard export (A15 final) | Before package COMPLETE / Phase 11 |
| Low (optional) | Real-device BIP/A2HS smoke on Galaxy / Pixel / iPhone | Recommended ops hygiene; not a Phase 2 code fail |

**No code changes required for this Validation PASS.**

---

## 8. Recommendation — Phase 2 approval & Phase 3

| Question | Answer |
|----------|--------|
| Is Phase 2 **Validated / approved for progression?** | ✅ **Yes — PASS** |
| May PMX-004 Phase 3 be **authorized**? | ✅ **Eligible** at validation · subsequently **AUTHORIZED** ([22](./22-phase-3-authorization.md)) |
| May UX-012 C / OPS-001 C / FIN-003 C / marketplace be authorized? | ❌ **No** under this phrase |
| Begin any locked implementation now? | ❌ **No** |

**Program next (not issued here):** governance may later issue `AUTHORIZE PMX-004 PHASE 3` in a dedicated authorize session. CORE-003 M2 exit still tracks Phase 2 verification — now met.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **PASS** · `VALIDATE PMX-004 PHASE 2` | 2026-07-26 |
| PMX-004 Phase 3 | ✅ Subsequently **AUTHORIZED** ([22](./22-phase-3-authorization.md)) | Implementation pending |
| UX-012 C–E · OPS-001 C–E · FIN-003 C–E · marketplace UI | 🔒 Locked | — |

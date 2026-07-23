# 14 — Installation Success Funnel

**Package:** PMX-004  
**Amendment:** 02  
**Status:** Binding for COMPLETE · Instrumentation **PENDING** until Phase 2  
**Goal:** Maximize successful PWA installation and notification enrollment while remaining frictionless (no blocking walls on core PM work).

---

## 1. Funnel definition

```
Landing (eligible session)
  ↓
Install Prompt Viewed
  ↓
Install Accepted  (Android BIP)  OR  A2HS Instructions Completed (iOS)
  ↓
PWA Installed (standalone detected)
  ↓
Notification Permission Granted
  ↓
Camera Permission Granted  (lazy — first camera intent OR explicit Settings enable)
  ↓
Setup Completed (checklist all green or user-finished)
```

### Stage definitions

| Stage | Definition | How measured |
| --- | --- | --- |
| **Landing** | Authenticated (or pre-auth marketing/login) session on a PWA-capable browser, not already `standalone`, onboarding not completed | Client event `pwa_funnel_landing` |
| **Install Prompt Viewed** | Android: custom install UI shown after `beforeinstallprompt` captured. iOS: A2HS instruction sheet shown | `pwa_funnel_install_prompt_viewed` + `platform` |
| **Install Accepted** | Android: user accepts BIP / install. iOS: user confirms they added to Home Screen (self-report) **or** next session detects standalone | `pwa_funnel_install_accepted` |
| **PWA Installed** | `display-mode: standalone` or `navigator.standalone === true` | `pwa_funnel_installed` |
| **Notification Permission Granted** | `Notification.permission === "granted"` and device registered (API-001A path) | `pwa_funnel_notifications_granted` |
| **Camera Permission Granted** | Permissions API `camera` = granted **or** successful `capture` / file camera flow once | `pwa_funnel_camera_granted` |
| **Setup Completed** | Checklist: Installed · Notifications · Offline Ready · Camera Ready — completed or explicitly finished with offline+installed+notifications minimum | `pwa_funnel_setup_completed` |

**Friction rule:** Camera is **not** requested during install onboarding by default (Phase 2 design). The Camera stage is tracked for funnel completeness and Settings / first-use; Setup Completed may mark Camera Ready as pending without blocking if user never needs camera in that session — Product default: **Setup Completed requires Installed + Notifications + Offline Ready**; Camera Ready is required for full checklist gold but not for funnel “Setup Completed” KPI denominator unless Product amends.

**Recommended KPI definition (binding until amended):**

- **Setup Completed** = Installed + Notifications Granted + Offline Ready (SW status).  
- **Camera Ready** tracked separately as enrichment KPI.

---

## 2. Primary KPIs

| KPI | Formula | Target (initial) | Notes |
| --- | --- | --- | --- |
| **Install Conversion %** | `PWA Installed / Landing` × 100 | ≥ 40% (Android eligible); ≥ 25% (iOS — A2HS harder) | Split by platform |
| **Notification Opt-In %** | `Notifications Granted / PWA Installed` × 100 | ≥ 70% | Prompt after install, not before |
| **Setup Completion %** | `Setup Completed / PWA Installed` × 100 | ≥ 60% | Per recommended definition above |
| **Average Time to Install** | Median seconds from Landing → PWA Installed | ≤ 120s Android; ≤ 180s iOS | Exclude multi-day returns |
| **Abandonment Points** | Largest drop-off between consecutive stages | Identify top 2 stages weekly | Drive UX copy / timing fixes |

Additional diagnostics (optional):

| KPI | Formula |
| --- | --- |
| Prompt→Accept % | Install Accepted / Install Prompt Viewed |
| Accept→Installed % | PWA Installed / Install Accepted |
| Installed→Notify % | Notifications Granted / PWA Installed |
| Notify→Setup % | Setup Completed / Notifications Granted |
| Camera enrichment % | Camera Granted / Setup Completed |

---

## 3. Platform-specific paths

### Android Chrome

1. Capture `beforeinstallprompt`; show non-blocking Install CTA.  
2. On accept → browser install → detect standalone on next launch / `appinstalled`.  
3. Then notification enrollment (reuse API-001A).  
4. Offline Ready from SW status message.  
5. Camera on first media capture need.

### iPhone Safari

1. Detect iOS + not standalone → beautiful A2HS steps (Share → Add to Home Screen).  
2. Cannot programmatically install — success = standalone detection on return.  
3. Notification enrollment **only after** installed PWA (Apple web push requirement).  
4. Same Offline / Camera rules.

### Desktop

1. Optional install prompt; low urgency.  
2. Do not block workflows.  
3. Funnel events still fire for analytics; desktop not a PASS blocker for mobile targets.

---

## 4. Frictionless rules (binding)

1. Never block `/dashboard` or critical PM CRUD behind install.  
2. Show onboarding as sheet/banner after shell ready — not before first paint of primary task.  
3. “Remind me later” / dismiss with backoff.  
4. Ask notifications **after** install success, with clear value copy.  
5. Never pre-prompt camera during onboarding.  
6. Settings always offers re-entry to install help + push enable.

---

## 5. Instrumentation requirements

| Requirement | Detail |
| --- | --- |
| Client events | Named stages above; include `platform`, `standalone`, `role` |
| PII | No email/phone in event props |
| Storage | Prefer existing analytics/ops path if present; else structured `console`/diagnostics buffer + Master Admin export later |
| Local completion flag | `mpa.pwa.onboarding.v1` (or successor) remains source of truth for UI suppression |
| Dashboard | Document query or MA panel in Phase 2 verification — funnel must be **documentable** even if first version is CSV from logs |

Until analytics backend exists, Phase 2 may log to a privacy-safe diagnostics endpoint or Master Admin-only store **without schema migration** (e.g. existing logging). If a table is later required, that is a **separate Approve**.

---

## 6. Abandonment analysis playbook

| Drop-off | Likely cause | Response |
| --- | --- | --- |
| Landing → Prompt Viewed | Prompt suppressed / already installed / desktop | Fix eligibility detection |
| Prompt → Accepted | Weak copy / bad timing | Soften CTA; delay until idle |
| Accepted → Installed | User cancelled OS sheet / iOS didn’t finish A2HS | Improve iOS steps; reminder on next visit |
| Installed → Notifications | Prompt too early / scary copy | Value-first; Settings fallback |
| Notifications → Setup | Offline SW not ready | Phase 1 health; clearer checklist |

---

## 7. Reporting for COMPLETE

PMX-004 COMPLETE requires:

1. Funnel stages implemented and events firing in production (or staging with production-like build).  
2. At least one **documented measurement window** (e.g. 7 days or Phase 11 pilot cohort) with:  
   - Install Conversion %  
   - Notification Opt-In %  
   - Setup Completion %  
   - Average Time to Install  
   - Top abandonment points  
3. Results filed under `artifacts/install-funnel/` (no secrets).

**Pilot cohort exception:** If production traffic is low, Phase 11 real-device pilot operators may populate funnel manually from scripted runs — still must document KPIs and abandonment observations.

---

## 8. Success criteria (funnel)

| Criterion | Gate |
| --- | --- |
| Funnel doc + instrumentation design | This document |
| Events live with Phase 2 | Phase 2 verification |
| KPI report produced | Before COMPLETE (Phase 11 OK) |
| Targets met or Product Accept variance | Before COMPLETE |

# 03 — Risk Assessment

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  

---

## 1. Risk summary

| ID | Risk | Likelihood | Impact | Phase | Mitigation |
| --- | --- | --- | --- | --- | --- |
| R1 | Unified SW breaks OneSignal subscribe (CP-003 regression) | Med | **Critical** | 1 | Compose offline via `importScripts` into OneSignal worker; never dual-register; enrollment e2e before any other phase ships |
| R2 | Offline fetch handlers intercept OneSignal or push endpoints incorrectly | Med | High | 1 | Explicit bypass list for OneSignal CDN/API; only handle same-origin GETs for cache |
| R3 | Caching authenticated HTML/API leaks across users on shared device | Med | **Critical** | 1, 7 | Phase 1: no API cache; HTML network-first; clear caches on logout |
| R4 | `skipWaiting` + claim mid-session corrupts forms | Med | High | 1 | Gated update UX; never silent force reload |
| R5 | Install onboarding blocks or annoys PMs | Med | Med | 2 | Non-blocking sheet; dismiss/remind; show after shell ready |
| R6 | iOS A2HS instructions become outdated (Safari UI changes) | Med | Med | 2 | Versioned copy; Settings fallback; screenshot updates in docs |
| R7 | In-app PDF viewer fails CSP / CORP / signed URL | Med | High | 4 | Fallback same-tab navigation; test Supabase signed URLs |
| R8 | Stripe return does not restore standalone session | Low | High | 4 | Absolute return URLs; cookie SameSite; device test matrix |
| R9 | E-sign provider cannot stay in-webview | High | Med | 4 | Document unavoidable exit; deep-link return; do not fake in-app if broken |
| R10 | Offline outbox double-submits mutations | Med | **Critical** | 7 | Idempotency keys client-generated; server tolerates replay where APIs allow; UI locks while syncing |
| R11 | Background Sync unsupported (iOS) | High | Med | 7 | `online` event + visibilitychange fallback always |
| R12 | Performance work regresses a11y or CSP | Med | High | 8 | EP-019 evidence log; a11y checklist per change |
| R13 | Haptics / gesture polish interferes with accessibility | Med | Med | 5 | Prefer reduced-motion; never replace buttons with gesture-only |
| R14 | Scope creep into redesign / new features | High | High | All | Non-negotiable rules; phase PRs cite this package; reject drive-by UI |
| R15 | Push certification blocked by device/lab access | Med | High | 6 | Parallel ops evidence; reuse PUSH-001 gates |

---

## 2. Highest-risk dependency: Phase 1

Phase 1 is the **single point of failure** for the entire initiative.

**Internal validation before Phase 1 merge to production:**

1. Fresh Android Chrome: enroll push → `players ≥ 1` → test notify delivers.  
2. Airplane mode: open installed/app shell → `/offline.html` or cached shell appears.  
3. Deploy new build: update prompt appears; reload gets new JS (SH-003).  
4. Logout → login as different user: no prior user’s cached private HTML shown.  
5. OneSignal dashboard still points at `/OneSignalSDKWorker.js` scope `/`.

If any of (1)–(5) fail, **rollback Phase 1** per [07-rollback-strategy.md](./07-rollback-strategy.md). Do not proceed to Phase 2+.

---

## 3. Product / commercial risks

| Risk | Mitigation |
| --- | --- |
| Claiming “native” prematurely | Scores only after Phase 10; no marketing copy until PASS |
| Offline expectations unbounded | Scope allowlist; honest SyncStatus UI |
| Install fatigue | Once-completed onboarding; Settings re-entry |

---

## 4. Operational risks

| Risk | Mitigation |
| --- | --- |
| SW update stuck on waiting | Master Admin / docs runbook; clear-site-data instructions |
| Duplicate legacy workers | Remove `/sw.js` registration; deprecate duplicate OneSignal path |
| Env misconfig (OneSignal off) | Worker still provides offline; push enrollment shows clear disabled state |

---

## 5. Risk acceptance for Approve

Approving PMX-004 accepts:

- Phase 1 complexity and mandatory device validation before broad rollout.  
- Phase 4 may leave some external providers (e-sign, Stripe) as controlled exits with return.  
- Phase 7 will **not** offline-enable every workflow in v1 of the outbox.  
- Phase 9 APIs may be partial by browser.

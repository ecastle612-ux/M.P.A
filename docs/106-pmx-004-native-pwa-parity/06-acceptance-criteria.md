# 06 — Acceptance Criteria

**Package:** PMX-004  
**Status:** ✅ Approved with Amendments (2026-07-23)  

---

## 1. Package-level hard PASS

All must be true for PMX-004 **COMPLETE**:

| ID | Criterion |
| --- | --- |
| A1 | Exactly one active root-scope service worker in production with OneSignal configured |
| A2 | Push enrollment + delivery still works (Android closed-app; iPhone installed PWA) |
| A3 | Offline fallback page/shell available with OneSignal configured |
| A4 | Android in-app install path works when Chrome offers `beforeinstallprompt` |
| A5 | iPhone A2HS instructions available and completable |
| A6 | First-run checklist can reach Completed and stays dismissed |
| A7 | Viewport-fit + safe areas + theme/status metadata present; no critical chrome clipping |
| A8 | Primary document/report flows do not exit standalone unexpectedly (inventory Mitigated) |
| A9 | Stripe Checkout round-trip returns to authenticated M.P.A. |
| A10 | Allowlisted offline submissions queue and sync without silent data loss |
| A11 | Lighthouse (agreed profiles): Perf ≥ 95 · a11y ≥ 95 · BP ≥ 100 · PWA ≥ 100 — or Product-accepted waivers recorded |
| A12 | Phase 10 regression matrix PASS — no Sev-1/2 defects open |
| A13 | Scores: Native Experience ≥ 95 · **PWA Readiness = 100** · Production Readiness ≥ 95 |
| A14 | **Amendment 01:** Every major screen in [13-native-ux-acceptance-matrix.md](./13-native-ux-acceptance-matrix.md) Overall = PASS (or listed Accepted waiver) |
| A15 | **Amendment 02:** Installation funnel KPIs documented per [14-installation-success-funnel.md](./14-installation-success-funnel.md) |
| A16 | **Amendment 03:** Phase 11 real-world pilot PASS on Samsung Galaxy, Google Pixel, iPhone, iPad per [15-real-world-pilot.md](./15-real-world-pilot.md) |
| A17 | No critical regressions; all existing application functionality preserved |

---

## 2. Score definitions

### Native Experience (0–100)

Weighted feel of installed app:

| Factor | Weight |
| --- | --- |
| Install / A2HS / first-run | 15 |
| Shell chrome (safe area, status, splash, keyboard) | 20 |
| Standalone containment | 20 |
| Touch / motion / loading polish | 15 |
| Offline confidence (status + no data loss) | 15 |
| Push deep-link correctness | 15 |

Native Experience ≥ 95 also requires UX matrix critical paths PASS (doc 13 §5).

### PWA Readiness (0–100)

Technical PWA completeness (installability, SW, offline, manifest, meta, Lighthouse PWA). **Must equal 100** for COMPLETE — all installability + SW + offline + meta gates green; no partial credit.

### Production Readiness (0–100)

Regression safety + cert evidence + ops runbooks + Phase 11 pilot + no critical open risks. **≥ 95** allows only documented Accepted low risks.

---

## 3. Phase acceptance (summary)

| Phase | Minimum PASS |
| --- | --- |
| 1 | A1–A3 + CP-003 checklist |
| 2 | A4–A6 + funnel instrumentation started (A15 in progress) |
| 3 | A7 |
| 4 | A8–A9 + inventory closed |
| 5 | Touch/a11y audit; UX matrix first pass underway (A14) |
| 6 | PUSH-001 G1–G10 (or accepted deferrals) |
| 7 | A10 + double-submit tests PASS |
| 8 | A11 |
| 9 | Feature-detect matrix documented; no crashes |
| 10 | A12 + regression; functionality preserved (A17) |
| **11** | **A14–A16** + final scores A13 |

---

## 4. Explicit non-criteria (do not block PASS)

- Full offline CRUD for every entity  
- Share Target on every browser  
- Firefox feature parity  
- App Store / Play Store listing  
- Removing CSP `unsafe-inline` entirely in the same package (tracked; Best Practices may require progress)  
- Camera permission during onboarding (lazy by design; tracked in funnel separately)

---

## 5. Evidence required

For each hard gate: device, OS version, browser version, date, screenshot or video reference path under `docs/106-pmx-004-native-pwa-parity/artifacts/` (no secrets).

Required artifact folders at COMPLETE:

- `artifacts/ux-matrix/`  
- `artifacts/install-funnel/`  
- `artifacts/phase-11-pilot/`  
- `artifacts/lighthouse/` (or EP-019-aligned)  

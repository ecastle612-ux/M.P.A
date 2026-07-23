# 00 — Purpose and Scope

**Package:** PMX-004  
**Status:** ✅ Approved with Amendments (2026-07-23)  

---

## 1. Purpose

Make the existing, feature-complete M.P.A. Progressive Web App behave as close to a professionally built native mobile application as technically possible on Android Chrome and iPhone Safari (Add to Home Screen), without leaving the single web codebase.

Primary user for this milestone: **Property Manager** installing and using M.P.A. daily on phone. Portal roles (owner, tenant, vendor) inherit shell/install/offline improvements where shared infrastructure applies; role-specific UI redesign is out of scope.

---

## 2. Objectives

1. **One production service worker** — OneSignal push + offline + update UX coexist.  
2. **Native installation** — Android install prompt + iPhone A2HS coaching + post-install readiness checklist.  
3. **Native application shell** — safe areas, status bar, splash/theme, viewport-fit, no browser flash.  
4. **Standalone compliance** — documents, PDFs, Stripe, e-sign stay in-app or return seamlessly.  
5. **Native mobile UX polish** — touch, scroll, skeletons, intentional motion (no redesign).  
6. **Push certification** — real devices; deep links correct.  
7. **Offline reliability** — scoped queue for field-critical submissions; never silently lose data.  
8. **Performance** — Lighthouse targets + task-feel.  
9. **Premium APIs** — shortcuts, badge, share, etc. where supported; graceful degrade.  
10. **Production validation** — full regression; no acceptable regressions.

---

## 3. In scope

| Area | Scope |
| --- | --- |
| Service worker | Unify `OneSignalSDKWorker.js` + offline handlers; single registration path |
| Manifest / metadata | Complete installability fields; Apple + Android meta; screenshots/shortcuts |
| Install UX | First-run onboarding until completed (local preference / existing prefs pattern) |
| Shell CSS / layout | Safe-area, viewport-fit, overscroll, keyboard avoidance, status bar theme |
| Standalone navigation | Replace or contain `_blank` / `window.open` exits; return URLs for Stripe |
| UX polish | Touch targets ≥ 44px where interactive; skeletons; limited transitions/haptics |
| Push | Device certification + deep-link verification (extends PUSH-001) |
| Offline | Read shell + **scoped** mutation outbox (IndexedDB); no schema |
| Performance | Evidence-first per EP-019 discipline |
| Premium features | Shortcuts, Badge, Web Share, Share Target (evaluate), Wake Lock (optional) |

---

## 4. Out of scope

| Item | Reason |
| --- | --- |
| Product feature additions | Mission is parity, not features |
| Canopy / IA redesign | Non-negotiable rule |
| Database schema migrations | Compatibility + gate; Phase 7 uses client outbox |
| Replacing OneSignal with VAPID/Firebase | ADR-017 |
| Native Expo / App Store apps | Future (docs/19); PWA-only here |
| Full offline CRUD for all entities | Too broad; scoped queue only |
| Removing `noindex` for SEO Lighthouse | Private beta intentional |
| Changing Stripe / Supabase / auth contracts | Preserve |

---

## 5. PRR / MOB alignment

| ID | Alignment |
| --- | --- |
| MOB-001 | PWA install + offline shell — **primary delivery** |
| MOB-003 | Offline inspections / photo queue — **partial** via Phase 7 scoped outbox |
| MHF-001 / API-001 / API-001A | Push path preserved |
| CA-007 | Offline-capable field work — progress, not full claim until Phase 7 PASS |

Complete [Implementation Checklist](../31-product-requirements/implementation-checklist.md) before Implement.

---

## 6. Success definition

A PM on an installed Android or iPhone PWA:

1. Installs without confusion.  
2. Enables notifications after install.  
3. Sees correct status bar / safe areas / no browser chrome.  
4. Completes maintenance, messaging, documents, photos without “leaving the app” unexpectedly.  
5. Receives push with app closed and lands on the right screen.  
6. Can capture critical field input offline and sync later without data loss.  
7. Feels the app is fast and intentional.

Measured by [06-acceptance-criteria.md](./06-acceptance-criteria.md), [13-native-ux-acceptance-matrix.md](./13-native-ux-acceptance-matrix.md), [14-installation-success-funnel.md](./14-installation-success-funnel.md), and [15-real-world-pilot.md](./15-real-world-pilot.md) (Phase 11).

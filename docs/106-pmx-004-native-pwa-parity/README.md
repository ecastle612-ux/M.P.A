# PMX-004 — Native PWA Parity

**Initiative ID:** PMX-004  
**Priority:** CRITICAL — commercial native-feel milestone  
**Type:** Experience / Platform (PWA) — **not** a feature catalog  
**Status:** Design ✔ · Document ✔ · ✅ **APPROVED WITH AMENDMENTS** · **Phase 1 code ✔** · Architecture **CONDITIONAL APPROVAL** · Production validation ⏳ ([17](./17-phase-1-production-validation.md)) · Phase 2 🔒 **LOCKED**  
**Date:** 2026-07-23  
**Author:** Lead Software Architect  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Constraint:** Make M.P.A. feel native while remaining a single-codebase PWA. **Do not** redesign the product, remove features, change schemas, or break Auth / Supabase / OneSignal / Stripe.

---

## 1. Document Information

| Field | Value |
|-------|-------|
| **ID** | PMX-004 |
| **Title** | Native PWA Parity |
| **Status** | ✅ **Approved with Amendments** · Amendments 01–03 incorporated |
| **Approved** | 2026-07-23 — `APPROVE PMX-004 WITH AMENDMENTS` |
| **Baseline audit** | 2026-07-23 PWA Production Readiness Audit (static) |
| **Baseline scores** | Native Experience **42** · PWA Readiness **58** · Production Launch **48** |
| **Target scores** | Native Experience **≥ 95** · PWA Readiness **= 100** · Production Readiness **≥ 95** |
| **Lighthouse targets** | Performance ≥ 95 · Accessibility ≥ 95 · Best Practices ≥ 100 · PWA ≥ 100 |

---

## 2. Mission

When a property manager installs M.P.A. on Android or iPhone, they should **not immediately recognize that it is a web application**.

The experience must feel **premium, polished, fast, and production-ready** while remaining a Progressive Web App.

### What this is / is not

| Is | Is not |
| --- | --- |
| Native-feel parity for an already feature-complete product | Adding new product features or workflows |
| Unified service worker (push + offline + updates) | Competing `/sw.js` vs OneSignal workers |
| Install / A2HS / standalone compliance | Redesigning Canopy, IA, or business screens |
| Soft UX polish (touch, safe-area, skeletons, transitions) | Visual redesign or feature removal |
| Offline queue for field-critical submissions (scoped) | Full offline CRUD for every entity |
| Certification of push, install, offline, performance | Schema migrations or provider swaps |
| Screen-level UX matrix + install funnel + real-device pilot | Claiming COMPLETE from shell work alone |

---

## 3. Non-negotiable rules (binding)

1. **DO NOT** redesign the application.  
2. **DO NOT** remove existing functionality.  
3. **DO NOT** introduce regressions.  
4. **DO NOT** modify business logic unless required for standalone/offline parity.  
5. **DO NOT** break authentication, Supabase, OneSignal, or Stripe.  
6. **DO NOT** change database schemas in this package (unless a later amendment is separately Approved).  
7. Everything must remain **backward compatible**.  
8. Production code may proceed **only** against this Approved package, starting with **Phase 1**.

---

## 4. Gate status (binding)

| Stage | Status |
|-------|--------|
| Design | ✔ |
| Document | ✔ (this package + Amendments 01–03) |
| **Approve** | ✔ **Approved with Amendments** (2026-07-23) |
| Amendments 01–03 | ✔ Incorporated ([13](./13-native-ux-acceptance-matrix.md) · [14](./14-installation-success-funnel.md) · [15](./15-real-world-pilot.md)) |
| Implement | ✔ Phase 1 code complete · ⏳ production device gate ([17](./17-phase-1-production-validation.md)) |
| Phase 2+ | 🔒 Locked until [17](./17-phase-1-production-validation.md) Final PASS + `AUTHORIZE PMX-004 PHASE 2` |
| COMPLETE | 🔒 Requires scores + matrix PASS + funnel KPIs + Phase 11 pilot PASS |

Silence is not approval. Approval record: [12-approval-checklist.md](./12-approval-checklist.md).

---

## 5. Package documents

| Doc | Purpose |
| --- | --- |
| [00 — Purpose & Scope](./00-purpose-and-scope.md) | Objectives, in/out of scope, PRR alignment |
| [01 — Current Architecture](./01-current-architecture.md) | As-built PWA / SW / push / shell |
| [02 — Proposed Architecture](./02-proposed-architecture.md) | Target unified architecture |
| [03 — Risk Assessment](./03-risk-assessment.md) | Technical, product, and operational risks |
| [04 — Regression Risks](./04-regression-risks.md) | What must not break; guardrails |
| [05 — Implementation Order](./05-implementation-order.md) | Phases 1–11 sequenced |
| [06 — Acceptance Criteria](./06-acceptance-criteria.md) | Hard PASS gates + score targets |
| [07 — Rollback Strategy](./07-rollback-strategy.md) | Per-phase and emergency rollback |
| [08 — Testing Strategy](./08-testing-strategy.md) | Device matrix, automation, evidence |
| [09 — Unified Service Worker Design](./09-unified-service-worker-design.md) | Phase 1 deep design (highest risk) |
| [10 — Standalone Exit Inventory](./10-standalone-exit-inventory.md) | Phase 4 inventory of exit vectors |
| [11 — Offline Queue Design](./11-offline-queue-design.md) | Phase 7 scoped outbox (no schema) |
| [12 — Approval Checklist](./12-approval-checklist.md) | Sign-off record |
| [13 — Native UX Acceptance Matrix](./13-native-ux-acceptance-matrix.md) | **Amendment 01** — every major screen PASS/FAIL |
| [14 — Installation Success Funnel](./14-installation-success-funnel.md) | **Amendment 02** — install / notify KPIs |
| [15 — Real-World Pilot](./15-real-world-pilot.md) | **Amendment 03** — Phase 11 device pilot |
| [16 — Phase 1 Verification](./16-phase-1-verification.md) | Phase 1 implementation report · CONDITIONAL PASS (code) |
| [17 — Phase 1 Production Validation](./17-phase-1-production-validation.md) | **Production gate** · real devices · unlocks Phase 2 |

---

## 6. Related packages

| Package | Relationship |
| --- | --- |
| [PUSH-001](../99-push-001-pwa-push-commercial-certification/README.md) | Push certification; PMX-004 Phase 6 / 11 consume real-device evidence |
| [API-001](../44-api-001-onesignal-notification-foundation/README.md) / [API-001A](../45-api-001a-push-enrollment-device-registration/README.md) | OneSignal stack — preserve |
| [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) | OneSignal primary; no VAPID swap |
| [CP-003](../76-cp-001-live-provider-certification/07-cp003-onesignal-production-failure.md) | Root-scope SW race RCA — must not regress |
| [SH-002](../90-sh-002-native-shell-stability/README.md) / [SH-003](../91-sh-003-runtime-verification-deployment/README.md) | Shell stability — extend, do not undo |
| [UX-008](../84-ux-008-premium-mobile-navigation/README.md) | Mobile nav chassis |
| [EP-019](../87-ep-019-performance-speed-certification/README.md) | Performance measurement; Phase 8 aligns |
| [MOB roadmap](../31-product-requirements/mobile-roadmap.md) | MOB-001 / MOB-003 alignment |
| [UX-010](../105-ux-010-unified-image-acquisition/README.md) | Camera/upload standard — coordinate, do not conflict |

---

## 7. Scorecard (baseline → target)

| Score | Baseline (2026-07-23) | Target | Gate |
| --- | --- | --- | --- |
| Native Experience | 42 | ≥ 95 | Package closeout |
| PWA Readiness | 58 | **= 100** | Package closeout |
| Production Readiness | 48 | ≥ 95 | Package closeout |

### COMPLETE requires (binding)

- [ ] Native Experience Score ≥ 95  
- [ ] PWA Readiness Score = 100  
- [ ] Production Readiness Score ≥ 95  
- [ ] All Native UX Acceptance Matrix items PASS ([13](./13-native-ux-acceptance-matrix.md))  
- [ ] Installation Funnel KPIs documented ([14](./14-installation-success-funnel.md))  
- [ ] Real Device Pilot completed successfully ([15](./15-real-world-pilot.md))  
- [ ] No critical regressions  
- [ ] All existing application functionality preserved  

Scores and COMPLETE are recorded after Phase 11 evidence. Do not claim targets early.

---

## 8. Implementation unlock rule

```
APPROVE PMX-004 WITH AMENDMENTS (2026-07-23)
  → Amendments 01–03 documented
  → Implement Phase 1 (unified SW) first
  → Phases 2–10 per order
  → Phase 11 real-world pilot
  → COMPLETE only when §7 checklist is fully true
```

Material scope changes restart Design → Document → Approve.

# 27 — PMX-004 Phase 4 Implementation Summary

**Package:** PMX-004  
**Phase:** 4 — Standalone Compliance  
**Authorization:** [25](./25-phase-4-authorization.md) · [CORE-003 §66](../113-core-003-implementation-master-plan/66-pmx-004-phase-4-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · Shipped Production (`521fa1f`, `dpl_9zkFEhVyiEYUYA5Gc1UW6CEChCfo`) · ✅ **VALIDATED PASS** ([28](./28-phase-4-validation.md) · [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md))  
**Date:** 2026-07-26  

> Phases 5–11 **not** implemented. UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** touched.
> Phases 1–3 preserved. AUTH / COM / OPS-A / UX-012 A–B preserved. No schema migrations. No IA redesign.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Exit inventory E01–E13 | Closed — [10](./10-standalone-exit-inventory.md) dispositions |
| In-app / same-tab documents | `StandaloneOpenLink` + blob `StandaloneDocumentViewer` |
| Stripe absolute returns | Resident + company paths confirm + same-window assign; absolute URLs retained; return banner |
| E-sign | Confirm + same-window assign (no `_blank`) |
| Leave confirmation | `LeaveAppConfirm` for Stripe / e-sign / hosted invoice |
| Auth deep-link notes | [26](./26-auth-deep-link-notes.md) |
| CSP | `frame-src 'self' blob:` for in-app blob iframe preview |
| Reporting download | Optional `?inline=1` for Content-Disposition inline |

---

## 2. Standalone compliance architecture

```
StandaloneOpenLink (auto | viewer | leave-confirm | same-tab)
  ├── StandaloneDocumentViewer  → fetch → blob URL → iframe/img
  └── LeaveAppConfirm           → Modal → location.assign

ReturnToMpaBanner               → welcome-back after Stripe query params

lib/pwa/standalone-open.ts      → classify href · fetch blob · same-window download
```

---

## 3. Exit inventory closure

See [10](./10-standalone-exit-inventory.md) — E01–E13 ✅ Mitigated · E14 Acceptable · E15 Documented.

---

## 4. Stripe return behavior

| Path | Behavior |
|------|----------|
| Resident Checkout | Confirm → `location.assign(checkoutUrl)`; success/cancel absolute to `/portal/tenant/payments`; `ReturnToMpaBanner` |
| Company Checkout / Portal | Confirm → assign; success/cancel/return to `/settings/billing`; banner |
| Invoice PDF | In-app viewer |
| Hosted Stripe invoice | Leave confirm |

BILL / Stripe provider integration unchanged (absolute URLs already from `NEXT_PUBLIC_APP_URL` / origin).

---

## 5. E-sign handling

`signing-progress-view` uses `StandaloneOpenLink` `mode="leave-confirm"` → same-window provider ceremony; progress UI remains in M.P.A.

---

## 6. Leave confirmation

`LeaveAppConfirm` used for Stripe Checkout/Portal, e-sign, and hosted invoice pages. Document opens use in-app viewer (no leave prompt). E14 feedback link remains Acceptable external without prompt.

---

## 7. Deep-link handling

Documented in [26](./26-auth-deep-link-notes.md). No AUTH-001 code changes.

---

## 8. Files changed (primary)

### Lib / config

| Path | Change |
|------|--------|
| `lib/pwa/standalone-open.ts` | **Added** — classify / fetch blob / download helper |
| `lib/pwa/standalone-open.test.ts` | **Added** — unit tests |
| `next.config.ts` | CSP `frame-src 'self' blob:` |
| `api/reporting/versions/.../download/route.ts` | Optional `inline=1` disposition |

### Components

| Path | Change |
|------|--------|
| `components/pwa/standalone-open-link.tsx` | **Added** |
| `components/pwa/standalone-document-viewer.tsx` | **Added** |
| `components/pwa/leave-app-confirm.tsx` | **Added** |
| `components/pwa/return-to-mpa-banner.tsx` | **Added** |
| Portal/ops document & report surfaces (E01–E09, E11) | Wired to `StandaloneOpenLink` / viewer |
| `signing-progress-view.tsx` | Leave-confirm same-window |
| `resident-payments-view.tsx` | Confirm + return banner |
| `company-billing-center.tsx` | Confirm + invoice viewer/confirm + return banner |

### Docs

| Path | Change |
|------|--------|
| `10-standalone-exit-inventory.md` | Dispositions closed |
| `26-auth-deep-link-notes.md` | **Added** |
| `27-phase-4-implementation.md` | **Added** — this summary |

---

## 9. Acceptance criteria map (implementation coverage)

| ID | Coverage |
|----|----------|
| P4-01 | Inventory E01–E13 dispositioned in [10](./10-standalone-exit-inventory.md) |
| P4-02 | Document opens via in-app viewer |
| P4-03 | Reports/statements via viewer; `window.open` removed |
| P4-04 | Stripe absolute returns + session restore paths preserved |
| P4-05 | `ReturnToMpaBanner` interstitial |
| P4-06 | E-sign confirm + same-window |
| P4-07 | Leave confirm for intentional outbound; E14 Acceptable |
| P4-08 | Auth deep-link notes documented |
| P4-09 | Phases 1–3 / AUTH / COM / OPS-A / UX-A–B preserved; no schema/IA |
| P4-10 | This summary; validation pending |

---

## 10. Remaining PMX Phases 5–11 (not in this session)

| Phase | Status |
|-------|--------|
| 5 — Native Mobile UX matrix | 🔒 Locked |
| 6 — Push Notification Certification | 🔒 Locked |
| 7 — Offline Reliability / outbox | 🔒 Locked |
| 8 — Performance Optimization | 🔒 Locked |
| 9 — Premium Native Features | 🔒 Locked |
| 10 — Production Validation | 🔒 Locked |
| 11 — Real-World Pilot | 🔒 Locked |

Also locked: UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI.

---

## 11. Recommendation

1. ✅ Phase 4 implementation complete within authorized scope.  
2. ✅ **`VALIDATE PMX-004 PHASE 4` → PASS** ([28](./28-phase-4-validation.md)).  
3. ✅ Phase 5 **eligible** for a future `AUTHORIZE PMX-004 PHASE 5` — **not** issued under Phase 4.  
4. ❌ Do **not** authorize or implement Phase 5+ / UX-C / OPS-C / FIN-C / marketplace under Phase 4 work.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** | 2026-07-26 |
| Validation | ✅ **PASS** ([28](./28-phase-4-validation.md)) | 2026-07-26 |

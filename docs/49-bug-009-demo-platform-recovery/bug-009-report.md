# BUG-009 Report — Demo Platform Recovery

## 1. Root cause

| Layer | Finding |
|-------|---------|
| Routing | `/demo/{product}/{surface}` resolved correctly |
| Session create | `/api/demo/start` and `POST /api/demo/session` created in-memory rows + `mpa_demo_session` id cookie |
| Session read | Surface RSC called `getDemoSessionRecord(id)` against **process-local** `Map` |
| Failure | On Vercel, create isolate ≠ surface isolate → miss → `redirect(/api/demo/start)` → new id cookie → miss again |
| Symptom | Infinite 307 redirect loop; browser shows blank page |

Confirmed for:

- `/demo/mpa_property_manager/mission-control`
- `/demo/mpa_facility_operations/fo-mission-control`
- `/demo/mpa_complete_platform/mission-control`

## 2. Files changed

| File | Change |
|------|--------|
| `apps/web/src/lib/demo/durable-state.ts` | Signed `mpa_demo_state` encode/decode + `applyDemoCookies` |
| `apps/web/src/lib/demo/durable-state.test.ts` | Round-trip + tamper tests |
| `apps/web/src/lib/demo/session-store.ts` | `resolveDemoSessionRecord` hydrates from durable cookie |
| `apps/web/src/lib/demo/cookie.ts` | Read session id + state token pair |
| `apps/web/src/app/api/demo/start/route.ts` | Sets durable cookies |
| `apps/web/src/app/api/demo/session/route.ts` | Resolve + refresh cookies |
| `apps/web/src/app/api/demo/persona/route.ts` | Hydrate + persist cookies after switch |
| `apps/web/src/app/api/demo/reset/route.ts` | Hydrate + persist cookies after reset |
| `apps/web/src/app/api/demo/analytics/route.ts` | Hydrate + persist cookies after track |
| `apps/web/src/app/(demo)/demo/[product]/[surface]/page.tsx` | Resolve durable session; bootstrap instead of blank |
| `apps/web/src/components/demo/demo-session-bootstrap.tsx` | Loading + friendly recovery |
| `apps/web/src/components/demo/demo-product-picker.tsx` | Launch via `/api/demo/start` navigation |
| `apps/web/src/components/demo/demo-chrome.tsx` | Touch/refresh durable cookies on mount |
| `apps/web/src/components/admin/demo-verification-console.tsx` | Clarify instance-local session list |
| `docs/49-bug-009-demo-platform-recovery/*` | This report |

## 3. Regression report

| Area | Expected | Status |
|------|----------|--------|
| Landing | Unchanged | Pass (not modified) |
| Pricing | Unchanged | Pass (not modified) |
| Confirm Plan / Checkout | Unchanged | Pass (not modified) |
| Enterprise | Unchanged | Pass (not modified) |
| Commercial / Provisioning / Lifecycle | Unchanged | Pass (not modified) |
| Product Constitution (ADR-019) | Unchanged | Pass (not modified) |
| Demo architecture | Shared snapshot + session overlay | Pass (retained; cookie carries overlay) |
| Master Admin demo console | Reset / persona / analytics / snapshot integrity | Pass (APIs persist durable state; integrity helpers unchanged) |

## 4. Production deployment

_Filled after merge + Production deploy._

## 5. Live URL verification

_Filled after Production deploy._

## 6. Screenshot evidence

_Filled after live capture under `/opt/cursor/artifacts/bug-009/`._

## 7. Demo certification

| Demo | Launch | Mission Control content | No account / payment |
|------|--------|-------------------------|----------------------|
| Property Manager | _pending_ | _pending_ | Required |
| Facility Operations | _pending_ | _pending_ | Required |
| Complete Platform | _pending_ | _pending_ | Required |

**STOP** — wait for Owner Acceptance before roadmap work.

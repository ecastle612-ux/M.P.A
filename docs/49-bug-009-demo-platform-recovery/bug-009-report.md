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
| Landing (`/`) | Unchanged | **Pass** (HTTP 200 smoke; not modified) |
| Pricing (`/pricing`) | Unchanged | **Pass** (HTTP 200 smoke; not modified) |
| Confirm Plan / Checkout | Unchanged | **Pass** (not modified) |
| Enterprise (`/enterprise`) | Unchanged | **Pass** (HTTP 200 smoke; not modified) |
| Commercial / Provisioning / Lifecycle | Unchanged | **Pass** (not modified) |
| Product Constitution (ADR-019) | Unchanged | **Pass** (not modified) |
| Demo architecture | Shared snapshot + session overlay | **Pass** (retained; cookie carries overlay) |
| Master Admin demo console | Reset / persona / analytics / snapshot integrity | **Pass** (APIs hydrate+persist; integrity helpers unchanged; console page unchanged functionally) |
| Persona switch API | Works across isolates | **Pass** (local cold-isolate verified) |
| Reset demo API | Works across isolates | **Pass** (local cold-isolate verified) |
| Analytics API | Works across isolates | **Pass** (local cold-isolate verified) |

## 4. Production deployment

| Item | Value |
|------|-------|
| PR | [#63](https://github.com/ecastle612-ux/M.P.A/pull/63) merged |
| Production SHA | `3af2916e04bf1755b95b692b2aaca5642943f58b` |
| GitHub Production deploy | `5805353032` · **success** |
| Serving project | Vercel `m-p-a-web` → `https://www.my-property-assistant.com` |

## 5. Live URL verification

| URL | Result |
|-----|--------|
| `/api/demo/start?product=mpa_property_manager&surface=mission-control` | **Pass** — 307 → surface HTTP 200 · 1 redirect · sets `mpa_demo_session` + `mpa_demo_state` |
| `/demo/mpa_property_manager/mission-control` | **Pass** — Demo Environment · Mission Control · Harborline · SYNTHETIC |
| `/api/demo/start?product=mpa_facility_operations&surface=fo-mission-control` | **Pass** — 307 → surface HTTP 200 · 1 redirect |
| `/demo/mpa_facility_operations/fo-mission-control` | **Pass** — Facility Mission Control · Northbridge |
| `/api/demo/start?product=mpa_complete_platform&surface=mission-control` | **Pass** — 307 → surface HTTP 200 · 1 redirect |
| `/demo/mpa_complete_platform/mission-control` | **Pass** — Mission Control · Summit Portfolio · SYNTHETIC |
| Cold surface with cookies only (no create) | **Pass** — Mission Control still renders (durable hydrate) |

No redirect loop. No blank page.

## 6. Screenshot evidence

Artifacts under `/opt/cursor/artifacts/bug-009/`:

| File | Source |
|------|--------|
| `live-property-manager-mission-control.webp` | Production browser |
| `live-facility-operations-mission-control.webp` | Production browser |
| `live-complete-platform-mission-control.webp` | Production browser |
| `property-manager-mission-control.webp` | Local verification |
| `facility-operations-mission-control.webp` | Local verification |
| `complete-platform-mission-control.webp` | Local verification |

## 7. Demo certification

| Demo | Launch | Mission Control content | No account / payment |
|------|--------|-------------------------|----------------------|
| Property Manager | **PASS** | **PASS** (Harborline attention queue) | **PASS** |
| Facility Operations | **PASS** | **PASS** (Northbridge FO queue) | **PASS** |
| Complete Platform | **PASS** | **PASS** (Summit Portfolio queue) | **PASS** |

**UX:** Loading bootstrap shown when session missing; recovery screen if boot fails; never blank.

**STOP** — wait for Owner Acceptance before roadmap work (COM-002 Slice F, Capital Projects, etc.).

# PUSH-001 system-audit preflight — 2026-07-24

**Session:** BEGIN PUSH-001 REAL-DEVICE CERTIFICATION  
**Scope:** Public production preflight only — **not** device PASS evidence

## Production

| Field | Value |
|-------|--------|
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Deployment | `dpl_HKHS54QHqS6w5d6NaMqBGr5qF53o` |
| Deployment URL | `https://m-p-a-e8eug8z68-ecastle612-uxs-projects.vercel.app` |
| Status | Ready · Production |
| git SHA | `8b46d70c9f2a6b73cb4b618bf936e9d4e9c1b712` |
| Commit message | PUSH-001: fix role-correct push deep links and payment failure notify. |
| Branch | `checkpoint/pre-phase5` |

## Service worker

`GET https://www.my-property-assistant.com/OneSignalSDKWorker.js` → 200

- Header comment: PMX-004 Phase 1 canonical SW (scope `/`)
- `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js")`
- `importScripts("/sw-offline.js")`
- Note: `/sw.js` also returns 200; runbook requires **only one** active registration (`OneSignalSDKWorker.js`) — confirm in DevTools on device (not verified this session)

## Manifest

`GET https://www.my-property-assistant.com/manifest.webmanifest` → 200 JSON

- `name`: M.P.A. My Property Assistant  
- `display`: standalone  
- Icons 16–512 present  

## OneSignal (read-only MCP)

- MCP health: ok  
- Apps visible: JunkDash App · **M.P.A.** (`c44fcb85-fdd7-4e98-be4f-1366559d2e2c`)  
- No notification send performed  
- No secret values recorded  

## G10 notes (this session)

| Check | Result |
|-------|--------|
| Prod deploy verified | ✅ SHA above |
| `pnpm --filter @mpa/web typecheck` | ✅ PASS |
| `pnpm typecheck` (repo root) | ❌ FAIL — `@mpa/qa-e2e` `scripts/seed-m0-qa-certification.ts` |
| `pnpm --filter @mpa/web build` | See `g10-build-result.txt` when available |

## Explicit non-claims

- No enrollment / permission / Send Test  
- No foreground / background / cold-start delivery  
- No deep-link tap evidence  
- Does **not** satisfy G1–G9  

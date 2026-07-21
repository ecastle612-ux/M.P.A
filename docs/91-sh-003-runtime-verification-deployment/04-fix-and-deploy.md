# 04 — Fix, Commit, Deploy, Verify

## Fix summary (architectural, not symptom patches)

| Cause | Fix | Files |
| --- | --- | --- |
| Focus trap re-armed on identity churn | Activate-only trap; escape via ref; safer restore | `packages/ui/src/lib/focus-trap.ts` |
| Controlled Search + DOM churn → iOS blur | Uncontrolled Search M.P.A. (`defaultValue` + ref); refocus if blurred after results | `apps/web/src/components/shell/responsive-navigation.tsx` |
| Section sync during typing | Skip expanded-section sync while search query non-empty | same |
| Stale SW trapped old JS | `mpa-foundation-v4`; **network-first** `/_next/static/` | `apps/web/public/sw.js` |
| Observability | Optional shell runtime timeline | `apps/web/src/lib/debug/shell-runtime-trace.ts`, `providers.tsx` |

Full causal chain: [03-root-cause-chain.md](./03-root-cause-chain.md).

---

## Phase 4 — Commit

| Field | Value |
| --- | --- |
| **Commit hash** | `578f3e37110d07e5abbeecb1eb29e0d535abb6e6` |
| **Short** | `578f3e3` |
| **Message** | SH-003: fix Search focus on device and stop stale SW bundles. |
| **Branch** | `checkpoint/pre-phase5` |
| **Pushed** | Yes → `origin/checkpoint/pre-phase5` |

### Changed files (reason)

| File | Reason |
| --- | --- |
| `packages/ui/src/lib/focus-trap.ts` | Stop trap effect from stealing focus on parent re-render |
| `apps/web/src/components/shell/responsive-navigation.tsx` | Uncontrolled search; skip section sync while typing; refocus after entity results |
| `apps/web/public/sw.js` | Network-first Next static assets; cache name v4 |
| `apps/web/src/lib/debug/shell-runtime-trace.ts` | Runtime timeline instrumentation |
| `apps/web/src/app/providers.tsx` | Init shell runtime trace |
| `docs/91-sh-003-runtime-verification-deployment/*` | Process, RCA, live protocol |

---

## Phase 5 — Deploy

| Field | Value |
| --- | --- |
| **Deployment ID** | `dpl_AGDJGuog2QqDMTZX4DC5TKkzHddZ` |
| **Deployment URL** | https://m-p-a-lzeiqw2nj-ecastle612-uxs-projects.vercel.app |
| **Production aliases** | https://www.my-property-assistant.com , https://m-p-a-web.vercel.app |
| **Inspector** | https://vercel.com/ecastle612-uxs-projects/m-p-a-web/AGDJGuog2QqDMTZX4DC5TKkzHddZ |
| **Build status** | READY |
| **Target** | production |
| **Build timestamp** | 2026-07-21T06:20:29Z (created; CLI: Tue Jul 21 2026 01:20:29 CDT) |
| **Git commit on deploy** | `578f3e37110d07e5abbeecb1eb29e0d535abb6e6` |
| **Commit message on deploy** | SH-003: fix Search focus on device and stop stale SW bundles. |

---

## Phase 6 — Deployment verification

| Check | Result |
| --- | --- |
| Deploy meta `githubCommitSha` == `578f3e3…` | ✅ |
| Alias includes `www.my-property-assistant.com` | ✅ |
| Live `/sw.js` == local `apps/web/public/sw.js` (SHA-256) | ✅ `d57501f28bd575cf5e4a58318c8aef41d33c1090e95fce4338416b8b31dace9f` |
| Live SW contains `mpa-foundation-v4` + network-first `/_next/static/` | ✅ |
| Live JS contains `__MPA_SHELL_TRACE__` / `mpaDebugShell` / `initShellRuntimeTrace` | ✅ chunk `1c2yqetpnwio3.js` |
| Instrumentation chunk SHA-256 | `5fa801c2c1419a6e3a3c7eb4daae86a824ee4513efcca0d26414be7468d4f20c` |
| HTML `cache-control: public, max-age=0, must-revalidate` | ✅ |

**Bundle hash (SW):** `d57501f28bd575cf5e4a58318c8aef41d33c1090e95fce4338416b8b31dace9f`  
**Bundle hash (runtime-trace chunk):** `5fa801c2c1419a6e3a3c7eb4daae86a824ee4513efcca0d26414be7468d4f20c`

Deployment **contains** the SH-003 fix artifacts. Proceed to live phone workflow ([05-live-test-protocol.md](./05-live-test-protocol.md)).

# 06 — SH-003 Certification Report

**Initiative:** SH-003 — Runtime Verification & Deployment Certification  
**Date:** 2026-07-21  
**Verdict:** ⏳ **Awaiting User Verification** — not PASS

Cursor cannot complete the exact phone workflow (drawer → Search M.P.A. → type ≥30s → AI → return → continue typing) on a physical device. Per process rules, this is **not** claimed PASS.

---

## Status ladder

| Step | Status |
| --- | --- |
| Implemented | ✅ |
| Committed | ✅ `578f3e3` |
| Pushed | ✅ `origin/checkpoint/pre-phase5` |
| Deployed | ✅ `dpl_AGDJGuog2QqDMTZX4DC5TKkzHddZ` READY |
| Deployment Verified | ✅ commit + SW v4 + live instrumentation chunk |
| Awaiting User Verification | ⏳ |
| User Verified | ☐ |

---

## Evidence package

| Item | Value |
| --- | --- |
| Commit hash | `578f3e37110d07e5abbeecb1eb29e0d535abb6e6` |
| Deployment ID | `dpl_AGDJGuog2QqDMTZX4DC5TKkzHddZ` |
| Production URL | https://www.my-property-assistant.com |
| SW bundle hash | `d57501f28bd575cf5e4a58318c8aef41d33c1090e95fce4338416b8b31dace9f` |
| Trace chunk hash | `5fa801c2c1419a6e3a3c7eb4daae86a824ee4513efcca0d26414be7468d4f20c` |
| Before video | Not captured in this session (prior manual FAIL on phone) |
| After video / runtime evidence | Pending user phone test; optional `?mpaDebugShell=1` → `window.__MPA_SHELL_TRACE__` |
| Render / focus timeline | Instrumentation live; dump after workflow |

---

## Root cause (complete)

See [03-root-cause-chain.md](./03-root-cause-chain.md):

1. **Chain A** — Focus trap effect identity churn  
2. **Chain B** — Controlled search + DOM churn → iOS blur  
3. **Chain C** — Section sync during search  
4. **Chain D** — Cache-first SW kept stale JS (why prior “fixes” never reached the phone)  
5. **Chain E** — AI Provider re-rendering shell  

---

## Final fix

- Uncontrolled Search M.P.A. + safe refocus  
- Focus-trap activate-only / stable escape  
- No section reshuffle while searching  
- SW v4 network-first for `/_next/static/`  
- AI context on external store (SH-002)  
- Optional runtime timeline for deploy verification  

---

## PASS criteria checklist

| Criterion | Status |
| --- | --- |
| Code committed | ✅ |
| Commit pushed | ✅ |
| Deployment completed successfully | ✅ |
| Deployment verified to contain new code | ✅ |
| Runtime trace shows no remaining focus loss | ⏳ user / phone dump |
| Manual testing on deployed app reproduces workflow without failure | ⏳ |
| Exact user-reported issue no longer occurs | ⏳ |

**Certification:** not PASS until the user (or equivalent device run) confirms the live workflow.

---

## User verification steps (required)

1. On phone, open https://www.my-property-assistant.com  
2. Hard refresh once (or clear site data) so SW v4 activates  
3. Run [05-live-test-protocol.md](./05-live-test-protocol.md)  
4. Reply with PASS or FAIL (+ optional `__MPA_SHELL_TRACE__` dump if FAIL)

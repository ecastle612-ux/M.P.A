# SH-003 — Runtime Verification & Deployment Certification

**Initiative ID:** SH-003  
**Status:** In progress — fix incomplete until Deployed + Verified + User workflow PASS  
**Blocks:** UX-009 expansion; SH-002 cannot be marked PASS without this  

---

## Permanent bug-fix status ladder

| Step | Status |
| --- | --- |
| Implemented | ☐ |
| Committed | ☐ |
| Pushed | ☐ |
| Deployed | ☐ |
| Deployment Verified | ☐ |
| Awaiting User Verification / User Verified | ☐ |

**PASS only after the deployed app behaves correctly on the exact user workflow.**

## Documents

| Doc | Purpose |
| --- | --- |
| [01-process.md](./01-process.md) | Mandatory end-to-end fix process |
| [02-instrumentation.md](./02-instrumentation.md) | Runtime probes |
| [03-root-cause-chain.md](./03-root-cause-chain.md) | Full causal chain |
| [04-fix-and-deploy.md](./04-fix-and-deploy.md) | Commit / deploy / verify evidence |
| [05-live-test-protocol.md](./05-live-test-protocol.md) | Phone Search M.P.A. 30s typing |
| [06-certification-report.md](./06-certification-report.md) | Final PASS/FAIL |

## Rule

If Cursor cannot verify the deployed phone workflow, report **Awaiting user verification** — never claim PASS from TypeScript or code review alone.

# Owner Experience Audit — Product Readiness v2

**Date:** 2026-08-10  
**Code changes:** None  
**Persona:** Platform Owner + Customer Support Representative

## Can you…?

| Capability | Answer | Notes |
|------------|--------|-------|
| Support customers? | **Mostly** | Support Center + org profile actions (resend invite, regenerate claim, retry provisioning) |
| Locate organizations? | **Yes** | `/admin/platform/organizations` + Command Center search |
| Find users? | **Yes** | Customers directory + profiles |
| Diagnose problems? | **Partial** | System Health + provisioning/billing/lifecycle; email stub risk blinds “did invite send?” |
| View provisioning? | **Yes** | `/admin/commercial/provisioning` |
| Understand platform health? | **Partial** | System Health page; should surface email provider configuration explicitly |
| Navigate without confusion? | **Mostly** | Slim 12-item nav is good; View As under `/admin/testing/...` feels like a lab tool |
| View As roles? | **Yes (code)** | LIVE deep UI AUTH_BLOCKED |

## Friction ranked

1. **P0** — Provisioning/lifecycle email returns success when Resend unset (`stub_*`)  
2. **P1** — View As path naming (`testing/impersonation`)  
3. **P1** — Extra hops for support actions (search → org)  
4. **P2** — Orphan admin URLs (catalog, launch-readiness, demo)  
5. **P2** — Exit-to-app lands on `/launcher` (context loss)  
6. **P2** — Impersonation banner unmistakable but off-token  

## Positive

Owner Ops simplification (nav only if live) is the right standard — **apply the same rule to FO customer nav**.

## Verdict

Owner can run the business **if email is truly configured** and they learn the org-profile support pattern. The product does not yet feel like a world-class support console end-to-end (path naming, health signals, action proximity).

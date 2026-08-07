# Remaining P1 Issues

Non-blocking for **GO WITH OBSERVATIONS**. Fix only under a future production-fix authorize or if Customer #1 hits them live.

| ID | Issue | Notes |
|----|-------|-------|
| PV-P1-R1 | Live staging MA Pass not recorded in this sprint | Operator DEF-003 — environmental, not a code defect |
| PV-P1-R2 | Role switcher is cosmetic (does not re-route) | Prefer hide when &lt;2 roles or route on change — polish, APIs still enforce |
| PV-P1-R3 | Staff authz helpers still cookie-first without membership fallback | Middleware bootstrap + portal resolver cover first login; multi-tab edge cases possible |
| PV-P1-R4 | Integration channels unproven live (Resend/Stripe/SignWell) | Honesty paths remain; claim only after env verification |

No open lifecycle blockers in code after PV-C / PV-P1 fixes in this sprint.

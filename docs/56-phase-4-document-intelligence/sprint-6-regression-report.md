# Sprint 6 — Regression Report

| Area | Touched? |
| --- | --- |
| `/shared/documents` UI + APIs | Yes |
| Document schemas / migration | Yes (additive) |
| PM/FO/Resident strips copy | Yes |
| Commercial module description | Yes (href unchanged) |
| Auth / Stripe / nav IA / FO workflows | No |

Expectation: Landing · Commercial · Pricing · Checkout · Provisioning · Master Admin · Platform Ops · PM · FO · Resident · Demo remain functionally unaffected aside from Documents Intelligence upgrade.

## LIVE (2026-08-09) — Production SHA `1bf28c697a99f901243793d7b4de07b555b43be6`

| Surface | Result |
| --- | --- |
| Landing | **PASS** |
| Pricing | **PASS** |
| Modules | **PASS** |
| Demo hub | **PASS** |
| Checkout / Confirm Plan | **PASS** |
| Provisioning | Unchanged (no write exercised) |
| Master Admin / Platform Ops / PM / FO / Resident apps | Auth gates intact |
| Demo PM documents | **PASS** |
| Demo FO documents shell | **PASS** |

Full detail: [sprint-6-live-verification.md](./sprint-6-live-verification.md).

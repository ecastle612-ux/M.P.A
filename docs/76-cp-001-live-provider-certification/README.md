# CP-001 — Live Provider Certification

**Status:** Design ✔ · Document ✔ · **Approved (EP-012)** · Implement unlocked  
**Initiative ID:** CP-001  
**Authorization:** EP-012 — 2026-07-19  
**Type:** Provider certification & Integrations health presentation — **not** a feature or workflow sprint  
**Parent blockers:** PM-001 CP-01 (live provider credentials)

---

## Objective

Prepare M.P.A. for Commercial Pilot by certifying every configured provider against existing integration foundations, clearly distinguishing sandbox vs production, and surfacing actionable health in Settings → Integrations.

## Hard constraints

Do **not** modify: Accounting, Facility/Asset Foundation, ReportingService, Timeline, Operations Center, Command Center, Migration, Master Admin architecture, database schema, unrelated APIs, or business workflows.

Do **not** implement new email/SMS delivery stacks (INT-302 / INT-303 remain out of path). Certify Resend/Twilio configuration posture only.

**Allowed:** Provider status matrix expansion, read-only health probes, webhook readiness checks, Integrations dashboard enrichment, certification report updates, env example guidance (no secrets).

## Documents

| Doc | Purpose |
| --- | --- |
| [01-provider-matrix.md](./01-provider-matrix.md) | Per-provider certification matrix |
| [02-implementation-notes.md](./02-implementation-notes.md) | Code targets |
| [03-certification-report.md](./03-certification-report.md) | Scores + Commercial Pilot GO/NO-GO |
| [04-live-validation-run.md](./04-live-validation-run.md) | Live env pass/fail (2026-07-19) |
| [05-onesignal-end-to-end-audit.md](./05-onesignal-end-to-end-audit.md) | OneSignal full audit + idempotency fix |
| [06-onesignal-production-certification.md](./06-onesignal-production-certification.md) | Prod URL · Integrations Production Ready · delivery gap |
| [07-cp003-onesignal-production-failure.md](./07-cp003-onesignal-production-failure.md) | CP-003 OneSignal root-cause + live delivery PASS |
| [08-cp004-resend-production-certification.md](./08-cp004-resend-production-certification.md) | CP-004 / EP-014 Resend certification — **FAIL** (INT-303 not shipped) |

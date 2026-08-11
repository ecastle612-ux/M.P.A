# Monitoring, Logging & Error Reporting

**Parent:** [Production Deployment Support](./index.md)  
**Constraint:** No new vendor integrations under this authorize. Use existing platform surfaces + app observability placeholders.

---

## Current code reality

| Layer | Location | Production behavior |
|-------|----------|---------------------|
| Logger | `apps/web/src/lib/observability/logger.ts` | Structured `console` JSON-shaped events |
| Errors | `apps/web/src/lib/observability/errors.ts` | `captureException` → log (fail-open) |
| Analytics / vitals | observability placeholders | No external sink |
| Audit | product audit tables + MA cert APIs | Business audit where already implemented |

**Sprint 5 (STAB-006):** `captureException` now emits structured logs, optionally forwards to Sentry when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set, and persists warning+ events to `platform_error_events` for Master Admin. Local/dev remains unblocked without Sentry.

**Do not** treat Sentry as deployed until operators configure the DSN in the target environment. This sprint does not mutate Production Vercel env.

---

## Production monitoring stack (interim)

| Signal | Where to watch | Cadence |
|--------|----------------|---------|
| App availability / deploy health | Vercel Dashboard → Production | Continuous; alert on failed deploy |
| Runtime / function errors | Vercel → Logs (filter `error`, `captureException`, 5xx) | First 2h post-deploy: every 15 min; then daily |
| Auth / DB errors | Supabase → Logs + Auth | Same |
| Migration / RLS issues | Supabase → Database / API errors | After migrate + first customer mutations |
| Stripe (if live) | Stripe Dashboard → Developers → Webhooks / Logs | After first checkout attempt |
| SignWell (if live) | SignWell dashboard + `/api/leasing/webhooks/signwell` | After first e-sign |
| Email (if Resend live) | Resend Dashboard → Logs | After first invite |
| Customer journeys | Master Admin launch cert APIs J0–J8 | During onboarding witness |

---

## Logging rules (operators + engineers)

- Prefer request-correlated messages already emitted by observability helpers.  
- **Never** log service role keys, Stripe secrets, raw card data, or magic-link tokens.  
- Scrub email/phone from shared incident notes when possible; reference user ids.  
- When investigating, capture: UTC time, route, actor role, org id, request id if present, Vercel deployment id.

---

## Error reporting triage

| Severity | Example | Response |
|----------|---------|----------|
| Sev-1 | Login broken, all orgs down, data loss risk | Page on-call; hotfix under [Bug-Fix Protocol](./production-bugfix-protocol.md) |
| Sev-2 | One journey broken for Customer #1 (e.g. portal handoff) | Same-day fix; pause that journey with customer |
| Sev-3 | Non-blocking UX defect | Log; fix only if it breaks advertised experience |
| Sev-4 | Cosmetic / nice-to-have | **Do not fix** under freeze |

---

## Watch window checklist

Post-deploy (before Customer #1 goes unattended):

- [ ] Vercel production deployment = intended commit  
- [ ] No sustained 5xx spike on `/login`, `/dashboard`, `/api/*`  
- [ ] Supabase Auth login succeeds for operator account  
- [ ] No repeated `SUPABASE_SERVICE_ROLE_KEY` / portal provisioning errors  
- [ ] If Resend live: no bounce storm / domain auth failures  
- [ ] If Stripe live: webhook signature failures = 0 after test event  

During Customer #1 first session:

- [ ] Tail Vercel + Supabase logs while they complete J0–J2  
- [ ] Confirm Mission Control loads for PM role  
- [ ] Confirm no `/unauthorized` for provisioned resident/vendor  

---

## Alert ownership

| Field | Value |
|-------|-------|
| Primary on-call | |
| Backup | |
| Escalation | |
| Log retention note | Vercel/Supabase default retention; export critical incidents to tickets |

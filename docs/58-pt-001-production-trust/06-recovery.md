# Recovery Report

## Guarantees strengthened

| Failure | Recovery path |
| --- | --- |
| Provider offline / send fail | Structured `failed` status + human UI message; retry CTA |
| Duplicate webhook | `integrations_webhook_events` short-circuit |
| Duplicate notification | Unique idempotency key returns existing row |
| Duplicate payment click | `useSubmissionGuard` + recent-key dedupe |
| Storage upload fail | New media intent retry; audit event |
| Auth session expired | Humanized message → sign in again |
| Unauthorized route | Friendly `/unauthorized` with support link |
| Page/render crash | `error.tsx` / `global-error.tsx` with Retry |
| Missing data relationships | Integrity audit lists Fix guidance |

## Workflow half-complete risk

Billing/screening/signature domain services already write audit events before/after provider calls. PT-001 does not redesign those flows; it surfaces failures and blocks duplicate client submits.

## Remaining

- Email rejection (Resend) not implementable until INT-303
- SMS failure (Twilio) not implementable until INT-302
- Long-running migration import resume UX exists in Migration Center; keep monitoring large jobs

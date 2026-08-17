# Notification Delivery — Audit + Fix

**Status:** Implemented (bug fix; no new product/architecture pattern)  
**Date:** 2026-08-17  
**Gate:** Implementation Gate § bug fixes that do not change product/architecture may proceed  
**Provider:** Resend HTTP API (`api.resend.com`) + Supabase Auth SMTP for password/confirm/invite-user

---

## Root cause

Production had `RESEND_API_KEY` and a **verified** sending domain (`my-property-assistant.com`). App transactional mail did **not** use that domain.

1. Invitation path fell back to `M.P.A. <onboarding@resend.dev>` when `RESEND_FROM_EMAIL` was unset.
2. Resend treated that as test-mode: **403** for every recipient except the account owner (`ecastle612@gmail.com`).
3. Operational / maintenance / provisioning / lifecycle mail required **both** env vars via `serverEnv`. Missing `RESEND_FROM_EMAIL` skipped the provider call (`Email provider is not configured`) without a Resend request.
4. Vercel Production has `RESEND_API_KEY` and `EMAIL_FROM`, but **not** `RESEND_FROM_EMAIL`. The app only read `RESEND_FROM_EMAIL`.
5. `RESEND_FROM_EMAIL` was validated as `z.string().email()`, so a correct `Name <email>` value (the format Auth SMTP already uses) would fail env parse.

Production evidence (2026-08-17, `mpa-prod`):

| Signal | Result |
|--------|--------|
| Resend domain | `my-property-assistant.com` verified, sending enabled |
| Auth SMTP | `My Property Assistant <noreply@my-property-assistant.com>` — password reset **delivered** |
| App `POST /emails` 2026-08-16 | `from: M.P.A. <onboarding@resend.dev>` → **403** test-mode |
| `organization_invitations.delivery_status` | **11 failed, 3 pending, 0 sent** |
| `maintenance_notifications` | relation **absent** in Production (ADR-029 optional) — in-app WO rows skipped; email still attempted when critical |
| `comms_messages` | no rows |
| Queues | Email is inline at trigger time; no claim/worker. Domain events are audit, not a mail queue. |

`delivery_status = failed` on an invitation row means the provider rejected the send. It is not inbox delivery.

---

## What was fixed

- Shared `resolveResendSender()` — Production never sends from `resend.dev`. From resolution order: `RESEND_FROM_EMAIL` → `EMAIL_FROM` → derive `My Property Assistant <noreply@{app-host}>` from `NEXT_PUBLIC_APP_URL`.
- Env schema accepts bare email or `Name <email>`.
- All Resend HTTP senders (invitation, operational notice, provisioning, SaaS lifecycle) use the resolver + shared HTTP helper.
- Honest status: invitation `sent` / `failed` / `skipped`; comms `email_sent` / `email_failed` (no longer `delivered` when email was requested and failed); maintenance keeps `queued` → `sent` / `failed` / `skipped_*`.
- Structured `mpa.email` logs (`provider_accepted` | `failed` | `skipped`). `provider_accepted` is not inbox delivery.
- Idempotency-Key on invitation create, conversation, and work-order lifecycle sends.
- Ops Command Center email health uses resolver (derived from counts as configured).

No Stripe, pricing, FIN-OPS money, July finance, M5, or native-app changes.

---

## Channel map

| Notification | Email? | In-app? | Notes |
|--------------|--------|---------|-------|
| Team / tenant invitation | Yes | Accept link in app | Resend HTTP |
| Tenant / vendor portal create | Yes (Auth) | Magic link handoff | `inviteUserByEmail` via Auth SMTP — already on verified domain |
| Password reset / confirm email | Yes (Auth) | — | Auth SMTP; works today |
| Work-order / vendor / emergency lifecycle | Yes when `emailCritical` + user email preference | Yes when in-app preference | In-app table optional in Production |
| Tenant conversation message | Yes if resident email present | Yes (`comms_notifications`) | Staff replies to tenant |
| Staff conversation reply notify | No | Yes | In-app only |
| Operational notice (`comms_messages`) | When channel is `email` or `both` | When recipient has a user id | |
| Finance reminder / delinquency | No | Yes (`financial_notifications`) | Designed in-app only |
| Leasing reminders | No | Catalog / in-app | Designed in-app only |
| SaaS provisioning / billing lifecycle | Yes | — | Same Resend path |

---

## Operator action still required

Optional but recommended: also set Vercel Production `RESEND_FROM_EMAIL` to the same verified-domain address already stored as `EMAIL_FROM` (likely `My Property Assistant <noreply@my-property-assistant.com>`). The fix now reads `EMAIL_FROM` if `RESEND_FROM_EMAIL` is missing, and otherwise derives `noreply@{app-host}`. Domain DNS is already verified — no Resend domain work unless you change the from host.

Do not use `onboarding@resend.dev` in Production.

UAT mailboxes on `@my-property-assistant.com` and `@example.com` bounce or are rejected. Use a real controlled inbox (for example a `+uat` Gmail) for delivery checks.

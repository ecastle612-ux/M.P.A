# 01 — Overview

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Related:** [ADR-018](../18-decision-log/adr-018-resend-as-primary-transactional-email-provider.md), [API-001 Notification Foundation](../44-api-001-onesignal-notification-foundation/README.md), [CP-004](../76-cp-001-live-provider-certification/08-cp004-resend-production-certification.md)

---

## Why M.P.A. needs a production email provider

M.P.A. already orchestrates resident and operator communication through in-app notifications and push (OneSignal via `NotificationService`). Several **existing** product paths still expect or record an **email** channel:

- Resident / applicant **invitations** (today: DB insert only — no outbound mail)
- **Announcement** fan-out rows with `delivery_channel: "email"` (today: `delivery_status: "placeholder"`)
- **Welcome**, **maintenance**, **owner statement**, and **financial** notify paths that can include email preference without a real mailer
- Operator-facing **general notifications** where email is a preferred channel

Without a production transactional mailer:

- Design Partners cannot receive invite or announcement email from M.P.A.
- Integrations correctly shows Resend as **Disabled** / capped below Production Ready
- CP-004 certification remains **FAIL**
- Commercial claims about email delivery are forbidden

INT-303 closes that gap by adding a **vendor-backed email adapter** behind a stable abstraction — not by redesigning workflows.

---

## Why Resend was selected

| Criterion | Resend |
| --- | --- |
| Fit for transactional email | First-class API for invites, alerts, and operational mail |
| Operational simplicity | REST send + domain verification; low infra burden vs self-hosted SMTP |
| Developer experience | Clear API, request IDs, domain SPF/DKIM tooling |
| Alignment with roadmap | PRR INT-303 lists **SendGrid / Resend**; product direction selects Resend as the **primary** adapter |
| Swap readiness | Provider interface allows SendGrid (or other) later without rewriting callers |

**Not selected as primary for INT-303:** raw SMTP from application servers, SendGrid-as-required-primary, or routing all mail through Supabase Auth SMTP (Auth remains for password reset only).

---

## Existing architecture (as of CP-004)

```
Workflow / domain modules
        ↓
NotificationService.notify()     → in-app (Postgres) + push (NotificationProvider / OneSignal)
        ↓
Invitation / announcement code   → DB rows; email channel often placeholder or absent
        ↓
Integrations Provider Status     → Resend row exists; honest “no adapter” posture
        ↓
Supabase Auth                    → password reset email (outside INT-303)
```

Facts from certification:

- No `resend` package / `ResendProvider` module under `apps/web/src/lib/integrations/`
- Production posture: `EMAIL_PROVIDER=noop`, no `RESEND_API_KEY`
- Push and email are **separate channels**; ADR-017 (OneSignal) explicitly excluded email

---

## Relationship to Notification Service

`NotificationService` remains the **orchestration** entry for preference-aware, multi-channel notify flows (in-app, push, and—after INT-303—email when the recipient’s preferences and the event allow it).

INT-303 adds:

1. An **`EmailProvider`** interface and registry (parallel to `NotificationProvider` for push).
2. A **`ResendProvider`** adapter that implements send + health + config validation.
3. Wiring so existing notify / invite / announcement email paths call the email registry **instead of placeholders or no-ops**.

Boundaries:

- Domain modules must **not** call the Resend SDK or HTTP API directly (MHF-015 / Phase 12 provider discipline).
- Email delivery does **not** replace in-app as source of truth for the notification center.
- Push continues through `NotificationProvider`; email through `EmailProvider`.

---

## Relationship to Provider Registry

INT-303 introduces an **Email Provider Registry** (design name), selected by `EMAIL_PROVIDER`:

| Mode | Adapter | Role |
| --- | --- | --- |
| `noop` | `NoopEmailProvider` | Default / local / CI — no outbound mail; structured skip results |
| `resend` | `ResendProvider` | Production transactional send via Resend API |

This mirrors payments (`PAYMENT_PROVIDER`) and push (`NOTIFICATION_PROVIDER`). Future adapters (e.g. SendGrid) register the same interface without changing workflow code.

---

## Relationship to Integrations Health

Settings → Integrations already surfaces a **Resend** card via `provider-status.ts`. Today it:

- Reads `EMAIL_PROVIDER` / `RESEND_API_KEY` (and related mode hints)
- Caps status below **Production Ready** because no adapter exists
- May probe Resend Domains API when a key is present (connectivity only)

After INT-303 implementation (post-Approve), health must reflect **real send capability**: Connected / Sandbox / Production Ready / Disabled, Last Success / Last Failure, Verified Domain, and Recommended Action — see [05-provider-health.md](./05-provider-health.md).

---

## Success intent (post-implementation)

When Approve → Implement completes and CP-004 is re-run:

- Real Resend API sends reach real inboxes for mapped workflows
- Integrations may show **Production Ready** only when contract + domain + live send criteria are met
- Audit events and request IDs exist for every send attempt
- Password reset still uses Supabase Auth unchanged

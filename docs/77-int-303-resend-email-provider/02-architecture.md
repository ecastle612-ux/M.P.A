# 02 — Architecture

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Constraint:** No workflow redesign. Existing callers gain a real email channel; product flows stay the same.

---

## Send path

```
Notification Service / domain email callers
            ↓
    Email Provider Registry
            ↓
       ResendProvider   (or NoopEmailProvider)
            ↓
         Resend API
            ↓
         Recipient inbox
```

For preference-aware notify events:

```
Domain event / workflow action
        ↓
NotificationService (orchestrator)
        ├── persist in-app notification (unchanged)
        ├── NotificationProvider → push (unchanged; OneSignal)
        └── EmailProvider Registry → ResendProvider → Resend API → inbox
```

For invite-style paths that today only insert DB rows:

```
Invite action (existing API / server function)
        ↓
Persist invitation (unchanged business rules)
        ↓
EmailProvider Registry → send invitation email
        ↓
Audit + delivery status update (email channel row / log — no new product workflow)
```

---

## Layer responsibilities

### 1. Notification Service / domain callers

- Decide **whether** email should be attempted (preferences, channel flags, recipient email presence).
- Supply template key, subject/body or structured template data, org context, idempotency key.
- Must not embed Resend-specific HTTP, headers, or SDK types.
- Must not redesign announcement, maintenance, financial, or invite UX in this package.

### 2. Email Provider Registry

- Resolve adapter from `EMAIL_PROVIDER` (`noop` | `resend`).
- Single factory entry point (e.g. `getEmailProvider()`), analogous to `getNotificationProvider()`.
- Reject unknown keys with a clear configuration error surfaced to health + logs (no silent “fake success”).

### 3. ResendProvider

- Implements `EmailProvider` contract ([03-provider-contract.md](./03-provider-contract.md)).
- Maps internal `sendEmail` input → Resend REST payload (`from`, `to`, `reply_to`, `subject`, `html`/`text`, headers for idempotency where supported).
- Implements `health()` and `validateConfiguration()`.
- Applies timeout, retry, and failure mapping.
- Emits audit-safe outcomes (request id, message id, status) without secrets or full PII dumps.

### 4. Resend API

- External system of record for message acceptance and provider-side delivery.
- Domain verification (SPF/DKIM) owned in Resend dashboard + DNS; M.P.A. health reports verified-domain posture.

### 5. Recipient

- End-user inbox. Certification requires real delivery, not mocked success.

---

## Boundaries (hard)

| In scope | Out of scope |
| --- | --- |
| Email adapter + registry | New notification product surface |
| Wiring existing email channel placeholders to `sendEmail` | Changing announcement lifecycle rules |
| Integrations health enrichment for Resend | Redesigning financial / owner statement generation |
| Audit of email send attempts | Replacing Supabase Auth password reset mail |
| Env-based mode selection | Concurrent multi-vendor fan-out in v1 |

---

## Relationship to push and SMS

| Channel | Abstraction | Provider (current / planned) |
| --- | --- | --- |
| In-app | Postgres notifications | N/A (platform) |
| Push | `NotificationProvider` | OneSignal (ADR-017) |
| Email | `EmailProvider` | Resend (ADR-018 / INT-303) |
| SMS | Future `SmsProvider` | Twilio (INT-302) — not this package |

Failure of email must not roll back in-app notification creation. Channel failures are independent, audited, and reflected in delivery status / health.

---

## Idempotency and correlation

- Callers pass an **idempotency key** (org + workflow + entity + recipient + template).
- Provider stores/returns Resend **message id** / request id when available.
- Retries use the same idempotency key; duplicate acceptance at Resend should not produce duplicate operator-visible “success” noise in audit (document provider behavior; prefer safe skip on known duplicate).

---

## Deployment topology

- Server-only: API routes, server actions, and background jobs may call the registry.
- Browser never holds `RESEND_API_KEY`.
- Edge vs Node: prefer the same runtime used by other server integrations (Next.js server); no client bundle of the adapter.

# 03 — Provider Contract

**Package:** INT-303  
**Status:** Draft — awaiting Approve

---

## Required interface

```typescript
type EmailProviderKey = "noop" | "resend" | string;

type EmailEnvironment = "development" | "staging" | "production" | "test";

type SendEmailInput = {
  organizationId: string;
  /** Stable key for retries / dedupe */
  idempotencyKey: string;
  /** Mapped template id from 04-template-mapping.md */
  templateKey: EmailTemplateKey;
  to: { email: string; name?: string | null };
  subject: string;
  html: string;
  text?: string | null;
  replyTo?: string | null;
  /** Correlation to in-app notification / announcement recipient row / invite id */
  correlation?: {
    notificationId?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  };
  tags?: Record<string, string>;
};

type SendEmailResult = {
  status: "sent" | "queued" | "skipped" | "failed";
  providerKey: EmailProviderKey;
  /** Resend email / message id when accepted */
  externalId?: string | null;
  /** Resend or HTTP request id when available */
  requestId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  /** Safe metadata only — never API keys or raw secrets */
  rawSafe?: Record<string, unknown>;
};

type EmailHealthResult = {
  ok: boolean;
  providerKey: EmailProviderKey;
  detail?: string;
  verifiedDomain?: boolean | null;
  domainName?: string | null;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  lastFailureMessage?: string | null;
};

type EmailConfigValidation = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

interface EmailProvider {
  readonly key: EmailProviderKey;

  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;

  health(): Promise<EmailHealthResult>;

  validateConfiguration(): Promise<EmailConfigValidation>;
}
```

`EmailTemplateKey` values are enumerated in [04-template-mapping.md](./04-template-mapping.md). No additional keys in INT-303.

---

## Method semantics

### `sendEmail()`

- Validates recipient email format; missing/invalid → `status: "failed"` with stable `errorCode` (e.g. `invalid_recipient`) — no HTTP call.
- When `EMAIL_PROVIDER=noop` → `status: "skipped"`, `errorCode: "provider_noop"` (or equivalent), no external call.
- When Resend accepts the message → `status: "sent"` or `"queued"` per API response; must capture `externalId` / `requestId` when present.
- Must never throw uncaught vendor errors to UI without mapping; throw only for programmer errors. Operational failures return `SendEmailResult` with `failed`.

### `health()`

- Reports whether the selected provider can serve production traffic posture.
- For Resend: credential presence, optional Domains API probe, last success/failure timestamps when known.
- Must not return secret values.

### `validateConfiguration()`

- Checks required env for the **selected** provider.
- Returns `missing` / `warnings` for Integrations Recommended Action.

---

## Supported provider modes

| `EMAIL_PROVIDER` | Behavior |
| --- | --- |
| `noop` (default) | No outbound mail; structured skip; Integrations **Disabled** or equivalent honest posture |
| `resend` | Live Resend API when config valid |

Unknown values: treat as configuration error; do not fall through to silent noop success without logging + health failure.

---

## Environment variables

| Variable | Required when | Purpose |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Always (default `noop`) | Registry selector: `noop` \| `resend` |
| `RESEND_API_KEY` | `EMAIL_PROVIDER=resend` | Server-only Resend API key |
| `EMAIL_FROM` | `EMAIL_PROVIDER=resend` | Verified From address (e.g. `M.P.A. <noreply@domain>`) |
| `EMAIL_REPLY_TO` | Optional | Default Reply-To when caller omits `replyTo` |
| `EMAIL_ENVIRONMENT` | Recommended | `development` \| `staging` \| `production` \| `test` — drives health labels and safety checks |

### Compatibility note (pre-INT-303 code)

`provider-status.ts` today may read `RESEND_MODE`. Implementation **should**:

1. Prefer `EMAIL_ENVIRONMENT` as the approved contract.
2. Accept `RESEND_MODE` as a temporary alias mapped into environment labeling if present, then deprecate alias after cutover.
3. Never require both; document the approved set above as authoritative.

---

## Failure contract

| Condition | Result |
| --- | --- |
| Missing `RESEND_API_KEY` with `resend` selected | `validateConfiguration` invalid; `sendEmail` → `failed` / `configuration_error`; health not Production Ready |
| Missing / unverified `EMAIL_FROM` | Same — do not send with arbitrary from |
| Invalid recipient | `failed` / `invalid_recipient` — no retry |
| Resend 4xx (except 429) | `failed` with mapped `errorCode`; retry only if classified retryable |
| Resend 5xx / network | `failed` after retry budget; record last failure |
| Timeout | `failed` / `timeout` after retry budget |
| Rate limit (429) | Retry with backoff per retry contract; then `failed` / `rate_limited` |

User-facing errors: generic, actionable (“Email could not be sent. Try again or contact support.”). Detail stays in audit/logs.

---

## Retry contract

| Rule | Value |
| --- | --- |
| Max attempts | 3 (initial + 2 retries) |
| Backoff | Exponential: e.g. 500ms, 2s (jitter allowed) |
| Retryable | Network errors, timeouts, HTTP 429, HTTP 5xx |
| Non-retryable | Invalid recipient, auth/config errors, most HTTP 4xx |
| Idempotency | Same `idempotencyKey` on every attempt |
| Caller responsibility | Do not open a second logical send with a new key for the same user action |

---

## Timeout contract

| Rule | Value |
| --- | --- |
| Per-attempt HTTP timeout | 10 seconds |
| Total wall time including retries | ≤ 30 seconds |
| Health probe timeout | 5 seconds |

Timed-out attempts count toward the retry budget.

---

## Audit contract

Every `sendEmail` attempt (including noop skip and failures) emits an audit-safe record:

| Field | Required |
| --- | --- |
| timestamp | Yes |
| organizationId | Yes |
| providerKey | Yes |
| templateKey | Yes |
| idempotencyKey | Yes |
| result status | Yes |
| externalId / requestId | When available |
| errorCode | On failure / skip reason |
| recipient email | **Hashed or redacted** in durable logs; full address only in tightly scoped operational tables if already required by existing invite/announcement schemas |
| correlation ids | When provided |

Forbidden in logs/audit payloads: `RESEND_API_KEY`, Authorization headers, full raw Resend error bodies that echo secrets.

---

## Registry factory (design)

```typescript
function getEmailProvider(): EmailProvider {
  switch ((process.env.EMAIL_PROVIDER ?? "noop").toLowerCase()) {
    case "resend":
      return resendProvider;
    case "noop":
    default:
      return noopEmailProvider;
  }
}
```

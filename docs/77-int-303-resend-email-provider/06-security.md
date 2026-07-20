# 06 — Security

**Package:** INT-303  
**Status:** Draft — awaiting Approve

---

## Secret storage

| Secret | Storage | Exposure |
| --- | --- | --- |
| `RESEND_API_KEY` | Server env only (Vercel / hosting secrets, local `.env.local` gitignored) | Never `NEXT_PUBLIC_*`; never client bundles |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | Server env | Non-secret but treat as config; validate domain ownership via Resend |
| `EMAIL_PROVIDER` / `EMAIL_ENVIRONMENT` | Server env | Non-secret selectors |

Do not commit real keys. Do not paste keys into docs, tickets, or chat. Rotate on suspected leak.

---

## No API keys in logs

Forbidden in application logs, audit JSON, health API responses, error toasts, and support exports:

- `RESEND_API_KEY` and any substring that is the key
- `Authorization: Bearer …` headers
- Full request bodies that echo the key

Allowed: provider key name (`resend`), HTTP status, Resend **request id** / **message id**, mapped `errorCode`, redacted recipient.

Health and Integrations APIs must continue the existing “no secrets in payload” posture used for other providers.

---

## Request IDs

- Capture Resend request / message identifiers on every accepted send.
- Persist on audit events and, where delivery rows exist (e.g. announcement recipients), on delivery metadata.
- Include correlation to `idempotencyKey` and organization id for support.

---

## Audit events

Emit for each send attempt (including noop skip and failures). Minimum fields are defined in [03-provider-contract.md](./03-provider-contract.md) Audit contract.

Audit is **security-relevant**: it proves who triggered sends, whether PII was mishandled in logs, and supports abuse investigation. Prefer append-only / existing audit mechanisms used by other integrations; do not invent a parallel secret store.

---

## PII handling

| Data | Rule |
| --- | --- |
| Recipient email | Necessary for send; minimize retention in free-form logs (hash/redact); existing invite tables may store email as today |
| Email body | May contain names, property addresses, amounts — treat as PII; do not log full HTML in info-level logs |
| Subject | Avoid logging full subject at info if it contains PII; debug only with redaction policy |
| Organization / user ids | Prefer UUIDs in logs over names |

Access to delivery logs follows existing org authorization (four-plane model). No cross-tenant email metadata leakage.

---

## Retry policy

Retries are bounded ([03-provider-contract.md](./03-provider-contract.md)). Security implications:

- Retries must not amplify spam against a recipient beyond the retry budget for a single logical send.
- Non-retryable auth failures must not tight-loop (fail fast on 401/403).
- Idempotency keys prevent accidental duplicate logical sends from retry storms.

---

## Rate limiting expectations

| Layer | Expectation |
| --- | --- |
| Resend account | Respect provider rate limits; map 429 → backoff then fail |
| M.P.A. application | Existing invite / announcement / notify authorization and product rate controls remain; INT-303 does not add a new public unauthenticated send endpoint |
| Abuse | Only authenticated, authorized server paths may call `sendEmail` |
| Bulk announcement | Fan-out stays within existing announcement recipient generation — no new blast API |

Do not build a public “send arbitrary email” debug route for production without auth + allow-listed recipients.

---

## Threat notes (informational)

- **Key theft** → attacker can send as the verified domain; mitigate with secret rotation, least privilege hosting access, and monitoring Last Failure / unusual volume via Resend dashboard.
- **Open relay** → prevented by server-only adapter + authz on callers.
- **Phishing lookalike** → use verified domain and consistent `EMAIL_FROM`; do not allow per-request arbitrary From spoofing outside configured address.

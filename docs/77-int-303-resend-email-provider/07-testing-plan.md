# 07 — Testing Plan

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Goal:** Certify Resend as Production Ready only with real evidence. Replaces the CP-004 FAIL once Implement ships.

---

## Certification gates

All gates below must **PASS** for Production Ready. Mocked “success” without Resend API acceptance is forbidden.

---

### 1. Authentication

| Check | Pass criteria |
| --- | --- |
| API key accepted | Resend API returns success on authenticated Domains or send call |
| Invalid key rejected | Clear `configuration_error` / auth failure; health not Production Ready |
| Server-only key | Key absent from client bundles and public env |

---

### 2. Real inbox delivery

| Check | Pass criteria |
| --- | --- |
| Test recipient | Controlled mailbox under team control |
| At least one mapped template | e.g. `user_invitation` or `announcement_email` or `general_notification` |
| Evidence | Message visible in inbox; Resend dashboard/message id matches M.P.A. `externalId` |
| From / Reply-To | Matches `EMAIL_FROM` / `EMAIL_REPLY_TO` (or per-send override) |

Password reset is **out of scope** — do not use it as Resend inbox proof.

---

### 3. Failure handling

| Scenario | Pass criteria |
| --- | --- |
| Invalid recipient | `failed` + stable error code; no retry storm |
| Missing config | Send blocked; Integrations Recommended Action points to missing vars |
| API rejection | Mapped failure; user-safe error; audit recorded |

---

### 4. Retries

| Check | Pass criteria |
| --- | --- |
| Retryable fault | Simulated 5xx/timeout triggers ≤ configured retries with backoff |
| Non-retryable | No retry on invalid recipient / auth |
| Idempotency | Same `idempotencyKey` across attempts |

---

### 5. Audit events

| Check | Pass criteria |
| --- | --- |
| Success | Audit contains status, providerKey, templateKey, externalId/requestId |
| Failure | Audit contains errorCode; no API key |
| Noop mode | Skip recorded when `EMAIL_PROVIDER=noop` |

---

### 6. Provider health

| Check | Pass criteria |
| --- | --- |
| Disabled | Honest when noop |
| Connected / Sandbox / Production Ready | Matches [05-provider-health.md](./05-provider-health.md) rules |
| Verified Domain | Shown and accurate vs Resend |
| Last Success / Last Failure | Update after probe or send |
| Recommended Action | Accurate next step |

---

### 7. Production verification

| Check | Pass criteria |
| --- | --- |
| Env | Production (or staging designated for cert) has `EMAIL_PROVIDER=resend`, key, from, environment |
| Domain | Verified in Resend; SPF/DKIM as required by Resend |
| Browser | Operator-triggered existing workflow produces real inbox mail (headed browser OK) |
| No false Production Ready | Status only after criteria met |
| Certification report | Written under CP / INT-303 follow-up (re-run CP-004 or successor) with PASS/FAIL matrix |

---

## Automated tests (implementation phase)

- Unit: registry selection, noop skip, config validation, error mapping, retry classifier.
- Integration (optional against Resend test key): one send in CI only if secrets available; otherwise contract tests with HTTP mock that still assert no key leakage.
- ESLint / TypeScript clean for new modules.

---

## Explicit non-tests

- Supabase Auth password reset inbox (separate Auth ops check).
- New workflow UX redesign validation.
- SMS / push regressions beyond smoke that email failure does not block in-app create.

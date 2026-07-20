# INT-303 — Resend Implementation & Production Certification

**Date:** 2026-07-20  
**Gate:** Design → Document → **Approve** → Implement (satisfied)  
**ADR:** [ADR-018](../18-decision-log/adr-018-resend-as-primary-transactional-email-provider.md) — **Accepted**  
**Design package:** [docs/77-int-303-resend-email-provider](../77-int-303-resend-email-provider/README.md)  
**Prior CP-004:** FAIL (no adapter) — superseded by this implementation report

---

## Implementation summary

| Deliverable | Status |
| --- | --- |
| `EmailProvider` contract (`sendEmail`, `health`, `validateConfiguration`) | Shipped |
| Registry modes `noop` \| `resend` via `EMAIL_PROVIDER` | Shipped |
| `ResendProvider` (retries, timeouts, request ids, error mapping) | Shipped |
| `NoopEmailProvider` | Shipped |
| Audit + idempotency (no secrets logged) | Shipped |
| Integrations health (Connected / Sandbox / Production Ready / Disabled, Verified Domain, Last Success / Failure / Delivery, Recommended Action) | Shipped |
| User invitation email | Wired |
| Welcome / maintenance / financial / general via `notify()` email channel | Wired |
| Announcement email (replaces placeholder delivery rows) | Wired |
| Owner statement email (when `owner_placeholder` is an email) | Wired |
| Password reset | **Unchanged** — Supabase Auth only |
| Schema / Accounting / Maintenance / Timeline / Reporting redesign | **Not modified** |

### Key modules

- `apps/web/src/lib/integrations/email/*`
- `apps/web/src/lib/notifications/service.ts` + `preferences.ts`
- `apps/web/src/lib/communication/server.ts` (announcement email delivery)
- `apps/web/src/lib/resident-lifecycle/server.ts`, invitations API, applicant invite
- `apps/web/src/lib/financial/server.ts` (owner statement)
- `apps/web/src/lib/integrations/provider-status.ts` + Integrations UI
- Cert harness: `apps/web/scripts/dev/certify-resend-int303.ts`

### Environment (approved contract)

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=...
EMAIL_REPLY_TO=...   # optional
EMAIL_ENVIRONMENT=production
```

---

## Certification matrix (this run)

**Environment under test:** local workspace / current `.env.local`  
**Resend credentials present:** **No** (`RESEND_API_KEY` / `EMAIL_FROM` unset)  
**Live inbox exercised:** **No** — cannot call Resend without secrets

| Area | Result | Notes |
| --- | --- | --- |
| Configuration | **FAIL** | `EMAIL_PROVIDER` not set to `resend` with key + from in the cert environment |
| Authentication | **FAIL** | No API key to authenticate against Resend |
| Provider Health | **WARNING** | UI/probe path implemented; shows Disabled / Configuration Required honestly without keys |
| Template Delivery | **FAIL** | No live inbox — invitation / welcome / announcement / maintenance / owner / financial not inbox-proven in this environment |
| Retries | **PASS** (unit) | Retry classifier + backoff implemented; live 5xx drill not run without credentials |
| Failures | **PASS** (unit) | Invalid recipient → `failed` / `invalid_recipient` without HTTP |
| Audit | **PASS** (unit) | Structured `[email.audit]` events; secrets scrubbed; idempotency dedupe covered by tests |
| Production Readiness | **FAIL** | Design forbids marking Production Ready without verified live inbox delivery |

### Automated verification executed

| Check | Result |
| --- | --- |
| Unit tests (`resend-provider.test.ts`, preferences) | **PASS** |
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint (email module) | **PASS** |
| Password reset still outside Resend | **PASS** (explicit skip path + ADR) |

### Browser verification (desktop / tablet / mobile)

| Viewport | Result |
| --- | --- |
| Desktop | **FAIL** — blocked: no Resend credentials / no inbox proof |
| Tablet | **FAIL** — same |
| Mobile | **FAIL** — same |

---

## Readiness statements

### Design Partner Readiness

**WARNING.** Code path is shipped. Partners can run with `EMAIL_PROVIDER=noop` (no outbound mail) or enable Resend once secrets + verified domain are configured. Password reset remains Supabase Auth.

### Production Readiness

**FAIL** until:

1. Production env sets `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ENVIRONMENT=production`
2. Sending domain shows **Verified** in Integrations
3. `pnpm exec tsx scripts/dev/certify-resend-int303.ts` with `CERT_INBOX=...` proves real inbox delivery for mapped templates
4. Operator confirms browser-triggered invite/announcement/notify emails arrive

### Commercial Readiness

**FAIL** for any commercial claim that Resend delivers production mail until the Production Readiness checklist above is **PASS**.

---

## Can Resend be marked Production Ready?

**No — not in this certification environment.**

Implementation is complete per approved scope. **Production Ready** requires live Resend authentication, verified domain, and real inbox proof. Re-run:

```bash
cd apps/web
EMAIL_PROVIDER=resend \
RESEND_API_KEY=*** \
EMAIL_FROM='M.P.A. <noreply@your-verified-domain>' \
EMAIL_ENVIRONMENT=production \
CERT_INBOX=you@example.com \
pnpm exec tsx scripts/dev/certify-resend-int303.ts
```

Then update this report’s matrix to PASS and only then allow Integrations **Production Ready**.

---

## Explicit non-claims

- Password reset is **not** delivered by Resend.
- No mocked / simulated Resend success was used for Production Ready.
- No workflow redesign beyond wiring the approved email transport.

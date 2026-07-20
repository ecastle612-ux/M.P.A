# INT-303 — Final Production Certification

**Date:** 2026-07-20  
**Scope:** Live Resend certification only — no mocked success, no simulated delivery  
**ADR:** [ADR-018](../18-decision-log/adr-018-resend-as-primary-transactional-email-provider.md) (Accepted)  
**Credentials under test:** `apps/web/.env.local` (`EMAIL_PROVIDER=resend`, `EMAIL_ENVIRONMENT=production`)  
**Controlled inbox:** `ecastle612@gmail.com` (master-admin / founder mailbox)  
**Sending domain:** `my-property-assistant.com`

---

## Overall verdict

| Gate | Result |
| --- | --- |
| Resend API authentication | **PASS** |
| Verified sending domain | **PASS** |
| SPF | **PASS** |
| DKIM | **PASS** |
| `EMAIL_FROM` | **PASS** |
| `EMAIL_REPLY_TO` | **PASS** |
| Real inbox delivery (Resend `last_event=delivered`) | **PASS** |
| Workflow template matrix | **PASS** (all required workflows) |
| Integrations health (process with full Resend env) | **PASS** — **Production Ready** |
| Hosted `www` Integrations (Vercel Production) | **FAIL** — Resend secrets not present on Vercel |

### Can Resend be marked Production Ready?

**Yes — for the configured production Resend account and the live adapter**, after verified `delivered` events to a real inbox.

**No — for the currently deployed Vercel Production host**, until `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, and `EMAIL_ENVIRONMENT=production` are set on Vercel (today only `EMAIL_PROVIDER` exists there). Deploying those secrets was not performed in this certification (production secret mutation requires explicit ops approval).

---

## 1. Configuration

| Check | Result | Evidence |
| --- | --- | --- |
| `EMAIL_PROVIDER` | **PASS** | `resend` |
| `RESEND_API_KEY` | **PASS** | Present (local production credential set) |
| `EMAIL_FROM` | **PASS** | `My Property Assistant <noreply@my-property-assistant.com>` |
| `EMAIL_REPLY_TO` | **PASS** | `support@my-property-assistant.com` |
| `EMAIL_ENVIRONMENT` | **PASS** | `production` |
| Vercel Production secrets complete | **FAIL** | `vercel env ls production` shows `EMAIL_PROVIDER` only — missing `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ENVIRONMENT` |

---

## 2. Authentication

| Check | Result | Evidence |
| --- | --- | --- |
| Domains API | **PASS** | `GET https://api.resend.com/domains` → HTTP 200 |
| Domain detail API | **PASS** | `GET /domains/3ef3924a-e715-47d9-bc62-745ae3be8c6b` → HTTP 200 |

---

## 3. Domain / SPF / DKIM

| Check | Result | Evidence |
| --- | --- | --- |
| Domain status | **PASS** | `my-property-assistant.com` → `status: verified` (region `us-east-1`) |
| DKIM | **PASS** | Record `DKIM` / `resend._domainkey` → `status: verified` |
| SPF (MX) | **PASS** | Record `SPF` / MX `send` → `status: verified` (`feedback-smtp.us-east-1.amazonses.com`) |
| SPF (TXT) | **PASS** | Record `SPF` / TXT `send` → `status: verified` (`v=spf1 include:amazonses.com ~all`) |

---

## 4. From / Reply-To on live messages

Verified on retrieved Resend email objects (not assumed from env alone):

| Field | Expected | Observed on all sends | Result |
| --- | --- | --- | --- |
| From | `My Property Assistant <noreply@my-property-assistant.com>` | Exact match | **PASS** |
| Reply-To | `support@my-property-assistant.com` | Exact match (array) | **PASS** |

---

## 5. Workflow delivery matrix

All sends used the production EmailProvider path (`sendWorkflowEmail` / `sendInvitationEmail` — the same helpers existing workflows call). Recipient: controlled Gmail inbox. Resend acceptance was **not** treated as success until `GET /emails/{id}` returned `last_event: "delivered"`.

| Workflow | Template / path | Resend message id | `last_event` | Result |
| --- | --- | --- | --- | --- |
| User invitation | `sendInvitationEmail` → `user_invitation` | `04dca423-9104-41b4-86c4-55b48c4788b8` | `delivered` | **PASS** |
| User invitation (cert matrix) | `user_invitation` | `42441b97-4a87-4b46-8226-360b5cb66ffd` | `delivered` | **PASS** |
| Welcome email | `welcome_email` | `cd84e365-3dc8-49c0-a83b-5a8aec213e0e` | `delivered` | **PASS** |
| Announcement | `announcement_email` | `4b583dd3-3435-4e6c-ad16-802bd0b05659` | `delivered` | **PASS** |
| Maintenance notification | `maintenance_notification` | `045f0c4b-8e41-4306-988f-b01961f75dd5` | `delivered` | **PASS** |
| Owner statement | `owner_statement` | `abe5b90a-7334-42c4-94d3-03513a2d7f08` | `delivered` | **PASS** |
| Financial report | `financial_report` | `a406362e-cf19-47cd-9da9-ebdd261fdb2b` | `delivered` | **PASS** |
| General notification | `general_notification` | `90aa01b7-304c-41af-9828-63a577be5135` | `delivered` | **PASS** |

Invitation subject observed: `You're invited to My Property Assistant` (production invitation copy path).

### Failure / retry drills

| Check | Result | Evidence |
| --- | --- | --- |
| Invalid recipient | **PASS** | `failed` / `invalid_recipient` (no HTTP send) |
| Idempotent dedupe | **PASS** | Second send with same idempotency key returned deduplicated result |

Password reset: **N/A** (Supabase Auth — out of INT-303 scope per ADR-018).

---

## 6. Integrations health (full Resend env process)

After a live invitation send in-process:

| Field | Observed | Result |
| --- | --- | --- |
| Connection / status | `Production Ready` (`production_ready`) | **PASS** |
| Verified Domain | `Verified (my-property-assistant.com)` | **PASS** |
| Last Success | Resend domains probe OK + timestamp | **PASS** |
| Last Delivery | `sent · 2026-07-20T07:50:07.376Z` | **PASS** |
| Last Failure | `null` / none | **PASS** |
| Recommended Action | No action — Production Ready | **PASS** |
| Environment label | `Production (partial)` while status is Production Ready | **WARNING** — cosmetic label lag from sync matrix; does not block delivery |

---

## 7. Hosted production (`www.my-property-assistant.com`)

| Check | Result | Evidence |
| --- | --- | --- |
| `/settings/integrations` reachable | **WARNING** | HTTP 307 (auth redirect) — expected |
| Vercel Production has Resend send credentials | **FAIL** | Only `EMAIL_PROVIDER` listed; no `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_ENVIRONMENT` |
| Hosted Integrations can show Production Ready | **FAIL** | Cannot without secrets on the host |

**Required ops follow-up (no code change):** set on Vercel Production:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY=…`
- `EMAIL_FROM=My Property Assistant <noreply@my-property-assistant.com>`
- `EMAIL_REPLY_TO=support@my-property-assistant.com`
- `EMAIL_ENVIRONMENT=production`

Then redeploy and confirm Settings → Integrations.

---

## 8. Readiness statements

### Design Partner Readiness

**PASS** (with configured Resend credentials). Live `delivered` events proven for all mapped transactional templates.

### Production Readiness (Resend account + adapter)

**PASS** — authentication, verified domain, SPF/DKIM, From/Reply-To, and inbox `delivered` events verified.

### Production Readiness (hosted www deployment)

**FAIL** until Vercel Production receives the full Resend env set above.

### Commercial Readiness

**WARNING** — Resend delivery is proven on the production Resend account; do not commercially claim hosted www email until Vercel secrets are applied and Integrations on www shows Production Ready.

---

## 9. Explicit non-claims

- No mocked Resend responses were used.
- Acceptance (`sent`) alone was insufficient; certification required Resend `last_event: delivered`.
- Password reset was not certified via Resend.
- Application code was not modified for this certification.
- Vercel Production secrets were not mutated in this sprint.

---

## Harness

```bash
cd apps/web
CERT_INBOX=ecastle612@gmail.com pnpm exec tsx --env-file=.env.local scripts/dev/certify-resend-int303.ts
```

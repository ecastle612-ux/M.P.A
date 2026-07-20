# Provider Certification Report

**Harness:** `pnpm trust:certify` → `apps/web/scripts/dev/run-trust-certification.ts`  
**API:** `GET /api/trust/certification` (requires `authorization:manage` or `migration:read`)  
**Raw run:** [`provider-certification-run.json`](./provider-certification-run.json)

## Method

For each provider the harness verifies (as applicable): authentication / configuration, a successful sandbox or noop request, webhook/callback parse path, failure handling, retry/idempotency recovery. **No silent failures** — every check emits status + recovery guidance.

## Results (this environment, 2026-07-18)

| Provider | Overall | Mode | Notes |
| --- | --- | --- | --- |
| OneSignal | **warn** | `noop` | Credentials not active; failure/idempotency paths coded |
| Stripe | **warn** | `noop` | Noop createCustomer + webhook parse **pass**; live `sk_test_` not set |
| Dropbox Sign | **warn** | `noop` | createEnvelope + webhook parse **pass** via noop |
| Checkr | **warn** | `noop` | createOrder sandbox/noop **pass**; live key not set |
| Resend | **not_in_path** | n/a | Roadmap INT-303 — not a production dependency |
| Twilio | **not_in_path** | n/a | Roadmap INT-302 — SMS not delivering |
| Supabase Storage | **fail*** | missing in CLI process | *Fails when CLI runs without Next env; configured apps with `NEXT_PUBLIC_SUPABASE_*` pass auth check |
| Supabase Auth | **fail*** | missing in CLI process | *Same — structural failure/recovery checks pass; credentials required in server env |

\* Re-run `pnpm trust:certify` with `apps/web/.env.local` loaded (or via authenticated `/api/trust/certification`) to certify Auth/Storage against the real project.

## Per-provider checklist

### OneSignal
| Check | Status | Recovery |
| --- | --- | --- |
| Auth | warn (missing keys) | Set `ONESIGNAL_APP_ID` + `ONESIGNAL_API_KEY`, `NOTIFICATION_PROVIDER=onesignal` |
| Request | warn | `health()` after credentials |
| Webhook | warn (optional) | Configure delivery webhooks if receipts required |
| Failure / retry | pass | Failed send surfaces error; idempotency unique key |

### Stripe
| Check | Status | Recovery |
| --- | --- | --- |
| Auth | warn | `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY=sk_test_…` |
| Request | pass (noop path) | Activate Stripe for live sandbox network |
| Webhook | warn | `STRIPE_WEBHOOK_SECRET` + dashboard endpoint |
| Failure / retry | pass | `integrations_webhook_events` dedupe |

### Dropbox Sign
| Check | Status | Recovery |
| --- | --- | --- |
| Auth | warn | `SIGNATURE_PROVIDER=dropbox_sign` + API key |
| Request / parse | pass (noop) | Sandbox key for live envelopes |
| Webhook | warn | `DROPBOX_SIGN_WEBHOOK_SECRET` |
| Failure / retry | pass | Audit events + webhook dedupe |

### Checkr
| Check | Status | Recovery |
| --- | --- | --- |
| Auth | warn | `SCREENING_PROVIDER=checkr` + sandbox API key |
| Request | pass (noop/sandbox sim) | Live key for network certification |
| Webhook | warn | `CHECKR_WEBHOOK_SECRET` |
| Failure / retry | pass | Fallback sim unless `CHECKR_REQUIRE_LIVE=true` |

### Resend / Twilio
Documented **not_in_path**. Do not treat as production providers until implemented.

### Supabase Storage / Auth
Code paths audited; CLI process without env reports fail. Production deploy must have URL, anon key, and server-only service role. Media orphan GC remains a follow-up.

## Acceptance vs PT-001 bar

**Not fully met for live sandbox providers in this run.** Structural + noop certification passes; live credential end-to-end remains a launch blocker (see blockers doc).

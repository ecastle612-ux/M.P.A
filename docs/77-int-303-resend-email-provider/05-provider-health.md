# 05 — Provider Health

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Surface:** Settings → Integrations (existing Provider Status Center)

---

## Purpose

Operators must see an honest Resend posture: whether M.P.A. can send transactional email, whether the domain is verified, and what to do next. Health must never claim **Production Ready** without a live adapter + valid config + successful verification criteria.

---

## Required fields (Resend card)

| Field | Meaning |
| --- | --- |
| **Connected** | Credentials present and provider selected (`EMAIL_PROVIDER=resend`); basic API reachability OK |
| **Production Ready** | Connected + `EMAIL_ENVIRONMENT=production` (or equivalent live posture) + verified sending domain + adapter in path + recent successful send or certified probe policy met |
| **Sandbox** | Credentials + adapter OK but non-production environment, or domain/send not yet certified for production |
| **Disabled** | `EMAIL_PROVIDER=noop` (or unset) and/or no intent to send via Resend |
| **Last Success** | Timestamp of last successful send or successful health probe that confirms API + domain readiness |
| **Last Failure** | Timestamp + short safe message of last failed send or failed probe |
| **Verified Domain** | Whether Resend reports the sending domain as verified (SPF/DKIM as Resend models it) |
| **Recommended Action** | Single next step for the operator (config, DNS, test send, or “none — healthy”) |

Status chips may continue to use existing `ProviderConnectionStatus` values (`disabled`, `configuration_required`, `sandbox`, `connected`, `production_ready`, etc.) as long as the **labels above** are visible or clearly mapped in the UI.

---

## Status resolution rules

| Condition | Display |
| --- | --- |
| `EMAIL_PROVIDER=noop` and no key | **Disabled** |
| `EMAIL_PROVIDER=resend` and missing `RESEND_API_KEY` or `EMAIL_FROM` | **Configuration required** (not Connected) |
| Key + from present, adapter live, domain not verified | **Sandbox** / Connected-with-warning — **not** Production Ready |
| Key + from + verified domain + `EMAIL_ENVIRONMENT` not production | **Sandbox** |
| All production criteria met | **Production Ready** |
| Adapter not implemented | Cap below Production Ready (current CP-004 honesty) — removed only after Implement ships |

---

## Probes

1. **Config validation** — `validateConfiguration()` (sync with env).
2. **Domains probe** — Resend Domains API (existing pattern in `provider-status.ts`) to set **Verified Domain**.
3. **Optional send probe** — only in non-destructive certification flows; never blast production lists from a health check.

Health probes must use timeouts from [03-provider-contract.md](./03-provider-contract.md) and must not log secrets.

---

## Recommended Action catalog (examples)

| Situation | Recommended Action |
| --- | --- |
| Disabled | Set `EMAIL_PROVIDER=resend` and configure `RESEND_API_KEY`, `EMAIL_FROM` |
| Missing key | Add `RESEND_API_KEY` to server environment |
| Missing from | Set `EMAIL_FROM` to a verified domain address |
| Domain unverified | Complete SPF/DKIM in Resend for the sending domain |
| Sandbox only | Keep for Design Partner demos; switch `EMAIL_ENVIRONMENT=production` only after live inbox certification |
| Last failure recent | Inspect audit `errorCode`; fix config or Resend account limits; retry test send |
| Production Ready | No action — monitor Last Success / Last Failure |

---

## UI constraints

- Extend the existing Integrations Resend row; do not invent a second Ops console in INT-303.
- Add **Verified Domain** as an explicit field (called out as missing in CP-004).
- Keep guidance copy accurate: password reset still points operators to Supabase Auth SMTP when discussing Auth recovery — not Resend.

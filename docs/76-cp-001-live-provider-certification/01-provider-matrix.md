# 01 — Provider Certification Matrix

**Package:** CP-001 · EP-012  
**Date:** 2026-07-19

Status values surfaced in Settings → Integrations:

`Production Ready` · `Connected` · `Sandbox` · `Configuration Required` · `Disabled`

---

## Matrix

| Provider | Foundation | Sandbox OK (DP) | Production Ready when | Cert method | Delivery in path? |
| --- | --- | --- | --- | --- | --- |
| **Supabase** | Platform | Dev project only | Prod project + Auth URLs + service role | Env | Yes |
| **Stripe** | API-005 | Yes (`sk_test_` / `STRIPE_MODE=sandbox`) | Live key + webhook secret + simulate off | Env + balance probe + webhook secret | Yes (when selected) |
| **Resend** | Env / roadmap INT-303 | N/A (adapter not shipped) | INT-303 + verified domain SPF/DKIM | Env + optional domains probe | **No** |
| **Twilio** | Env / roadmap INT-302 | N/A (adapter not shipped) | INT-302 + approved numbers + consent | Env + optional account probe | **No** |
| **OneSignal** | API-001 | Test app OK | Prod app + HTTPS origin + App API Key | Env + App API health | Yes (when selected) |
| **Dropbox Sign** | API-004 | Yes | Live key + webhook secret + simulate off | Env + account probe | Yes (when selected) |
| **Checkr** | API-003 | Yes | Live key + webhook secret + simulate off | Env + account probe | Yes (when selected) |
| **Google Maps** | Optional client key | Yes | Referrer-restricted prod key | Env | Presentation only |

---

## Fallback / recovery (existing workflows unchanged)

| Provider | Failure behavior | Recovery guidance |
| --- | --- | --- |
| Stripe | Noop / failed intent messaging | Set sandbox keys; review webhook secret |
| OneSignal | Push `failed` / `skipped`; in-app still works | Fix App API Key; check subscription state |
| Dropbox Sign | Noop envelope / webhook ignore | Sandbox key + webhook secret |
| Checkr | Local sandbox simulation unless `CHECKR_REQUIRE_LIVE` | Sandbox key or keep simulator |
| Resend | No outbound mail; invites in DB | Supabase Auth SMTP or waive |
| Twilio | No SMS send | Keep Disabled; communicate in UI |
| Maps | UI enrichment off | Optional key |

---

## Honest Commercial Pilot note

Resend and Twilio **credentials may be present** and probed, but **must not** be labeled Production Ready until approved delivery adapters (INT-303 / INT-302) ship. Integrations UI enforces this.

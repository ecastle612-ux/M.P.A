# 02 — Implementation Notes

**Package:** CP-001 · EP-012  
**Date:** 2026-07-19

---

## Code targets

| Area | Path |
| --- | --- |
| Status matrix + health probes | `apps/web/src/lib/integrations/provider-status.ts` |
| Integrations UI | `apps/web/src/components/settings/provider-status-center.tsx` |
| Settings page | `apps/web/src/app/(app)/settings/integrations/page.tsx` |
| Master Admin mirror | `apps/web/src/app/(app)/master-admin/providers/page.tsx` |
| Chips / banners | `apps/web/src/components/trust/provider-status-chip.tsx` |
| Trust certification | `apps/web/src/lib/trust/provider-certification.ts` (+ test) |
| Env guidance | `apps/web/.env.example`, `.env.example` |

## Probes (read-only)

| Provider | Probe |
| --- | --- |
| Stripe | `GET /v1/balance` |
| OneSignal | Existing `onesignalProvider.health()` |
| Dropbox Sign | `GET /v3/account` |
| Checkr | `GET /v1/account` |
| Resend | `GET /domains` (credentials only; no send) |
| Twilio | `GET /Accounts/{Sid}.json` (credentials only; no send) |

## Non-goals

- No Resend/Twilio send adapters  
- No workflow redesign  
- No schema changes  
- No secrets in UI or logs (sanitized probe messages)

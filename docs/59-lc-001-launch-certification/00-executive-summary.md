# LC-001 — Launch Certification

**Status:** Executed — **NO-GO**  
**Date:** 2026-07-18  
**Scope:** Close remaining P0 launch blockers. No new features / UX redesign / architecture.

## Executive Summary

LC-001 ran live certification against the linked Supabase project and current `.env.local`. **Storage and Auth infrastructure checks passed. A 100-unit portfolio was seeded and query performance is excellent.** P0 blockers for **Stripe, Dropbox Sign, Checkr, OneSignal (invalid REST key), and outbound email** remain open because sandbox credentials are missing or rejected.

**Production Readiness did not reach 9+/10.** Honest score after this run: **7.1 / 10**.

## Scores

| Score | Previous (PT-001) | LC-001 |
| --- | ---: | ---: |
| Design Partner Readiness | 8.8 / 10 | **8.8 / 10** |
| Production Readiness | 6.6 / 10 | **7.1 / 10** |

## GO / NO-GO

# **NO-GO**

LC-001 acceptance requires every P0 closed, every provider/webhook/email/push/signature/payment verified end-to-end. That bar is **not** met.

## Would you confidently recommend M.P.A. to a real PM company with 100 units?

**No — not as the sole production system of record yet.**

### Evidence for confidence (what is ready)

- Supabase Auth GoTrue healthy; email auth enabled
- Supabase Storage `media-private`: upload, signed URL, delete verified live
- 100 units / residents / leases / work orders / payments seeded in **M.P.A. Development**
- DB list/search/ops count queries at 100 units all **&lt; 4ms**
- Friendly 404 / unauthorized recovery screens verified in browser
- Trust unit tests green; `pnpm trust:certify` Auth/Storage **pass** with env loaded
- Noop adapters still exercise webhook parse + failure/idempotency paths

### Evidence against (P0 still open)

| Blocker | Status | Why open |
| --- | --- | --- |
| Stripe | **BLOCKED** | `STRIPE_SECRET_KEY` missing; `PAYMENT_PROVIDER=noop` |
| OneSignal | **FAIL** | Credentials present but REST API returns **403 Access denied** |
| Dropbox Sign | **BLOCKED** | API key + provider unset |
| Checkr | **BLOCKED** | API key + provider unset |
| Email deliverability | **BLOCKED** | No mailer; invites write `organization_invitations` only — inbox never receives |
| Auth interactive flows | **WARN** | Signup/login/reset/role-switch not fully automated this run |

## How to flip to GO

1. Add sandbox keys to `apps/web/.env.local` (do **not** paste into chat): Stripe `sk_test_`, Dropbox Sign, Checkr, valid OneSignal **REST** key, set matching `*_PROVIDER`.
2. Re-run `pnpm launch:certify` and webhook simulate paths.
3. Prove one real inbox for invite + password reset (Supabase SMTP or Resend).
4. Browser-prove login/logout/invite/role boundaries + one live push delivery.
5. Re-score — target **≥ 9.0** only after P0 table is all pass.

# Environment Verification

**Parent:** [Production Deployment Support](./index.md)  
**Schema source:** `packages/shared/src/env/base-env.ts`  
**Loaders:** `apps/web/src/lib/env/server-env.ts`, `client-env.ts`

---

## Required (must be set in production)

| Variable | Verify |
|----------|--------|
| `NEXT_PUBLIC_APP_NAME` | Customer-facing name (e.g. MPA / My Property Assistant) |
| `NEXT_PUBLIC_APP_URL` | Exact production origin (https, no trailing slash mismatch with invites) |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SESSION_COOKIE_NAME` | Stable cookie name (e.g. `mpa_session`) |

---

## Operationally required for advertised portal handoffs

| Variable | Why |
|----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Lease activation + vendor assign portal provisioning (`portal-access-service`) |

Without this key, resident/vendor first login fails. **Do not go live claiming portal access.**

---

## Optional integrations (honesty rules)

Set only when the channel is claimed for Customer #1. Otherwise leave unset and use honesty paths.

| Variable | Channel | Honesty if unset |
|----------|---------|------------------|
| `RESEND_API_KEY` | Invite / notice email | Accept link still available in app |
| `RESEND_FROM_EMAIL` | From address on a **verified** domain (`Name <email>` allowed). Production must not use `resend.dev`. If unset, Production derives `noreply@{app-host}` from `NEXT_PUBLIC_APP_URL`. | Same |
| `STRIPE_SECRET_KEY` | Resident Pay Now | Manual rent / FO path |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verify | Checkout unreliable if secret missing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout client | Same |
| `SIGNWELL_API_KEY` | E-sign send | Offline signed lease path |
| `SIGNWELL_WEBHOOK_ID` | Webhook verify | Sync unreliable if misconfigured |
| `SIGNWELL_TEST_MODE` | `"false"` only for live SignWell | Defaults to test unless `"false"` |

---

## Vercel project checks

- [ ] Production environment (not Preview) holds the vars above  
- [ ] Preview/staging use **separate** Supabase project or clearly isolated data  
- [ ] Service role key is **server-only** (never `NEXT_PUBLIC_`)  
- [ ] Production domain / auth redirect URLs include `NEXT_PUBLIC_APP_URL`  
- [ ] Supabase Auth Site URL + redirect allowlist match production  

---

## Supabase Auth / email

- [ ] Auth Site URL = production app URL  
- [ ] Redirect URLs include `/auth/callback` (and invite accept paths used in product)  
- [ ] If Resend is claimed: domain verified; test invite delivers  
- [ ] If Auth SMTP used instead of Resend for magic links: SMTP verified with a test login  

---

## Preflight commands (operator)

Do not paste secrets into chat or tickets.

1. In Vercel Production → Environment Variables: confirm each required row present.  
2. Hit a logged-out production page; confirm app boots (no env schema crash).  
3. Master Admin / operator: confirm org creation path uses production DB.  
4. With service role present: dry-provision check is covered in [Deployment Validation](./deployment-validation.md) (lease activate / vendor assign).  

---

## Record

| Field | Value |
|-------|-------|
| Prod project (Vercel) | |
| Prod Supabase ref | |
| `NEXT_PUBLIC_APP_URL` | |
| Service role present? | ☐ Yes |
| Resend claimed? | ☐ Yes ☐ No (honesty) |
| Stripe claimed? | ☐ Yes ☐ No (honesty) |
| SignWell claimed? | ☐ Yes ☐ No (honesty) |
| Verifier | |
| Date | |

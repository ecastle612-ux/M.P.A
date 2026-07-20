# 02 — Commercial Pilot Launch Checklist

**Package:** EP-017 · Use before unsupervised Design Partner / Commercial Pilot sessions on `www.my-property-assistant.com`

## Providers

- [ ] `PAYMENT_PROVIDER=stripe` with live keys + webhook secret
- [ ] Stripe webhook endpoint receiving `payment_intent.*` / settlement events
- [ ] `NOTIFICATION_PROVIDER=onesignal` + App ID + API keys
- [ ] `EMAIL_PROVIDER=resend` + API key + From / Reply-To
- [ ] Screening / e-sign providers set or explicitly waived for cohort
- [ ] Provider Health dashboard shows no unexpected Fail for required rails

## Environment

- [ ] Vercel Production env complete (Supabase, OneSignal, Stripe, Resend, app URL)
- [ ] `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com`
- [ ] `EMAIL_ENVIRONMENT=production`
- [ ] `STRIPE_MODE=live` and `STRIPE_ALLOW_SIMULATE=false`
- [ ] No secrets in client bundles (`NEXT_PUBLIC_` audit)

## Domain & SSL

- [ ] Apex → www redirect
- [ ] Valid TLS on www
- [ ] Auth callback URLs include production host

## Emails

- [ ] Resend domain verified (SPF/DKIM)
- [ ] Invite email delivers to real inbox from www
- [ ] Announcement email delivers for portal-linked or email-addressed residents
- [ ] Password reset remains Supabase Auth (not Resend)

## Push

- [ ] OneSignal app allowed origin includes production host
- [ ] Service worker registers; test push to enrolled device
- [ ] Announcement publish increments push recipients when devices exist

## Payments

- [ ] Supervised live charge succeeds once
- [ ] Webhook settles attempt → ledger payment
- [ ] Duplicate settlement blocked / idempotent
- [ ] Timeline / audit / receipt path verified

## Authentication

- [ ] Login / logout / session cookie on production host
- [ ] Invitation accept links `tenants.user_id`
- [ ] Unauthorized routes redirect cleanly

## Organization setup

- [ ] Create org → property → bulk units path
- [ ] Team invite (optional) from Settings
- [ ] Org / role switcher works for multi-org users

## Resident onboarding

- [ ] Create resident with real email
- [ ] Portal invite sent
- [ ] Accept invite → membership + `tenants.user_id`
- [ ] Tenant portal login
- [ ] No orphan residents (email without invite path documented for ops)

## Reports

- [ ] Owner Statement PDF vault + download
- [ ] Financial report (P&L) PDF vault + download
- [ ] Maintenance Summary PDF vault + download
- [ ] Reports appear in property Document Vault references

## Backups & data

- [ ] Supabase project backups / PITR posture confirmed with ops
- [ ] No destructive Master Admin reset run against pilot orgs

## Monitoring & health

- [ ] Master Admin → System Health
- [ ] Master Admin → Provider Health
- [ ] Trust / integrity certification report reviewed
- [ ] Error capture hooks enabled (no silent 500s)

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Operator | | | |
| Product | | | |
| Architect | | | |

**Pilot recommendation:** ☐ GO · ☐ GO WITH LIMITATIONS · ☐ NO-GO

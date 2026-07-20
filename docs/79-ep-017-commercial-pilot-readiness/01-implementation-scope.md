# 01 — Implementation Scope

**Package:** EP-017 · Approved

## Code changes (in-repo)

1. **Maintenance Summary** — add `maintenance_summary` to FIN-001 catalog/engine/presentation/read-sources
2. **Announcement audience** — resolve `tenants.user_id` (not only `resident_devices`) so portal-linked residents receive in-app/push and count in audience
3. **Docs** — Commercial Pilot checklist + final certification report

## Ops changes (environment)

1. Vercel Production: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ENVIRONMENT` (keep `EMAIL_PROVIDER=resend`)
2. Redeploy Production
3. Supervised Stripe live payment certification (operator-approved)
4. Master Admin session certification (`ecastle612@gmail.com`)

## Verification bar

Commercial ≥ 9.0 · Production ≥ 8.5 · Recommendation **GO** (deferred: Owner Portal, advanced AI, future report packs)

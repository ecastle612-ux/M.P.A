# ADR-018: Resend as the Primary Transactional Email Provider

## Status
Accepted

## Date
2026-07-20

## Context
M.P.A. requires production transactional email to complete INT-303 (roadmap: SendGrid / Resend) for invitations, announcement email, welcome/maintenance/owner/financial notify email channels, and general notification email. CP-004 certified that no Resend adapter exists, production uses `EMAIL_PROVIDER=noop`, and Integrations correctly refuses **Production Ready** for Resend.

Push is already decided: [ADR-017](./adr-017-onesignal-as-primary-push-provider.md) adopts OneSignal behind `NotificationProvider` and explicitly excludes email. Password reset already uses Supabase Auth (`resetPasswordForEmail`) and must not be silently moved onto a marketing/transactional vendor without a separate design.

M.P.A. standards (MHF-015, Phase 12 provider abstractions, ADR-005 domain events) forbid domain modules from calling a vendor email SDK directly.

**Numbering:** A draft brief referred to this decision as “ADR-017.” ADR-017 is already Accepted for OneSignal push; this record is **ADR-018** to preserve a unique decision index.

Authoritative design package: [docs/77-int-303-resend-email-provider](../77-int-303-resend-email-provider/README.md).

## Decision
1. Adopt **Resend** as M.P.A.’s **primary production transactional email provider** for INT-303.
2. Expose email exclusively through an **`EmailProvider`** interface (`sendEmail`, `health`, `validateConfiguration`) invoked only via an **Email Provider Registry**, selected by `EMAIL_PROVIDER`.
3. Support **`noop`** and **`resend`** modes; default remains `noop` until credentials and domain verification are in place.
4. Keep **Supabase Auth password reset outside INT-303** — Auth continues to own recovery email.
5. Map only **existing** workflows/templates listed in the INT-303 package; no new email products in this decision.
6. Treat SendGrid (and other SMTP/API vendors) as **future `EmailProvider` adapters**, not concurrent required primaries in INT-303.
7. Allow Integrations **Production Ready** for Resend only after real API sends, inbox proof, verified domain, audit, retries, and failure handling per the design package Definition of Done.

## Consequences
**Easier:** Single REST integration for transactional mail; clear parallel to OneSignal/Stripe provider patterns; honest Integrations health; CP-004 can be re-run to PASS; invites and announcement email placeholders can become real delivery without workflow redesign.

**More difficult:** Operators must verify sending domain (SPF/DKIM) in Resend; team must maintain abstraction discipline; Resend outages require reliance on in-app + push; Auth reset email remains a separate operational surface (Supabase SMTP) that must still be configured for recovery UX.

## Alternatives Considered
- **SendGrid as required primary:** Rejected as the *required* primary for INT-303; remains a valid future adapter. Resend selected for operational simplicity and current product direction while satisfying the roadmap’s “SendGrid / Resend” optionality via abstraction.
- **Application SMTP / nodemailer to arbitrary hosts:** Rejected as primary — higher ops burden and weaker unified domain/analytics story for Design Partner → Production.
- **Route all mail through Supabase Auth SMTP:** Rejected for transactional product email — Auth mailer is for identity recovery, not announcement/invite/report orchestration; coupling would blur security and product concerns.
- **Call Resend directly from each workflow module:** Rejected — violates MHF-015; blocks provider swap; inconsistent retry/audit/health.
- **Remove `noop`:** Rejected — local/CI and Design Partner cohorts must run without outbound mail or secrets.
- **Move password reset to Resend in the same package:** Rejected — changes Auth recovery architecture; requires its own Design → Document → Approve cycle.

## Migration strategy
1. **Approve** this ADR and the INT-303 design package.
2. Implement `EmailProvider` + registry + `NoopEmailProvider` + `ResendProvider` (server-only).
3. Wire existing invite, announcement email placeholders, and notify email-channel paths to `sendEmail` without redesigning those workflows.
4. Configure env: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`, `EMAIL_ENVIRONMENT`.
5. Verify domain in Resend; confirm Integrations fields including Verified Domain.
6. Certify with real inbox delivery; only then allow **Production Ready**.
7. Keep `EMAIL_PROVIDER=noop` as default in example env files until operators opt in.

## Future provider compatibility
Any new email vendor implements `EmailProvider` and registers under `EMAIL_PROVIDER=<key>`. Callers, templates keys, health field meanings, and audit shape remain stable. Dual-send / migration cutovers between vendors are a future design if needed — not INT-303.

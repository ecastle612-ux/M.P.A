# 04 — Password Reset Branding

**Package:** EML-001  
**Constraint:** Identity recovery must remain coupled to Supabase Auth (ADR-018).

---

## Decision (proposed)

| Layer | Owner |
| --- | --- |
| Token / session / `exchangeCodeForSession` | Supabase Auth + existing app recovery (EP-018) |
| **Visual HTML** of the recovery email | **Branded Auth email template** (same Canopy email system HTML) |
| SMTP transport | Prefer **Resend SMTP** (or existing Auth SMTP) configured in Supabase — not a second product mailer |

`password_reset` remains **skipped** in `sendWorkflowEmail` (no dual-send). Branding is applied in **Supabase Auth email templates**, generated from the same `renderMpaEmail` source of truth so Auth mail matches Resend mail.

---

## Implementation approach (after Approve)

1. Export `renderMpaEmail` output for template `password_reset` with Supabase placeholders:
   - `{{ .ConfirmationURL }}` (or project-equivalent) as CTA href
   - `{{ .Email }}` / `{{ .SiteURL }}` as needed
2. Publish template to Supabase Auth (Dashboard or Management API) as part of deploy/runbook — **not** via Resend `sendEmail`.
3. Document operator steps in certification: trigger `resetPasswordForEmail` → capture inbox screenshots.

## Explicit non-change

- Do not move recovery token issuance to Resend.
- Do not break EP-018 recovery session flow.

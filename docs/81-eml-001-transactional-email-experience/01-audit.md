# 01 — Audit (current Production)

**Package:** EML-001  
**Date:** 2026-07-20  
**Canonical mailer:** Resend (`EMAIL_PROVIDER=resend`) via `sendWorkflowEmail`  
**Render entry:** `apps/web/src/lib/integrations/email/render.ts`

---

## Inventory

| Template key | Sent via | Caller(s) | Current presentation | Premium? |
| --- | --- | --- | --- | --- |
| `user_invitation` | Resend | Org invitations API, resident invite, applicant invite | Thin Georgia wrapper + charcoal CTA | **FAIL** |
| `welcome_email` | Resend | `NotificationService` → `templateKeyForNotify` | Same wrapper | **FAIL** |
| `announcement_email` | Resend | `communication/server` publish path | Same wrapper | **FAIL** |
| `maintenance_notification` | Resend | `NotificationService` (category maintenance) | Same wrapper | **FAIL** |
| `owner_statement` | Resend | `financial/server` statement notify | Same wrapper | **FAIL** |
| `financial_report` | Resend | `NotificationService` (category financial) | Same wrapper | **FAIL** |
| `general_notification` | Resend | `NotificationService` catch-all | Same wrapper | **FAIL** |
| `password_reset` | **Supabase Auth** (not Resend) | `resetPasswordForEmail` | Auth default / SMTP template | **FAIL** (ADR-018) |

---

## Current HTML characteristics (before)

Source: `renderTransactionalEmail`

| Attribute | Current | Required (Priority 6) |
| --- | --- | --- |
| Brand header | Uppercase text only | Logo + branded header |
| Typography | Georgia / serif | Canopy-aligned sans (web-safe stack) |
| Primary color | `#292524` charcoal button | Brand primary `#0f6b56` |
| Logo | None | Hosted logo, controlled size (≤120px wide) |
| Footer | Template key debug string | Support + legal + product name |
| Mobile | Basic max-width 560 | Table-based / fluid responsive |
| Plain text | Minimal | Full parity fallback |
| Dark mode | None | `prefers-color-scheme` where supported |
| Accessibility | Weak | Semantic structure, CTA contrast, alt text |

Before HTML fixtures: `fixtures/before/*.html`

---

## Explicit gaps vs Priority 6

1. **Generic appearance** — INT-303 intentionally shipped “thin wrappers,” not product email design.
2. **No logo** — breaks brand trust in first viewport of the email.
3. **Password reset excluded** from Resend path — still generic Auth mail unless Auth templates are branded (see `04-password-reset.md`).
4. **Footer leaks `templateKey`** — developer artifact, not customer-facing.
5. **No client rendering certification** in INT-303 DoD for visual quality.

---

## What stays stable

- Closed `EMAIL_TEMPLATE_KEYS` set (no new keys)
- `sendWorkflowEmail` / audit / idempotency
- Preference-aware notify orchestration
- Resend as primary provider (ADR-018)

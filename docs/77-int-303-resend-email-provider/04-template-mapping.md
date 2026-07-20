# 04 — Template Mapping

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Rule:** Map **existing** workflows only. **No new templates.** No new product email types.

---

## Template keys (closed set)

| `templateKey` | Workflow | Primary caller surface today | INT-303 email behavior |
| --- | --- | --- | --- |
| `user_invitation` | User Invitation | Resident / applicant invite → `organization_invitations` insert | Send invite email with existing invite context (accept link / instructions already implied by product) |
| `password_reset` | Password Reset | `supabase.auth.resetPasswordForEmail` | **Not sent via Resend.** Documented for completeness — Supabase Auth remains the mailer |
| `welcome_email` | Welcome Email | `sendWelcomeNotifications` → `notify()` | When email channel is enabled for the recipient, send welcome content via `EmailProvider` |
| `maintenance_notification` | Maintenance Notification | Maintenance events → `notify()` | Email channel when preferred / allowed — same event payload as existing notify body |
| `announcement_email` | Announcement Email | Announcement publish; email recipient rows with `delivery_status: "placeholder"` | Replace placeholder with real `sendEmail`; update delivery status from result |
| `owner_statement` | Owner Statement | Owner statement persistence + `notify()` | Email delivery of statement notice / link using existing statement context |
| `financial_report` | Financial Report | Financial `notify()` paths | Email notice for existing financial report / summary notifications |
| `general_notification` | General Notification | Generic `notify()` when email channel applies | Catch-all for existing general notification email preference — not a new product category |

---

## Password reset (explicit)

| Item | Decision |
| --- | --- |
| Provider | **Supabase Auth** (SMTP / Auth email settings) |
| INT-303 change | **None** |
| Resend involvement | **None** |
| Certification | Do not require Resend inbox proof for password reset; do not claim Resend delivers resets |

Rationale: Auth identity recovery must stay coupled to Supabase Auth flows, redirect URLs, and rate limits. Moving reset to Resend would be a separate design package.

---

## Content rules (no new templates)

- Subjects and bodies are derived from **existing** notification titles/bodies, announcement content, or invite copy already used in-product.
- INT-303 may introduce thin HTML/text wrappers for deliverability (plain layout, unsubscribe/preference link if already part of product), but must **not** invent new marketing campaigns or template CMS.
- Localization: only what existing notify paths already provide; no new i18n system in this package.

---

## Channel interaction

| Channel | Behavior after INT-303 |
| --- | --- |
| In-app | Unchanged; still created by `NotificationService` where applicable |
| Push | Unchanged; OneSignal / `NotificationProvider` |
| Email | Real send for mapped keys when provider is `resend` and preferences allow |
| Placeholder rows | Announcement email placeholders become real delivery statuses (`sent` / `failed` / `skipped`) |

---

## Out of mapping (reject in review)

- Billing dunning sequences not already in product
- Marketing newsletters
- New “digest” products
- Vendor marketplace promotional mail
- Any template key not listed above

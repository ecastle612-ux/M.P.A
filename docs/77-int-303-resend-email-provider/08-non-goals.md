# 08 — Non-Goals

**Package:** INT-303  
**Status:** Draft — awaiting Approve

INT-303 is a **transactional email provider** package. The following are explicitly out of scope. If any item becomes required, it needs a new Design → Document → Approve cycle.

---

## Explicit exclusions

| Non-goal | Clarification |
| --- | --- |
| **No workflow redesign** | Invite, announcement, maintenance, financial, and welcome product flows keep existing UX and business rules; only the email transport becomes real |
| **No Accounting changes** | No chart of accounts, ledger, fee engine, or owner payout redesign |
| **No Maintenance changes** | No work-order state machine, vendor dispatch, or SLA redesign |
| **No Reporting redesign** | No new report builders, PDF engine replacement, or analytics product |
| **No Timeline changes** | No activity timeline schema or UX redesign |
| **No Notification redesign** | Notification Center, preference model, and push path (API-001 / ADR-017) stay as-is; INT-303 adds email transport only |
| **Password reset remains Supabase Auth** | `resetPasswordForEmail` and Auth SMTP/settings are unchanged; not routed through Resend |
| **No SMS (INT-302)** | Twilio remains a separate package |
| **No new email templates / campaigns** | Closed template set in [04-template-mapping.md](./04-template-mapping.md) |
| **No multi-provider fan-out** | One selected `EMAIL_PROVIDER` at a time |
| **No client-side Resend SDK** | Server-only adapter |
| **No schema redesign as the product** | Implementation may add minimal delivery metadata if required to replace placeholders; large new email product schemas are out of scope without a follow-on design |

---

## Reminder

CP-004 failed because the adapter was missing — not because workflows were wrong. INT-303 must not expand into a communication platform rebuild.

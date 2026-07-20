# 03 — Template Specs

**Package:** EML-001  
**Rule:** Same closed keys as INT-303. Presentation upgrade only; subjects/bodies still come from workflow callers unless noted.

---

## Shared render API (proposed)

```ts
renderMpaEmail({
  templateKey,
  title,          // H1 inside card
  previewText,    // hidden preheader
  eyebrow?,       // e.g. "Invitation"
  greeting?,
  body,           // plain text; escaped; paragraphs split on \n\n
  cta?: { label: string; href: string },
  secondaryNote?, // below CTA
  organizationName?
})
```

---

## Per-template defaults

| Key | Eyebrow | Default title | Default CTA label | Notes |
| --- | --- | --- | --- | --- |
| `user_invitation` | Invitation | You’re invited to M.P.A. | Accept invitation | Role list in body |
| `welcome_email` | Welcome | Welcome to My Property Assistant | Open your portal | Resident / org welcome |
| `announcement_email` | Announcement | (caller title) | View announcement | Body = announcement excerpt |
| `maintenance_notification` | Maintenance | (caller title) | View work order | |
| `owner_statement` | Owner statement | Your statement is ready | View statement | |
| `financial_report` | Financial | (caller title) | Open financials | |
| `general_notification` | Notification | (caller title) | Open in M.P.A. | Catch-all |
| `password_reset` | Security | Reset your password | Reset password | Auth-hosted; see `04` |

---

## CTA fallback

If `href` is missing: omit button; keep body + footer (still branded). Never invent URLs.

---

## Preview text

Derive from first 90 chars of body, or template-specific default (e.g. invitation: “Accept your invitation to join your organization on M.P.A.”).

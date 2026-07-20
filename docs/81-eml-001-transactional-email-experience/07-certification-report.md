# EML-001 — Certification Report

**Package:** EML-001 Transactional Email Experience  
**Approved:** 2026-07-20  
**Production deploy:** `dpl_DqNA61ZZUAYuyfqmpFcU8BQCfDAr`  
**Canonical host:** https://www.my-property-assistant.com  
**Verdict:** **COMPLETE WITH LIMITATIONS**

---

## Scorecard

| Template | Presentation | Live Resend delivery | Desktop / tablet / mobile render | Client inbox (Gmail/Outlook/Apple) | Result |
| --- | --- | --- | --- | --- | --- |
| Invitation | Branded Canopy layout | **sent** `b9e879c9-…` | Screenshots captured | Operator verify in inbox (EML-001b subjects) | **PASS** |
| Welcome | Branded | **sent** `89a0fcac-…` | Desktop captured | Operator verify | **PASS** |
| Announcement | Branded | **sent** `a1f13b3a-…` | Desktop captured | Operator verify | **PASS** |
| Maintenance | Branded | **sent** `1a21e1b1-…` | Desktop captured | Operator verify | **PASS** |
| Owner statement | Branded | **sent** `0e706385-…` | Desktop captured | Operator verify | **PASS** |
| Financial report | Branded | **sent** `693a9f47-…` | Desktop captured | Operator verify | **PASS** |
| General notification | Branded | **sent** `9f335d4b-…` | Desktop / tablet / mobile | Operator verify | **PASS** |
| Password reset | Branded HTML artifact + Auth placeholders | Auth-owned (ADR-018) | Desktop fixture screenshot | **Not published to hosted Auth until Management token apply** | **WARNING** |

---

## What shipped

| File | Change |
| --- | --- |
| `apps/web/src/lib/integrations/email/email-tokens.ts` | Compiled Canopy tokens |
| `apps/web/src/lib/integrations/email/render.ts` | `renderMpaEmail` premium layout (header, logo 40px, CTA, footer, plain text) |
| `apps/web/src/lib/integrations/email/delivery.ts` | Eyebrow / CTA labels (presentation only) |
| `apps/web/src/lib/integrations/email/render.test.ts` | Unit coverage |
| `supabase/templates/recovery.html` | Auth recovery template source of truth |
| `apps/web/scripts/dev/apply-supabase-recovery-template.sh` | Operator apply via Management API |
| `apps/web/scripts/dev/generate-eml001-fixtures.ts` | Before/after fixture generator |

**Not changed:** workflows, notification architecture, Resend provider behavior, password-reset token flow.

---

## Evidence

### Before / after fixtures

- `fixtures/before/*.html` — Georgia / charcoal placeholder  
- `fixtures/after/*.html` + `.txt` — Canopy layout + plain text  

### Screenshots

Under `screenshots/`:

- `before-*-desktop.png`
- `after-*-desktop|tablet|mobile.png`
- `after-password_reset-desktop.png`

### Live Resend

See `live-send-results.json` (batch `eml001c-fontfix`). Subjects prefixed `EML-001b ·` sent to operator Gmail.

### Production

Vercel Production Ready: `dpl_DqNA61ZZUAYuyfqmpFcU8BQCfDAr` aliased to `www.my-property-assistant.com`.

---

## Password reset (ADR-018)

| Step | Status |
| --- | --- |
| HTML template with `{{ .ConfirmationURL }}` | **PASS** (generated) |
| Token / session flow unchanged | **PASS** |
| Published to Supabase Auth hosted templates | **WARNING** — requires `SUPABASE_ACCESS_TOKEN` + `scripts/dev/apply-supabase-recovery-template.sh` (or Dashboard paste) |

Until applied, Auth continues sending the previous Auth template. App recovery UX (EP-018) remains intact.

---

## Readiness impact

| Track | Impact |
| --- | --- |
| Design Partner | **Improved** — invite / notify / statement mail now match product brand |
| Production | **Improved** — Resend path branded on Production deploy |
| Commercial | **Improved with limitation** — close Auth recovery template publish for full PASS |

---

## Operator follow-ups

1. Open Gmail (and optionally Outlook / Apple Mail) for `EML-001b ·` messages; confirm logo, CTA, mobile layout.  
2. Apply recovery template:

```bash
export SUPABASE_ACCESS_TOKEN=…   # from https://supabase.com/dashboard/account/tokens
bash apps/web/scripts/dev/apply-supabase-recovery-template.sh
```

3. Trigger forgot-password once and confirm branded recovery mail.

---

## Explicit non-regressions

- No template keys in customer-visible footer  
- No Georgia placeholder styling  
- Plain-text fallback present  
- Password reset not routed through Resend  

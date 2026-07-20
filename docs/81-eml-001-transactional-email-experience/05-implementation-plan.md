# 05 — Implementation Plan

**Package:** EML-001  
**Status:** Locked until Approve

---

## Code changes (post-Approve)

| Area | Work |
| --- | --- |
| `lib/integrations/email/render.ts` | Replace thin wrapper with `renderMpaEmail` layout system |
| `lib/integrations/email/templates/*` | Optional split: layout + per-key copy helpers |
| `delivery.ts` | Pass richer title/eyebrow/cta label; stop leaking templateKey to users |
| Unit tests | Snapshot HTML/text for each key; escape tests |
| Fixtures | `fixtures/after/*.html` for visual review |
| Auth | Publish password-reset HTML to Supabase Auth templates |
| Docs | ADR note amending INT-303 “thin wrapper” non-goal for presentation |

## Logo hosting

- Prefer PNG for Outlook: `${APP_URL}/icons/icon-192.png` or dedicated `email-logo.png` ≤40KB
- SVG only where clients support; dual `<img>` with PNG primary

## Live Resend E2E (required)

For each template key (except Auth reset):

1. Send via Production Resend to a controlled inbox
2. Capture Gmail web, Outlook web/desktop if available, Apple Mail / iOS
3. Store screenshots under `screenshots/after/`

Password reset: Auth trigger → same client matrix.

## Definition of done

- [ ] All Resend templates use branded layout
- [ ] Plain text fallback present
- [ ] No templateKey in visible footer
- [ ] Logo sized correctly (not oversized)
- [ ] CTA contrast + single primary action
- [ ] Live Resend proofs for each key
- [ ] Auth reset branded
- [ ] Certification report with before/after

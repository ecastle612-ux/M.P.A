# UI / Email Visual Polish

**Status:** Implemented (visual / presentation only)  
**Date:** 2026-08-17  
**Gate:** Canopy approved; no new product pattern; no money / billing / permission / schema change

---

## Major visual issues found

- Customer Resend emails used a placeholder `<html><h1>` body with no logo, CTA button, or footer.
- Status badges were square chips instead of consistent pills.
- Forms (Add Tenant, team invite) lacked required/optional labels and shared field chrome.
- Mission Control glance metrics were one-off boxes instead of a shared metric card.
- Tenant Portal copy still sounded like a staff summary in moved-out / pre-move-in states.
- Team membership list showed truncated user IDs.
- PWA install card used unofficial token aliases.

Auth SMTP templates (password reset, confirm email, `inviteUserByEmail`) remain on Supabase Auth SMTP and were **not** changed.

---

## Design system changes

Preserved Canopy: forest teal `#0F6B56`, ink `#12151A`, mist grey surfaces. No new blue system.

| Pattern | Change |
|---------|--------|
| Badge | `rounded-full` status pills |
| Card / empty state | Slightly calmer radius, border, and muted fill |
| Input / select / textarea | `h-10` + `rounded-md` |
| Modal | Visible close focus ring; dialog close label |
| `FormField` | Required/optional + hint + error |
| `MetricCard` | Shared glance / metric treatment |
| `TableScroll` | Horizontal overflow wrapper |

---

## Pages polished

- PM Mission Control glance metrics
- Facility Mission Control glance cards
- Complete launcher capability cards
- Tenant Portal welcome / occupancy copy
- Tenant PWA install card
- Add Tenant
- Add Property wizard
- Move Out
- Team invite
- Accept invitation
- Tenant maintenance / messages copy

No FIN-OPS money, Stripe, SKU, subscription, or authorization logic changed.

---

## Email template system

Reusable `renderBrandedEmail()` / `renderFoundationEmail()`:

- Official `logo-dark.png` from `https://www.my-property-assistant.com` (never localhost / `vercel.app`)
- Logo sits on a dedicated white `mpa-logo-plate` (`bgcolor="#FFFFFF"`) so Gmail dark mode does not drop a navy mark onto a dark page
- `color-scheme: light only` + `supported-color-schemes: light` + Outlook `[data-ogsc]` plate lock
- Alt text + “M.P.A. / My Property Assistant” text fallback
- White content card, ink headline, Canopy green CTA
- Plain-text fallback link
- Footer with product name, support/product line, copyright year
- Table layout, inline CSS, no remote fonts, no animation

Delivery safety unchanged: `resolveResendSender()`, `EMAIL_FROM` fallback, `provider_accepted`, sent/failed/skipped, idempotency keys.

### Templates updated

| Template | Subject / CTA |
|----------|----------------|
| Tenant invitation | You’ve been invited to M.P.A. / Accept Invitation |
| Staff invitation | You’ve been invited to help manage [org] / Accept Invitation |
| Vendor invitation | You’ve been invited to work with [org] / Accept Invitation |
| Work-order / vendor / emergency | Customer-facing subject + Open Work Order / Vendor Portal |
| Tenant conversation | New message from your property team / Open Message |
| Operational notice | Staff-written subject + Open M.P.A. |
| SaaS provisioning | Existing meaning + branded CTA |
| SaaS billing lifecycle | Existing meaning + branded CTA |

---

## Controlled email UAT

Sent only to the Product Owner inbox (`ecastle612@gmail.com`) on 2026-08-17. No customer emails.

These were **renderer visual UAT** via Resend from the verified Production sender. They did **not** create Production invitations or work orders. Accept links are sample URLs.

| Template | Resend ID | From | Status |
|----------|-----------|------|--------|
| Tenant invitation | `35769e6b-e980-4af6-be1e-478d1dcb7f5f` | `My Property Assistant <noreply@my-property-assistant.com>` | **delivered** |
| Staff invitation | `cc992c49-8fa4-42d8-bc30-934273b3b37d` | same | **delivered** |
| Work-order assignment | `505ce588-1b2b-4df5-9f74-63f3cd6bd697` | same | **delivered** |

Checked in provider payload: logo URL is Production `logo-dark.png`, Canopy green CTA `#0F6B56`, fallback link present, no UUIDs/capability keys. `delivered` is Resend/SES delivery status, not an app-path invitation trigger.

App-path UAT (click Team / Add Tenant in Production after merge) remains a Product Owner step.

---

## Dark-mode logo fix (2026-08-17)

Gmail mobile dark mode painted the official navy `logo-dark.png` onto an inverted page background.

**Shell change only** (`packages/email/src/shell.ts`): wrap the existing Production logo in a white `mpa-logo-plate` table (`bgcolor="#FFFFFF"`, padding, centered, 8px radius). Force `color-scheme: light only` / `supported-color-schemes: light`. Keep Canopy green CTA, fallback links, and `logo-dark.png`. All Resend templates inherit this.

Renderer tests: 8 passed in `@mpa/email` (logo plate + Production `logo-dark.png` + unchanged CTA). Implementation SHA `ca04d86d`.

Controlled UAT (one email, Product Owner only, no invitation record): Resend `5a9b478b-999f-4251-b593-924116e68ce8` from `My Property Assistant <noreply@my-property-assistant.com>` to `ecastle612@gmail.com` — **delivered**. Subject `[UAT] Email logo plate — Gmail dark mode`. Confirm the white logo card in Gmail mobile dark mode.

**Production SHA:** not released from this agent.

---

## Public landing information update (2026-08-17)

Copy and light visual polish only. No new design/certification chain. Prices and Stripe products unchanged (`$59` / `$59` / `$109` from `PUBLIC_PRICING_MODEL_COPY`).

### Sections updated

- Hero: what M.P.A. is; primary Get Started; secondary “See which plan is for me”
- Who it is for / problem / what it does
- Tenant experience (browser-first portal, optional add-to-phone, no store apps)
- Product fit cards: Property Operations, Facility Operations, Complete (one org / one subscription)
- How to get started, comparison, pricing cards, trust, FAQ

### Inaccurate / outdated claims removed

- “Rent collection” / “collections” as live Financial Operations marketing
- Billing framed as if tenant card checkout were live
- Complete implied as combining two products without stating one organization
- Owner portal listed as a peer live portal in the Property Manager SKU blurb
- Glue-work copy that overstated connected billing execution

### Honest claims added

- Tenant Portal, digital invitations, move-out history, payment history where supported
- Optional phone install (Add to Home Screen / supported Android browsers)
- Operational finance without automated late fees, collections, or live tenant card checkout
- Email for invitations, work orders, conversations, and lifecycle notices — not every in-app event; no phone push

### Product-decision flag (not expanded)

Tenant Portal still has an in-app “Pay rent” surface gated by `onlinePaymentsEnabled`. Marketing does not advertise live Stripe tenant payment execution. Changing that in-app label is a Product Owner decision, not this copy patch.

---

## Remaining visual backlog

- Dense FIN-OPS tables (visual only; not in this package)
- Auth SMTP HTML (separate system)
- Broader form rewrite of every create-work / asset / stock wizard
- In-app Tenant Portal “Pay rent” wording while card checkout remains disabled (product decision)

---

## Tests / release

Local verification (2026-08-17), implementation SHA `d639ebc0`:

| Suite | Result |
|-------|--------|
| `@mpa/email` branded shell + invitation copy | 7 passed |
| Email / invitation / conversation / lifecycle / PWA / tenant lifecycle / PLAT-002 / PLAT-005 / PLAT-006 | 71 passed |
| PM / FO / Complete authz + ADR-033 operating scope + entitlements | 77 + 65 passed |
| Finance (web + shared) | 42 + 19 passed |
| Mission Control / Complete launcher presentation | 10 passed |
| Lint (`web`, `email`, `ui`) | passed |
| Typecheck (`web`, `email`, `ui`) | passed |
| Production `next build` (CI env placeholders) | passed, 174 routes |

PR: https://github.com/ecastle612-ux/M.P.A/pull/279 (CI `verify` passed)

**Not released from this agent:** merge and Production promote. This environment cannot merge PRs.

**Deployed SHA:** not released. Implementation HEAD `9be871ab`.

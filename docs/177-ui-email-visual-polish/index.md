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
- Team invite
- Accept invitation

No FIN-OPS money, Stripe, SKU, subscription, or authorization logic changed.

---

## Email template system

Reusable `renderBrandedEmail()` / `renderFoundationEmail()`:

- Official `logo-dark.png` from `https://www.my-property-assistant.com` (never localhost / `vercel.app`)
- Alt text + “M.P.A. · My Property Assistant” text fallback
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

Send only to the Product Owner inbox after Production deploy. Do not send to customers.

1. Team invitation  
2. Tenant invitation  
3. Work-order assignment if safely triggerable  

Check: sender, logo, brand color, CTA, mobile, fallback link, no internal IDs, honest delivery status.

---

## Remaining visual backlog

- Public marketing pages beyond login/accept
- Dense FIN-OPS tables (visual only; not in this package)
- Auth SMTP HTML (separate system)
- Broader form rewrite of every create-work / asset / stock wizard

---

## Tests / release

See the pull request for lint, typecheck, targeted suites, Production build, and deployed SHA after release.

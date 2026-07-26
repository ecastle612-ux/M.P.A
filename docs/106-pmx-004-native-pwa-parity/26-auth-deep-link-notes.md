# 26 — Auth / deep-link notes (PMX-004 Phase 4)

**Package:** PMX-004 · Phase 4 Standalone Compliance  
**Status:** Documented under Phase 4 implementation  
**Related:** [10 — Standalone Exit Inventory](./10-standalone-exit-inventory.md) §3 · [25 — Phase 4 Authorization](./25-phase-4-authorization.md) P4-08

> No AUTH-001 behavior changes. No Universal Links / App Links in Phase 4.

---

## Flows

| Flow | Standalone risk | Phase 4 disposition |
|------|-----------------|---------------------|
| Password login | Low | Unchanged — in-app `/login` |
| Invite / accept invitation | Opens mail client → Safari/Chrome | Email CTAs use absolute `NEXT_PUBLIC_APP_URL` HTTPS links (`lib/integrations/email/render.ts`). User may land in browser instead of installed PWA on iOS — reopen from Home Screen after completing invite/reset. |
| Password reset | Same as invite | Same HTTPS app URLs; document iOS reopen |
| Push deep links | Medium | Absolute URLs via OneSignal + `NEXT_PUBLIC_APP_URL` — Phase 6 verifies delivery matrix |
| E-sign return | Provider exit | Same-window `location.assign` after confirm (LeaveAppConfirm); return to progress route |
| Stripe return | Unavoidable exit | Absolute success/cancel/return URLs → app; `ReturnToMpaBanner` on Payments / Billing |

---

## Product guidance (support / release notes)

1. After invite or password-reset email, iPhone users who installed M.P.A. may finish the flow in Safari.  
2. Advise: return to the Home Screen icon to continue in the standalone app (session cookies usually persist for the same site).  
3. Universal Links / App Links are **out of Phase 4 scope**.

---

## Preservation

- AUTH-001 invite / reset / login routes and APIs unchanged.  
- Email templates retain `target="_blank"` in the mail client (E15 — expected for HTML email; not an in-app PWA exit).

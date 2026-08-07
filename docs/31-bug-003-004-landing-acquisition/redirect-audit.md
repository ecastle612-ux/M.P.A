# Redirect Audit — BUG-003 / BUG-004

**Date:** 2026-08-07  

---

## Public acquisition (no auth redirects)

| From | Action | To | Redirect? |
|------|--------|----|-----------|
| `/` | Choose Modules / Get Started | `/modules` | Link |
| `/modules` | Compare & continue | `/pricing?intent=<sku>` | Link |
| `/modules` | Skip to checkout | `/checkout?intent=<sku>` | Link |
| `/pricing` | Checkout plan | `/checkout?intent=<sku>` | Link |
| `/checkout` | Create account | `/login?mode=sign_up&intent=<sku>` | Link |
| `/` Sign In | — | `/login` | Link |
| `/` Customer Portal | anonymous | `/portal` → middleware **307 `/login`** | Auth gate |

---

## Post-account (existing pipeline)

| From | To | Mechanism |
|------|----|-----------|
| Login success | `next` or `/dashboard` | Client router |
| `/dashboard` unauth | `/login` | Middleware + page |
| `/dashboard` auth | `resolvePostAuthHome` | Server redirect |
| No SKU / incomplete setup | `/setup` | Entitlement / post-auth |
| Guided Setup finish | `/pm/mission-control` | Existing setup completion |

---

## Protected prefixes unchanged

Middleware still protects `/dashboard`, `/pm/*`, `/facility/*`, `/portal/*`, `/admin/*`, `/setup`, `/billing`, `/settings/*`, etc.

Public additions **not** in matcher: `/`, `/modules`, `/pricing`, `/checkout`.

---

## Verdict

No anonymous visitor is forced into authentication before plan selection or checkout confirmation.

# 03 — Company Admin Experience

**Package:** BILL-001  
**Status:** Approved · Phase B implementing  
**Surface:** Settings → Billing (org admins with `saas:read` / `saas:manage`)

---

## Must provide

| Capability | UX |
|------------|----|
| Current Plan | Plan name, status badge (`trialing` / `active` / `past_due` / `canceled` / suspended) |
| Renewal Date | Current period end |
| Billing History | List of invoices with status + amounts |
| Invoices | Open hosted invoice URL / PDF |
| Payment Method | Summary + change via Customer Portal (card data never stored in M.P.A.) |
| Usage | Properties / seats vs plan limits (**enforced** Phase C) |
| Upgrade | Checkout (new) or Portal plan change (existing) |
| Downgrade | Via Portal with confirmation of price / effective date / proration |
| Cancel | **In-app** cancel at period end (confirm → API); access until period end — see [21](./21-amendment-in-app-cancel-at-period-end.md) |
| Founder protection | High-visibility confirm before leaving Founder pricing (including cancel; type `LEAVE FOUNDER`) |
| Stripe Customer Portal | Primary self-serve for PM, invoices, plan change, reactivate — **not** required for cancel |

---

## Flows

1. **No subscription** → CTA “Start trial / Subscribe” → Stripe Checkout (subscription mode)  
2. **Has subscription** → Plan card + usage + invoice table + Portal for PM / plan change  
3. **Cancel** → In-app confirm → `POST /api/saas` `action: "cancel"` → `cancel_at_period_end`; badge until period ends  
4. **Past due** → Banner + Portal deep link; non-billing features may enter grace/restrict per [10](./10-failure-handling.md)

**Amendment status:** In-app cancel is **Approved** ([21](./21-amendment-in-app-cancel-at-period-end.md)).

---

## Auth vs billing

Company Admin must already be authenticated and authorized for the org. Billing UI never replaces login; it only manages SaaS subscription for that org.

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
| Usage | Properties / units / residents vs plan limits (tracking now; enforcement Phase C) |
| Upgrade | Checkout (new) or Portal plan change (existing) |
| Downgrade | Via Portal with confirmation of price / effective date / proration |
| Cancel | Cancel at period end via Portal; access until then |
| Founder protection | High-visibility confirm before leaving Founder pricing |
| Stripe Customer Portal | Primary self-serve for PM, invoices, cancel |

---

## Flows

1. **No subscription** → CTA “Start trial / Subscribe” → Stripe Checkout (subscription mode)  
2. **Has subscription** → Plan card + usage + invoice table + “Manage billing” (Portal)  
3. **Past due** → Banner + Portal deep link; non-billing features may enter grace/restrict per [10](./10-failure-handling.md)

---

## Auth vs billing

Company Admin must already be authenticated and authorized for the org. Billing UI never replaces login; it only manages SaaS subscription for that org.

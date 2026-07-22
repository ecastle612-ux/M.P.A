# 03 — Company Admin Experience

**Package:** BILL-001  
**Status:** Draft — Ready for Approval  
**Surface:** Settings → Billing (org admins with `saas:read` / `saas:manage`)

---

## Must provide

| Capability | UX |
|------------|----|
| Current Plan | Plan name, status badge (`trialing` / `active` / `past_due` / `canceled`) |
| Renewal Date | Current period end |
| Billing History | List of invoices with status + amounts |
| Invoices | Open hosted invoice URL / PDF |
| Payment Method | Last4 / brand summary; change via Customer Portal |
| Usage | Properties / users vs plan limits |
| Upgrade | Checkout or Portal plan change |
| Downgrade | Scheduled at period end (preferred) or immediate with confirmation |
| Cancel | Cancel at period end; access until then |
| Stripe Customer Portal | Primary self-serve for PM, invoices, cancel |

---

## Flows

1. **No subscription** → CTA “Start trial / Subscribe” → Stripe Checkout (subscription mode)  
2. **Has subscription** → Plan card + usage + invoice table + “Manage billing” (Portal)  
3. **Past due** → Banner + Portal deep link; non-billing features may enter grace/restrict per [10](./10-failure-handling.md)

---

## Auth vs billing

Company Admin must already be authenticated and authorized for the org. Billing UI never replaces login; it only manages SaaS subscription for that org.

# 06 — Money & Invoice Flow

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Lifecycle

```
Org created
  → (optional) start Checkout trial / paid
  → Stripe Customer (saas) + Subscription
  → Local saas_customers / saas_subscriptions mirror
  → Entitlements on
  → Recurring Invoice (Stripe)
  → invoice.paid → mirror saas_invoices; renew period
  → (optional) upgrade / downgrade / cancel via Portal or API
  → Terminal: canceled / unpaid
```

---

## Money path (SaaS only)

- Payer: Organization (PM company)  
- Collector: M.P.A. platform Stripe account (Billing)  
- Not resident rent; not Connect destination charges  

Application fees on rent (API-005/FIN-003) are **not** SaaS subscription revenue and must not be double-counted in MRR.

---

## Proration

Default: Stripe automatic proration on upgrades; downgrades at period end unless Product chooses immediate. Documented in Portal / change-plan API.

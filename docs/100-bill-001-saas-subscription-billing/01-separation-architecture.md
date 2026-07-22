# 01 — Separation Architecture

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Three Stripe rails

```
┌─────────────────────────────────────────────────────────────┐
│                     M.P.A. Platform                         │
├─────────────────┬───────────────────┬───────────────────────┤
│  SaaS Billing   │  Tenant Payments  │  Owner Payouts        │
│  (BILL-001)     │  (API-005)        │  (FIN-003)            │
├─────────────────┼───────────────────┼───────────────────────┤
│ Stripe Billing  │ Stripe Payments   │ Stripe Connect        │
│ Org Customer    │ Resident Customer │ Express accounts      │
│ Subscriptions   │ PaymentIntents    │ Destination + xfer    │
│ saas_* tables   │ payments / ledger │ connect_* / payout_*  │
│ /webhooks/saas  │ /webhooks/payments│ /webhooks/connect     │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## Hard rules

1. **No shared write path** — SaaS never writes to rent or Connect money tables.
2. **No shared webhook secret/route** — dedicated SaaS endpoint + secret.
3. **No shared Stripe Customer id** for org SaaS vs resident rent.
4. **Product naming** — Stripe Products for SaaS prefixed `mpa_saas_*`; rent products stay in payments catalog if any.
5. **Code layout** — `lib/saas/` + `lib/integrations/saas-billing/`; do not extend `billing/server.ts` (API-005) for SaaS.

---

## Same Stripe account (v1)

v1 may use one Stripe platform account with logical separation. Dual Stripe accounts are an optional hardening path (not required for Approve).

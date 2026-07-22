# 00 — Executive Summary

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Goal

Enable property management companies to pay M.P.A. via **Stripe Billing** (Products, Prices, Subscriptions, Invoices, Customer Portal), with trials and commercial tiers, while keeping SaaS fees completely separate from tenant rent (API-005) and owner payouts (FIN-003).

---

## In scope

- Stripe Billing catalog: Free Trial, Founder, Professional, Business, Enterprise (monthly + annual)
- One subscription per organization
- Company Admin: current plan, renewal, invoices, payment method, usage, upgrade/downgrade/cancel, Customer Portal
- Master Admin: MRR, ARR, active companies, trials, founder accounts, past due, canceled, churn, revenue, failed subscription payments
- Entitlements gated by subscription (not Auth)
- Dedicated SaaS webhooks and `saas_*` data model
- Certification of subscribe / trial / change / fail / portal flows

---

## Out of scope

- Tenant rent PaymentIntents / Elements / ledger (API-005)
- Owner Connect onboarding / payouts (FIN-003)
- Mixing SaaS Customers with resident `payment_customers`
- Replacing Auth/AuthZ with billing checks
- Complex metered usage billing (may come later)
- Marketing site pricing redesign beyond functional Checkout

---

## Success

**PASS** only when a PM company can subscribe and renew via Stripe Billing with zero side effects on tenant payments or owner payouts, and P0 certification scenarios S01–S12 pass.

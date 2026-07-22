# 11 — Implementation Phases

**Package:** BILL-001  
**Status:** Approved · Phase A in progress  
**Rule:** No phase until package **Approved** + ADR-024 **Accepted**. No skipping.

---

## Phase A — Foundation

- `saas_*` schema + capabilities  
- `SaasBillingProvider` + Stripe + noop  
- Webhook ingress (subscription + invoice)  
- Ensure customer + mirror subscription  

**Exit:** Sandbox Checkout creates mirrored `saas_subscriptions`.

---

## Phase B — Company Admin Billing UX

- Settings → Billing  
- Current plan, renewal, invoices, usage  
- Checkout upgrade + Customer Portal  
- Cancel / downgrade policy  
- Founder leave confirmation  

**Exit:** Admin can self-serve billing in sandbox.  
**Status:** Implementing after Phase A commercial PASS.

---

## Phase C — Entitlements

- Plan limits enforcement  
- Grace / past_due behavior  
- Founder grant path (Master Admin)  

**Exit:** Hard blocks respected in create-property / invite flows.

---

## Phase D — Master Admin SaaS metrics

- MRR/ARR/trials/past_due/churn APIs  
- ADMIN-003 Sales workspace cards  

**Exit:** HQ sees SaaS health.

---

## Phase E — Certification & production

- Execute [12](./12-certification-plan.md)  
- Production prices + webhook + portal branding  
- PASS only if SaaS flows do not touch rent/Connect  

---

## Explicit deferrals

- Dual Stripe accounts (optional later)  
- Complex metered billing  
- Public marketing pricing page redesign (Canopy) beyond functional Checkout

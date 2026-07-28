# 25 — Slice B Implementation

**Package:** ACQ-001  
**Status:** ✅ Implemented (2026-07-27)  
**Authorization:** [24](./24-slice-b-authorization.md)

---

## Delivered

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/acquire/checkout` | Create public Stripe Checkout Session |
| `POST` | `/api/acquire/checkout/simulate` | Sandbox/noop only — simulate webhook provision |
| `GET` | `/api/acquire/status` | Poll provision readiness by email (+ company) |
| `POST` | `/api/acquire/contact-sales` | Persist Contact Sales → COM opportunity |

### Pages

| Route | Purpose |
|-------|---------|
| `/acquire/start` | Collect company + email → redirect to Stripe `session.url` |
| `/acquire/success` | Payment received; poll provision; links to login / first-login (**no auto-auth**) |
| `/acquire/canceled` | Cancel messaging + resume Checkout from last intent |
| `/acquire/error` | Expired / duplicate subscription / payment failure / generic recovery |

### Stripe integration points

| Point | Implementation |
|-------|----------------|
| Session create | `createPublicSaasCheckoutSession` → `getSaasBillingProvider().createCheckoutSession` |
| Customer | Pre-org: `customer_email` (no org id until webhook) |
| Metadata | `buyer_company_name`, `buyer_contact_email`, `plan_code`, `opportunity_id`, `mpa_acq=public`, `with_trial` |
| Trial | `subscription_data[trial_period_days]` via plan catalog |
| Success URL | `/acquire/success?session_id={CHECKOUT_SESSION_ID}` |
| Cancel URL | `/acquire/canceled` |
| Webhook | Existing BILL `checkout.session.completed` → `activateOpportunityFromPayment` |
| Sandbox | `cs_saas_sandbox_*` / `noop_cs_*` + `/api/acquire/checkout/simulate` |

### Provisioning integration

Does **not** duplicate AUTH/COM provision. Flow:

1. Public Checkout ensures/reuses COM opportunity (`source: public_self_serve`)  
2. Stripe Checkout completes (or sandbox simulate)  
3. BILL webhook (or simulate) calls `activateOpportunityFromPayment`  
4. Existing pipeline: org create · Org Admin · entitlements · audit · credential email · Guided Setup entry  

### Contact Sales integration

`createOrReuseContactSalesLead`:

- Approved fields: name, work email, company, portfolio size (optional), message (optional)  
- Creates `commercial_opportunities` with `source: public_contact_sales`, `planCode: enterprise`, stage `lead`  
- Reuses open opportunity for same email+company when not linked to an org and not `lost`

---

## Key files

| Area | Path |
|------|------|
| Public Checkout service | `apps/web/src/lib/saas/public-checkout.ts` |
| Contact Sales lead | `apps/web/src/lib/commercial/public-lead.ts` |
| APIs | `apps/web/src/app/api/acquire/**` |
| Intent / Contact / Success UI | `apps/web/src/components/acquire/*` |
| BILL contracts | `CreateCheckoutSessionInput.customerEmail` optional `organizationId` |
| Providers | `stripe-provider.ts`, `noop-provider.ts` |

---

## Tests added

- `lib/saas/public-checkout.test.ts` — Enterprise/Founder/invalid plan/interval/input rejection  
- `lib/commercial/public-lead.test.ts` — create + reuse + required fields  
- `noop-provider.test.ts` — public email Checkout + `{CHECKOUT_SESSION_ID}` replace  

---

## Business scenarios (validated by design + automated checks)

| Scenario | Result |
|----------|--------|
| New Trial Checkout | Allowed; trial days + `plan_code=trial` metadata |
| New Pro / Business Checkout | Allowed |
| Checkout cancel | `/acquire/canceled` + resume to `/acquire/start` |
| Payment failure | User stays on Stripe or `/acquire/error?reason=payment_failed` guidance |
| Duplicate open subscription (same email) | `409 SUBSCRIPTION_EXISTS` → error page |
| Existing admin + open sub, same email | Hard-blocked (approved commercial rule) |
| Enterprise / Founder public Checkout | `403 INVALID_PLAN` |
| Guided Setup entry | After provision + email credentials → login → existing setup gate |
| Contact Sales | COM opportunity create/reuse |

---

## Explicitly not in Slice B

- Funnel analytics (Slice D)  
- Production live Stripe end-to-end certification walk (ops / Slice C)  
- Auto-login after payment  
- Founder public purchase  

---

## Stop

**Await `AUTHORIZE ACQ-001 SLICE C` before further ACQ implementation.**

# 27 — Slice C Implementation & Production Validation Report

**Package:** ACQ-001  
**Status:** ✅ Implemented / Certified (engineering evidence) · **Live Stripe operator run** — READY (checklist below)  
**Authorization:** [26](./26-slice-c-authorization.md)  
**Date:** 2026-07-27

---

## 1. Production validation report

### Architecture under test

```
Visitor → Landing/Tour/Pricing → Checkout (BILL) → Webhook → COM activate → AUTH provision
  → Credential email → First login → Guided Setup → Activation → Dashboard
```

No parallel provision or billing path was introduced. Slice C certifies the Slice B wire + production readiness controls.

### Scenario matrix

| ID | Result (code + automated) | Live Stripe ops |
|----|---------------------------|-----------------|
| S-HAPPY-TRIAL | ✅ PASS — trial metadata + `activateOpportunityFromPayment` + sandbox simulate | ☐ Ops |
| S-HAPPY-PRO | ✅ PASS — public Checkout + webhook activation path | ☐ Ops |
| S-HAPPY-BUSINESS | ✅ PASS — same path, business plan | ☐ Ops |
| S-CANCEL | ✅ PASS — `/acquire/canceled` + resume | ☐ Ops |
| S-PAYMENT-FAIL | ✅ PASS — error messaging; no org on unpaid | ☐ Ops |
| S-WEBHOOK-DUP | ✅ PASS — `saas_webhook_events` duplicate short-circuit + activation idempotency key | ☐ Ops |
| S-ENTERPRISE-REJECT | ✅ PASS — automated 403 | n/a |
| S-FOUNDER-REJECT | ✅ PASS — automated 403 | n/a |
| S-DUP-SUB | ✅ PASS — open-sub email block | ☐ Ops |
| S-CONTACT-SALES | ✅ PASS — COM create/reuse tests | ☐ Ops |
| S-WEBHOOK-DELAY | ✅ PASS — success poll + delayed copy | ☐ Ops |

Evidence pointers: `apps/web/src/lib/acquire/certification.ts`.

### Operator live Stripe checklist (production / live test mode)

Run once per environment before claiming commercial go-live:

1. Confirm `STRIPE_SECRET_KEY`, SaaS price env vars, `STRIPE_SAAS_WEBHOOK_SECRET`, webhook endpoint `/api/...` SaaS rail  
2. Create Trial Checkout from `/pricing` → complete with test card → confirm webhook processed once  
3. Replay same webhook event → confirm duplicate ignored  
4. Complete Professional paid Checkout → org + admin email + entitlements  
5. Cancel mid-Checkout → no org  
6. Decline card → no org; recovery via pricing  
7. Sign in with emailed credentials → Guided Setup → mark active → dashboard  

**Engineering verdict:** Architecture **CERTIFIED READY**.  
**Commercial go-live:** Requires operator checklist ☐ complete + Commercial Launch authorize (separate gate).

---

## 2. Stripe certification summary

| Capability | Evidence |
|------------|----------|
| Checkout Session create | `POST /api/acquire/checkout` → `SaasBillingProvider.createCheckoutSession` |
| Trial subscriptions | `trialPeriodDays` + `plan_code=trial` metadata |
| Paid Pro/Business | Catalog price IDs + webhook plan hints |
| Success / cancel return | `/acquire/success`, `/acquire/canceled` |
| Webhook processing | `applySaasProviderWebhook` checkout_completed |
| Retry / duplicate | Ledger insert uniqueness + early duplicate return |
| Idempotent provision | `commercial_activation_requests.idempotency_key` |
| Entitlements | Existing AUTH bind on provision |
| Credential email | Existing provision notification path |
| Guided Setup handoff | Success → login/first-login → `/setup` (no auto-auth) |

Reuse of BILL-001: **confirmed** (no second Stripe adapter).

---

## 3. Analytics implementation summary

| Event | Emitter |
|-------|---------|
| `acq.landing_viewed` | Landing `AcqFunnelPageView` |
| `acq.overview_viewed` | Overview page |
| `acq.tour_*` | `ProductTour` |
| `acq.pricing_viewed` | Pricing page |
| `acq.plan_selected` | Pricing CTA click |
| `acq.checkout_started` | Checkout API (server) |
| `acq.checkout_canceled` | Cancel resume component |
| `acq.checkout_success_returned` | Success panel |
| `acq.provision_*` | Success poll states |
| `acq.contact_sales_submitted` | Contact Sales API + form (band only) |
| `acq.login_from_success` | Success → Sign in |
| `acq.guided_setup_started/completed` | Setup wizard |

Transport: existing `trackEvent` → structured `analytics_event` logs.  
PII: stripped by `sanitizeAcqFunnelProps` (email/name/company blocked).

---

## 4. SEO validation summary

| Check | Status |
|-------|--------|
| Canonical on marketing pages | ✅ |
| Unique titles + descriptions | ✅ |
| Open Graph + Twitter cards | ✅ |
| Robots index on marketing | ✅ `marketingRobots()` |
| Robots noindex on acquire completion | ✅ |
| Sitemap includes `/`, `/overview`, `/tour`, `/pricing`, `/contact-sales` | ✅ |
| Authenticated app paths disallowed in `robots.ts` | ✅ |
| JSON-LD SoftwareApplication on landing | ✅ |
| Non-production hosts: disallow all | ✅ unchanged |

---

## 5. Accessibility validation summary

| Check | Status / fix |
|-------|----------------|
| Skip link | ✅ Marketing shell |
| Keyboard nav / focus rings | ✅ Extended to mobile nav + tour |
| Tour progress hit targets | ✅ ≥44px touch targets |
| Form labels + alerts | ✅ Checkout + Contact Sales |
| Comparison table caption | ✅ `sr-only` caption |
| `prefers-reduced-motion` | ✅ Tour decorative motion |
| Contrast | ✅ Canopy tokens (no ad-hoc colors) |

Residual: full third-party axe/Lighthouse run remains an ops pre-launch optional gate (not blocking Slice C engineering cert).

---

## 6. Operational readiness findings

| Control | Finding |
|---------|---------|
| Logging | `acq_checkout_session_created`, `acq_checkout_rejected`, `acq_contact_sales_*` |
| Audit | Provision/activation remain on COM/AUTH audit paths (unchanged) |
| Rate limiting | In-app acquire Checkout 20/min/IP; Contact Sales 10/min/IP |
| Webhook idempotency | BILL duplicate event ignore + activation keys |
| Interrupted flow recovery | Cancel resume; success poll; delayed/error messaging |
| Monitoring hooks | Structured logs suitable for log drains; no new vendor required |
| Edge/WAF | Still recommended in production in front of app (outside ACQ code) |

---

## 7. Key files

- `apps/web/src/lib/acquire/{funnel,seo,rate-limit,certification}.ts`
- `apps/web/src/lib/acquire/funnel.test.ts`
- `apps/web/src/components/acquire/*` (analytics + a11y)
- `apps/web/src/app/{sitemap,robots}.ts`
- `apps/web/src/app/api/acquire/{checkout,contact-sales}/route.ts`
- `apps/web/src/components/setup/setup-wizard.tsx` (guided setup events)

---

## 8. Automated tests

- Funnel sanitize / dedupe / portfolio bands  
- Rate limit allow/block/reset  
- SEO path lists + JSON-LD safety  
- Certification scenario matrix completeness  
- Prior Slice B Checkout/Contact Sales rejection tests remain green  

---

## 9. Stop

**Await `AUTHORIZE ACQ-001 SLICE D` before further ACQ work.**  
Slice D (if authorized) should be residual continuous ops/analytics only — core acquisition workflow is certified at Slice C.

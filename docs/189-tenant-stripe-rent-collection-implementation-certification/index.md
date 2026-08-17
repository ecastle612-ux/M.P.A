# 189 — Tenant Stripe Rent Collection Implementation Certification

**Status:** **IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-17  
**Authority:** [docs/188](../188-tenant-stripe-rent-collection/index.md) **Approved** (Owner A–E)  
**This package:** In-repo implementation + tests only.

## Stop line

Do **not**:

- apply `20260817193000_docs_188_tenant_stripe_rent_collection.sql` to Production
- complete live Stripe Connect onboarding
- set `stripe_payment_execution_enabled = true`
- process a real tenant payment
- change SaaS Prices or SaaS Checkout
- authorize M5
- unfreeze July

## Delivered

| Slice | In-repo |
|-------|---------|
| A Admin fees, immutability, schedule poster | Yes — finance desk + `postDueSchedules` + `adjustChargeAmount` guard + late-fee policy route |
| B Connect onboarding | Yes — `/api/finance/connect`, fail closed if not `ready` |
| C Pay Once on connected account | Yes — Checkout `stripeAccount` + webhook harden + partial amount + refund/dispute reversing entries |
| D Tenant AutoPay | Yes — tenant consent + connected-account Checkout setup + off-session PI of eligible posted charges only |
| E Copy | Yes — FAQ, Privacy/Terms, module copy, Pay once / AutoPay UI |

## Safety preserved

- FIN-OPS remains the only operational ledger
- No July writes / no dual-write
- SaaS webhook isolated from tenant webhook
- M5 collections route still hard-stopped
- FO-only and Complete FACILITY remain denied
- Admin cannot enroll AutoPay
- Changing a schedule amount does not rewrite posted charges

## Next (not this package)

Owner-authorized UAT: apply migration to a non-production or explicitly authorized UAT org → Connect `ready` → per-org execution flag → one Pay Once and one AutoPay test → then customer enablement.

2026-08-17 UAT readiness read: **BLOCKED**. See [docs/190](../190-tenant-stripe-rent-collection-uat-readiness/index.md).

2026-08-17 foundation release: **READY FOR STRIPE CONNECT UAT**. See [docs/191](../191-tenant-stripe-rent-collection-foundation-release/index.md). Production SHA `b39acb42`. Stamp `20260817080250`. Execution remains OFF. Connect not started.

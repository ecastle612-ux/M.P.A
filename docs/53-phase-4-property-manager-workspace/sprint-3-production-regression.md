# Phase 4 Sprint 3 — Production regression report

**Date:** 2026-08-09  
**Production SHA:** `75b3b5ba9c9c943af1348c4d8a1605ef048577fd`  
**Deployment ID:** `dpl_DNenXbWrFh4AGBEgzMvcBBDef2K6`  
**Overall:** **PASS**

| Area | Expected | Result |
| --- | --- | --- |
| Commercial Platform `/` `/modules` `/enterprise` | 200 | **PASS** |
| Pricing | 200; PM/FO/Complete amounts | **PASS** ($99 / $149 / $1,490) |
| Checkout PM | Stripe URL | **PASS** → `checkout.stripe.com` (unique idempotency) |
| Checkout FO | enterprise gate | **PASS** 409 `enterprise_required` |
| Provisioning / admin commercial | operator gate | **PASS** 307 → `/login` |
| Master Admin / Platform Ops | operator gate | **PASS** 307 → `/login` |
| Facility `/facility` | auth gate | **PASS** 307 → `/login` |
| Resident `/portal/tenant` | auth gate | **PASS** 307 → `/login` |
| Demo `/demo` | 200 | **PASS** |
| Guided Setup `/setup` | auth gate | **PASS** 307 → `/login` |
| PM workspace routes | auth gate | **PASS** 307 → `/login` |

No commercial workflow, Stripe product, or admin ops changes in this deploy (PM UX presentation + merge-blocking lint fix only).

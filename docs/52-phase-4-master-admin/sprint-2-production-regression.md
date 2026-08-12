# Phase 4 Sprint 2 — Production regression report

**Date:** 2026-08-09  
**Production SHA:** `1698b0fd765229faeb6250e9a11547a67e597260`  
**Deployment ID:** `dpl_68mMFYfgKJ1KtTQHRXpwA49RGVVv`  
**Overall:** **PASS** (customer/commercial surfaces)

| Area | Expected | Result |
| --- | --- | --- |
| Commercial Platform `/` | 200 | **PASS** |
| Modules `/modules` | 200 | **PASS** |
| Enterprise `/enterprise` | 200 | **PASS** |
| Pricing `/pricing` | 200; PM/FO/Complete amounts | **PASS** ($99 / $149 / $1,490 present) |
| Checkout PM `POST /api/commerce/checkout` | Stripe Checkout URL | **PASS** → `checkout.stripe.com` |
| Checkout FO | enterprise gate | **PASS** 409 `enterprise_required` |
| Checkout Complete | enterprise gate | **PASS** 409 `enterprise_required` |
| Provisioning console `/admin/commercial/provisioning` | operator gate | **PASS** 307 → `/login` |
| Mission Control `/pm/mission-control` | auth gate | **PASS** 307 → `/login` |
| Guided Setup `/setup` | auth gate | **PASS** 307 → `/login` |
| Demo `/demo` | 200 | **PASS** |
| Resident `/portal/tenant` | auth gate | **PASS** 307 → `/login` |
| Property Manager `/pm` | auth gate | **PASS** 307 → `/login` |
| Facility Operations `/facility` | auth gate | **PASS** 307 → `/login` |
| Master Admin ops routes | operator gate | **PASS** 307 → `/login` |

No customer workflow, Stripe product, or pricing changes in this deploy (admin ops visibility only).

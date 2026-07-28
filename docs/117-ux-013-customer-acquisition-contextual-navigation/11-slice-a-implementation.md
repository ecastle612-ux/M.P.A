# 11 — Slice A Implementation

**Package:** UX-013  
**Slice:** A  
**Status:** ✅ Implemented · Deployed · Verified  
**Date:** 2026-07-28  
**Authorize:** `AUTHORIZE UX-013 SLICE A` · [10](./10-slice-a-authorization.md)  
**Commit:** `ed7115b78ff1e904966c1bc9b2f96469c86859e8` · branch `release/rc1`  
**Deployment:** `dpl_5DM6zuGi3MPYRRvoHZojdWKNTbKK` · Production READY  
**Aliases:** `https://m-p-a-web.vercel.app` · `https://www.my-property-assistant.com`

---

## Delivered

| Area | Change |
|------|--------|
| Decisions | Public self-serve = Professional + Business only; `ACQ_TRIAL_ENABLED=false` |
| Modules | `/modules` + `ModuleSelectionExperience` |
| Pricing | Requires `?modules=`; dynamic card/comparison copy; no Trial column/card |
| Landing / overview / shell | Modules-first CTAs; enterprise SaaS positioning |
| Tour | Optional; skip → modules |
| Checkout UX | Requires modules query; rejects public `trial` at API validation |
| SEO | `/modules` indexable; AggregateOffer no $0 trial |

## Explicitly not changed

- Provisioning / activation pipelines  
- Entitlement capability matrix bind (Slice B)  
- Contextual nav matrices (Slice C)  
- Company Billing Center “Start trial” for in-app BILL (post-purchase)  

## Remaining for Slice B

- Persist `module_selection` on Checkout Session metadata end-to-end  
- Selection-aware entitlement snapshot at provision  
- Resolve OQ-01 / OQ-04  

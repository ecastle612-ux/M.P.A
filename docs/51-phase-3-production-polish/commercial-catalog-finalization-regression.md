# Commercial catalog finalization — regression report

**Date:** 2026-08-09  
**Production SHA:** `bc893446f061452e338e0332b9478f6af99d2442`  
**Deployment ID:** `dpl_FWF37eoMiYr75ZBHL1p2Bo96qe7c`  
**Overall:** **PASS**

## Pricing display

| Check | Result |
| --- | --- |
| Env detected (`catalog-prices` ready, no warning) | **PASS** |
| Monthly PM $99 / FO $99 / Complete $149 | **PASS** |
| Annual PM $990 / FO $990 / Complete $1,490 | **PASS** |

## Purchase motions

| Check | Result |
| --- | --- |
| PM Confirm Plan → Stripe Checkout | **PASS** |
| FO Request Early Access; checkout 409 `enterprise_required` | **PASS** |
| Complete Request Consultation; checkout 409 | **PASS** |
| Enterprise sales path `/enterprise` | **PASS** |
| FO_READY unchanged | **PASS** |

## Surfaces

| Check | Result |
| --- | --- |
| Landing | **PASS** |
| Modules | **PASS** |
| Pricing | **PASS** |
| Confirm Plan | **PASS** |
| Checkout | **PASS** |
| Demo | **PASS** |
| Guided Setup (auth gate) | **PASS** |
| Mission Control (auth gate) | **PASS** |

## Constraints honored

| Constraint | Result |
| --- | --- |
| No code changes | **PASS** |
| No Stripe Product/Price edits this run | **PASS** |
| No checkout logic changes | **PASS** |
| Sprint 4 not started | **PASS** |

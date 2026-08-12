# Commercial Catalog — COMPLETE (Production LIVE)

**Status:** **COMPLETE** — awaiting Owner LIVE acceptance  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE COMMERCIAL CATALOG FINALIZATION  
**Scope:** Deploy + verify only. No code, Stripe, checkout, or FO_READY changes. Sprint 4 not started.

---

## Step 1 — Production env detected

`GET /api/commerce/catalog-prices` → `status: "ready"`, `warning: null`

| SKU | Monthly | Annual |
| --- | --- | --- |
| Property Manager | $99 (9900) | $990 (99000) |
| Facility Operations | $99 (9900) | $990 (99000) |
| Complete Platform | $149 (14900) | $1,490 (149000) |

No “Stripe Price ID env not set” banner on `/pricing`.

---

## Step 2 — Production redeploy

Owner set Production env vars; Production redeployed and is serving the catalog.

| Field | Value |
| --- | --- |
| Serving project | `m-p-a-web` |
| Vercel deployment ID | `dpl_FWF37eoMiYr75ZBHL1p2Bo96qe7c` |
| GitHub Production deploy | `5815210095` (success status @ 2026-08-09T14:47:09Z) |
| Production SHA | `bc893446f061452e338e0332b9478f6af99d2442` |
| Production URL | https://www.my-property-assistant.com |

Note: Agent has no Vercel API token; redeploy evidence is the new serving `dpl_*` + catalog API ready + GitHub Production success status after Owner env apply.

---

## Step 3 — LIVE pricing

https://www.my-property-assistant.com/pricing

| Cycle | PM | FO | Complete |
| --- | --- | --- | --- |
| Monthly | **$99** | **$99** | **$149** |
| Annual | **$990** | **$990** | **$1,490** |

Screenshots: [`screenshots-catalog/live-pricing-monthly.png`](./screenshots-catalog/live-pricing-monthly.png), [`screenshots-catalog/live-pricing-annual.png`](./screenshots-catalog/live-pricing-annual.png)

---

## Step 4 — Customer actions

| Product | Expected | LIVE |
| --- | --- | --- |
| Property Manager | Confirm Plan → Stripe Checkout | **PASS** — `POST /api/commerce/checkout` → `checkout.stripe.com` |
| Facility Operations | Request Early Access; no self-serve checkout | **PASS** — CTA Early Access; API **409** `enterprise_required` |
| Complete Platform | Request Consultation; no self-serve checkout | **PASS** — CTA Consultation; API **409** `enterprise_required` |
| Enterprise | Sales motion only | **PASS** — `/enterprise` |

---

## Step 5 — Regression

| Surface | Result |
| --- | --- |
| Landing `/` | **PASS** 200 |
| Modules `/modules` | **PASS** 200 |
| Pricing `/pricing` | **PASS** 200 + amounts |
| Confirm Plan `/checkout` | **PASS** 200 |
| Checkout API (PM) | **PASS** Stripe URL |
| Demo `/demo` | **PASS** 200 |
| Guided Setup `/setup` | **PASS** 307 → login |
| Mission Control `/pm/...`, `/facility/...`, `/launcher` | **PASS** 307 → login |
| Commercial certification | **PASS** (see certification doc) |
| FO_READY / checkout logic | **Unchanged** |

---

## Stripe IDs (reference — not modified this run)

| Product | ID |
| --- | --- |
| Facility Operations | `prod_V2T5R4aelXunHp` |
| Complete Platform | `prod_V2T5DGZOhygqiH` |

| Price | ID |
| --- | --- |
| FO Monthly | `price_1U2O9M8jGrZYUXDtuoUU9jVQ` |
| FO Annual | `price_1U2O9N8jGrZYUXDt28S1FwxK` |
| Complete Monthly | `price_1U2O9N8jGrZYUXDtqwDqgobS` |
| Complete Annual | `price_1U2O9N8jGrZYUXDtsAhAkcTD` |

---

## Verdict

**PASS** — Commercial Catalog marked **COMPLETE**.

**STOP.** Await Owner LIVE acceptance. Do not begin Sprint 4.

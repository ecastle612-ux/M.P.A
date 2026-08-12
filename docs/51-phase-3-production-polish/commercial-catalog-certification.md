# Commercial Catalog Certification

**Status:** **PASS — COMPLETE**  
**Certified:** 2026-08-09  
**Production SHA:** `bc893446f061452e338e0332b9478f6af99d2442`  
**Deployment ID:** `dpl_FWF37eoMiYr75ZBHL1p2Bo96qe7c`

## Official list prices (LIVE)

| Product | Monthly | Annual |
| --- | --- | --- |
| Property Manager | $99 | $990 |
| Facility Operations | $99 | $990 |
| Complete Platform | $149 | $1,490 |

## Purchase policy (LIVE)

| Product | Motion |
| --- | --- |
| Property Manager | Self-serve Stripe Checkout |
| Facility Operations | Request Early Access (FO_READY false) |
| Complete Platform | Request Consultation (FO_READY false) |
| Enterprise | Sales motion only — not a product tier |

## Certification checks

1. Public Pricing retrieves live Stripe amounts for all three products — **PASS**
2. No invented amounts; no Price-ID env warning — **PASS**
3. FO / Complete self-serve checkout remain blocked — **PASS**
4. PM Stripe Checkout launches — **PASS**
5. Product Constitution commercial flow intact — **PASS**

## Evidence

- `commercial-catalog-complete.md`
- `commercial-catalog-finalization-regression.md`
- `screenshots-catalog/live-pricing-monthly.png`
- `screenshots-catalog/live-pricing-annual.png`
- `screenshots-catalog/live-confirm-*.png`

**Commercial Catalog: COMPLETE.**  
Await Owner LIVE acceptance. Do not begin Sprint 4.

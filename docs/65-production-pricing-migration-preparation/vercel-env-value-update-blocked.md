# VERCEL PRODUCTION ENV VALUE UPDATE BLOCKED

**Date:** 2026-08-11  
**Clarification:** The eight Production `STRIPE_PRICE_*` variables **already exist**.  
**Required op:** **UPDATE VALUES IN PLACE** — not create, not delete, not rename, not duplicate.

## Agent capability

| Capability | Status |
|------------|--------|
| Vercel MCP authenticated (inspect project/deployments) | **PASS** |
| Project `m-p-a-web` | **PASS** (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| MCP env **value** read/write tools | **MISSING from catalog** |
| `VERCEL_TOKEN` for REST env edit | **MISSING** in cloud agent |
| Existing variables found by agent | **ASSUMED 8/8** (Owner-confirmed exist; agent cannot decrypt Production env values via MCP) |
| Existing variables updated | **0/8** |
| New variables created | **0** |
| Duplicate variables created | **0** |

## Existing variables → new values (edit only)

| Variable (name unchanged) | Update value to |
|---------------------------|-----------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1U31Z48jGrZYUXDteGv4gbSw` |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1U31Z58jGrZYUXDt2d9wqG4p` |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `price_1U31Z58jGrZYUXDtMKIvMBCo` |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `price_1U31Z68jGrZYUXDtfHZfdUMI` |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | `price_1U31Z68jGrZYUXDtxN4pEhmQ` |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | `price_1U31Z68jGrZYUXDtZbyPva6V` |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | `price_1U31Z78jGrZYUXDtZw1c648L` |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | `price_1U31Z78jGrZYUXDtJuCrMN4V` |

Target environment: **Production only**. Do not touch Preview/Development.

## Operator action (no create)

```
Vercel → m-p-a-web → Settings → Environment Variables → Production
  → locate each EXISTING variable above
  → Edit value
  → replace old Stripe Price ID with the NEW Price ID
  → Save
  → Redeploy Production
```

Do **not** create new variables. Do **not** create duplicates.

## Live state (pre-edit)

- `/pricing` still shows prior amounts ($99 / $990)  
- NEW Stripe Prices exist and are active  
- Existing subscriptions unmodified  

## After operator edits + redeploy

Verify PM $59 / $590; Business $209 / $2,450; FO/Complete remain NOT ONLINE; checkout uses new Price IDs; old subscriptions stay on old Prices.

# Operator runbook — $40 pricing cutover

## Preconditions

- Owner authorizes Stripe operator migration  
- NEW Prices created at authorized targets (see migration table)  
- Existing Prices left intact  

## Steps

1. In Stripe Dashboard (or API), create NEW Prices:
   - PM Pro: $59/month, $590/year  
   - PM Business: $209/month, $2,450/year  
   - FO Pro (display): $59/month, $590/year  
   - Complete Pro (display): $109/month, $1,090/year  
2. Record each new `price_…` ID.  
3. Update Vercel Production env:
   - `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY/ANNUAL`  
   - `STRIPE_PRICE_PM_BUSINESS_MONTHLY/ANNUAL`  
   - `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY/ANNUAL`  
   - `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY/ANNUAL`  
4. Redeploy / propagate env.  
5. Verify:
   - `/pricing` shows new PM amounts  
   - Confirm Plan + Checkout charge new PM Price  
   - FO/Complete still NOT ONLINE labels  
   - FO/Complete checkout still 409 `enterprise_required`  
   - Spot-check an existing subscription still references the **old** Price ID in Stripe  

## Do not

- Modify/delete old Prices  
- Bulk-update existing subscriptions  
- Remove EARLY ACCESS / CONSULTATION copy  
- Hard-code Price IDs into application source  

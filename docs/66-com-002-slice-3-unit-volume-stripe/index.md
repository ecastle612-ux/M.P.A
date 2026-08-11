# COM-002 Slice 3 — Unit-volume Stripe architecture (code only)

**Status:** Implemented in application code  
**Safety:** No Production Stripe mutations · No Vercel · No Production env · No Price creation  

---

## Future Stripe Price env vars (do not create / set in Production from this slice)

| Registry | Env var |
|----------|---------|
| PM_BASE_MONTHLY | `STRIPE_PRICE_PM_BASE_MONTHLY` |
| PM_BASE_ANNUAL | `STRIPE_PRICE_PM_BASE_ANNUAL` |
| COMPLETE_BASE_MONTHLY | `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` |
| COMPLETE_BASE_ANNUAL | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` |
| UNIT_BLOCK_MONTHLY | `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` |
| UNIT_BLOCK_ANNUAL | `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` |

Checkout Session creation from a quote requires PM base + unit block env vars for the selected interval. Complete Prices are architected but FO_READY-gated.

---

## Subscription shape

1. Base module Price — quantity **1** (always)  
2. Additional Unit Capacity Price — quantity **additional_blocks** only if **≥ 1**  

Never quantity 0.

---

## Trial

- `trial_period_days = 30` iff server quote `managed_units <= 500`  
- Otherwise no trial  
- `payment_method_collection = always`

---

## Metadata keys

`mpa_money_domain`, `mpa_product_sku`, `mpa_billing_cycle`, `mpa_quote_id`, `mpa_managed_units`, `mpa_included_units`, `mpa_additional_blocks`, `mpa_authorized_unit_capacity`, `mpa_trial_eligible`, `mpa_trial_days`, `mpa_commercial_model_version` (`unit_volume_v1`), optional `mpa_organization_id`.

---

## Slice 4 needs (over-capacity payment gate)

Prepared helper: `planNextPeriodCapacityUpdate()` in `packages/shared/src/commercial/unit-volume-stripe.ts`.

Slice 4 must:

1. Detect unit create/import that would exceed `authorized_unit_capacity`  
2. Show Additional Unit Capacity authorization UI (no silent charge)  
3. Persist pending authorized blocks + audit  
4. Grant operational capacity after authorize  
5. Update Stripe Additional Unit Capacity item quantity for **next billing period** with `proration_behavior=none`  
6. Omit/delete item when blocks become 0 (never qty 0)  
7. Use `stripe_additional_capacity_item_id` stored on `organization_subscriptions`

---

## Webhook events prepared

Existing SaaS webhook handler extended for:

- `checkout.session.completed` (existing)  
- `customer.subscription.created|updated|deleted` (existing + capacity item ids)  
- `customer.subscription.trial_will_end` (new)  
- `invoice.created` (ack / Slice 4 prep)  
- `invoice.paid|payment_failed` (existing)  

No Production webhook configuration changes in this slice.

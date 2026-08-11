# COM-002 Slice 4 — Additional Unit Capacity payment gate

**Status:** Implemented in application code  
**Safety:** No Production Stripe mutations · No Vercel · No Production env · FO/Complete gated  

---

## Behavior

When creating units would exceed `authorized_unit_capacity`:

1. Block only that capacity-increasing action (HTTP 409)
2. Show **Additional Unit Capacity Required** gate
3. Require explicit **Authorize Additional Capacity**
4. Server recounts `public.property_units` (all statuses) and recalculates blocks/price
5. Grant operational capacity immediately after authorize
6. Schedule Stripe Additional Unit Capacity quantity for **next billing period** with `proration_behavior=none`
7. Never quantity 0 — delete/omit the capacity item when blocks return to 0

Organization remains usable within current authorized capacity.

---

## Trial

- Signup ≤500 units: 30-day trial (Slice 3)
- Exceeding 500 during trial: capacity gate; authorize required; **no surprise mid-trial charge**
- New amount applies on the next invoice after trial / period boundary
- Signup >500: no trial (Slice 3)

---

## Capacity states

| Status | Meaning |
|--------|---------|
| `within_capacity` | actual ≤ authorized; billing aligned |
| `requires_authorization` | action/projection exceeds authorized |
| `authorized_pending_period` | pending next-period blocks differ (typically decrease scheduled) |
| `sync_required` | actual units imply fewer blocks than currently authorized — decrease to schedule |

---

## APIs

- `GET /api/commerce/capacity`
- `POST /api/commerce/capacity/authorize` — body may include `intentId` only (no prices/blocks/units)
- Property create `POST /api/pm/properties` — capacity pre-check

---

## Decrease

Scheduled for next period; no immediate refund/credit. Operational capacity stays until `invoice.created` period-boundary sync applies pending blocks.

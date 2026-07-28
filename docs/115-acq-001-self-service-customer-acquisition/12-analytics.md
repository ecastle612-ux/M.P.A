# 12 — Analytics Requirements

**Package:** ACQ-001  
**Status:** ✅ Approved / Implemented (Slice C)

---

## Funnel events (minimum)

| Event | Properties |
|-------|------------|
| `acq.landing_viewed` | referrer, utm_* |
| `acq.tour_started` / `step` / `completed` / `skipped` | step index |
| `acq.pricing_viewed` | interval toggle |
| `acq.plan_selected` | plan_code, interval |
| `acq.checkout_started` | plan_code, interval, session_id (opaque) |
| `acq.checkout_canceled` | plan_code |
| `acq.checkout_success_returned` | session_id |
| `acq.provision_ready` / `provision_delayed` / `provision_failed` | correlation_id |
| `acq.contact_sales_submitted` | portfolio_band |
| `acq.login_from_success` | — |

---

## Conversion KPIs

| KPI | Definition |
|-----|------------|
| Visit → Pricing | Funnel |
| Pricing → Checkout start | Funnel |
| Checkout start → Paid | Stripe |
| Paid → First login | Auth |
| First login → Active | Setup |
| Active → Day-7 retained | Product |

---

## Constraints

- No PII in analytics event payloads beyond coarse traits (prefer hashed email if needed)  
- Do not log passwords, temp credentials, or full card data  
- Prefer existing analytics pipeline if one exists; otherwise first Implement slice may use privacy-safe first-party events  

Staff commercial dashboard (COM) remains separate from public funnel analytics.

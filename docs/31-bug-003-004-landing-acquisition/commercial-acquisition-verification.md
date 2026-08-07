# Commercial Acquisition Verification — BUG-004

**Date:** 2026-08-07  

---

## Expected vs delivered

| Expected step | Delivered | Auth required? |
|---------------|-----------|----------------|
| Landing | `/` | No |
| Choose Modules | `/modules` | No |
| Subscription comparison | `/pricing` | No |
| Pricing | `/pricing` plan cards | No |
| Checkout | `/checkout` plan confirmation | **No** |
| Account creation | `/login?mode=sign_up&intent=` | Starts auth |
| Organization provisioning | Guided Setup `POST /api/organizations` | Yes |
| Guided Setup | `/setup` | Yes |
| Mission Control | `/pm/mission-control` via `/dashboard` | Yes |

---

## Checkout honesty (binding)

There is **no** existing Stripe `mode: "subscription"` SaaS checkout in the certified pipeline.

This authorize required reuse of the existing pipeline and forbade inventing features. Therefore:

- `/checkout` confirms **plan selection** and stores `mpa_acquisition_sku`  
- It does **not** invent card capture or Stripe SaaS payment  
- Paid subscription confirmation remains white-glove commercial operations (operator SKU assign)  
- Org create still provisions Property Manager; acquisition preference is shown in Guided Setup  

Inventing a full pre-auth Stripe SaaS payment system would require Design → Document → Approve.

---

## Verdict

**Pass** for public pre-auth selection → pricing → checkout confirmation → account → existing Guided Setup pipeline.

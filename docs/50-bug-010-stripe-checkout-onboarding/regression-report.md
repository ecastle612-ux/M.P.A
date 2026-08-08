# BUG-010 — Regression Report

## Intentionally unchanged

| Area | Note |
|------|------|
| Product Constitution | Three products; Enterprise sales motion |
| Commercial funnel order | Landing → product → cycle → Confirm Plan → Stripe |
| Stripe Product names | Not renamed |
| Internal offer ids / planTier | Still `professional` / `business` for price env mapping |
| FO_READY | Remains `false` (FO/Complete self-serve still Enterprise-routed) |
| Canopy / Experience Architecture | No redesign |

## Changed (customer-facing constitution cleanup)

| Change | Risk |
|--------|------|
| Billing page: removed Professional/Business CTAs + copy | Customers no longer self-serve capacity tier changes from `/billing` (API still exists for admin/automation) |
| Subscription API `planLabel` | Now Product Constitution product name |
| Lifecycle email plan label | Product name only |
| Funnel URLs | Dropped `plan=` query param |
| Checkout 503 message | Customer-safe wording |

## Test focus after merge

- Confirm Plan still posts internal `planTier: "professional"`  
- Marketing pages still show three platforms only  
- `/enterprise` still optional sales motion  
- Admin commercial consoles still show catalog offer ids  
- Existing unit tests for saas-checkout / provisioning / lifecycle  

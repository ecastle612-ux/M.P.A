# Regression Report — PR #46 Blocking Remediation

## Functional scope

Copy and commercial honesty only. No route renames, no new products, no Capital Projects, no payment capture.

| Area | Expected | Status |
|------|----------|--------|
| `/` marketing sections | Still present; copy updated | Unchanged structure |
| `/modules` `/pricing` `/checkout` | Routes unchanged | Pass |
| Funnel query `?intent=` | Unchanged | Pass |
| Cookie `mpa_acquisition_sku` | Still set on Confirm Plan | Pass |
| Org create → Property Manager | Unchanged | Pass |
| Capital Projects | Still excluded from marketing catalogs | Pass |
| Stripe SaaS subscription checkout | Still not invented | Pass |
| Authenticated app shells / FO pages | Untouched | Pass |

## Risk notes

- `SKU_SUMMARIES` text also appears in Master Admin product blurbs — now more customer-honest (acceptable).
- Component name `CheckoutPage` retained; customer H1 is Confirm Plan.

## Verdict

**No functional regression intended.** Marketing honesty remediation only.

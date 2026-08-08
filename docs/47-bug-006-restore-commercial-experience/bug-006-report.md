# BUG-006 Report — Restore Commercial Experience

**Authorized:** 2026-08-08  
**Branch:** `cursor/bug-006-restore-commercial-experience-c9e8`

## Defect

After COM-002 / BUG-005, the public commercial experience presented Professional/Business tiers and treated Facility Operations / Complete Platform as Enterprise substitutes. That conflicted with the agreed three-platform model.

## Fix

| Surface | Restore |
|---------|---------|
| Landing | Hero → Choose Your Platform → PM → FO → Complete → Feature comparison → FAQ → Enterprise Solutions (once) → Footer |
| Pricing | Three platforms × Monthly/Annual; no Professional/Business chooser |
| Confirm Plan | Platform + billing cycle only; payment-before-account preserved for PM Stripe |
| Navigation | Home, Live Demo, Modules, Pricing, Confirm Plan, Enterprise, Sign In, Get Started |
| Enterprise page | Large-org optional path only |

## Stripe note

No new price models or env keys. Existing PM Stripe prices remain mapped internally. FO/Complete Confirm Plan remains honest when self-service checkout is not yet configured — without presenting Enterprise as the product.

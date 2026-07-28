# 23 — Slice A Implementation

**Package:** ACQ-001  
**Status:** ✅ Implemented (2026-07-27)  
**Authorization:** [22](./22-slice-a-authorization.md)

---

## Delivered

| Route | Purpose |
|-------|---------|
| `/` | Landing (anonymous); authenticated users redirected to product home |
| `/overview` | Product overview |
| `/tour` | Interactive product tour (≤6 steps) |
| `/pricing` | Plans, comparison, FAQ |
| `/contact-sales` | Enterprise contact form (intent stored locally; COM write = Slice B) |
| `/acquire/start` | Checkout navigation / pre-Checkout fields (no Stripe Session) |

## Key files

- `apps/web/src/components/acquire/*`
- `apps/web/src/lib/acquire/{decisions,catalog}.ts`
- `apps/web/src/app/(marketing)/**`
- `apps/web/src/middleware.ts` (root anonymous → landing)

## Explicitly not in Slice A

- Stripe Checkout Session create
- Provision / welcome / Guided Setup changes
- COM opportunity API from Contact Sales

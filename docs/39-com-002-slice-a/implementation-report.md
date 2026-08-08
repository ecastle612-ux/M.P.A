# Slice A Implementation Report

**Package:** COM-002 Slice A  
**Date:** 2026-08-07  
**Branch:** `cursor/com-002-slice-a-f5dd`  

---

## Summary

Slice A establishes the commercial backbone: canonical catalog, offer validation, Enterprise fork, feature flags, funnel state machine, event names, entitlement preparation, public funnel screens (no payment), and Master Admin catalog read model.

---

## Shared module (`packages/shared/src/commercial/`)

| File | Role |
|------|------|
| `plans.ts` | Plan tiers, billing cycles, seat/property limits (5/25 · 25/150) |
| `commerce-flags.ts` | `FO_READY=false`, slice flags |
| `catalog.ts` | `CATALOG_OFFERS`, resolve/validate, Enterprise motion, entitlement prep |
| `commerce-state.ts` | Canonical funnel state machine |
| `commerce-events.ts` | Analytics + audit event constants |
| `acquisition.ts` | Funnel hrefs; FO/Complete → Enterprise; offer cookie key |
| `master-admin.ts` | Catalog nav entry |
| `skus.ts` | FO/Complete Enterprise-honest descriptions |

---

## UI surfaces

| Route | Behavior |
|-------|----------|
| `/` | Landing; Get Started → Modules; FO/Complete → Request Enterprise |
| `/modules` | PM self-serve; FO/Complete Enterprise CTAs |
| `/pricing` | Plan + cycle for PM; Enterprise CTA for FO/Complete |
| `/checkout` | Confirm Plan (no payment); server redirect FO/Complete → Enterprise |
| `/enterprise` | Request Enterprise foundation (no CRM automation) |
| `/admin/commercial/catalog` | Operator catalog + flags read model |

---

## Architecture rules enforced

1. Only Property Manager Professional / Business is self-serve eligible.  
2. Facility Operations and Complete Platform require Enterprise while `FO_READY=false`.  
3. Single catalog + validation path — no duplicated commercial eligibility logic.  
4. `stripePriceId` reserved null until Slice C.  
5. Capital Projects remain excluded from marketing catalogs.

---

## Tests added/updated

- `catalog.test.ts` — self-serve eligibility, limits, Enterprise routing, entitlement prep, funnel transitions  
- `acquisition.test.ts` — Enterprise href routing for FO/Complete  

---

## Follow-on (not in this slice)

AUTHORIZE COM-002 SLICE B — Demo Platform.

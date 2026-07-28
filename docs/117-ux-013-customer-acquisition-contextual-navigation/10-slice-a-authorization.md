# 10 — Slice A Authorization

**Package:** UX-013  
**Phrase:** `AUTHORIZE UX-013 SLICE A`  
**Status:** ✅ **AUTHORIZED**  
**Date:** 2026-07-28  
**Prerequisite:** [08 — Approval record](./08-approval-record.md) · `APPROVE UX-013`

---

## Scope (in)

| Item | Detail |
|------|--------|
| Module selection | Public `/modules` — Property Ops / Facility Ops / Both |
| Dynamic pricing UX | `/pricing` responds to module selection; Pro / Business / Enterprise only |
| Trial messaging | Remove public Trial plan card and “Start free trial” CTAs |
| Landing | Enterprise SaaS positioning; modules + outcomes; CTA to modules |
| Tour | Remains optional; skip / return without blocking Checkout |
| Checkout entry UX | Continues for `professional` / `business`; rejects public `trial` via decisions |

## Scope (out — later slices)

| Slice | Out of Slice A |
|-------|----------------|
| **B** | Checkout metadata entitlement bind; selection-aware capability matrix |
| **C** | Contextual nav matrices A–G implementation |
| **D** | Analytics/SEO/a11y certification package |

## Preserve

AUTH / COM / BILL money rail / provision / Guided Setup / SignWell / entitlements enforcement — **unchanged** in Slice A.

---

## Exit criteria

- [ ] Modules → Pricing → Checkout path works without Trial CTA  
- [ ] Existing Checkout / provision / Setup still function  
- [ ] Relevant tests + production build pass  
- [ ] Commit, push, deploy, production verify  

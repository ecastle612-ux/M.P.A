# PR #46 Pre-Merge Review

**Date:** 2026-08-07  
**PR:** [#46](https://github.com/ecastle612-ux/M.P.A/pull/46) · head `0380b13`  
**Lens:** Prospective customer evaluating M.P.A.  
**Mode:** Review only — no code changes made  

---

## Decision

# 2. Required changes before merge

The PR is directionally correct (sections exist, funnel is wired, Capital excluded, SaaS card payment not invented). It is **not** yet production-ready for a customer-facing homepage because several messages overstate Facility Operations readiness and use internal/meta voice that undermines enterprise trust.

---

## What works (customer view)

| Area | Assessment |
|------|------------|
| Visual hierarchy | Strong hero; clear section rhythm; Canopy tokens |
| Feature coverage | BUG-003 section list is present in code |
| Module comparison | Inclusion matrix present (landing + `/pricing`) |
| CTA placement | Multiple paths to `/modules` / `/pricing` / Sign In |
| Customer journey | Steps explained; funnel routes exist |
| Accessibility baseline | Skip link, focus rings, reduced-motion animations |
| Mobile | Grids collapse; comparison tables scroll horizontally |
| Performance | Mostly server-rendered marketing; light client checkout cookie |
| Capital | Explicitly excluded |
| SaaS Stripe invention | Correctly refused; payment honesty stated |

---

## Required changes (blocking)

| # | Change | Reason | User impact | Effort | Blocking? |
|---|--------|--------|-------------|--------|-----------|
| B1 | Stop labeling FO modules as **“In product”** when they are commercial shells / not live workflows. Use customer-safe labels (e.g. **“Product catalog”** / **“Coming in Facility product”**) and never imply FO Assets/Inventory/etc. are live today. | On this tip, FO routes still render `ModuleAlignmentPage` shells; `readiness: "aligned"` ≠ certified live FO operations. | Prospective Facility buyer believes capabilities exist that do not. Trust break after signup. | Small (label map + FO section copy) | **Blocking** |
| B2 | Qualify **Facility Operations** / **Complete Platform** SKU blurbs on overview & modules cards so they read as commercial composition, not shipped FO depth. | `SKU_SUMMARIES.mpa_facility_operations` lists assets/inventory/etc. without status. | Same as B1 — brochure oversell. | Small | **Blocking** |
| B3 | On `/checkout`, if selected SKU ≠ Property Manager, state clearly that **org create provisions Property Manager first** and commercial ops activates Facility/Complete. | Guided Setup still assigns PM; preference cookie is informational only. | Buyer of Complete/FO thinks they checked out that plan, then lands in PM-only setup. | Small | **Blocking** |
| B4 | Rename customer-facing **“Checkout”** CTAs/H1 to **“Confirm plan”** (URL `/checkout` may remain). Remove meta line *“we do not invent a Stripe SaaS checkout here”* from FAQ. | “Checkout” implies payment; meta engineering voice is unprofessional on a marketing surface. FAQ already explains white-glove billing more calmly elsewhere. | Confusion at payment step; brand feels unfinished. | Small | **Blocking** |
| B5 | Replace internal jargon on the public landing: **“S0–S3 delivered”**, **“Start acquisition”**, hardening-checklist tone in Security. Use customer language (e.g. “Operational billing live today”, “Get started”, “Enterprise access controls”). | Prospective customers do not speak in slice IDs or CI hardening notes. | Page feels like an internal status report, not enterprise SaaS. | Small | **Blocking** |

---

## Recommended changes (non-blocking)

| # | Change | Reason | User impact | Effort | Blocking? |
|---|--------|--------|-------------|--------|-----------|
| N1 | Differentiate hero CTAs: primary **Get Started** → `/modules`; secondary **Choose Modules** is redundant (same href). | Duplicate actions weaken hierarchy. | Mild confusion. | Trivial | Non-blocking |
| N2 | Soften Leasing copy (“Vacancy-to-lease pipeline”) to launch-path honesty (lease → active; full marketing/screening deferred). | Promise cert limits leasing depth. | Slight overclaim risk. | Trivial | Non-blocking |
| N3 | Add accessible text for comparison cells (`Included` / `Not included`) instead of only `●` / `—`. | Screen-reader clarity. | A11y improvement. | Small | Non-blocking |
| N4 | Drop `apps/web/tsconfig.tsbuildinfo` from the PR. | Build artifact noise. | None for users. | Trivial | Non-blocking |
| N5 | Reduce repeated identical card chrome across 10+ sections (visual fatigue). | Long page feels samey. | Lower engagement on lower sections. | Medium | Non-blocking |
| N6 | Confirm Vercel Preview failures on PR #46 are env-only and Production `m-p-a-web` still deploys from `main` after merge (ops check). | Preview red does not prove prod red, but should be understood. | Deploy risk if misconfigured. | Ops check | Non-blocking for merge decision if Production path known good |

---

## Advertised vs exists (spot check)

| Claim area | Exists in platform today? | Notes |
|------------|---------------------------|-------|
| PM Mission Control, Properties, Residents, Leasing (launch), Maintenance, FinOps S0–S3, Docs, Comms, portals | **Yes** | Safe to feature with launch-path honesty |
| Search / notifications / audit trails | **Yes** | Shared spine |
| Master Admin | **Yes** (operators) | Correctly marked not a customer SKU |
| Facility Assets / Inventory / PM / Inspections / etc. as live ops | **No** on this tip | Shells / commercial alignment — **must not read as live** |
| Capital Projects | **No** | Correctly excluded |
| SaaS card checkout | **No** | Correctly not invented; naming still confusing |

---

## Merge recommendation

**Do not merge until B1–B5 are addressed.**

After B1–B5:

1. Re-review copy as a Facility buyer and a PM buyer.  
2. Merge PR #46 into `main`.  
3. Verify `Production – m-p-a-web` success.  
4. Spot-check www for `#overview`…`#faq` and `/modules` `/pricing` `/checkout`.

---

## STOP

```
STOP
Required changes before merge (B1–B5).
No automatic code changes in this review.
No Capital Projects.
```

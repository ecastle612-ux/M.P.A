# Customer #1 Dry Run

**Authorization:** `AUTHORIZE CUSTOMER #1 DRY RUN`  
**Date:** 2026-08-07  
**Baseline:** Feature complete · Promise certified · Production GO (92/100) · Launch stabilization complete  
**Constraint:** No new features. Report only. STOP after deliverable.

---

## Deliverable

| Document | Purpose |
|----------|---------|
| [Customer #1 Dry Run Report](./customer-1-dry-run-report.md) | Critical bugs, workflow friction, and confidence-hurting polish only |

---

## Method

| Aspect | Detail |
|--------|--------|
| Stance | Zero internal knowledge — new paying customer |
| Org | Assumed brand-new (no seeded portfolio) |
| Live browser / staging DB | **Unavailable in this agent environment** (no app env / Supabase credentials) |
| Simulation basis | Shipped routes, UI copy, APIs, redirects, RLS/role wiring, and journey CTAs in current `main`/`cursor/product-architecture-reset-5922` |

This is an **operational code-path dry run**. Findings below are reproducible from product behavior as implemented. A live staging Pass (DEF-003) remains required to stamp human MA evidence.

---

## STOP

No implementation in this authorization.  
Await explicit authorization before fixing listed defects.

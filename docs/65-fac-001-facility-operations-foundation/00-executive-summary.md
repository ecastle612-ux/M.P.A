# 00 — Executive Summary

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Problem

Today, completed work orders fade into list archaeology. Property managers cannot reliably answer:

- When was this repaired?  
- Who fixed it?  
- What did it cost?  
- Is it under warranty?  
- Has this happened before?

Competitors win retention when **facility memory** lives in one system. M.P.A. already coordinates maintenance ([Phase 6](../26-phase-6-maintenance-foundation/README.md)) and vendors ([Phase 7](../27-phase-7-vendor-foundation/README.md)), but lacks a **permanent Facility Operations layer** that turns coordination into durable building knowledge.

---

## Opportunity

Make every property a **living operational record**:

- Work Orders coordinate work (temporary)  
- Facility Records preserve outcomes (permanent)  
- Property / Unit History + Timeline become the memory surface  
- Service Providers unify who did the work  
- Assets, warranties, and documents attach to that memory  

This strengthens [MOAT-001](../63-moat-001-competitive-advantage-blueprint/README.md): after years of repairs live here, switching costs rise.

---

## Solution (design intent)

Introduce Facility Operations as a **read-mostly history plane** beneath existing maintenance workflows:

```
Resident / Ops / Maintenance events
        ↓
Facility Operations Services (append / read)
        ↓
Facility Records · Timeline · Assets · Providers · Vault links
        ↓
Property History · Unit History · Facility Search · (future) AI / PM
```

Closing a work order **creates or finalizes** a Facility Record. The WO may archive; the Facility Record does not disappear.

---

## Success criteria

| # | Criterion |
| --- | --- |
| S1 | 15-year memory test passes (see README) |
| S2 | Zero breakage to existing WO / vendor assignment paths |
| S3 | Every completed repair yields an immutable Facility Record |
| S4 | Property Timeline aggregates facility + lifecycle + key ops events |
| S5 | Service Provider model migrates Vendors without dual-path UX |
| S6 | Search returns repairs, assets, providers, properties, units, media, timeline |
| S7 | Future PM / AI / compliance have documented extension points only |

---

## Non-goals

FAC-001 will **not**:

1. Redesign work-order workflows or status machines  
2. Break or fork vendor assignment  
3. Modify accounting, payments, or FIN-001 reporting  
4. Change Resident lifecycle product paths (may **emit** timeline events only)  
5. Change Operations Center behavior in Phase 1 Implement  
6. Ship preventive schedules, predictive models, or AI scoring  
7. Ship any application code before **Approve**

---

## Audience

| Role | Value |
| --- | --- |
| Property manager | Instant answers on repair history and warranties |
| Owner (future) | Transparency into building care |
| Internal maintenance / vendors | Attribution in permanent records |
| Design Partner | Trust that closed work is not lost knowledge |

---

## Gate reminder

This package completes **Design** and **Document** only.

| Stage | Status |
| --- | --- |
| Approve | Pending — see [12](./12-approval-checklist.md) |
| Implement | Blocked until Approve |

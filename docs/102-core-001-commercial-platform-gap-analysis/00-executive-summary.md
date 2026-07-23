# 00 — Executive Summary

**Package:** CORE-001  
**Date:** 2026-07-22

---

## The commercial question

Can a paying property management company switch to M.P.A. **tomorrow** and run Property → Resident → Lease → Rent → Maintenance → Vendor → Owner → Reporting every day without dead ends or untrue claims?

**Answer today:** **No** for unsupervised commercial launch.  
**Answer for constrained Design Partners:** **Yes**, with documented limitations.

---

## What already clears the bar

| Capability | Evidence |
|------------|----------|
| PM daily path (Ops → Property → Resident → Lease → Payment → Maintenance → Vendor assign → Message → Notify owner) | DPX-002 **PASS** |
| Property / Unit / Tenant CRUD | Phase 4–5 · PM-001 |
| Lease + e-sign foundation | Phase 8 · API-004 |
| Maintenance work orders | Phase 6 |
| Vendor QR Start / Finish (no login) | VENDOR-001 Phase A **PASS** |
| SaaS subscription billing | BILL-001 Phase A **PASS** |
| Financial reports + statements (PM-side) | FIN-001 · Phase 10 |
| Migration / switching narrative | MIG-001 · MX-001 |
| Auth + tenant portal + vendor portal | Phase 3 / UX-005 |

---

## What still blocks confident paid onboarding

| # | Blocker | Priority |
|---|---------|----------|
| 1 | **Live rent collection** not commercially certified (Stripe live supervised payment still open) | **P0** |
| 2 | **Owner money rail** (Connect Express payouts) designed in ADR-023 but FIN-003 package **absent on disk** and **not implemented** | **P0** |
| 3 | **Owner Portal** is `FutureReleaseNotice` — owners cannot self-serve | **P0*** |
| 4 | **Push notifications** not commercially PASS (PUSH-001 real-device evidence) | **P1** (P0 if selling “real-time ops”) |
| 5 | **DPX-003 / theme / commercial polish** not PASS | **P1** |
| 6 | **Vendor get paid** (invoice → approve → pay) locked in VENDOR-001 Phase B | **P1** |
| 7 | Master Admin deep operator walk + support readiness incomplete (EP-017) | **P1** |
| 8 | SMS intentionally unavailable — must not be sold | Claim control |

\*Owner Portal may drop to P1 only if launch positioning is “PM-operated statements only” with written customer acceptance. Default for paid switchers: **P0**.

---

## Score snapshot

| Score | Value | Target |
|-------|------:|-------:|
| Design Partner | 9.95 | — |
| Production | ~8.4 | ≥ 8.5 |
| Commercial | ~8.3 | ≥ 9.0 |

---

## How to get to launch

1. **Approve** this CORE-001 roadmap (product + architecture).  
2. Execute **Implementation Order** (doc 07) — only P0 then P1.  
3. Close each item with its **Certification Matrix** row (doc 06).  
4. Re-score Commercial ≥ 9.0 → issue Commercial Launch GO under a new cert package (suggested: `LC-002` or EP-017 closeout).

Until then: sell Design Partner / supervised pilot only.

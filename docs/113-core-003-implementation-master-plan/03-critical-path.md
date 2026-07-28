# 03 — Critical Path

**Package:** CORE-003

There is no single path that maximizes every outcome. CTO sequencing optimizes for **commercial readiness** while keeping **money-out** and **native PWA** from stalling.

---

## Path A — Customer can buy and operate (primary commercial)

```
AUTH-A → AUTH-B ↔ COM-A → AUTH-C → AUTH-D → AUTH-E
                ↘ COM-B → COM-C → COM-D → COM-E
```

**Why critical:** Without AUTH-A/B + COM-A, M.P.A. cannot safely turn Payment Successful into an org with an Org Admin. Later COM slices (health, offboarding, staff dashboard) are worthless without that spine.

**Longest chain length (approx):** AUTH A–E (5) + COM B–E after COM-A (4) with COM-A overlapping AUTH-B = **~8–9 serial validated gates** on the customer track.

---

## Path B — Platform OS (highest platform leverage)

```
OPS-A → OPS-B → OPS-C → OPS-D → OPS-E
UX-A  → UX-B  → UX-C (⋯ OPS-E) → UX-D → UX-E
```

**Why critical:** OPS-A is the anti-fragmentation move. Delay here forces every module to invent timelines/notify/tasks — permanent debt. UX-A/B must lead UI work so Command Center (UX-C + OPS-E) does not ship snowflake CSS.

**Merge point:** OPS-E + UX-C/D/E = Universal Command Center product surface.

---

## Path C — Money-out / Blocker 4 (commercial launch)

```
PAY-001 S3 + Verified → FIN-003 C → D → E → Blocker 4 CLOSE
```

**Why critical:** CORE-002 Blocker 4 remains OPEN until this path completes. It is **capacity-isolated** from AUTH/UX but must not be starved — finance/security reviews dominate calendar, not just eng days.

---

## Path D — Native PWA COMPLETE

```
PMX-004 P1 Final PASS → P2 → … → P7/P10 gates → P11 pilot → COMPLETE
```

**Why critical:** Phase 1 code exists; **evidence gate** is the bottleneck. Completing Final PASS unlocks the rest of the package without blocking AUTH/OPS foundation.

---

## CTO critical-path recommendation

| Priority | Path | Rationale |
|----------|------|-----------|
| **P0** | M0: PMX-1 Final PASS + PAY verify + infra | Unlocks M1 Authorizes |
| **P0** | M1 serial: UX-A → OPS-A → AUTH-A | Official first implementation ladder |
| **P1** | Path A through AUTH-C + COM-B | Real customers + invites |
| **P1** | Path B through OPS-B + UX-B | Notify/timeline usable |
| **P1** | Path C when PAY Verified | Do not slip money reviews |
| **P2** | AUTH-D/E, COM-C–E, OPS-C–E, UX-C–E, PMX mid phases | Depth + Command Center |
| **P3** | FIN-D/E, PMX-11, UX-E polish, Production Launch Validation | Certification & COMPLETE |

**True “longest pole” for platform maturity:** Path B through OPS-E + UX-E (Command Center).  
**True “longest pole” for revenue ops:** Path A through COM-E.  
**True “longest pole” for launch blocker close:** Path C (calendar/risk dominated).

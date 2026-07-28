# 08 — Milestone Timeline

**Package:** CORE-003  
**Status:** ✅ Approved — timeline is planning-grade under serial Authorize  
**Clock:** Relative program weeks from CORE-003 Approve (W0). Assumes focused capacity per [06](./06-resource-plan.md); Authorize remains one slice at a time. Slips if money reviews or device lab starve.

---

## Timeline

| Milestone | Target | Exit criteria |
|-----------|--------|---------------|
| **MS-0** Production readiness | W0–W2 | CORE-003 Approved; PMX-004 P1 Final PASS; PAY-001 verify status published; infra validation recorded |
| **MS-1** Foundation live | W2–W5 | UX-A → OPS-A → AUTH-A each Validated (serial); PMX-1 remains Certified |
| **MS-2** First provisioned customer path | W5–W8 | AUTH-B + COM-A Validated; OPS-B + UX-B Validated; PMX-2 per authorize |
| **MS-3** Invited multi-user + trial | W7–W10 | AUTH-C + COM-B Validated; OPS-C Validated |
| **MS-4** Entitled dashboards + health | W10–W14 | AUTH-D + COM-C Validated; OPS-D in progress/Validated |
| **MS-5** Ops Command Center | W14–W18 | OPS-E Validated; UX-C Command Center PASS; AUTH-E + COM-D Validated |
| **MS-6a** Money-out (if PAY ready) | W8–W16* | PAY Verified → FIN-C → D → E; Blocker 4 CLOSE eligible |
| **MS-6b** Native COMPLETE | W12–W20* | PMX Phases through 11 PASS |
| **MS-7** Program spine complete | W18–W22 | COM-E + UX-E Validated; streams closed or explicitly deferred |

\* Money and PMX calendars are **gate-dominated**; they may finish earlier or later than customer/OPS spines without reordering M1–M5.

---

## Gantt (conceptual)

```
W0    Approve CORE-003
W0-4  M1 Foundation ||||||||||
W3-7  M2 Provision/Activate/Notify      ||||||||||
W6-10 M3 Invites/Trial/Tasks                 ||||||||||
W9-14 M4 Authz/Health/AI ops / FIN-C?*            ||||||||||
W13-18 M5 Recovery/Offboard/Command Center/FIN-D       ||||||||||
W16-22 M6 Dashboards/UX-E/FIN-E/PMX-11                      ||||||||||

Money*  ----PAY----|------FIN-C------|--D--|--E--|
PMX*    -P1 PASS-|--P2-4--|--P5-7--|--P8-10--|-P11-|
```

---

## Decision checkpoints

| Week | Decision |
|------|----------|
| W0 | Approve CORE-003; staff streams |
| After MS-1 | Authorize M2 package slices only if M1 exits met |
| Before FIN-C | Independent money GO/NO-GO (existing FIN-003/PAY docs) |
| Before claiming Command Center | Require OPS-E + UX-C validate |
| Before PMX COMPLETE | Phase 11 pilot evidence only |

---

## What “on track” means

- No slice Authorize jumped ahead of [05](./05-master-implementation-order.md) without CORE-003 amendment.  
- Parallel sets match [04](./04-parallel-workstreams.md).  
- Blocked units in [02](./02-dependency-graph.md) remain locked.  
- Roadmap status updated after each MS exit.

# 07 — Design Partner Simulation

**Package:** DPX-002  
**Status:** Approved — execute during implementation  
**Rule:** Complete the workflow as if managing a **real** property. **Every hesitation is a bug** (Amendment C — Friction Timer).

---

## Protocol

1. Use production (or production-like) data for one property + resident + open WO.  
2. Run certified path **S1→S10**.  
3. Run **End-of-Day Test** (Amendment G): Morning → Priorities → Properties → Residents → Maintenance → Messages → Payments → Reports → Dashboard.  
4. On every pause/unsure click: log screen · reason · time lost · better alternative → [10](./10-friction-from-this-sprint.md).  
5. At every screen: Operator Confidence (Amendment F) — would an experienced PM trust this immediately?

## Observation log

**Certification run:** 2026-07-21 · Canopy Property Partners · local then production verify

| Time | Step | Observation | Type | Time lost (s) | Better alternative | Friction ID |
| --- | --- | --- | --- | --- | --- | --- |
| — | S1 | Command glance readable; priorities first | — | 0 | — | — |
| — | S3–S4 | Property/Resident load; toolbelts clear | — | 0 | — | was T001–T003 |
| — | S5–S6 | Continue chips prevent back-hunt | — | 0 | — | was DPX2-005/006 |
| — | S8–S9 | Assign vendor on-page; Message → Cert Resident thread | — | 0 | — | was T005 |
| — | S10 | Notify owner prefilled | — | 0 | — | was T006 |
| — | Return | Dashboard via breadcrumb/logo | — | 0 | — | — |

No new hesitation defects on the certified path after P2.

## Pass contribution

- Continuous feel (Amendment B)  
- Next actions obvious (Amendment A)  
- Hesitations filed with Friction Timer fields  
- Confidence ≥ 9/10 on path surfaces  
- End-of-Day interruptions filed

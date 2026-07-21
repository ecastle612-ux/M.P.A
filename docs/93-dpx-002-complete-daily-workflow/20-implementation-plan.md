# 20 — Prioritized Implementation Plan (Phase 6 gate)

**Package:** DPX-002  
**Rule:** Implement highest-friction first. No drive-by redesigns. Preserve APIs, permissions, architecture.

---

## Sequence

| Order | ID | Work | Why | Est. effort |
| --- | --- | --- | --- | --- |
| 1 | DPX2-001 | Fix RSC import of `buildAiPageContext` (Property + WO + any sibling) | Unblocks path | S |
| 2 | DPX2-002 | Fix Resident detail load error | Unblocks path | S–M |
| 3 | Re-run baseline S1→S10 live | Evidence for after metrics | S |
| 4 | DPX2-007 | Property Next Action: Residents | Continuity S3→S4 | S |
| 5 | DPX2-003 | Contextual Message from resident/WO | Removes inbox hunt | M |
| 6 | DPX2-008 | Maintenance default filter alignment | Stops false empty | S |
| 7 | DPX2-004 | Notify owner from property/WO context | Completes S10 | M |
| 8 | P2 batch | Lease/payment return chips, dashboard density, AI labels, hydration | Polish | M |

## Out of scope until PASS

- New modules / nav items  
- DPX-003+ workflows  
- Visual redesign for aesthetics only  
- EP-019 performance deep dive  

## Definition of ready for next implement slice

After each slice: update [05-measurement.md](./05-measurement.md) deltas + close friction rows + re-check heat map.

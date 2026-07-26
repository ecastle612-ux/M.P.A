# 15 — Acceptance Criteria

**Package:** FAC-002  
**Bar:** [V1.0 Mission](../00-governance/v1-0-implementation-mission.md) §2 + [Definition of Done](../00-governance/definition-of-done.md) (applicable rows)

A FAC-002 slice is complete only when:

| # | Criterion |
|---|-----------|
| 1 | Matches approved design for that slice |
| 2 | Implemented on shippable git baseline (not WIP-only) |
| 3 | Integrated with permissions |
| 4 | Notifications wired where §13 requires (or explicitly N/A documented) |
| 5 | Reporting wired where §12 requires (Slice D) |
| 6 | Mobile + desktop usable |
| 7 | E2E happy path tested (Playwright or certified manual script) |
| 8 | No FutureRelease / coming soon on advertised Facility V1 surfaces |
| 9 | Reuses FAC-001 memory + existing WO/vendor — no parallel systems |
| 10 | Inventory add path remains Photo → Name → Save |
| 11 | Works with Property Operations **unlicensed** ([18](./18-facility-independence.md)) |
| 12 | Facility nav hidden when `module:facility_operations` off |

---

## Package-level V1.0 Facility COMPLETE

All slices A–D accepted + Production deploy of final slice SHA + role smoke:

- Technician: dashboard → open WO → complete path  
- Manager: PM schedule → see draft WO → calendar  
- Inventory: add item in ≤3 steps  
- Inspection: complete → Facility Record visible  
- **Facility-only org** (no Property module): full path above with zero tenant/lease/rent UI  

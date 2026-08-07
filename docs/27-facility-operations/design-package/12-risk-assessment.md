# 12 — Risk Assessment

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Approved

---

## Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R1 | Engineers invent FO-only WO system | High | [07] binding; boundary tests; code review gate |
| R2 | FO clones PM Maintenance UX confusingly | High | Queue filters; Facility-only mounts shared execution components |
| R3 | Scope creep into Capital/ERP | Medium | E.7 future; ADR-010 accounting deferral stands |
| R4 | PM feature freeze broken during FO Implement | High | Slice authorize scope lists; CI ownership checks |
| R5 | Attention engine becomes unread noise | Medium | Severity ranking; only state-derived items |
| R6 | Incomplete MA testability | High | [09] required for slice cert |
| R7 | Schema prefix drift into `property_` | Medium | [06] prefix plan; review checklist |
| R8 | Complete Platform dual-home confusion | Medium | Launcher rules; no merged MC |
| R9 | PM generator double-creates WOs | Medium | Idempotency keys on generation runs |
| R10 | Design Approved but Implement skips E.1 | High | Gate: E.1 authorize only first |
| R11 | Integrations/sensors assumed in E.1 | Low | Manual status first; integrations later |
| R12 | Documentation drift vs module map | Medium | Package cites map; ownership unchanged |

---

## Out of scope risks (accepted)

- Full BIM/CAD parity — not a goal  
- Offline field app — future native strategy  
- Automatic regulatory content libraries — customer-defined obligations first  

---

## Go-forward controls

1. Implementation Gate + per-slice authorize  
2. Master Admin certification mandatory  
3. Dependency-cruiser / boundary checks remain on  
4. No weakening of lint/architecture protections for FO speed  

---

## Related

- [10 Implementation Order](./10-implementation-order-and-slices.md)  
- [Gate package](../index.md)  

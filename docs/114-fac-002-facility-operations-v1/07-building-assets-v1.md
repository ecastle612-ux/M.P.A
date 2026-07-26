# 07 — Building Assets V1

**Package:** FAC-002  
**Extends:** FAC-001 Slice C

---

## Already delivered

FacilityAsset registry, types, profile shell, repair history link, property/unit sections, search.

---

## V1.0 additions (design)

| Capability | Behavior |
|------------|----------|
| Photos | Multiple via media foundation |
| Warranty | Start/end dates + notes; optional notify before expiry |
| Manuals | Vault document links (`entity=asset`) |
| Service history | Existing repair/Facility Record link — improve presentation |
| Preventive maintenance | List schedules for asset + add schedule CTA |
| Expected life | Optional install date + expected years → simple “age / remaining” display |
| Replacement planning | Optional flag + target year + notes (list report later) — not a CAPEX GL |

---

## Types (examples — extensible)

HVAC, Boilers, Elevators, Roofs, Fire systems, Water heaters, Smoke detectors, CO detectors, Generators, Custom.

---

## Non-goals

- Full asset passport marketplace  
- Depreciation accounting  
- Duplicate “equipment” table outside FacilityAsset  

# 16 — Risks & Non-Goals

**Package:** FAC-002

---

## Risks

| Risk | Mitigation |
|------|------------|
| Scope balloon into WMS / CAPEX / compliance | Hard non-goals; slice Authorize only |
| Parallel history DB | FAC-001 extension law |
| Colliding with AUTH/shell agents | Collision boundary in [02](./02-baseline-and-reuse.md) |
| PM job duplicates WOs | Idempotent occurrence → WO |
| Push unavailable | Workflows work via in-app + email |
| Overwhelming PM dashboard | Calendar is one deep link; tech dashboard separate |
| Cert docs ahead of HEAD | Slice DoD requires shippable baseline |
| Facility coupled to rental IA | [18 Independence](./18-facility-independence.md) + subscription SoT |
| Showing unlicensed modules | Hide nav — no grey/upgrade clutter |

---

## Non-goals (summary)

- Inventory check-in/out  
- Vendor accounts  
- AI-required workflows  
- Second WO / shell / theme / permission system  
- Native mobile app  
- Full GL / depreciation  
- Jurisdictional compliance engine  

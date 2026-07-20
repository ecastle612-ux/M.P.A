# 11 — Definition of Done

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked  

This DoD applies to **post-Approve Implementation Phase 1**. It is not authorization to implement now.

---

## Gate prerequisite

- [ ] FAC-001 README status is **Approved**  
- [ ] [12 Approval Checklist](./12-approval-checklist.md) signed  
- [ ] Open Approve questions (Q1–Q5) recorded with decisions  

---

## Architecture DoD

- [ ] FacilityOperationsService (or equivalent) is the append/read entry for facility memory  
- [ ] Existing WO create/assign/complete UX behavior unchanged  
- [ ] Vendor assignment still works (bridge acceptable)  
- [ ] No accounting write paths introduced from Facility Ops  

---

## Facility Records DoD

- [ ] Completing/closing a WO creates an idempotent Facility Record  
- [ ] Record includes issue, resolution, provider snapshot, dates, property/unit, WO link  
- [ ] Normal users cannot edit; admin correction uses supersede chain  
- [ ] Records never hard-deleted in Phase 1  

---

## Timeline & History DoD

- [ ] Property Timeline shows repair completion events (+ adopted lifecycle events if in scope)  
- [ ] Property History hub: Repairs, Assets (if shipped), Documents, Timeline, basic stats/factors  
- [ ] Unit History shows unit-scoped repairs / related slices  

---

## Service Provider DoD

- [ ] Service Provider model exists with typed providers  
- [ ] Existing vendors bridged (`legacy_vendor_id` or equivalent)  
- [ ] Facility Records resolve providers without breaking WO assign  

---

## Search DoD

- [ ] Facility-oriented queries return repairs + providers + units/properties (assets/media as available)  
- [ ] Prefer Command Center / existing search extension — no parallel silo  

---

## Future hooks DoD

- [ ] PM / AI / compliance documented extension points only — not implemented  
- [ ] Property Health factors available as raw signals — no scoring algorithm  

---

## Verification DoD (Implement phase)

- [ ] TypeScript clean for touched packages  
- [ ] ESLint clean for touched files  
- [ ] Targeted browser verification of History + record creation on WO complete  
- [ ] Do **not** require full-repo validation unless CI already mandates  

---

## Explicitly not DoD for Phase 1

- Preventive maintenance schedules  
- Predictive maintenance  
- AI recommendations  
- Compliance engine  
- Forced Vendor API deprecation  
- Operations Center redesign  
- FIN-001 / accounting changes  

---

## Success narrative

> A property manager closes a roof repair WO, opens Property History, and immediately sees a permanent Facility Record with who fixed it, when, photos, and warranty — then finds the same event on the Property Timeline years later.

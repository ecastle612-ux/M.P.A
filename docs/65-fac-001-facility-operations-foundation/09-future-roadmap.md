# 09 — Future Roadmap

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked  

**Rule:** Everything here is **documented only**. Do **not** implement in FAC-001 Phase 1.

---

## Extension law

Future features **consume Facility Records, Timeline, Assets, and Providers**. Forbidden: parallel “history” databases inside AI, PM, or compliance modules.

---

## Preventive maintenance

- Recurring schedules per asset/property  
- Seasonal templates (HVAC spring/fall, smoke detectors, …)  
- Compliance reminders (inspections, certifications)  
- Auto-create draft Work Orders from due schedules  
- Completion writes Facility Records + Timeline

## Asset lifecycle

- Expected life dashboards  
- Replacement planning / capital lists  
- Install → service → replace chains  

## Predictive maintenance / AI (IA-001)

- Repeated repair detection  
- Replace vs repair recommendations (explainable, dismissible)  
- Warranty recommendations  
- Vendor / provider performance summaries  
- Property Health insights from [07](./07-property-health.md) factors  
- Capital planning narratives  

**AI may never** silently delete history, invent completed repairs, or auto-spend money.

## Warranty automation

- Expiry notifications (API-001)  
- Coverage check at WO create  

## Compliance engine

- Jurisdictional checklists  
- Evidence vault packs  
- Audit exports  

## Media

- Before/after galleries  
- Future video attachments  
- Mobile capture offline queue  

## Suggested sequencing (non-binding)

| Wave | Items |
| --- | --- |
| A | Facility Records + Timeline + Provider bridge + Property History |
| B | Assets + Warranties + Search depth |
| C | PM schedules + reminders |
| D | IA-001 facility insights |
| E | Compliance engine |

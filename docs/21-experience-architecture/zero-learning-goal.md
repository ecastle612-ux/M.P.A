# Zero Learning Goal

**Status:** Draft for approval  
**Part of:** Phase 1.6 Experience Architecture

---

## Goal

M.P.A. should feel understandable **without training**.

A new property manager, tenant, owner, or vendor should reach competence through **structure, language, and feedback** — not through courses, PDFs, or hostage product tours.

---

## Design Principles That Make Zero Learning Possible

### 1. Speak the job, not the database
Use “Work order”, “Rent due”, “Lease ending” — not entity codes or internal table names in the UI.

### 2. Recognition over recall
Show lists, chips, statuses, and attached context. Do not require users to remember IDs or where they filed something.

### 3. One primary action
Every view teaches itself by making the next step visually and verbally obvious.

### 4. Progressive disclosure
Basics first; power second. Experts can go deeper; beginners are never punished with full complexity.

### 5. Consistent interaction grammar
Opening any record feels the same: context header → status → next action → history.

### 6. Inline teaching beats manuals
Empty states, errors, and waiting copy teach the model of the world. Help links are secondary.

### 7. Defaults that match real life
Sensible defaults (due dates, assignees, notification prefs) reduce decisions. Ask only what the system cannot infer.

### 8. Optional guidance, never blocking tours
Tips can exist. They must be dismissible and never prevent work.

### 9. Role-native simplicity
Tenants and vendors get fewer concepts. PMs get density **with** the same grammar — not a different product logic.

### 10. Show consequences before commitment
“Tenant will be notified.” “Owner will see this expense.” Prediction teaches the system safely.

---

## How We Measure Zero Learning

| Signal | Pass |
|--------|------|
| First-five exit criteria | Met without human trainer |
| Task success (core flows) | Completes without documentation |
| Time to first confident action | Short; no “where do I click?” loops |
| Support volume for “how do I…?” | Declines as product matures |

---

## What Zero Learning Is Not

- Dumbing down professional PM workflows  
- Hiding necessary complexity forever  
- Replacing skill — PMs still make judgments  
- Endless tooltips that create noise  

Zero learning means **the interface carries the model**; the user supplies judgment.

---

## Related

- [First Five Minutes](./first-five-minutes.md)
- [Experience Principles](./experience-principles.md) — Principle 15
- [Micro Interaction Philosophy](./micro-interaction-philosophy.md)

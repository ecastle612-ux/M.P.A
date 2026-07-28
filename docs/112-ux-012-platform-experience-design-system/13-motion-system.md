# 13 — Motion System

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Tokens:** Canopy motion tokens

---

## Principle

Motion creates **presence and hierarchy**, not noise.  
Every animation needs a job: orient, confirm, or explain continuity.

---

## Microinteractions

| Interaction | Behavior |
|-------------|----------|
| **Hover** | Subtle lift/contrast; ≤150ms |
| **Tap / click** | Press feedback; no long bounce |
| **Drag** | Clear grab cursor; drop target highlight |
| **Swipe** | Sheet follows finger; snap points |
| **Focus** | Instant ring; no delay |

---

## Transitions

| Type | Use |
|------|-----|
| Fade / short slide | Panel enter |
| Shared continuity | List → detail (keep context) |
| Cross-fade | Tab content |

Durations: Canopy `motion.fast` / `motion.normal` / `motion.slow`.  
Easing: standard product ease; no elastic gimmicks.

---

## Loading / completion

| State | Motion |
|-------|--------|
| Loading | Skeleton shimmer restrained; or determinate progress |
| Success | Brief check / toast — don’t block |
| Error | Shake avoided; prefer color+text banner |
| Completion of wizard | Calm confirm; confetti forbidden in ops UI |

---

## Reduced motion

See [12](./12-accessibility.md) — cut distance/duration; keep opacity fades minimal or none.

---

## Anti-patterns

- Parallel bouncing widgets on Command Center  
- Page-wide parallax in product  
- Infinite attention-seeking pulses on non-critical items  
- AI “glow breathing” as default  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| MO-01 | Hover/tap/drag/swipe/load/success/error patterns defined |
| MO-02 | Uses Canopy motion tokens |
| MO-03 | Reduced motion respected |
| MO-04 | No decorative motion storms |

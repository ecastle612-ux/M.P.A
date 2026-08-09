# Sprint 2 — First Run Experience Report

**Status:** Complete — handoff polish only (not Sprint 3 MC program)  
**Date:** 2026-08-09  

## Question

After Guided Setup, does Mission Control feel like:

> “Congratulations. Your organization is now operational.”

## Evaluation (before polish)

| Question | Before | After |
|----------|--------|-------|
| Where to begin? | CTA present but empty state said “earlier journeys” | Welcome + “Where to begin” + aligned empty state |
| What to configure next? | Single nextAction only | Numbered guidance: property → team → residents/leases |
| What first task? | Add property implied | Explicit: add first property (name + units enough) |
| Operational confirmation? | Missing | “Congratulations. Your organization is now operational.” |
| Assistant guidance? | Recommendation when loaded; `successCopy` unused | Surfaces `successCopy` when daily ops present |

## Changes (existing functionality only)

1. **Welcome banner** when setup complete, zero properties, no daily ops yet.  
2. **Eyebrow** “Getting started” on first run.  
3. **Where to begin** panel reuses existing `nextAction` + ordered list of already-supported follow-ons.  
4. **EmptyState** copy aligned with Add first property — no invented journeys.  
5. **Focus ring** on primary next-action link for keyboard users.

## Out of scope (Sprint 3)

- Full Mission Control visual redesign  
- New dashboards, widgets, or assistant workflows  
- Product/home routing changes for FO / Complete  

## Acceptance criteria for Owner

- [ ] First-run welcome reads as operational confirmation  
- [ ] Customer never sees “earlier journeys” jargon on empty MC  
- [ ] First task is unambiguously add property  
- [ ] No new features beyond presentation of existing next actions  

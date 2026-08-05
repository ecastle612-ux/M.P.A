# 11 — Approval Checklist

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05

Sign-off requires Product + UX + Lead Architect (and OPS owner if Command Center data mapping changes presentation assumptions).

---

## Product

- [ ] Work-before-navigation philosophy accepted  
- [ ] Six-section dashboard hierarchy accepted as binding  
- [ ] Role specializations cover required surfaces  
- [ ] Non-goals (no business logic / routing / permissions changes) accepted  
- [ ] Slice plan A–D acceptable or amended in approval record  

## UX

- [ ] Five-second test is the pass bar  
- [ ] Sidebar workflow grouping acceptable  
- [ ] Top bar constraint acceptable  
- [ ] Notification Critical / Today / Later acceptable  
- [ ] Mobile order + bottom-nav frequency acceptable  
- [ ] Empty/loading/a11y bars acceptable  

## Architecture

- [ ] No conflict with AUTH-001 dashboard assignment  
- [ ] Reuses OPS priority/queue signals (no parallel engine)  
- [ ] UX-013 matrices remain destination SoT; UX-016 owns grouping presentation  
- [ ] UI-001 / UX-012 inheritance relationship clear  
- [ ] ADR-032 ready to Accept on Approve  

## Open questions

- [ ] [14 — Open questions](./14-open-questions.md) resolved or explicitly deferred with owner  

---

## Approve phrase

```text
APPROVE UX-016
```

Record in [12](./12-approval-record.md). Then authorize slices individually.

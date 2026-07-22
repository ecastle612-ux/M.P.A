# 09 — AI Experience

**Package:** DPX-003  
**Status:** Draft — awaiting Approve

---

## Principle

Floating AI is an **operational assistant**, not a chatbot.

When opened it must understand:

- Current page  
- Current property (when in scope)  
- Current resident (when in scope)  
- Current work order (when in scope)  
- Current workflow  

Provide useful **operational** suggestions.

**Never** generic conversation starters.

## Builds on

- DPX-002 operational labels (list vs detail)  
- AI-001 / SH-002 context store isolation  
- UX-009 floating AI assistant rules  

## Pass checks

| Check | Pass |
| --- | --- |
| Dashboard → priority-handling suggestion | ☐ |
| Property → property-scoped ops suggestion | ☐ |
| Resident → account / next-step suggestion | ☐ |
| WO → next-step suggestion | ☐ |
| No “Hi, how can I help?”-style generics as primary CTA | ☐ |

# 05 — Future Development Rule

**Standard:** STD-001  
**Status:** ✅ Binding  
**Date:** 2026-08-05  
**ADR:** [ADR-033](../18-decision-log/adr-033-ux016-platform-standards-mandatory.md)

---

## Rule

> **Every new feature must inherit UX-016 / STD-001.**  
> No future module may introduce its own dashboard or navigation pattern unless approved through governance.

```
Design → Document → Approve → Implement
```

still applies. STD-001 is the **default approved UX baseline** for homes and navigation. Inheritance is automatic; deviation is exceptional.

---

## Automatic inheritance (default path)

When implementing a new operational module or role home:

1. Mount the Universal Dashboard Framework.  
2. Fill sections with module-scoped signals (entitlement-safe).  
3. Use the permanent sidebar groups; add destinations into the correct group.  
4. Feed M.P.A. Assistant / Waiting / Recommended from existing queues.  
5. Use Critical / Today / Later for notification presentation.  
6. Cite STD-001 + ADR-033 in the PR.

No new UX initiative is required for normal module expansion.

---

## Forbidden without amendment

| Forbidden | Why |
|-----------|-----|
| Per-module custom dashboard anatomy | Breaks five-second familiarity |
| Competing primary sidebar taxonomy | Breaks workspace model |
| KPI-first module homes | Violates work-first law |
| Ungrouped notification dumps as home story | Violates Smart Notifications |
| Chatbot-first replacement of Assistant briefing | Violates ADR-006 + STD-001 |
| Reopening UX-016 slices | Package is **CLOSED** |

---

## Exception path (governance)

A material deviation (new home anatomy, new nav model, Assistant redesign) requires:

1. **Design** of the change and impact on STD-001  
2. **Document** as a new package or ADR amendment (not an UX-016 slice)  
3. **Approve** by Product + UX + Lead Architect  
4. **Update** STD-001 / ADR-033 (or superseding ADR) before Implement  

Silence is not approval.

---

## Program transition

Platform-wide UX redesign work is complete for this era.

Next program focus: **Core Platform Expansion** — [CORE-004](../120-core-004-core-platform-expansion/README.md) — implementing remaining operational capabilities while inheriting these standards automatically.

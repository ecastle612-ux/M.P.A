# 01 — Permanent UX Standard

**Standard:** STD-001  
**Status:** ✅ Binding  
**Date:** 2026-08-05  
**Source:** UX-016 (Certified / Closed)

---

## Law

Every future M.P.A. dashboard / home canvas **must inherit** the following composition. Labels may adapt by role. **Order and presence rules must not** without a governance-approved amendment.

```
1. Greeting
2. M.P.A. Assistant
3. Waiting on Me
4. Waiting on Others
5. Immediate Attention
6. Today's Mission
7. Recommended Actions
8. Quick Actions
9. Operational Timeline   (Recent Activity — meaningful events only)
10. Insights              (below the fold)
```

Optional Quick Wins may sit with Recommended Actions. Empty Waiting sections may omit chrome. Insights must never lead the first viewport.

---

## Five-second test (permanent)

On open, the user must answer:

1. Who am I?  
2. Where am I?  
3. What needs my attention?  
4. What should I do next?  
5. How do I start working?

Failure of this test is a **product defect**, not a stylistic preference.

---

## Section intent (binding)

| Section | Answers |
|---------|---------|
| Greeting | Who / where / when / calm status |
| M.P.A. Assistant | Operational briefing — Today · Highest Priority · Recommended Next Action |
| Waiting on Me | What requires *my* approval, signature, assignment, or response |
| Waiting on Others | What I’m blocked on (vendor, resident, owner, payment, inspection) |
| Immediate Attention | Highest-priority items only (≤ 5) |
| Today’s Mission | Today’s workload summary |
| Recommended Actions | Highest-value next steps (deterministic) |
| Quick Actions | Start new work (≤ 6) |
| Operational Timeline | What changed that matters |
| Insights | Supporting analytics only |

---

## Anti-patterns (permanent fail)

- Blank home / module launcher as hero  
- KPI wall above Immediate Attention  
- Parallel “custom dashboard” per module  
- Chronological notification dump as the home story  
- Chatbot-first entry replacing the Assistant briefing  

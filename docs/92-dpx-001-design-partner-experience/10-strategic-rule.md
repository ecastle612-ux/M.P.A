# 10 — Strategic Rule: Replace Friction

**Package:** DPX-001  
**Status:** ✅ **Approved** — permanent product rule  
**Approved with:** `APPROVE DPX-001` (2026-07-21)

---

## Rule

> **Every new feature must replace friction, not create it.**

If a feature makes the interface more complex than the value it provides, it must be redesigned before it is merged.

## Companion roadmap rule

> **No feature enters the roadmap unless it clearly saves time, reduces risk, improves communication, or removes friction for a property manager.**

Full intake filter: [11-usability-amendments.md](./11-usability-amendments.md).

## Why

M.P.A. wins by helping property managers get through their day faster and with less effort — not by feature count.

## How to apply (PR / gate)

Before merge / roadmap add, answer:

1. **What friction does this remove?**  
2. **What complexity does this add?**  
3. **Saves time / reduces risk / improves communication / removes friction?**  
4. **Net:** Does a PM’s day get easier?  

| Result | Action |
| --- | --- |
| Clear operator win | Proceed |
| Neutral / unclear | Redesign or defer |
| Adds complexity without replacing friction | **Block merge / block roadmap** |

## Relationship to Implementation Gate

Additional filter at Approve and PR review — does not replace Design → Document → Approve → Implement.

## Exceptions

Security, compliance, and data-integrity may add necessary steps. Document in the friction registry (category C).

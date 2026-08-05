# 06 — Notifications Priority Grouping

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Related:** [API-001 / OneSignal ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) · UX-012 notification prefs (A09) · PUSH-001

---

## Intent

Notifications must be **actionable**. Avoid long undifferentiated unread lists.

This package owns **presentation grouping and interaction**, not delivery infrastructure.

---

## Priority groups

| Group | Meaning | Presentation |
|-------|---------|--------------|
| **Critical** | Act now — safety, money failure, emergency ops | Top; distinct severity treatment; always visible when non-empty |
| **Today** | Actionable within the current workday | Second |
| **Later** | Informational / deferrable | Collapsed by default after Critical/Today |

Empty groups are omitted (do not show “Critical (0)”).

---

## Item requirements

Each notification row should include:

- Clear title (job language)  
- Why it matters (one line)  
- **Primary action** (deep link to finish)  
- Timestamp  
- Optional dismiss / mark read (existing behaviors)

If a notification cannot deep-link to a useful next step, it is a candidate for demotion or redesign (product content debt — not silent home spam).

---

## Home vs notification center

| Surface | Rule |
|---------|------|
| Dashboard Immediate Attention | Subset of Critical (and only the highest) — ≤ 5 |
| Notification center / panel | Full Critical → Today → Later grouping |
| Badge counts | Prefer actionable unread, not total historical unread |

---

## Anti-patterns

- Infinite chronological unread dump  
- Equal visual weight for marketing and emergency  
- Badge inflation from low-value events  
- Notifications that only open a dead-end list with no row action  

---

## Non-goals

- Changing OneSignal / provider choice  
- Redesigning email templates (EML-001)  
- New notification taxonomy schema unless Approve explicitly expands scope (prefer mapping existing types → Critical/Today/Later)

# Promise Evaluation Framework

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Draft

---

## Rule

If a capability appears in Property Manager navigation, Billing inclusions, Subscription Matrix, or Module Map, it is a **Customer Promise**.

A promise is **kept** only when a first-time customer can complete its primary workflow without guidance, documentation, or support — and Master Admin can certify that fact.

---

## Six questions

| # | Question | Pass means |
|---|----------|------------|
| 1 | **Discover** | Visible in entitled nav/home with honest label; first CTA or empty state points to it |
| 2 | **No documentation** | Labels, steps, and success state are self-explanatory |
| 3 | **No support** | No token pasting, env lore, or “ask us for the FO desk” |
| 4 | **Clear begin → end** | Customer knows start action and done state |
| 5 | **Matches advertise** | Behavior equals Billing / Module Map wording |
| 6 | **Master Admin validate** | Operator can run/observe a certification script without customer impersonation hacks |

Score each **Yes / Partial / No**.

| Aggregate | Meaning |
|-----------|---------|
| All Yes | **Promise kept** — eligible for launch |
| Any Partial | **Conditional** — not launch-ready without fix or honest de-advertise |
| Any No | **Promise broken** — launch blocker or must remove from advertise surface |

---

## Promise artifact template

Every capability uses:

```
PROMISE
  ↓
Customer Journey
  ↓
Current Status
  ↓
Friction Points
  ↓
Launch Blockers
  ↓
Recommended Fix
  ↓
Verification Steps
```

Plus the six-question scorecard.

---

## Advertise honesty law

Until a promise is kept:

- Nav readiness must not read as fully live (“Aligned” without workflow is dishonest).
- Empty states must say what is coming — or hide the entry.
- Billing “included” implies executable. Prefer **remove from customer claim** over shipping theater.

---

## Ordering law

Work is sequenced by **Customer Journeys** (outcomes), not by internal module ownership.

Example order: purchase → org → property → staff → resident → lease → sign → rent → maintenance → vendor → resolve → owner review.

See [Customer Journeys](./customer-journeys.md).

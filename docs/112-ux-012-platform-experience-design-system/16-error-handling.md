# 16 — Error Handling

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Related:** UX-003 trust/validation

---

## Principles

| Principle | Meaning |
|-----------|---------|
| Honest | Say what failed |
| Actionable | Offer retry / fix / support path |
| Contained | Prefer inline over blocking the whole app |
| Calm | No blame; no stack traces for end users |
| Logged | Correlate with OPS/support ids when useful |

---

## Patterns

| Severity | UI |
|----------|-----|
| Field | Inline under control |
| Form | Summary + field links |
| Page | Banner + retry |
| App | Full-page recovery with home link |
| Toast | Only for non-critical failures after action |

---

## Copy formula

```
[What happened]. [What to do].
```

Example: “Payment didn’t go through. Check your card or try another method.”

---

## Special cases

| Case | UX |
|------|-----|
| Offline | Clear offline banner; queue per PMX when applicable |
| Session expired | Return to sign-in; preserve return URL when safe |
| Permission denied | Explain; no fake empty data |
| AI failure | Continue manually |
| Partial success | State what saved vs failed |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| ER-01 | Severity → pattern map |
| ER-02 | Actionable copy formula |
| ER-03 | Offline/session/permission/AI cases covered |

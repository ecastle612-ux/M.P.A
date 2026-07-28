# 26 — Component Maturity Model

**Package:** UX-012  
**Amendment:** A05  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Every shared component has a **maturity state** before widespread use — preventing Draft experiments from becoming de facto platform UI.

---

## States

```
Draft
  → Experimental
  → Beta
  → Production
  → Deprecated
```

| State | Meaning | Allowed use |
|-------|---------|-------------|
| **Draft** | Design/API unstable | Package-internal only; not in product routes |
| **Experimental** | Spike; may break | Feature flags / non-critical surfaces only |
| **Beta** | API stable-ish; a11y incomplete | Limited modules with owner approval |
| **Production** | Tokenized, a11y, documented, reviewed | Default for product |
| **Deprecated** | Replacement exists | No new usage; migrate by date |

---

## Promotion gates

| From → To | Requires |
|-----------|----------|
| Draft → Experimental | Design sketch + owner |
| Experimental → Beta | Token compliance; basic a11y; story/docs |
| Beta → Production | Design Review + Accessibility Review; used in ≥1 certified journey; quality standards pass |
| Production → Deprecated | Replacement Production component + migration note |

---

## Inventory expectation

`packages/ui` (or equivalent) maintains maturity metadata per component.  
CI may block importing Draft outside allowlist (Implement slice).

---

## Acceptance (A05)

| ID | Criterion |
|----|-----------|
| CM-01 | Five maturity states defined |
| CM-02 | Promotion gates explicit |
| CM-03 | Production required for widespread use |
| CM-04 | Deprecated has migration path |

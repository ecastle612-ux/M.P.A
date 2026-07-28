# 03 — Component Standards

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Related:** [12 Component Standards](../12-component-standards/index.md) · Canopy component philosophy

---

## Binding rule

```
If a UI need exists in the system → reuse the standard component.
Do not invent a parallel control for the same job.
```

New primitives require UX-012 amend + Canopy alignment before Implement.

---

## Composition hierarchy

```
Tokens (Canopy)
  → Primitives (Button, Input, Badge, …)
    → Patterns (Form field, Data table, Empty state, …)
      → Features (Command Center widgets, WO detail, …)
```

Features compose patterns; they do not restyle primitives ad hoc.

---

## Primitive checklist (must exist as one family)

| Primitive | Required states |
|-----------|-----------------|
| Button | default/hover/focus/active/disabled/loading |
| Input / Textarea / Select | default/focus/error/disabled |
| Checkbox / Radio / Switch | on/off/disabled + label |
| Badge / Tag | semantic variants |
| Avatar | image/initials/fallback |
| Link | inline / standalone |
| Icon | sized + labeled when actionable |
| Tabs | keyboard arrow nav |
| Menu / Combobox | typeahead where lists are long |
| Tooltip | supplementary only; never sole label |
| Modal / Drawer / Sheet | focus trap, dismiss rules |
| Toast / Banner | info/success/warn/error |
| Skeleton | layout-matched |
| Progress | determinate when known |

---

## Pattern standards

| Pattern | Rule |
|---------|------|
| Form field | Label + control + hint + error |
| Confirm destructive | Explicit verb (“Delete property”) |
| File / image acquire | UX-010 Capture + Upload when images |
| List + detail | Master/detail or drawer; preserve list context |
| Filters | Clear “filters applied”; reset |
| Pagination / infinite | Prefer pagination for ops tables; infinite for feeds |

---

## Do / Don’t

| Do | Don’t |
|----|-------|
| One primary button per section | Three filled primaries |
| Visible focus rings (token) | `outline: none` without replacement |
| Semantic HTML | Div soup buttons |
| Match Canopy density | Mix compact and airy randomly |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CS-01 | Primitive family + states defined |
| CS-02 | Features compose patterns, not one-offs |
| CS-03 | Destructive confirms required |
| CS-04 | New primitives need Approve |

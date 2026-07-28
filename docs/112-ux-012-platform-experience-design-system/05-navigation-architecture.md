# 05 — Navigation Architecture

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Related:** UX-008 mobile nav · AUTH dashboard assignment · OPS Command Center

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **Role-assigned home** | Command Center / portal home is AUTH-determined |
| **Shallow where possible** | Prefer ≤3 levels deep |
| **Labeled** | Icons + text in primary nav |
| **Entitlement-aware** | Hide unpurchased modules (COM/AUTH capability) |
| **Same destinations** | Deep links and nav agree |

---

## Desktop

| Pattern | Use |
|---------|-----|
| Side rail | PM / Org Admin / Master Admin |
| Top tabs | Within-module sections |
| Command palette / search | OPS Unified Search ([OPS-001 26](../111-ops-001-platform-operations-architecture/26-unified-search.md)) |
| Org / role switchers | Existing shell patterns; no fake portal picker |

---

## Mobile

| Pattern | Use |
|---------|-----|
| Bottom nav | Primary 3–5 destinations |
| “More” sheet | Secondary |
| Top context | Title + critical actions |
| FAB / quick actions | OPS Global Quick Actions when entitled |

Align UX-008 / PMX-004 — native feel, safe areas.

---

## Information architecture (meta)

```
Home (Command Center)
  → Work (Tasks / WO / Leasing queues)
  → Messages / Inbox
  → Portfolio (Properties) [role]
  → More (Reports, Settings, People)
```

Exact items vary by role ([08](./08-role-based-experiences.md)).

---

## Anti-patterns

- Duplicate entries to same place with different names  
- Nav items that 404 for entitlement  
- Hamburger-only primary IA on mobile for core jobs  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| NV-01 | Home assigned by role; not user-picked dashboard |
| NV-02 | Desktop rail + mobile bottom patterns defined |
| NV-03 | Entitlement-aware visibility |
| NV-04 | Search as navigation accelerator |

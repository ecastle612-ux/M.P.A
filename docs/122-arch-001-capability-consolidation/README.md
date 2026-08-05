# ARCH-001 — Capability Consolidation

**Standard ID:** ARCH-001  
**Status:** ✅ **Accepted** (2026-08-05) — permanent architectural principle  
**Issued with:** `APPROVE NAV-001`  
**Related:** [NAV-001](../121-nav-001-master-admin-hub-consolidation/README.md) · [ADR-034](../18-decision-log/adr-034-master-admin-single-hub.md) · [STD-001](../119-std-001-ux016-platform-standards/README.md)

---

## Platform rule

> **One capability. One authoritative home.**

No duplicate launchers. No mirrored navigation. No synonym pages.

---

## Default order of preference

```
Extend → Reuse → Consolidate → Create
```

When new functionality is introduced:

1. **Extend** an existing surface whenever practical.  
2. **Reuse** existing components.  
3. **Consolidate** duplicate navigation.  
4. Prefer **one operational hub** over multiple launchers.  
5. **New top-level destinations** require explicit architectural justification.

Creating a new top-level page is always the last option.

---

## Documents

| Doc | Purpose |
|-----|---------|
| [01 — Permanent principle](./01-permanent-principle.md) | Binding rule + review questions |

---

## Lesson

Don’t build more places — make the right place better.

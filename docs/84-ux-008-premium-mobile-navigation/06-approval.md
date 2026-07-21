# UX-008 — Approval Record

| Field | Value |
| --- | --- |
| Package | UX-008 Premium Mobile Navigation & Information Architecture |
| ADR | ADR-020 |
| Status | **Approved** |
| Approved by | Product owner (Erick) |
| Approved on | 2026-07-20 |
| Explicit statements | `APPROVE UX-008` · `ACCEPT ADR-020` |

## Approval statements received

```text
APPROVE UX-008
ACCEPT ADR-020
```

## Approved amendments (binding before / during implementation)

The following platform-scale requirements were accepted as part of UX-008 approval and are documented in [`07-platform-scale-navigation.md`](./07-platform-scale-navigation.md):

1. Search-first navigation (“Search M.P.A.”)
2. Favorites (pin most-used pages)
3. Recently visited
4. Company switcher reserved in header
5. Notification badges (Messages / Maintenance / Approvals / Leases when data exists)
6. Floating ＋ New quick actions (OS-style)
7. Operations Score header health slot
8. Collapsible brand header
9. Universal command palette reserved (`⌘K` / `Ctrl+K`)
10. Design rule: optimize for 3–5 year platform scale (40–60 modules)

## Implementation unlocked

Application / UI work for UX-008 may proceed **only** within:

- This package + ADR-020 (Accepted)
- Canopy + Experience Architecture (already Approved)
- UX-007 Adaptive Logo System (Completed)
- No schema / API / business-logic changes
- Existing routes + permissions as source of truth

Material scope expansion beyond the approved package restarts Design → Document → Approve.

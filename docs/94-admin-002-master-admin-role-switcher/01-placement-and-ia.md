# 01 — Placement and IA

**Package:** ADMIN-002  
**Status:** Draft

## Desktop

- Place control in top navigation (near org/profile), Master Admin only.
- Dropdown opens downward; Escape / outside click closes.
- When Test Mode or Impersonation is active, trigger label shows effective role; submenu still exposes Return.

## Mobile

- Same control in sticky header or Profile / More overflow if space is tight — prefer one tap from header.
- Dropdown must not cover primary CTAs permanently; use sheet if density requires.
- Floating AI launcher remains tappable (ADMIN-001 certification constraint).
- Mobile drawer: switcher must not steal focus trap incorrectly; close drawer before navigating if needed.

## Coexistence

| Surface | Rule |
| --- | --- |
| ADMIN-001 banner | Remains authoritative; switcher is a faster entry, not a replacement |
| Impersonation Center | Full browse/search; switcher is the shortcut |
| RoleSwitcher (existing shell) | Do not confuse with membership RoleSwitcher for multi-role users — label Master Admin control distinctly (“Master Admin” / “Act as”) |

## Reuse

Wire exclusively to ADMIN-001 session APIs:

- `POST /api/master-admin/portal-test`
- `POST /api/master-admin/impersonation/start`
- `POST /api/master-admin/impersonation/end`

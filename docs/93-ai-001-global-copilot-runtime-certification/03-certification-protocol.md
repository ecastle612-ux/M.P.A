# 03 — Certification Protocol

**Package:** AI-001

Enable debug: `localStorage.setItem("mpaDebugShell","1")` then hard refresh.

## A. Presence & tap (every authenticated area)

For each route below, confirm:

1. AI bubble visible (bottom-right; above mobile chrome)
2. Single tap opens panel
3. Single tap / Close / Esc closes panel
4. Page still scrolls after close
5. Context label / suggestions match the screen

| Area | Route examples | Pass? | Notes |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | ☐ | Expect “What requires attention today?” |
| Properties | `/properties`, `/properties/[id]` | ☐ | Detail uses labeled bridge |
| Residents | `/tenants`, `/tenants/[id]` | ☐ | |
| Units | `/units` | ☐ | |
| Applicants | `/applicants` | ☐ | |
| Maintenance | `/maintenance`, `/maintenance/[id]` | ☐ | |
| Messages | `/communications` | ☐ | |
| Financials | `/financials` | ☐ | |
| Reports | `/financials/reports` | ☐ | |
| Settings | `/settings/*` | ☐ | |
| Owner Portal | `/portal/owner` | ☐ | |
| Tenant Portal | `/portal/tenant` | ☐ | |

## B. Shell survival

| Stress | Pass? |
| --- | --- |
| Navigate 8+ routes without full reload — bubble persists | ☐ |
| Toggle Light/Dark in Settings → Appearance | ☐ |
| Open/close mobile Menu drawer — bubble still tappable when drawer closed | ☐ |
| Open AI, background tab, return — panel state sane | ☐ |
| Mobile keyboard open on Ask field — can still Close | ☐ |

## C. Devices

| Device | Pass? |
| --- | --- |
| Desktop | ☐ |
| Tablet | ☐ |
| Mobile (primary) | ☐ |

## Fail conditions

- Multiple taps required to open
- Bubble not visible on an authenticated PM/portal route with `ai:read`
- Drawer closed but bubble untappable
- Context stuck on wrong entity after navigation
- Scroll locked after close

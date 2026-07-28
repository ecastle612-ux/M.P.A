# 06 — Mobile UX

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Related:** [PMX-004](../106-pmx-004-native-pwa-parity/README.md) · UX-008

---

## Goals

Mobile must feel **native**: fast, thumb-friendly, safe-area aware, installable (PWA), offline-tolerant where PMX defines.

---

## Touch targets

| Rule | Value |
|------|-------|
| Minimum target | **44×44 px** (prefer 48) |
| Spacing between targets | ≥ 8px |
| Primary CTA | Full-width or thumb-zone bottom |

---

## Gestures

| Gesture | Use |
|---------|-----|
| Tap | Activate |
| Long-press | Optional secondary (always have visible alternative) |
| Swipe | Sheets dismiss / list actions with reveal — never only swipe |
| Pull-to-refresh | Feeds/lists where data freshness matters |
| Edge swipe back | Respect OS; don’t trap |

---

## Bottom navigation

- 3–5 items max  
- Active state obvious  
- Badges for unread/priority  
- “More” for overflow  

---

## Keyboard behavior

- `inputmode` appropriate (tel, numeric, email)  
- Avoid jumpiness: `visualViewport` / sticky actions accounted for  
- Forms: next field focus logical; Done dismisses  

---

## Safe areas

Respect notch/home indicator insets on fixed bottom bars, FABs, sheets.

---

## Responsive / tablet / orientation

| Form | Behavior |
|------|----------|
| Portrait phone | Default; single column |
| Landscape phone | Keep critical actions reachable; avoid tiny side nav |
| Tablet portrait | Optional split master/detail |
| Tablet landscape | Closer to desktop rail when width allows |

---

## Installation onboarding

- PWA install prompt timing per PMX-004 (not nagging)  
- Success state: clear “Add to Home Screen” benefit  
- Post-install: land on role Command Center  

---

## Native feel checklist

| Check |
|-------|
| No desktop-only hover dependency |
| Bottom sheets over center modals for secondary |
| Skeleton loading on navigation |
| System font scaling respected |
| Reduced motion honored |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| MB-01 | 44px targets; bottom nav; safe areas |
| MB-02 | Gestures have non-gesture alternatives |
| MB-03 | Keyboard/viewport behavior defined |
| MB-04 | PWA install UX references PMX-004 |

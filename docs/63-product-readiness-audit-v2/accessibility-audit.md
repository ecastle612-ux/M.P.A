# Accessibility Audit — Product Readiness v2

**Date:** 2026-08-10  
**Code changes:** None

## Strengths

- Skip-to-content in ApplicationShell / MasterAdminShell
- Resident bottom nav `aria-current`
- Some admin OpsDirectoryTable inputs have visible labels
- Modal primitive includes focus trap (but unused)

## Gaps

| Issue | Severity | Evidence |
|-------|----------|----------|
| Finance amount fields use placeholder-as-label | P1 | `finance-desk.tsx`, collections patterns |
| Mobile nav via unstyled/custom `<details>` summary | P2 | `responsive-navigation.tsx`, admin shell |
| Destructive confirms without Modal focus trap | P2 | Modal unused |
| Icon-only chrome buttons may lack consistent aria-labels | P3 | notification/command triggers |
| Marketing comparison tables may be hard for SR (layout tables) | P2 | landing/pricing |
| Contrast of subtle borders / planned badges | P3 | FO Planned chips |
| Authenticated full axe/SR pass | — | **AUTH_BLOCKED** — Owner should run |

## Keyboard

Command palette exists (positive). Focus rings inconsistent where raw buttons use gray hover utilities.

## Verdict

Baseline a11y hygiene exists; **form labeling** and **overlay focus management** are the highest-leverage gaps before claiming WCAG-ready ops desks.

# BR-002 — Implementation Plan

**Implement only after** `APPROVE BR-002` + `ACCEPT ADR-022`.

All visual changes land inside the branding system (`resolveBrandPresentation` + `BrandLogo` + email helpers). Pages continue to pass `purpose` only.

## Phase 1 — Purpose presentation updates

| Purpose | Change |
| --- | --- |
| `loading` | House mark only; `showBrandName/tagline/productLine = false`; no typography lockup |
| `drawer` / `header` | House mark + **large** typography “M.P.A.”; tune mark vs type scale for phone readability |
| `sidebar` | Expanded: mark + M.P.A. + tagline; collapsed: mark + M.P.A. (typography) |
| `login` / `onboarding` / `splash` | Confirm hero stack (mark + M.P.A. + tagline + Property Operations OS); polish spacing |
| `email` | Horizontal lockup in HTML helper (mark + brand name text), not square-only |
| `browser` / icons | Remain icon-only; never used on drawer/login/loading chrome |
| Error / empty | Use polished compact lockup (`header`) |

## Phase 2 — Perception QA harness

1. Update `/dev/brand-certification` to show **purpose-optimized** samples and the five human questions.  
2. Add checklist UI: YES/NO is documentation-driven; page can show expected variant copy.  
3. Do **not** auto-PASS from component presence alone.

## Phase 3 — Human certification close-out

1. Capture before/after + device/theme evidence.  
2. Fill [03-surface-audit-matrix.md](./03-surface-audit-matrix.md).  
3. Update visual baselines (`pnpm qa:e2e:visual`) **after** human PASS.  
4. Mark sprint Complete only when matrix is all PASS + reviewer sign-off.

## Exit criteria

- Every surface in the matrix is human **PASS**  
- Purpose treatments match [02-purpose-optimized-presentation.md](./02-purpose-optimized-presentation.md)  
- No page-local logo hacks reintroduced  
- Design Partner quality affirmed by human reviewer  

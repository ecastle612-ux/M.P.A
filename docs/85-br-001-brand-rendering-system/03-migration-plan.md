# BR-001 — Migration Plan

**Implement only after** `APPROVE BR-001` + `ACCEPT ADR-021`.

## Phase A — Branding package API

1. Introduce purpose tokens + hard minimums in `packages/shared` branding module.
2. Implement `<BrandLogo purpose="…" />` as the sole React renderer (asset selection, lockup switch, floors, responsive density).
3. Keep ADR-019 path constants private to the branding system (no feature imports of path strings).
4. Provide non-React helpers for email/PDF that accept surface tone + purpose only.

## Phase B — Repository sweep

Search and eliminate direct usage:

```bash
rg -n "logo-light\\.png|logo-dark\\.png|mpa-logo|logo-horizontal|logo-stacked" \
  apps packages --glob '!**/node_modules/**' --glob '!**/docs/**'
```

Also inventory:

- `<Logo` / `from ".../branding/logo"`
- `<img` / `Image` pointing at `/branding/` or `/icons/` used as logos
- Inline SVG brand marks
- `MobileBrandLockup` size decisions (absorb into `BrandLogo`)

Replace every product surface with `<BrandLogo purpose="…" />` (or email/PDF helper).

### Expected purpose mapping (initial)

| Current surface | Purpose |
| --- | --- |
| Login / signup / password reset / auth shell | `authentication` |
| Mobile drawer brand | `navigation` (+ `collapsed` when scrolled) |
| Desktop sidebar | `sidebar` (+ `collapsed`) |
| Top header brand (if any) | `header` or `navigation` |
| Loading / splash | `loading` / `splash` |
| Error / unauthorized / not-found | `navigation` or `header` (readable, not auth-hero) |
| Email templates | `email` helper |
| PDF / reports | `pdf` helper |
| PWA / favicon | browser icons only — not `BrandLogo` UI |

## Phase C — Deprecate shims

1. Time-box `<Logo size>` as a thin mapper to purposes (if needed for PR sequencing).
2. Remove mapper once call sites are clean.
3. Delete duplicate lockup components that select sizes/assets.

## Phase D — Guards + certification

1. Enable ESLint + CI rules ([05-build-protection.md](./05-build-protection.md)).
2. Ship certification page + fill PASS/FAIL report ([04-certification-plan.md](./04-certification-plan.md)).
3. Visual certification checklist (Rule 11) must all pass before BR-001 is marked Complete.

## Exit criteria

- Zero direct logo asset imports outside the branding system
- Zero page-local size/tone brand decisions
- One `BrandLogo` powers app, portals, auth, email, PDF, loading, errors
- Build fails if a developer reintroduces direct logo paths
- Certification report is PASS with no open violations

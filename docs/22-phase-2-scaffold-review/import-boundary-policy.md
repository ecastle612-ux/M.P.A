# Import Boundary Policy (Phase 2.1)

## Goals

- Prevent circular dependencies
- Keep package APIs stable
- Stop app code from importing private package internals
- Preserve clean extraction boundaries for future mobile and service growth

## Rules

1. `apps/*` may import packages only through public package entrypoints:
   - `@mpa/ui`
   - `@mpa/shared`
   - `@mpa/supabase`
   - `@mpa/email`
2. `apps/*` must not import `packages/*/src/*` via relative paths.
3. `packages/ui` must not depend on `apps/*`.
4. `packages/shared` must not depend on `packages/ui`.
5. Circular dependencies are build blockers.

## Enforcement

- ESLint (`no-restricted-imports`) in `apps/web/eslint.config.mjs`
- `dependency-cruiser` config in `.dependency-cruiser.cjs`
- CI gates:
  - `pnpm check:boundaries`
  - `pnpm check:circular`

## Future Tightening

- Add layered boundaries inside `apps/web` (`app` → `components` → `lib`)
- Add package-level `exports` + `"type": "module"` tests in CI
- Add forbidden cross-domain imports once feature modules exist

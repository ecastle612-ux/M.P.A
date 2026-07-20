# Files Modified & Regression Tests

## Files added / modified (high level)

### Trust core
- `apps/web/src/lib/trust/*` (contracts, certification, integrity, permissions, performance, submission-guard)
- `apps/web/src/app/api/trust/certification/route.ts`
- `apps/web/src/app/api/trust/integrity/route.ts`
- `apps/web/scripts/dev/run-trust-certification.ts`
- `apps/web/src/components/trust/friendly-error-state.tsx`
- `apps/web/src/hooks/use-submission-guard.ts`

### Error / loading / confidence
- `apps/web/src/app/error.tsx`, `global-error.tsx`
- `apps/web/src/app/(portals)/error.tsx`, `loading.tsx`
- `apps/web/src/app/(auth)/error.tsx`, `loading.tsx`
- `apps/web/src/app/(app)/profile|settings/{error,loading}.tsx`
- `apps/web/src/app/(app)/dashboard/error.tsx`
- `apps/web/src/app/not-found.tsx`, `unauthorized/page.tsx`
- `apps/web/src/lib/api/client-error.ts`, `http.ts`
- `apps/web/src/components/financial/record-payment-form.tsx`

### QA-001 expansion
- `qa/e2e/tests/smoke/trust-surfaces.spec.ts`
- `qa/e2e/tests/smoke/module-shells.spec.ts` (financials + migration)
- Unit: `client-error.test.ts`, `submission-guard.test.ts`, `permission-matrix.test.ts`, `provider-certification.test.ts`

### Docs / tooling
- `docs/58-pt-001-production-trust/*`
- Root script `pnpm trust:certify`

## Verification results

| Check | Result |
| --- | --- |
| Vitest PT-001 suite (9 tests) | **Pass** |
| `pnpm trust:certify` | **Ran** — see provider report (noop/warn; Auth/Storage fail without env in CLI) |
| Playwright trust smoke | Added (run with `pnpm qa:e2e:smoke` when QA auth seeded) |

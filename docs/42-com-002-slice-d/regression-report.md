# Slice D — Regression Report

**Date:** 2026-08-08  

## Commands

| Check | Command | Result |
|-------|---------|--------|
| Unit / integration tests | `pnpm test` | Recorded after run |
| Typecheck | `pnpm typecheck` | Recorded after run |
| Lint | `pnpm lint` | Recorded after run |
| Build | `pnpm build` | Recorded after run |
| Boundaries | `pnpm check:boundaries` | Recorded after run |

## Focused suites

- `packages/shared` — `provisioning.test.ts`, `saas-checkout.test.ts`, `commercial.test.ts` (Provisioning nav)
- `apps/web` — `run-provisioning.test.ts`, `webhook.test.ts`

## Non-regression scope

- Slice A catalog / flags
- Slice B demo (untouched)
- Slice C Checkout create + dedicated SaaS webhooks
- FIN-OPS resident Checkout isolation (`saasStoreTouchesFinOps === false`)
- Capital Projects not introduced

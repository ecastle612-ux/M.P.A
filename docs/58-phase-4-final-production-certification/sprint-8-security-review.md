# Sprint 8 — Security Review

| Control | Result |
| --- | --- |
| Unauthenticated access to app/portal/admin | **PASS** — 307 → `/login` |
| Master Admin | Operator-gated (`platform_operators`) separate from org entitlements |
| Entitlements | Path → entitlement fail-closed for unknown `/pm/*` `/facility/*` `/shared/*` |
| RLS | Org-scoped tables; cert did not bypass RLS |
| Demo isolation | Mutations/export/payment denied (`restrictions.ts`) |
| Stripe | No agent writes; secrets not in repo |
| Capability grants | Role permission grants + org overrides |

## Residual risk

- Owner must validate invitation/claim and portal provisioning live (LAUNCH remaining procedural)
- Prod schema catch-up (LAUNCH entity tables) can empty DIC pickers — honesty, not auth bypass

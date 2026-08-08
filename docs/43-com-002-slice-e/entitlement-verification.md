# Slice E — Entitlement Verification

| Rule | Behavior | Evidence |
|------|----------|----------|
| Active | Modules on | `hasLifecycleModuleAccess` |
| Grace (past_due ≤ 7d) | Modules on | Shared + middleware |
| Past due after grace / expired | Modules off; `/billing` reachable | Middleware redirect to billing |
| Unpaid / incomplete / dispute_hold / canceled | Modules off | Shared fail-closed tests |
| Seat / property limits | Auto from plan tier | `limitsForPlanTier` on upgrade |
| Navigation / Mission Control | SKU entitlements while module access true | Existing path entitlements + lifecycle gate |
| FO / Complete | Not self-serve | `FO_READY=false` |

No manual Master Admin SKU assign required for renewals or recovery on the PM self-serve path.

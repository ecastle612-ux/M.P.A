# Security Verification (P0 Hardening)

| Check | Result | Evidence |
|-------|--------|----------|
| Unentitled `/facility/*` denied for PM SKU | Pass | `evaluatePathEntitlement` + middleware redirect |
| Unentitled `/pm/*` denied for Facility SKU | Pass | Same |
| Unknown `/pm/*` or `/facility/*` paths denied | Pass | `requiredEntitlementForPath` → `deny` |
| No-SKU org limited to setup/billing/launcher/org | Pass | Bootstrap entitlement set |
| Master Admin route blocked for non-operators | Pass | Middleware + `(admin)/layout` |
| Master Admin menu hidden for non-operators | Pass | `ProfileMenu` + `OperatorProvider` |
| Search never lists unentitled modules | Pass | `searchCatalogForSku` filters via path evaluator |
| Quick Actions/⌘K use same catalog | Pass | `command-palette.tsx` |
| Subscription PUT requires operator | Pass | API 403 + RLS update policy |
| Customers cannot change SKU in Setup UI | Pass | Read-only purchased product panel |
| Platform operators may preview customer routes | Pass | Middleware bypass for operators (support) |
| Unauthorized page explains entitlement/admin | Pass | `/unauthorized` |

**Security verdict: Pass for P0 scope.**

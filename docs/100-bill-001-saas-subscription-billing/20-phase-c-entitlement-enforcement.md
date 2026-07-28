# 20 — Phase C Entitlement Enforcement

**Package:** BILL-001  
**Status:** Implemented (2026-07-27)  
**Exit criterion:** Hard blocks respected in create-property / invite flows.

---

## Scope delivered

1. Central gate: `apps/web/src/lib/saas/entitlement-gate.ts`
2. Wired into:
   - `createProperty` / `POST /api/properties`
   - `createAndDeliverInvitation` / invitations POST (resends exempt)
3. Usage UI reflects plan caps + enforcement status
4. Nav `requiredModule` filtering when entitlement snapshot is bound
5. Manual org create binds trial snapshot
6. Subscription webhook path rebinds entitlements + in-app notify + SaaS audit

## Behaviors

| Scenario | Result |
|----------|--------|
| At property / seat limit | `402` `LIMIT_EXCEEDED` |
| past_due / unpaid / canceled | `402` create blocked |
| No snapshot | `403` `NO_SNAPSHOT` |
| Module not on plan | `403` `NOT_ENTITLED` |
| Upgrade/downgrade webhook | Snapshot rebound via `bindEntitlementSnapshot` |
| Resend invite | Does not consume an extra seat |

## Tests

- `lib/saas/entitlement-gate.test.ts`
- Existing `capability-matrix.test.ts` (SKU modules)

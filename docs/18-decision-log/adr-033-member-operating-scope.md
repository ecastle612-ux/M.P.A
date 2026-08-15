# ADR-033: Member Operating Scope (Complete Delegated Operations)

## Status
Accepted

## Accepted
2026-08-15 — Product Owner + Architect: `ACCEPT ADR-033` with docs/127 Approved.

## Date
2026-08-15

## Context

ADR-015 made Complete the entitlement **union** of Property Manager and Facility Operations at the organization / SKU layer. ADR-026 ordered the customer pipeline:

```
Authentication → Organization → Role → SKU entitlement → Module permission → Action
```

That pipeline is correct for **what the organization purchased**. It cannot express **which person** inside a Complete organization operates Property Operations, Facility Operations, or both.

Today a Complete `property_manager` is also a Facility manager (`FACILITY_MANAGER_ROLES`), inherits `pm.financial_operations` and `pm.finance:*`, sees both nav families, and may switch shared-report persona to `facility_manager`. There is no `facility_manager` RBAC role; FO-only orgs already relabel `property_manager` as “Facility Manager.”

The Product Owner requires one Complete subscription and one organization, with delegated managers who must not inherit the other product merely because Complete is the union. Adding a second SKU, a second organization, or buying PM + FO separately is forbidden (ADR-019).

docs/126 (FIN-OPS Production reconciliation) is blocked on schema lineage. When finance APIs become real, a FACILITY-only Complete manager with the `property_manager` role would pass staff finance unless this layer exists.

Authoritative design: `docs/127-complete-delegated-operations/`.

## Decision

1. **Add member operating scope** under the purchased SKU. Canonical values: `property_operations` | `facility_operations` | `both`. Customer name: Operational responsibility. Not a SKU, not billing, not a second membership, not an OPS-001 workspace.

2. **Effective access is an intersection:**

   ```
   SKU surfaces ∩ member operating scope ∩ role / module permission ∩ action
   ```

   SKU always wins. Scope cannot grant Facility to a Property Manager subscription or Property to a Facility Operations subscription.

3. **Do not add a `facility_manager` role.** Keep `USER_ROLES`. Distinguish Property vs Facility with scope (design Option B). FO-only continues to relabel `property_manager`. Customer-facing Complete labels are derived from role × scope.

4. **Resolve entitlements per member**, not only per org SKU. `requireAuthorizedAction` (and path/nav/report/home helpers) must use member-effective entitlements. `pm.*` is Property-scoped; `facility.*` is Facility-scoped; `platform.*` stays shared but connected data respects effective surfaces.

5. **Complete Organization Admin:** the primary / last admin has `both` and cannot be reduced such that Complete has zero BOTH admins. Additional admins may be scoped. Org billing and last-admin transfer require BOTH.

6. **Existing memberships:** PM staff → `property_operations`; FO staff → `facility_operations`; Complete admins → `both`; other existing Complete staff → `NULL` with compatibility BOTH until an admin assigns. New Complete invites require an explicit scope. Do not silently strip access.

7. **This ADR does not** change Stripe or SKUs; does not approve FIN-OPS schema remediation (docs/126 remains blocked); does not revive `facility_technician` as a role.

## Consequences

**Easier:** Sarah/Mike delegation inside one Complete org; Mike cannot inherit PM finance or tenant comms; report and home routing can follow scope; FO-only role catalog stays stable.

**More difficult:** Every Complete entitlement check must use member-effective entitlements; work-order / comms / FAC-003 SQL helpers that key only on org SKU must AND scope; NULL compatibility mode needs a later cleanup slice; invitation and Guided Setup gain a customer-facing control.

## Alternatives Considered

- **Add `facility_manager` (Option A):** Rejected as the primary discriminator — FO-only already uses `property_manager`; technicians and leasing still need scope; grant/RLS/invite enums proliferate; Complete generalists would hold two manager roles.
- **Position entity plus role plus scope (Option C):** Rejected — triple encoding of one fact.
- **Second Complete SKU or two organizations:** Rejected — Product Owner vision and ADR-019.
- **Split `role_permission_grants` by SKU instead of scope:** Rejected — does not distinguish two Complete managers who share a role; ADR-026 already left grants global and denied at entitlement.
- **Treat Complete `property_manager` as Property-only by default:** Rejected — silently strips today’s Complete managers who use both surfaces.
- **Implement before approval:** Rejected — ADR-012.

## Approval

Accepted with docs/127 Approved. Implementation of the member-operating-scope contract is authorized. FIN-OPS schema remediation is not. Production application release is certified in `docs/134` as **PRODUCTION RELEASE SUCCESSFUL**.

# Portal Shell Foundation

## Status

Accepted and implemented

## Objective

Create four role-aligned portal shells that share identity and design language
while preserving role-specific navigation and layout framing.

## Portal Shells

1. Property Manager Portal
2. Owner Portal
3. Tenant Portal
4. Vendor Portal

## Shared Foundation Responsibilities

- Common authenticated app frame contract
- Common organization switcher placement and behavior
- Common role switch behavior (when multi-role applies)
- Common global command/navigation primitives from Canopy
- Common session and logout controls

## Role-Specific Shell Responsibilities

- Layout composition differences per role
- Role-aware top navigation and side navigation definitions
- Role-specific landing shell route
- Role-aware unauthorized fallback behavior

## Route and Guard Contracts

- Auth guard: requires valid authenticated session
- Organization guard: requires active organization in context
- Role guard: requires valid role for target shell
- Unauthorized route: explicit access-denied destination
- Not-found route: deterministic fallback for unknown routes

## Exclusions

- No business content pages
- No workflow modules
- No feature data views outside identity/profile/membership surfaces

## Quality Requirements

- Accessibility baseline parity across all four shells
- Responsive navigation behavior preserved
- No duplication of core auth/org/guard logic between portals

## Implemented Route Surface

- `/portal/manager`
- `/portal/owner`
- `/portal/tenant`
- `/portal/vendor`
- `/portal` role-aware resolver route
- `/unauthorized` explicit access-denied route
- shared profile route `/profile` for identity editing

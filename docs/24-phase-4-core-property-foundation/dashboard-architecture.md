# Dashboard Architecture

## Status

**Accepted and implemented**

## Objective

Replace foundation scaffolding with a production dashboard architecture that is
organization-aware, role-aware, resilient, and extensible.

## Audience

- Primary: Property Manager
- Secondary (future adaptation): Owner, Tenant, Vendor specialized dashboards

## Dashboard Composition

### Top-Level Regions

1. Portfolio KPI row
2. Operational intelligence row
3. Activity and task streams
4. Onboarding/empty-state guidance surfaces

### KPI Widgets (Foundation Scope)

- Properties
- Units
- Occupancy Rate
- Vacancies
- Expiring Leases (contract now, richer data in future phase)

### Operational Widgets (Foundation Scope)

- Recent Activity
- Upcoming Tasks
- Recent Maintenance (contract now, richer data in future phase)

## Data Contracts

Dashboard read model is delivered by `GET /api/dashboard` and returns:

- `organizationId`
- `snapshot.propertiesTotal`
- `snapshot.unitsTotal`
- `snapshot.occupancyRate`
- `snapshot.vacanciesTotal`
- `snapshot.expiringLeasesTotal`
- `snapshot.recentActivity`
- `snapshot.upcomingTasks`

All payload fields must be organization-scoped and capability-filtered.

## Rendering Strategy

- Server component loads secure, org-scoped dashboard snapshot.
- Client components handle interactions (filters, refresh triggers, collapsible
  widgets, keyboard shortcuts).
- Empty-state components are first-class view states, not fallback text.

## Performance and UX Requirements

- Fast initial render with stable skeleton states.
- No blocking waterfall between widgets.
- Widget failures degrade gracefully with per-widget recovery actions.
- Refresh actions avoid full-page jank where possible.

## Observability Contracts

- Track widget load duration.
- Track widget error rate by widget key.
- Track onboarding state completion path.
- Track dashboard interactions for product analytics (non-PII).

## Security Constraints

- All dashboard data is resolved under organization + role context.
- No cross-org aggregates returned to standard user roles.
- Service-role operations restricted to backend-only systems.

## Future Expansion

Widget contract intentionally supports:

- leasing signals
- financial signals
- maintenance SLA views
- AI recommendations
- organization benchmarks

# Navigation Audit — Owner Operations Simplification

**Date:** 2026-08-10  
**Authority:** Owner — remove all Not yet available / placeholder / future surfaces from Master Admin nav

## Rule applied

Every nav item must:

1. Work today  
2. Help the Owner operate the platform  

If either answer is no → remove from navigation.

## Navigation kept (12 items · 3 groups)

| Group | Item | Href | Justification |
|---|---|---|---|
| Operations | Command Center | `/admin` | Health + search + live activity |
| Operations | Support Center | `/admin/support` | Customer diagnosis workflows |
| Operations | System Health | `/admin/system` | Infra / integration status |
| Customers | Organizations | `/admin/platform/organizations` | Org directory + profiles |
| Customers | Customers | `/admin/platform/customers` | User directory + profiles |
| Customers | Operators | `/admin/platform/operators` | Operator access list |
| Customers | View As | `/admin/testing/impersonation` | Secure support impersonation |
| Commercial | Billing | `/admin/commercial/billing` | Stripe / MRR / purchases |
| Commercial | Provisioning | `/admin/commercial/provisioning` | Claim / retry / checkpoints |
| Commercial | Lifecycle | `/admin/commercial/lifecycle` | Grace / cancel / reactivate |
| Commercial | Subscriptions | `/admin/commercial/subscriptions` | SKU inspection / assign |
| Commercial | Checkout | `/admin/commercial/checkout` | Payment troubleshooting |

## Removed from navigation

| Former item | Why removed |
|---|---|
| Launch Readiness | Certification theater — not day-to-day support |
| Commercial Products (PM / FO / Complete) | Product summary pages — not operational triage |
| Catalog | Commercial catalog console — not primary support |
| Entitlements | Thin reference shell |
| Capability Catalog | Module reference — not ops triage |
| Product Matrix | Reference matrix — not ops triage |
| Live Demo | Demo verification theater |
| Operational Workspaces (all modules) | Many planned; others mirror customer apps — cluttered dead ends |

## Direct-URL policy

- Fully implemented tools removed from nav remain reachable by direct URL (catalog, demo, launch readiness, product pages, capability catalog) so functionality is not deleted.
- Placeholder / thin shells redirect into the lean console:
  - `/admin/workspaces/[moduleId]` → `/admin`
  - `/admin/commercial/entitlements` → `/admin/commercial/subscriptions`
  - `/admin/testing/product-matrix` → `/admin`

## Verification

- No Master Admin nav item shows **Not yet available**, **Coming Soon**, or Planned badges
- No empty shells linked from the sidebar
- `MASTER_ADMIN_NAV` status field removed

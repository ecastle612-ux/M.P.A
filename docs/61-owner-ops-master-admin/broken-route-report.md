# Broken Route Report — Master Admin

**Date:** 2026-08-10  
**Method:** Static audit of `MASTER_ADMIN_NAV` + App Router pages under `apps/web/src/app/(admin)/admin`

## Nav items (all resolve)

| Href | Page | Result |
|---|---|---|
| `/admin` | `admin/page.tsx` | OK — Command Center |
| `/admin/support` | `admin/support/page.tsx` | OK — Support Center |
| `/admin/system` | `admin/system/page.tsx` | OK — System Health |
| `/admin/launch-readiness` | `admin/launch-readiness/page.tsx` | OK |
| `/admin/products/*` | product pages | OK |
| `/admin/commercial/*` | catalog/checkout/provisioning/subscriptions/lifecycle/billing/entitlements | OK |
| `/admin/platform/organizations` | directory | OK |
| `/admin/platform/organizations/[orgId]` | profile | OK (linked from directory) |
| `/admin/platform/customers` | directory | OK |
| `/admin/platform/customers/[userId]` | profile | OK (empty-state if no data — not 404) |
| `/admin/platform/operators` | OK | |
| `/admin/platform/capability-catalog` | OK | |
| `/admin/testing/product-matrix` | OK | |
| `/admin/testing/demo` | OK | |
| `/admin/testing/impersonation` | OK — View As | |
| `/admin/workspaces/[moduleId]` | dynamic | OK — aligned modules show status; planned modules show **Not yet available**; unknown/`capital_projects` show intentional empty state |

## Prior defects addressed

| Issue | Fix |
|---|---|
| Impersonation was stub AdminSimplePage | Replaced with View As console |
| Org/user directories were tables only | Deep-link profiles |
| Support was lookup-only placeholder notes | Support Center + audited actions on org profile |
| `/admin` active state highlighted all routes | Exact match for Command Center |
| Unknown workspace returned “Unknown workspace” | Renamed to intentional **Not yet available** |

## Policy

Every Master Admin navigation item must either work or show an intentional Not yet available page. Next.js 404 inside Master Admin is forbidden.

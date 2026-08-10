# Broken Route Report — Master Admin (post-simplification)

**Date:** 2026-08-10  
**Method:** Audit of `MASTER_ADMIN_NAV` + App Router admin pages

## Sidebar items (all functional)

| Href | Result |
|---|---|
| `/admin` | OK — Command Center |
| `/admin/support` | OK — Support Center |
| `/admin/system` | OK — System Health |
| `/admin/platform/organizations` (+ `/[orgId]`) | OK |
| `/admin/platform/customers` (+ `/[userId]`) | OK |
| `/admin/platform/operators` | OK |
| `/admin/testing/impersonation` | OK — View As |
| `/admin/commercial/billing` | OK |
| `/admin/commercial/provisioning` | OK |
| `/admin/commercial/lifecycle` | OK |
| `/admin/commercial/subscriptions` | OK |
| `/admin/commercial/checkout` | OK |

## Placeholder policy

- No sidebar item opens a placeholder, **Not yet available**, or **Coming Soon** page.
- Former workspace shells redirect to `/admin`.
- Thin entitlements / product-matrix shells redirect into operational tools.

## Policy

Every Master Admin navigation item must work today and help operate the platform. Unimplemented features are omitted from navigation entirely.

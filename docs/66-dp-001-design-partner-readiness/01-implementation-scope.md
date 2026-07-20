# DP-001 — Implementation Scope

**Status:** Approved

## Settings information architecture

```
Settings
├── Organization   — name, slug, active context
├── Team           — members, roles, permissions summary, invites, deactivate
├── Integrations   — Provider Status Center
├── Documents      — PM Document Vault browser
└── Notifications  — existing preferences (unchanged behavior)
```

Shell Workspace nav adds **Settings** → `/settings`.

## P0-1 Organization & Team

- Reuse `GET/POST /api/organizations/:id/invitations`
- Reuse `GET/PATCH /api/organizations/:id/memberships` (status `inactive` = deactivate)
- Add `GET/PATCH /api/organizations/:id` for organization information (`authorization:manage` for update)
- Staff invite roles: `property_manager`, `property_owner` (portal roles inviteable when needed)
- Permissions: read-only summary from role capability model (not a new ACL editor)

## P0-2 Provider Status Center

Providers: Stripe, Checkr, Dropbox Sign, OneSignal, Twilio, Google Maps, Resend.

Statuses derived from env + registry ids (never expose secrets):

| Status | Meaning |
|--------|---------|
| Connected | Live provider selected and required credentials present; mode not sandbox |
| Sandbox | Provider selected with credentials; sandbox/test mode |
| Disconnected | `noop`, missing credentials, or unset |

Each card includes configuration guidance for operators.

## P0-3 Portal availability

- `/portal` becomes an availability hub (no auto-redirect into stubs)
- Tenant / Vendor portals remain available when the user has those roles
- Owner / Manager show “Available in a future release” with return path to Operations Center
- `toPortalPath(property_manager)` → `/portal` hub (not manager stub)

## P0-4 Document Vault browser

- Extend vault list: org-scoped query on existing `vault_documents`
- UI: category filters (leases, reports, invoices, facility, photos, permits, warranties, …), search, preview metadata, download when `fileUrl` present
- No new storage buckets or duplicate tables

## Messaging rule

Replace user-visible “Placeholder”, “TODO”, and casual “Coming Soon” with:

> This feature will become available during a future release.

Keep internal field names (`*Placeholder` columns) unchanged.

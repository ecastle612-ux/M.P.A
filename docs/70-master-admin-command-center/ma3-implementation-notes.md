# Master Admin MA-3 — Users, Memberships & Audit

**Status:** Implemented (slice MA-3)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Users directory `/admin/users` (+ membership filters by org/role/status)
- User detail `/admin/users/[userId]`
- Audit Log `/admin/audit` (+ detail `/admin/audit/[eventId]`)
- Inspect-only APIs: `GET /api/admin/users`, `GET /api/admin/audit`
- Nav: Overview · Organizations · Users · Audit Log · Errors

## Data sources (reuse)

- `organization_memberships`, `user_profiles`, `organizations`
- `platform_support_audit_events`, `audit_events`
- Security signals: auth-related rows from `platform_error_events`

## User ↔ Organization relationship

Bidirectional deep-links (no new stores):

| From | To |
|------|----|
| Users list / membership filter | Organization Detail (`/admin/platform/organizations/[orgId]`) |
| User Detail memberships | Organization Detail |
| Organization Detail members | User Detail (`/admin/users/[userId]`) |
| Organization Detail | Users filtered by org (`/admin/users?organizationId=…`) |
| Organization Detail audit | Audit Log filtered by org + event detail |
| Audit Detail | Organization Detail; actor → Users when actor id present |

## Schema / filter limitations (documented, not invented)

- Audit tables do not expose a first-class severity column; security signals reuse auth-related `platform_error_events`.
- Actor role/capability is not stored on every audit row; support rows label `platform_operator`.
- Membership filters use existing `organization_memberships.status` / `roles` only.

## Non-goals

- Membership/role mutations
- RBAC administration
- Suspend/reactivate, capacity edit, webhook replay
- New user/membership/audit stores

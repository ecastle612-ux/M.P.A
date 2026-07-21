# 07 — Audit Trail

**Package:** ADMIN-001  
**Status:** Draft

## Requirement

Every Portal Test Mode and Impersonation session is recorded. Prefer a dedicated append-only table (e.g. `master_admin_impersonation_sessions` + `master_admin_impersonation_events`) aligned with existing audit patterns (`*_audit_events`), **or** a clearly namespaced extension of the platform audit log — chosen at implement time with RLS: Master Admin read; insert via service/server only.

## Session record fields

| Field | Notes |
| --- | --- |
| Master Admin user id | Authenticated subject |
| Target user id | Null for pure Portal Test Mode |
| Mode | `portal_test` \| `impersonate` |
| Organization id | Required |
| Portal / role label | When applicable |
| Start time | Required |
| End time | Set on Return / Exit / expiry |
| Duration | Derived |
| Reason | Optional free text (support ticket id) |

## Event stream (within session)

| Event | Examples |
| --- | --- |
| Page visited | pathname (+ entity id when present) |
| Sensitive action | payment attempt, announcement send, lease status change, assignment approve — even if blocked as simulated |

## Retention / access

- Visible in Master Admin Audit / Impersonation history UI (v1 minimum: queryable table + simple list).  
- Not editable by clients.  
- Required for certification PASS.

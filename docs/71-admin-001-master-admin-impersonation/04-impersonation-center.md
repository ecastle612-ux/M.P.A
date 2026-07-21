# 04 — Impersonation Center

**Package:** ADMIN-001  
**Status:** Draft

## Placement

Master Admin–only route under the existing console, e.g. `/master-admin/impersonation` (exact path fixed at implement time; nav gated by `master_admin`).

## Directory capabilities

Master Admin can browse (scoped by platform data access approved for Master Admin reads):

| Directory | Actions |
| --- | --- |
| Organizations | Open → drill into properties / members |
| Properties | Context for residents / owners |
| Residents | View Profile · Impersonate User |
| Owners | View Profile · Impersonate User |
| Vendors | View Profile · Impersonate User |
| Managers | View Profile · Impersonate User |

**View Profile** — read-only summary (identity, org, roles, portal eligibility).  
**Impersonate User** — start impersonation session for that user.  
**Return to My Session** — available globally via banner while impersonating.

## Impersonation banner (every page)

```
MASTER ADMIN IMPERSONATION
Logged in as: {Display Name} ({Role label})
Authenticated as: {Master Admin Name} (Master Admin)
[Return to My Session]
```

Rules:

- Never omit Authenticated as  
- Never imply the Master Admin *is* the resident  
- One tap Return clears effective subject and ends audit session  

## Faithful reproduction

While impersonating, chrome and effective permissions match the target:

- Navigation / menus  
- Capability checks for UI  
- Portal eligibility  
- Notifications and messages scoping  
- Empty vs populated states for **that user’s** real data (demo seed only when in Portal Test Mode without a real user, not silently when impersonating a real empty account — prefer truthful empty + optional “Load demo overlay” control if needed)

## Role switcher (no logout)

Allow switching effective portal experience among:

- Property Manager  
- Resident  
- Vendor  
- Owner  

Implementation options (choose one in implement notes after Approve):

1. Impersonate a concrete user of that role, or  
2. Enter Portal Test Mode for that role when no user is selected  

Either way: authentication remains Master Admin.

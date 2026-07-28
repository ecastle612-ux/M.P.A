# 11 — Account Lifecycle

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Related binding docs

| Topic | Doc |
|-------|-----|
| Organization commercial status | [28](./28-organization-status-lifecycle.md) |
| Offboarding (disable → transfer → archive) | [29](./29-employee-offboarding.md) |
| Invitation-only creation | [27](./27-invitation-only-platform.md) |

---

## Covered lifecycles

1. Account creation (invite/provision only)  
2. Account activation  
3. First login  
4. Password change  
5. Password reset  
6. Account recovery  
7. Organization recovery  
8. User deactivation / offboarding  
9. User reactivation  
10. Organization suspension  
11. Organization reactivation  
12. Organization cancellation / archive  

---

## Principal (user) lifecycle

| Stage | Trigger | Result |
|-------|---------|--------|
| **Create** | Provisioning / Org Admin invite | Principal + username + temp password; membership pending/active invite |
| **Activate** | First-login gate complete | `status=active`, `password_state=permanent_set` |
| **First login** | Username + temp password | Hardening gate |
| **Password change** | User voluntary or forced | New hash; sessions rotated |
| **Password reset** | Authorized resetter | `reset_required` + temp issued |
| **Deactivate / disable** | Org Admin | Login blocked; data retained; membership disabled |
| **Archive** | Org Admin | Hidden from default directories; retained for audit |
| **Reactivate** | Org Admin | Login restored; may force password reset |
| **Lock** | Security policy | Temporary block; unlock by Org Admin (or Level 0 for Org Admin) |

Org Admin principals follow the same states but **reset/recovery authority differs** ([16](./16-recovery-workflows.md)).

---

## Organization lifecycle

Canonical states and per-state login/billing/access/notifications/recovery: **[28 — Organization status lifecycle](./28-organization-status-lifecycle.md)**.

| Stage | Trigger | Result |
|-------|---------|--------|
| **Prospect** | Pre-purchase | No tenant access |
| **Trial** | Trial subscription | Limited entitlements |
| **Pending Setup** | Provisioned; wizard incomplete | Setup-scoped access |
| **Active** | Wizard Finish | Production |
| **Past Due** | Billing failure | Login for payment recovery; entitlements restricted |
| **Suspended** | Ops/compliance/dunning | Tenant logins blocked |
| **Cancelled** | Subscription ended | Export window / no ops |
| **Archived** | Retention elapsed | Terminal tombstone |

---

## Deactivation vs suspension

| Concept | Scope | Typical actor |
|---------|-------|---------------|
| User deactivation | One principal’s membership/access | Org Admin |
| Organization suspension | Entire workspace | Level 0 / billing |

Suspended org ⇒ all members cannot use tenant plane (Level 0 support tools excepted).

---

## Deletion semantics

### User (subaccount)

- Soft-delete / archive by default  
- Username remains unreusable  
- Operational records remain org-owned (work orders, messages) with actor tombstone display  

### Organization

1. Legal/commercial confirmation  
2. Suspend  
3. Export opportunity (policy window)  
4. Soft-delete (`pending_deletion`)  
5. Irreversible delete of tenant data per retention policy  
6. Retain billing + audit + username tombstones as required  

Cross-org restore into another customer is forbidden.

---

## Lifecycle audit minimum

Every transition above emits an audit event with actor, target, before/after state, reason, correlation id.

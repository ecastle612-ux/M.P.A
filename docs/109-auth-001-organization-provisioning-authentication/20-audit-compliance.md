# 20 — Audit & Compliance Requirements

**Package:** AUTH-001  
**Amendment:** A07  
**Status:** Binding (Approved with Amendments)

---

## Rule

**Every privileged action must be permanently audited.**

Privileged = anything that changes identity, access, ownership, org state, credentials, subscription capabilities, dashboard assignment inputs, or recovery configuration.

Audit records are **append-only** and retained as permanent security evidence (subject only to legal hold / extreme statutory limits — not routine deletion).

---

## Required event fields (A07)

| Field | Required | Description |
|-------|----------|-------------|
| **Timestamp** | ✔ | UTC `occurred_at` |
| **Actor** | ✔ | Principal id + actor type (`system` / `org_admin` / `subaccount` / `master_admin` / `implementation_specialist` / `support`) |
| **Organization** | ✔ when tenant-scoped | `organization_id` |
| **IP Address** | ✔ if available | Client IP |
| **Device** | ✔ if available | User-Agent / device fingerprint class |
| **Reason** | ✔ for recovery, suspend, ownership, support overrides | Human/system reason |
| `event_id` | ✔ | UUID |
| `action` | ✔ | Machine code |
| `target_type` / `target_id` | ✔ | What was affected |
| `before` / `after` | ✔ when meaningful | Redacted snapshots |
| `correlation_id` | Optional | Billing event / ticket / wizard session |
| `impersonation_id` | When applicable | ADMIN-001 effective subject |

**Never** store plaintext passwords, temp passwords, or MFA secrets in audit payloads.

---

## Required audited actions (A07 examples + baseline)

| Action | Example `action` code |
|--------|------------------------|
| User Created | `user.created` |
| User Disabled | `user.disabled` |
| User Archived | `user.archived` |
| Password Reset | `user.password_reset` |
| Password Changed | `user.password_changed` |
| Permission Changed | `user.permission_changed` |
| Role Changed | `user.role_changed` |
| Dashboard Changed* | `user.dashboard_assignment_changed` |
| Subscription Changed | `org.subscription_changed` |
| Organization Suspended | `org.suspended` |
| Organization Reactivated | `org.reactivated` |
| Organization status transition | `org.status_changed` |
| Owner Changed (Org Admin transfer) | `org.owner_changed` |
| Recovery Completed | `org.admin_recovery_completed` |
| Invitation issued / accepted | `user.invited` / `user.invitation_accepted` |
| Offboarding transfer | `user.offboard_transfer` |
| Organization switch (when exposed) | `org.switched` |
| Impersonation start/stop | `support.impersonation_start` |
| Module / entitlement override | `org.entitlement_override` |

\*Dashboard is never user-selected; “Dashboard Changed” means role/org-type/permission inputs that cause reassignment changed.

Also retain: username issuance, MFA changes, email/recovery contact changes, failed lockouts (security telemetry).

---

## Retention

| Class | Retention |
|-------|-----------|
| Privileged security / access audits | **Permanent** (default) |
| Username tombstones | Permanent / unreusable |
| Session debug logs | Short (non-authoritative) |

---

## Compliance uses

- Ownership dispute reconstruction  
- Insider threat investigation  
- Customer security questionnaires  
- SOC 2 access control evidence  
- Support escalation evidence ([30](./30-support-escalation-levels.md))  

---

## Integrity

- Append-only from application perspective  
- Level 3 Master Admin cannot edit history  
- Corrections are compensating events  
- Exports for legal must preserve hash/chain integrity where implemented  

---

## Acceptance (A07)

| ID | Criterion |
|----|-----------|
| AUD-01 | Listed privileged actions emit permanent audit rows |
| AUD-02 | Timestamp, actor, organization, IP/device (if available), reason captured |
| AUD-03 | No plaintext secrets in audit payloads |
| AUD-04 | Audit history is not editable in-product |

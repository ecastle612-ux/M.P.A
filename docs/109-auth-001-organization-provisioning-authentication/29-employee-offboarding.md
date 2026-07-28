# 29 — Employee Offboarding

**Package:** AUTH-001  
**Amendment:** A04  
**Status:** Binding (Approved with Amendments)

---

## Principle

**No data should ever disappear** because a person left.

Offboarding disables access and **transfers operational ownership**. It does not purge history, messages, work orders, documents, or audit trails.

---

## Triggers (examples)

| Trigger | Typical actor |
|---------|---------------|
| Employee resigns | Org Admin / manager with grant |
| Manager terminated | Org Admin |
| Vendor removed | Org Admin |
| Technician leaves | Org Admin |
| Tenant move-out *(related)* | Domain lease workflow + access disable (may reuse steps) |

---

## Standard workflow

```
Disable Account
    ↓
Transfer Assigned Work
    ↓
Transfer Messages
    ↓
Transfer Tasks
    ↓
Archive User
    ↓
Audit Log
```

### 1) Disable Account

- Membership `disabled` / login blocked immediately  
- Sessions revoked  
- Invites cancelled  
- Username retained (never reused)  

### 2) Transfer Assigned Work

- Open work orders, inspections, maintenance assignments → reassigned to successor or unassigned queue  
- Property assignments cleared or remapped  

### 3) Transfer Messages

- Thread participation retained historically  
- Open threads requiring response → reassigned mailbox / successor  
- No deletion of message history  

### 4) Transfer Tasks

- Open tasks, approvals, wizard responsibilities → successor  
- SLA clocks preserved with audit note of transfer  

### 5) Archive User

- Principal/membership moved to `archived`  
- Hidden from default directories  
- Still resolvable on historical records (“Former: Display Name”)  

### 6) Audit Log

Permanent event covering disable, each transfer class, archive, actor, reason, org, IP/device when available ([20](./20-audit-compliance.md)).

---

## What must remain

| Artifact | Retention |
|----------|-----------|
| Work orders / invoices / leases touched by user | Org-owned forever (per retention policy) |
| Messages sent/received | Retained |
| Documents uploaded | Retained |
| Audit events | Permanent privileged audit |
| Username tombstone | Unreusable |

---

## What must stop

| Access | On disable |
|--------|------------|
| Login | Blocked |
| API tokens / devices | Revoked |
| Push enrollment | Unenrolled / ignored |
| Future assignments | Not selectable as assignee |

---

## Organization Administrator offboarding

Offboarding a **primary Org Admin** is **not** this workflow alone. Use ownership transfer + Level 0 / emergency recovery ([16](./16-recovery-workflows.md), [17](./17-emergency-recovery.md)) before disable/archive of the former primary.

---

## Acceptance (A04)

| ID | Criterion |
|----|-----------|
| OFF-01 | Disable → transfer work/messages/tasks → archive → audit is the standard path |
| OFF-02 | Historical data remains queryable after archive |
| OFF-03 | Disabled users cannot authenticate |
| OFF-04 | Org Admin primary transfer requires elevated recovery path |

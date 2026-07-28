# 17 — Emergency Recovery Procedures

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

During onboarding, require a **Secondary Recovery Contact** so organization ownership can be restored through an additional verified path **before** (or alongside) full M.P.A. support intervention.

---

## Roles

| Role | Description |
|------|-------------|
| **Primary Organization Administrator** | Ownership anchor; day-to-day admin |
| **Secondary Recovery Contact** | Business Owner, Managing Partner, Regional Director, etc. |

Secondary Recovery Contact is **not** automatically a full Org Admin unless also invited as a user with that role.

---

## Onboarding requirement

Wizard cannot reach `active` until:

1. Secondary Recovery Contact name recorded  
2. Contact email (and optionally phone) recorded  
3. Contact completes verification challenge  
4. Org Admin acknowledges recovery responsibilities  

---

## Emergency path

```
Org Admin unavailable / credentials lost / dispute
        │
        ▼
Secondary Recovery Contact initiates recovery request
        │
        ▼
M.P.A. Level 0 verifies:
  - Contact still verified
  - Organization identity
  - Business authority evidence (as needed)
        │
        ▼
Level 0 issues Org Admin temp credentials
  OR transfers primary Org Admin to an approved principal
        │
        ▼
Forced password change + session revoke + audit
```

---

## Dispute handling

If Primary and Secondary disagree:

1. Suspend login elevation changes  
2. Escalate to formal business verification  
3. Prefer documented legal authority (operating agreement, etc.)  
4. No silent takeover  

---

## Rotation

Org Admin may replace Secondary Recovery Contact with re-verification. Previous contact is notified. Change is audited. Cannot remove last verified recovery contact without Level 0 exception.

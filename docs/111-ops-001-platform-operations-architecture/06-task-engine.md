# 06 — Task Engine

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Everything **actionable** becomes a Task — a first-class work item with ownership and state — not only a notification that disappears.

Examples:

- Approve lease  
- Review invoice  
- Complete inspection  
- Upload document  
- Renew contract  
- Contact tenant  
- Assign vendor  

---

## Task model

| Field | Description |
|-------|-------------|
| `task_id` | UUID |
| `organization_id` | Tenant |
| `title` | Short action |
| `description` | Details |
| **Priority** | low / normal / high / urgent |
| **Due date** | Optional datetime |
| **Owner** | Principal responsible |
| **Followers** | Watchers |
| **Status** | `open` / `in_progress` / `blocked` / `done` / `canceled` |
| **Dependencies** | Other `task_id`s that must complete first |
| `source_event_id` | Creating event |
| `subject` | Linked entity (lease, WO, …) |
| `deep_link` | Where to act |
| `created_by` | system / automation / user |

---

## Lifecycle

```
open → in_progress → done
         ↓
      blocked → in_progress
open/in_progress → canceled
```

Completing a task may emit `ops.task.completed` for automation/timeline.

---

## Creation sources

| Source | Example |
|--------|---------|
| Automation Engine | Renewal task from lease.expiring |
| Domain workflow | Inspection created → complete inspection task |
| User | Manual “Contact tenant” |
| AI suggestion accepted | Becomes task |
| Reminder Engine | Escalation task if ignored |

---

## Dependencies

- Task B `blocked` until dependency A `done`  
- Cycles rejected at write  
- UI shows blocked reason  

---

## Inbox integration

Open tasks assigned to the user appear in Unified Inbox ([10](./10-unified-inbox.md)) as actionable items.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| TK-01 | Priority, due, owner, followers, status, dependencies supported |
| TK-02 | Automation and domain can create tasks |
| TK-03 | Tasks appear in Unified Inbox for owners |
| TK-04 | Completion emits event for downstream |

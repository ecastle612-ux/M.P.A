# 10 — Unified Inbox

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Related:** MHF-001 messaging · Notification Center · Task Engine

---

## Purpose

Users should **never wonder where communication lives**.

One inbox aggregates:

| Stream |
|--------|
| Email (notification history / deep links) |
| SMS (when enabled) |
| Push history |
| System alerts |
| AI alerts / recommendations needing attention |
| Tasks (assigned / following) |
| Announcements |

Conversational **threads** (MHF-001) remain thread UX but surface unread counts / latest into the inbox.

---

## Inbox item model

| Field | Description |
|-------|-------------|
| `item_id` | UUID |
| `organization_id` | Tenant |
| `recipient_principal_id` | User |
| `kind` | `notification` / `task` / `announcement` / `thread` / `ai` / `system` |
| `ref_id` | Underlying record |
| `title` / `preview` | Display |
| `priority` | Inherited |
| `read_at` | Nullable |
| `archived_at` | Nullable |
| `occurred_at` | Sort key |
| `deep_link` | Action target |

---

## Unification rule

```
If the platform needs a human to see or act
  → it appears in Unified Inbox (for that human)
```

Staff commercial dashboard ([COM-001 22](../110-com-001-customer-lifecycle-commercial-operations/22-commercial-dashboard.md)) is **not** the customer inbox.

---

## UX principles (design)

- Single list with filters by kind  
- Bulk mark read / snooze  
- Task items show due/owner  
- AI items clearly labeled  
- Portal-specific shells (PM/Owner/Tenant/Vendor) filter kinds by plane  

PMX-004 / mobile: inbox is a primary destination on small screens.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| IN-01 | Aggregates notifications, tasks, announcements, AI/system alerts, push/email/SMS history |
| IN-02 | Per-principal, org-scoped |
| IN-03 | Deep links to underlying work |
| IN-04 | Distinct from staff commercial dashboard |

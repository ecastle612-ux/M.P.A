# 27 — Global Quick Actions

**Package:** OPS-001  
**Amendment:** A07  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Every role has **context-aware quick actions** — the fastest path to common work — adapted by role, permissions, subscription, and current context.

---

## Example actions

| Action |
|--------|
| Create Work Order |
| Message Tenant |
| Scan Document |
| Collect Payment |
| Schedule Inspection |
| Generate Report |
| Invite User |
| Connect Vendor |

---

## Adaptation inputs

```
Visible actions =
  f(Role, Permissions, Subscription entitlements, Current context, Priority)
```

| Input | Effect |
|-------|--------|
| **Role** | Technician: Arrive / Complete; Tenant: Pay / Request |
| **Permissions** | Hide Invite User without `org:users:create` |
| **Subscription** | Hide Collect Payment if module off |
| **Current context** | On Unit page → Create WO prefilled; in thread → Reply |
| **Priority** | Surface “Escalate” when Critical WO open |

---

## Action contract

| Field | Description |
|-------|-------------|
| `action_id` | Stable key |
| `label` | UX |
| `icon` | Optional |
| `required_capability` | AuthZ |
| `required_entitlement` | Plan module |
| `contexts` | global / property / unit / lease / wo / … |
| `handler` | Domain command route |
| `confirm` | Optional destructive confirm |

Actions invoke **domain commands** (not raw DB). Success emits events into OPS.

---

## Surfaces

| Surface | Behavior |
|---------|----------|
| Command Center | Primary quick action group |
| Global search (Commands) | Discoverable |
| Mobile FAB / sheet | PMX-004 patterns |
| Context headers | Entity-scoped actions |

---

## Acceptance (A07)

| ID | Criterion |
|----|-----------|
| QA-01 | Role-aware quick actions defined |
| QA-02 | Adapt to permissions, subscription, context |
| QA-03 | Actions go through domain commands + events |
| QA-04 | Appear on Command Center + search Commands |

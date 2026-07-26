# 21 — Universal Command Center

**Package:** OPS-001  
**Amendment:** A01  
**Status:** Binding (Approved with Amendments)  
**Visual structure:** [UX-012 Command Center UX](../112-ux-012-platform-experience-design-system/09-command-center-ux.md)

---

## Purpose

The **Command Center** is the homepage of M.P.A. for every authenticated user.

One OPS-powered shell; **role-specific surfaces** composed from the same engines (Tasks, Notifications, AI, Timeline, Inbox, Calendar, Quick Actions, Priority).

---

## Audiences

| Role | Command Center emphasis |
|------|-------------------------|
| Organization Administrator | Org health, priority tasks, billing/ops alerts, team |
| Property Manager | Portfolio ops, WO, leasing, messages |
| Owner | Performance, statements, messages, alerts |
| Facility Technician | Assigned jobs, schedule, arrive/complete |
| Vendor | Offered/accepted jobs, schedule, invoices |
| Tenant | Requests, payments, messages, announcements |

Dashboards remain AUTH-001 assigned (never user-selected); Command Center **is** that assigned home, enriched by OPS.

---

## Surfaces (all roles; filtered by AuthZ + entitlements)

| Widget | Source |
|--------|--------|
| **Priority tasks** | Task Engine + Priority Engine |
| **Notifications** | Notification Center / Inbox unread |
| **AI recommendations** | AI Operations Director / AI events |
| **Calendar** | Scheduled visits, inspections, renewals |
| **Recent activity** | Activity Timeline (scoped) |
| **Quick actions** | Global Quick Actions ([27](./27-global-quick-actions.md)) |
| **Messages** | MHF-001 unread / threads |
| **Alerts** | High/Critical priority + system |

---

## Composition rule

```
Command Center =
  f(Role, Permissions, Subscription entitlements, Active org, Priority Engine)
    ← Tasks · Notifications · AI · Timeline · Inbox · Calendar · Quick Actions
```

No parallel “home page bus.” Modules contribute **events and projections**; they do not ship competing homes.

---

## Experience principles

| Principle | Meaning |
|-----------|---------|
| One homepage | Deep links return to Command Center |
| Role-fit | Technician never sees Owner portfolio chrome |
| Action-first | Priority tasks + quick actions above fold |
| Mobile-native | PMX-004: thumb-reachable primary actions |
| Empty states | Clear next step, not blank dashboard |

---

## Acceptance (A01)

| ID | Criterion |
|----|-----------|
| CC-01 | Command Center is homepage for all authenticated roles |
| CC-02 | Same OPS engines; role-filtered composition |
| CC-03 | Surfaces include tasks, notifications, AI, calendar, activity, quick actions, messages, alerts |
| CC-04 | Modules do not invent alternate homes |

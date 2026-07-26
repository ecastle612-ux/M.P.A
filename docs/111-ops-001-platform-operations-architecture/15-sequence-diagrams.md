# 15 — Sequence Diagrams

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## 1) Domain mutation → outbox → fan-out

```mermaid
sequenceDiagram
  participant User
  participant Domain
  participant DB
  participant Outbox
  participant Disp as Dispatcher
  participant TL as Timeline
  participant NC as Notification Center
  participant Aut as Automation

  User->>Domain: Create maintenance request
  Domain->>DB: Write WO + outbox event
  Disp->>Outbox: Claim pending
  Disp->>TL: Project activity
  Disp->>NC: Notify recipients
  Disp->>Aut: Evaluate rules
```

---

## 2) Maintenance lifecycle on timeline

```mermaid
sequenceDiagram
  participant Sys as OPS
  participant TL as Timeline

  Sys->>TL: request.created
  Sys->>TL: vendor.assigned
  Sys->>TL: vendor.accepted
  Sys->>TL: technician.arrived
  Sys->>TL: work.completed
  Sys->>TL: ai.summary.generated
```

---

## 3) Lease expiry automation

```mermaid
sequenceDiagram
  participant Sched as Scheduler
  participant Rem as Reminder Engine
  participant Bus as Event Bus
  participant Aut as Automation
  participant NC as Notifications
  participant Tasks as Task Engine
  participant AI as AI Router

  Sched->>Rem: Due scan
  Rem->>Bus: lease.expiring
  Bus->>Aut: Match rule
  Aut->>NC: Notify manager + tenant
  Aut->>Tasks: Create renewal task
  Aut->>AI: Draft renewal email (human gate)
```

---

## 4) Notification preferences

```mermaid
sequenceDiagram
  participant Bus as Event
  participant NC as Notification Center
  participant Prefs as Preferences
  participant Push
  participant Email
  participant InApp

  Bus->>NC: maintenance.vendor.assigned
  NC->>Prefs: Resolve channels
  Prefs-->>NC: push + in-app (email off)
  NC->>InApp: Write SoT
  NC->>Push: Send
```

---

## 5) Failure → DLQ → replay

```mermaid
sequenceDiagram
  participant Worker
  participant Q as Queue
  participant DLQ
  participant Ops as Staff Ops
  participant Health

  Worker->>Q: Fail max attempts
  Q->>DLQ: Poison message
  Q->>Health: ops.job.failed
  Ops->>DLQ: Inspect + fix
  Ops->>Q: Replay (audited)
```

---

## 6) Unified Inbox aggregation

```mermaid
flowchart LR
  N[Notifications] --> I[Unified Inbox]
  T[Tasks] --> I
  A[Announcements] --> I
  AI[AI alerts] --> I
  S[System alerts] --> I
  M[Message unread] --> I
```

# 14 — Failure Recovery

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Define how OPS recovers from partial failures without losing the business fact (which already committed with the outbox) and without duplicate harmful side effects.

---

## Principles

1. **Business write wins** — domain TX + outbox committed together  
2. **Retry with backoff** — transient channel/job errors  
3. **Idempotent consumers** — safe redelivery  
4. **DLQ for poison** — human/ops replay  
5. **Compensating actions** — explicit, audited; not silent mutation storms  
6. **Customer clarity** — user sees degraded channel, not silent drop (when possible)  

---

## Recovery playbooks

### Outbox stuck

| Step | Action |
|------|--------|
| Detect | Lag / oldest pending |
| Auto | Dispatcher restart / sweeper |
| Manual | Requeue pending; inspect locks |

### Notification channel down

| Step | Action |
|------|--------|
| Detect | Provider errors |
| Auto | Retry; keep in-app SoT |
| Manual | Switch provider / pause noncritical |

### Automation loop / storm

| Step | Action |
|------|--------|
| Detect | Emit budget exceeded |
| Auto | Circuit-break rule |
| Manual | Disable rule; replay carefully |

### AI worker failure

| Step | Action |
|------|--------|
| Detect | Timeouts / 5xx |
| Auto | Retry; skip noncritical AI |
| Manual | Disable subscription; backlog drain |

### Webhook failure

| Step | Action |
|------|--------|
| Detect | Non-2xx / timeout |
| Auto | Retry schedule |
| Manual | DLQ replay; partner fix |

### Poison message

| Step | Action |
|------|--------|
| Detect | Max attempts / validation error |
| Auto | Move to DLQ; emit `ops.*.failed` |
| Manual | Fix payload/handler; replay one |

---

## Replay tools (staff)

- Replay DLQ message by id  
- Reproject timeline for `event_id` range (org-scoped)  
- Redeliver notification (deduped)  

All replays audited.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| FR-01 | Retry + DLQ + idempotency playbooks defined |
| FR-02 | Channel down keeps in-app history |
| FR-03 | Staff replay is audited and org-scoped |
| FR-04 | Automation circuit-break on storms |

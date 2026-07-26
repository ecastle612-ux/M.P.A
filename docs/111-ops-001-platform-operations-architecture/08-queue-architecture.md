# 08 — Queue Architecture

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Define how work moves through OPS queues with isolation, retries, and backpressure — Postgres-backed for v1 (ADR-005), broker-optional later without redesigning contracts.

---

## Logical queues

| Queue | Payload | Consumers |
|-------|---------|-----------|
| `outbox.dispatch` | Domain events | Dispatcher → fan-out |
| `notify.channel.*` | Per-channel sends | Push/Email/SMS workers |
| `automate.rules` | Event → rule eval | Automation Engine |
| `tasks.project` | Task side-effects | Task workers |
| `jobs.default` | Background jobs | Job workers |
| `jobs.batch` | Nightly / large | Batch workers |
| `ai.triggers` | AI requests | AI workers |
| `webhooks.outbound` | Partner webhooks | Webhook workers |
| `dlq.*` | Poison messages | Ops replay tools |

---

## Semantics

| Concern | Design |
|---------|--------|
| Delivery | At-least-once |
| Ack | After successful handler + side effects durable |
| Visibility timeout | Claim lease; reclaim if worker dies |
| Idempotency | Consumer key `(queue, message_id)` or `event_id` |
| Ordering | Per `organization_id`+aggregate best-effort on critical queues |
| Backpressure | Max in-flight per org; shed batch before interactive |

---

## Retry policy (defaults)

| Attempt | Delay |
|---------|-------|
| 1 | Immediate / short |
| 2 | 30s |
| 3 | 2m |
| 4 | 10m |
| 5+ | DLQ (type-specific max) |

Non-retryable errors (validation) go DLQ immediately.

---

## Multi-tenant isolation

- Every tenant message carries `organization_id`  
- Workers must re-check AuthZ/RLS assumptions server-side  
- No cross-org batching that mixes payloads in one job  

---

## Future broker

Kafka/SQS/etc. may replace transport; **message contracts and consumer idempotency stay**. Migration does not change event envelope.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| Q-01 | Logical queues defined for outbox/notify/automate/jobs/ai/webhooks/dlq |
| Q-02 | Retry + visibility timeout + idempotency |
| Q-03 | Per-org isolation |
| Q-04 | Transport swappable without contract break |

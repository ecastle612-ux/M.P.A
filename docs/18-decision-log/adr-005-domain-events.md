# ADR-005: Domain Event System for Workflow Connectivity

## Status
Accepted

## Date
2026-07-11

## Context
M.P.A. is a connected operating system where workflows hand off to each other (lease signed → move-in tasks → rent schedule). The initial architecture had no event infrastructure — workflow connections would become brittle point-to-point function calls.

## Decision
Implement a **domain event log** (`event_domain_events`) with outbox pattern. Edge Functions emit events in the same transaction as business data writes. Event consumers (Edge Functions) process events asynchronously for downstream workflow steps, notifications, and AI triggers.

## Consequences
**Easier:** Workflow automation, AI triggers, audit trail, future event replay.

**More difficult:** Event ordering, idempotent consumers, monitoring unprocessed events.

## Alternatives Considered
- **Point-to-point Edge Function calls:** Rejected — brittle, no audit, no replay.
- **External message broker (Kafka, RabbitMQ):** Rejected for v1 — Postgres-backed events sufficient at current scale.

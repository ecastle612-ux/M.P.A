# 00 — Executive Summary

**Package:** OPS-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Goal

Define the **operational nervous system** of M.P.A.: a single event-driven backbone for notifications, activity timelines, automation, tasks, jobs, queues, AI triggers, reminders, scheduling, unified inbox, and operational health.

---

## Thesis

| Principle | Statement |
|-----------|-----------|
| **Event-first** | Important actions become standardized Events |
| **One bus** | Domain modules emit; OPS routes and records |
| **One notification origin** | All channels fan out from Notification Center |
| **One timeline** | Chronological Activity Timeline per organization |
| **Actionable work** | Tasks are first-class, not buried in chat |
| **AI as subscriber** | AI reacts to events; does not own a shadow pipeline |
| **Observable** | Failures in queues, notifications, webhooks, jobs, AI, storage are visible |
| **Org isolation** | Every operational artifact is organization-scoped |

---

## In scope (design)

1. Event architecture + catalog  
2. Notification architecture (push/email/SMS/in-app + future)  
3. Activity timeline  
4. Automation engine  
5. Task engine  
6. Background jobs + queue architecture  
7. AI event triggers  
8. Unified inbox  
9. Reminder engine + scheduler  
10. System health + failure recovery  
11. Sequences, edge cases, acceptance, implementation slices  

---

## Out of scope

| Excluded | Note |
|----------|------|
| Schema/API/UI implementation | Gate-locked |
| Replacing Stripe / auth / COM commercial logic | Those packages remain SoT for their domains |
| Vendor SDK calls from domain modules | Providers stay behind channel adapters (API-001, EML-001, …) |
| Kafka/RabbitMQ mandate | Postgres outbox remains v1 default (ADR-005); broker optional later |
| Full visual rule-builder UX | Automation rules designed; builder UI may be later slice |

---

## Success

**Design PASS** when OPS-001 + ADR-028 are Approved.  
**Platform PASS** (post-implement) when domain actions reliably drive timeline + notify + automate + task + AI without inventing side channels.

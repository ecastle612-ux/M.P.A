# ADR-028: Platform Operations Backbone (OPS-001)

## Status
Accepted

## Date
2026-07-23

## Context
COM-001, AUTH-001, FIN-003, and PMX-004 define commercial lifecycle, identity, financial payouts, and PWA experience. ADR-005 established a domain event log with outbox, but the platform needs a single operating-system SoT so every module communicates through one operational architecture — events, notifications, timelines, automation, tasks, AI direction, search, command center, and health.

## Decision
Adopt **OPS-001** ([package](../111-ops-001-platform-operations-architecture/README.md)) as the operational backbone / operating system of M.P.A., **including Amendments A01–A09**:

1. **Single event bus** with standardized envelope, catalog, and outbox (extends ADR-005).  
2. **Notification Center** as sole origin of channel fan-out.  
3. **Activity Timeline** per organization.  
4. **Automation, Tasks, Reminders (smart), Scheduler, Jobs/Queues**.  
5. **AI Operations Director** — monitors events; recommends/drafts with confidence thresholds, escalation rules, and human approval gates.  
6. **Operational Priority Engine** — Critical → Low drives notify/task/dashboard/AI/escalation.  
7. **Workflow Orchestration** — reusable templates for every module.  
8. **Universal Command Center** — homepage for all roles, OPS-composed.  
9. **Unified Inbox, Unified Search, Global Quick Actions**.  
10. **Operational Analytics** KPIs from OPS signals.  
11. **System health + failure recovery**.  
12. Implementation only via authorized slices A–E (Event/Timeline → Notify/Remind/Schedule → Task/Workflow/Priority → AI/Automate/Analytics → Inbox/Command/Search/Actions).

Every future module must communicate exclusively through this architecture — no parallel buses.

## Consequences
**Easier:** Consistent OS for all modules; safer AI ops; unified homepage/search/actions; operable priorities and workflows.  
**More difficult:** Catalog/envelope discipline; migration of ad-hoc paths; sequential slice delivery.

## Alternatives Considered
- **Keep only ADR-005 without product SoT:** Rejected — insufficient OS ownership.  
- **Per-module homes/buses:** Rejected — fragments UX and automation.  
- **Ungated AI mutations:** Rejected — unsafe for money/legal/resident messaging.

## References
- [OPS-001 package](../111-ops-001-platform-operations-architecture/README.md)  
- [OPS-001 Approval record](../111-ops-001-platform-operations-architecture/29-approval-record.md)  
- [ADR-005](./adr-005-domain-events.md) · [ADR-006](./adr-006-embedded-ai-not-chatbot.md)  
- [COM-001](../110-com-001-customer-lifecycle-commercial-operations/README.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md)

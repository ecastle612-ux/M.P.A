# Automation Roadmap (AUT)

## Status

**Permanent — automation requirements registry**

Automation requirements define how M.P.A. reduces repetitive property management labor while preserving human control (MHF-002, MHF-004). All automation builds on **domain events** (ADR-005) and **workflow-first** triggers (MHF-003).

Source: [13 AI Strategy](../13-ai-strategy/index.md), [05 Business Workflows](../05-business-workflows/index.md), [02 Product Philosophy](../02-product-philosophy/index.md)

---

## Automation Principles

| Principle | Rule |
|-----------|------|
| Trigger from workflow events | Automations start from domain events — not cron-only silos |
| Human override | Every automation can be paused, skipped, or reversed by PM |
| Audit trail | Automation runs logged with trigger, action, and outcome |
| Risk tiering | Low-risk may auto-run; medium/high require confirmation (MHF-004) |
| Org configurability | Rules scoped per organization with sensible defaults |

---

## Category 1 — Lifecycle Automations

Tied to [05 Business Workflows](../05-business-workflows/index.md) master lifecycle.

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-101 | Vacancy alert | Unit status → vacant | Notify PM; add dashboard task | Low | 4 ✓ |
| AUT-102 | Lease expiry reminder | Lease end date − N days | Notify PM and tenant; suggest renewal workflow | Medium | 5 |
| AUT-103 | Move-in checklist | Lease status → active | Generate task sequence | Low | 5 |
| AUT-104 | Move-out inspection schedule | Move-out initiated | Schedule inspection work order | Medium | 6 |
| AUT-105 | Deposit disposition timer | Move-out complete | Remind PM of legal deadline | Low | 8 |

---

## Category 2 — Rent & Collections

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-201 | Rent due reminder | Rent due date − N days | SMS/email/push to resident | Low | 8, 10 |
| AUT-202 | Late fee assessment | Grace period elapsed | Create charge; notify resident | Medium | 8 |
| AUT-203 | Delinquency escalation | N days past due | Escalate to PM action queue | Medium | 8 |
| AUT-204 | Payment confirmation | Payment webhook | Update ledger; receipt to resident | Low | 8 |
| AUT-205 | NSF retry sequence | Payment failed | Scheduled retry + notify | Medium | 8 |

---

## Category 3 — Maintenance

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-301 | Work order routing | WO created | Assign vendor by rules/geography | Medium | 6, 7 |
| AUT-302 | SLA breach alert | WO open > threshold | Escalate to PM | Low | 6 |
| AUT-303 | Resident status updates | WO status change | Push/SMS to resident | Low | 6, 10 |
| AUT-304 | Preventive maintenance | Schedule due | Create WO; assign vendor | Low | 6 |
| AUT-305 | Vendor completion prompt | WO stale | Nudge vendor mobile app | Low | 7 |

---

## Category 4 — Communication (MHF-001)

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-401 | Scheduled announcement publish | Scheduled time reached | Deliver via preference channels | Low | 10 |
| AUT-402 | Emergency broadcast | PM marks emergency | Override quiet hours; SMS fallback | Medium | 10 |
| AUT-403 | Unread announcement nudge | No read receipt + N hours | Secondary channel delivery | Low | 10 |
| AUT-404 | Welcome sequence | Resident QR enrollment | Onboarding messages + prefs setup | Low | 10 |
| AUT-405 | Multi-language fan-out | Announcement published | Translate + deliver per locale | Low | 10 |

---

## Category 5 — Owner & Reporting

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-501 | Monthly owner statement | Month end | Generate and deliver statement | Medium | 8, 9 |
| AUT-502 | Major repair approval request | WO cost > threshold | Route to owner portal | High | 9 |
| AUT-503 | Portfolio summary digest | Weekly schedule | Email digest to PM | Low | 11 |

---

## Category 6 — AI-Assisted Automation

Embedded AI automations — always MHF-004 compliant.

| ID | Automation | Trigger | Action | Risk | Phase |
|----|------------|---------|--------|------|-------|
| AUT-601 | Expense categorization | Invoice uploaded | Suggest category; PM confirms | Low | 8, 11 |
| AUT-602 | Maintenance triage | WO description submitted | Suggest priority/vendor | Medium | 6, 11 |
| AUT-603 | Announcement draft | PM starts compose | Draft from template + context | Low | 10, 11 |
| AUT-604 | Anomaly flag | Metric deviation | Surface in AI Operations Center | Low | 11 |
| AUT-605 | Lease term extraction | Document uploaded | Pre-fill lease fields; PM confirms | Medium | 5, 11 |

---

## Automation Engine Requirements (Platform)

| ID | Requirement | Priority |
|----|-------------|----------|
| AUT-E01 | Visual rule builder for PM-configurable automations | MEDIUM |
| AUT-E02 | Domain event subscription registry | HIGH |
| AUT-E03 | Dead-letter queue for failed automation runs | HIGH |
| AUT-E04 | Simulation / dry-run before enabling rules | MEDIUM |
| AUT-E05 | Rate limiting and org quotas | HIGH |

**Competitive anchor:** [CA-009 Automation Engine](./competitive-advantages.md#ca-009-automation-engine)

---

## Anti-Patterns (Forbidden)

| Anti-pattern | Why |
|--------------|-----|
| Silent auto-eviction or lease termination | Violates MHF-004 high-risk tier |
| Automation without audit log | Violates enterprise trust |
| Cross-org automation leakage | Violates MHF-005 multi-tenant |
| Chatbot-only automation interface | Violates ADR-006 |

---

## Sequencing

1. **Foundation (current):** Domain event infrastructure (ADR-005)
2. **Phase 5–6:** Lifecycle and maintenance automations (AUT-1xx, AUT-3xx)
3. **Phase 8:** Rent and collections (AUT-2xx)
4. **Phase 10:** Communication automations (AUT-4xx) — enables MHF-001
5. **Phase 11:** AI-assisted layer (AUT-6xx)

---

## Related Documents

- [AI Roadmap](./ai-roadmap.md)
- [Communication Platform](./communication-platform.md)
- [Integration Roadmap](./integration-roadmap.md)
- ADR-005 Domain Events

# 16 — Edge Cases

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Events

| Case | Expected |
|------|----------|
| Domain write succeeds, outbox insert fails | TX rolls back; no silent partial |
| Duplicate delivery | Consumer no-ops via idempotency |
| Event for deleted subject | Projector shows historical; deep link safe empty state |
| Cross-org event forgery | Reject; org_id from auth context only |

## Notifications

| Case | Expected |
|------|----------|
| All channels opted out | In-app still written for critical/security; others suppressed per policy |
| Quiet hours + emergency | Emergency bypasses |
| User disabled mid-fanout | Skip remaining channels |
| Provider timeout | Retry; in-app remains |

## Automation

| Case | Expected |
|------|----------|
| Rule creates event that retriggers same rule | Loop budget trips; circuit break |
| Entitlement removed mid-rule | Action no-ops with reason |
| Human gate ignored by bug | Treat as P0; outbound must check gate server-side |

## Tasks

| Case | Expected |
|------|----------|
| Owner leaves org | Reassign queue / Org Admin |
| Dependency cycle | Reject create/update |
| Complete twice | Idempotent done |

## Jobs / queues

| Case | Expected |
|------|----------|
| Worker crash mid-job | Lease expires; retry |
| Poison payload | DLQ |
| Org suspended | Pause noncritical jobs; keep billing/security |

## AI

| Case | Expected |
|------|----------|
| AI down | Skip optional AI; workflow continues |
| Hallucinated vendor recommend | Human confirm before assign |
| Prompt injection in WO text | Tool allowlist + org scope |

## Inbox / timeline

| Case | Expected |
|------|----------|
| High-volume org | Pagination; rate-limit noisy event types |
| Portal user sees others’ items | Fail closed visibility |

## Design defaults

See [19 — Open questions](./19-open-questions.md).

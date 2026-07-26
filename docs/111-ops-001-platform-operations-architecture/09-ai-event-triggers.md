# 09 — AI Event Triggers

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Related:** [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md)

---

## Purpose

AI **subscribes to events** via OPS — it does not scrape databases on a private schedule as its primary integration path.

---

## Examples

| Event | AI behavior |
|-------|-------------|
| `maintenance.request.created` | Classify urgency / category |
| `maintenance.vendor.declined` | Recommend another vendor |
| `billing.payment.failed` / late | Draft reminder (human send) |
| `inspection.completed` / media uploaded | Summarize findings |
| `maintenance.work.completed` | Follow-up summary for timeline |

---

## Trigger router

```
Event
  → AI Trigger Router (subscriptions)
    → enqueue ai.triggers job
      → AI worker (org-scoped context retrieval)
        → emit ai.recommendation.generated / ai.summary.generated
          → Timeline + optional Task/Notification (policy)
```

---

## Subscription record

| Field | Description |
|-------|-------------|
| `subscription_id` | UUID |
| `event_type` | Match |
| `capability` | classify / draft / summarize / recommend |
| `auto_apply` | Default **false** for outbound communications |
| `entitlement_key` | Plan AI gates |

---

## Safety

| Rule | Design |
|------|--------|
| Org-scoped retrieval only | ✔ |
| No cross-tenant embeddings in prompts | ✔ |
| Human gate for resident-facing sends | ✔ default |
| Rate limits / AI quotas | Per COM/AUTH capability matrix |
| Prompt/PII minimization | Prefer ids + necessary fields |
| Failures | `ops.job.failed` / AI health; degrade gracefully |

---

## Non-goals

- AI as silent Org Admin  
- AI bypassing Notification Center  
- AI writing passwords or payments  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| AI-01 | AI triggered from events via router |
| AI-02 | Example triggers expressible |
| AI-03 | Outbound drafts human-gated by default |
| AI-04 | Results emit AI events onto timeline |

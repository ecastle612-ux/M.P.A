# 22 — AI Operations Director

**Package:** OPS-001  
**Amendment:** A02  
**Status:** Binding (Approved with Amendments)  
**Related:** [09 AI Event Triggers](./09-ai-event-triggers.md) · ADR-006

---

## Purpose

AI must not merely answer questions. It actively **monitors operational events** and functions as an **Operations Director**: detect, recommend, draft, escalate — within strict decision boundaries and human approval gates.

---

## Example behaviors

| Signal | AI Director action |
|--------|-------------------|
| Maintenance request overdue | Recommend escalation |
| Vendor repeatedly declines jobs | Recommend replacement vendor |
| Late rent trend detected | Recommend intervention |
| Inspection identifies recurring issue | Recommend preventative maintenance |

---

## Operating loop

```
Events (continuous)
  → Situation detection (rules + models)
    → Confidence score
      → Recommend / Draft / Alert
        → Human gate (as required)
          → Approved action via domain command APIs
            → Emit ai.recommendation.* / outcome events
```

---

## Decision boundaries

| AI **may** | AI **must not** |
|------------|-----------------|
| Classify urgency/category | Silently change money or legal status |
| Recommend vendor / priority / next step | Auto-assign vendor without policy allow + confidence |
| Draft resident/PM communications | Send resident-facing messages without human approve (default) |
| Suggest preventative WO | Create bulk WOs without human confirm |
| Flag trends for CS/PM | Access other organizations’ data |
| Propose escalation | Grant permissions or reset Org Admin |

---

## Confidence thresholds (design defaults)

| Band | Confidence | Behavior |
|------|------------|----------|
| **High** | ≥ 0.85 | Auto-apply only for **non-mutating** labels (e.g. category tag) if policy allows |
| **Medium** | 0.60–0.84 | Recommend in Command Center; require one-click approve for mutations |
| **Low** | below 0.60 | Suggest as “possible insight”; no mutation path |

Exact numbers tunable at Implement; **outbound communications default to human approve** regardless of confidence.

---

## Approval requirements

| Action class | Gate |
|--------------|------|
| Label / summarize for internal UI | Optional auto |
| Create/update task | Auto OK if low-risk template |
| Escalate WO priority | Human approve (PM/supervisor) |
| Reassign / recommend vendor apply | Human approve |
| Draft email/SMS to resident | Human approve + send |
| Preventative WO create | Human approve |
| Financial write-offs / credits | Never AI-alone |

---

## Escalation rules

| Condition | Escalate to |
|-----------|-------------|
| Critical priority + overdue SLA | Supervisor + AI recommend escalate |
| Repeated vendor declines (N in window) | PM + replacement shortlist |
| Rent delinquency trend | PM / collections playbook |
| AI confidence collapse / tool errors | Disable subscription; Technical Support |
| Safety keywords (gas, fire, flood) | Force Critical + human notify immediately |

---

## Human approval gates (summary)

1. Server-side gate — UI approve is not sufficient alone  
2. Actor recorded (who approved AI suggestion)  
3. Audit + timeline entry  
4. Rejection trains feedback (optional later)  

---

## Acceptance (A02)

| ID | Criterion |
|----|-----------|
| AD-01 | AI monitors events as Operations Director, not Q&A-only |
| AD-02 | Decision boundaries + approval matrix documented |
| AD-03 | Confidence thresholds + escalation rules defined |
| AD-04 | Human gates enforced server-side for mutating/outbound actions |

# IA-001 — Surfaces, Notifications & Learning

**Status:** Draft — Ready for Approval  
**Depends on UX hosts:** [DX-004 OS surfaces](../61-dx-004-five-minute-rule/03-os-surface-specifications.md) · [Phase 11 foundation](../31-phase-11-ai-operations-foundation/README.md)

---

## 9. Operations Center integration

Operations Center (`/dashboard`) becomes the **primary AI push surface**, not `/ai-operations` alone.

| Region | AI content |
| --- | --- |
| **Morning briefing** | REC-OPS-01 — 3–5 sentences + top 3 risks |
| **Today’s priorities** | REC-OPS-02 — ordered list aligned with attentions |
| **Overdue strip** | REC-OPS-03 — count + jump filters |
| **Risk alerts** | REC-OPS-04 — distinct visual from routine due |
| **Recommended actions** | REC-OPS-05 — Context Action = Accept / Open Inspector |
| **Portfolio pulse** | REC-PFH-* summaries (secondary, below fold) |

**Rules**

- Briefing is dismissible for the day; regenerates next morning or on force refresh.  
- Recommendations call existing Resolve / Quick Add / guided jobs — AI does not invent new mutation APIs.  
- Widget already in Phase 11 expands to match this layout; avoid a second competing AI home.

---

## 10. Command Center integration

Universal Command Palette (⌘K) modes:

| Mode | AI behavior |
| --- | --- |
| **Ask AI** | Natural language Q&A over RLS-scoped context (Phase 11 + future LLM) |
| **Actions** | Recommendations appear as runnable actions (“Resume move-in Unit 12B”) |
| **Records** | On select → Inspector may show AI Context Actions |

Pinned prompts (examples):

- What’s overdue today?  
- Which work orders are stalled?  
- Who is at risk of late payment this week?  
- Summarize unread resident messages  

**Guard:** Palette actions that are L3/L4 open confirm UI; never silent execute.

---

## 11. Today’s Work AI integration

Per [DX-004 Today’s Work](../61-dx-004-five-minute-rule/03-os-surface-specifications.md):

| Bucket | AI role |
| --- | --- |
| Overdue / Due today | AI may **re-rank** within bucket (L1); labels show “Suggested order” |
| Waiting on others | AI explains blocker (screening, signature, vendor) |
| **Suggested** | Distinct styling for AI-originated Next Best Action |

**Row contract**

1. Why it matters (human or AI why)  
2. Evidence chips (entity links)  
3. Primary Context Action (human commit)  
4. “Why this?” expand → explainability panel  
5. Dismiss suggestion (does not dismiss underlying obligation unless product already allows)

**Invariant:** Dismissing an AI card ≠ marking a charge paid or an applicant approved.

---

## 12. Notification strategy

Align with [API-001 notification model](../44-api-001-onesignal-notification-foundation/04-notification-event-model.md) (`ai_operations` category).

| Event | Channel bias | When |
| --- | --- | --- |
| Morning briefing ready | In-app; optional push if org enables | Schedule (e.g. 07:30 local) |
| New High risk alert | In-app + push (opt-in) | On detect |
| Stalled WO / delinquency cluster | In-app; digest if noisy | Threshold cross |
| Recommendation generated | In-app only by default | On create |
| Frustration detected | In-app; escalate push if urgent WO+thread | On flag |

**Anti-spam**

- Cap AI pushes per user per day (design default: 5).  
- Prefer digest for L0/L1; immediate only for L1 risk with high confidence.  
- Never push L4 “AI approved X” (impossible by design).  
- Respect notification preferences; AI cannot override quiet hours except org-defined emergencies (emergency WO keywords — still human-defined rules).

---

## 13. Future learning strategy

### Near-term (post-Approve v1)

- Record accept / edit / dismiss on every recommendation.  
- Org-scoped weights: boost recommendation types with high accept rates.  
- No cross-tenant training on customer data.

### Mid-term

- Per-org vendor preference learning from assignment accepts.  
- Draft tone profiles (formal/short) from edited message deltas.  
- Threshold tuning for stall/delinquency false positives.

### Explicitly deferred

- Fine-tuning foundation models on tenant PII  
- Autonomous policy agents that change money/legal state  
- Resident-facing AI that negotiates lease terms  

### Feedback loop diagram

```
Suggestion shown → Human outcome (accept|edit|dismiss)
  → analytics event + ai_activity
    → weekly job adjusts ranking weights (org)
      → next suggestions improve
```

Human remains accountable actor on all L3/L4 commits.

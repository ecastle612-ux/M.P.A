# IA-001 — Executive Summary

**Status:** Approved — Execution Phase 1  
**Date:** 2026-07-18  
**Constraint:** Design + Document only

---

## 1. Executive Summary

Phase 11 shipped an **AI Operations shell** (conversations, insights, activity, Ops widget, Command Center hooks) with a relational/provider-ready assistant. That is a foundation, not yet an active operations manager.

Today AI is still mostly **pull**: open `/ai-operations`, ask a question, get a summary. Interrupted 500-unit managers need **push**: continuous monitoring that puts the next risk and next action into **Today’s Work**, Inspector, and notifications — with humans always confirming high-stakes commits.

IA-001 designs six assistants that share one governance model:

| Assistant | Job |
| --- | --- |
| **AI Operations Manager** | Morning briefing, priorities, overdue, risks, recommended actions |
| **AI Resident Assistant** | Draft replies, summarize threads, frustration detection |
| **AI Maintenance Coordinator** | Stalled WOs, vendor rank, recurring issues, urgency |
| **AI Leasing Assistant** | Incomplete apps, screening explain, missing docs, lease drafts |
| **AI Financial Assistant** | Unusual balances, late-pay risk, duplicate charges, collections drafts |
| **AI Portfolio Health** | Vacancy, occupancy risk, lease expiry, backlog, comms health |

**Relationship to DX-003 / DX-004:** DX-003 clears dual paths; DX-004 defines Today’s Work + Palette + Inspector. IA-001 fills those surfaces with **supervised intelligence**. Approve DX packages first or with IA-001; implement path-fixing before high-volume AI push.

**Non-goals:** Autonomous leasing decisions, auto-posting payments, chatbot-first IA, cross-tenant learning.

---

## 16. Success metrics

| Metric | Baseline (approx) | Target (post IA-001 slices) |
| --- | ---: | ---: |
| % of Today’s Work rows with AI-sourced suggestion | ~0–10% | ≥40% of due items |
| Recommendation accept / edit / dismiss rate tracked | Partial | 100% of surfaced recs |
| Time to morning priority clarity | 10–15 min | ≤3 min (briefing) |
| Stalled WO detection lag | Manual / days | ≤24h automated flag |
| High-risk action auto-executions | Must stay **0** | **0** (hard invariant) |
| False-positive risk alert rate (partner feedback) | n/a | <25% dismissed as noise |
| Draft message edit distance before send | n/a | Median ≥1 edit (humans stay in loop) |

---

## 17. Design Partner impact

| Effect | Why |
| --- | --- |
| **+0.2 to +0.5** Design Partner Readiness | “It tells me what broke overnight” is demo-visible |
| Trust test | Explainability + approval gates prevent “scary AI” rejection |
| Differentiation | Competitors often ship chat; partners feel ops manager |

Risk if shipped without gates: partners lose trust on first wrong auto-action. Prefer under-automate.

---

## 18. Production readiness impact

| Effect | Why |
| --- | --- |
| Small–medium (+0.2–0.4 UX/ops) | Better triage ≠ provider certification |
| Compliance load ↑ | Screening/financial AI needs audit + privacy review |
| Non-goals | Does not clear OneSignal/Stripe/Checkr certification by itself |
| Hard gate | Zero unsupervised high-risk mutations in production |

---

## Recommendation stance

| Question | Answer |
| --- | --- |
| Approve IA-001 design? | **YES — recommend Approve** with DX-003/004 |
| Implement now? | **NO** — Approved |
| Ship LLM provider before OS surfaces? | Prefer **Today’s Work + rules/insights** first; LLM drafts second |
| Unsupervised production autonomy? | **Never** for High-risk tier |

---

## Gate

```
Design ✔ → Document ✔ → Approved → Implement in progress
```

# IA-001 — Vision, Risk & Boundaries

**Status:** Draft — Ready for Approval  
**Aligns with:** [13 AI Strategy](../13-ai-strategy/index.md) · [AI Roadmap](../31-product-requirements/ai-roadmap.md) · MHF-004

---

## 2. AI Vision

### From chatbot to operations manager

| Passive chatbot | Active operations manager |
| --- | --- |
| Waits for questions | Continuously monitors domain events + schedules |
| Answers in a chat silo | Surfaces inside Today’s Work, lists, Inspector |
| Generic “how can I help?” | Named assistants with clear jobs |
| Opaque answers | Explainable: why + source records |
| Can feel autonomous | Explicit human commit on High risk |

### Operating loop

```
Monitor (events + nightly jobs)
  → Detect (risk / stall / incompleteness / anomaly)
    → Recommend (Next Best Action + draft)
      → Human decides (accept / edit / dismiss)
        → Act (existing product APIs / guided jobs)
          → Learn (feedback on accept/dismiss — org-scoped)
```

### Six assistants (logical; one platform)

Assistants are **capability packs**, not six separate products. Shared: context builder, recommendation store, audit, approval gates, RLS.

| Pack | Continuous monitors | Primary surfaces |
| --- | --- | --- |
| Operations Manager | Overdue, open attentions, SLA breaches | Ops Center, AI Ops, notifications |
| Resident Assistant | Unanswered threads, sentiment proxies | Inbox, Inspector, draft pane |
| Maintenance Coordinator | Stall age, recurrence, vendor SLA | Maintenance list, Inspector |
| Leasing Assistant | Incomplete apps, missing docs, unsigned | Applicants, Leases, Move in |
| Financial Assistant | Delinquency, duplicates, unusual balances | Financials, Today’s Work |
| Portfolio Health | Vacancy, expiry cluster, backlog | Ops pulse, AI Ops dashboard |

---

## 5. Risk classification

| Tier | Definition | AI may | AI must not |
| --- | --- | --- | --- |
| **L0 Inform** | Read-only insight | Show, rank, summarize | Mutate data |
| **L1 Assist** | Draft / categorize / prioritize | Write suggestion records; prefill UI | Commit without click |
| **L2 Suggest-act** | Low-stakes automations with audit | Auto-run if org policy allows (e.g. WO category) | Touch money/legal/access |
| **L3 Human-required** | Medium stakes | Recommend + one-click confirm | Silent execute |
| **L4 Forbidden-auto** | High stakes | Draft only | Approve/reject/sign/pay/delete/legal edit |

### Catalog mapping (examples)

| Action | Tier |
| --- | --- |
| Morning briefing narrative | L0 |
| Prioritize Today’s Work order | L1 |
| Auto-categorize work order trade | L2 (org opt-in) |
| Assign recommended vendor | L3 |
| Send draft rent reminder | L3 |
| Record payment / refund / charge create | **L4** |
| Approve / reject applicant | **L4** |
| Apply / change screening decision | **L4** |
| Sign or alter lease/legal docs | **L4** |
| Delete resident/property/WO | **L4** |
| Activate lease / move-in complete | **L4** |

---

## 6. Human approval boundaries

### Hard invariants (non-negotiable)

AI **never**, without an explicit human confirmation step in the UI (or future policy engine with human-configured rules that still log an accountable actor):

1. Approves or rejects applicants  
2. Moves money (charge, payment, refund, write-off, payout, AutoPay enroll)  
3. Signs documents or completes e-sign as any party  
4. Deletes records  
5. Changes legal document content or lease terms of record  
6. Grants portal/access credentials  

### Soft automations (allowed when org enables)

- Categorize WO / expense  
- Rank / reorder attention queues  
- Create **draft** announcements or messages (unsent)  
- Create **insight / recommendation** rows  
- Snooze reminders for the AI suggestion itself (not the underlying obligation)  

### Confirmation UX (normative)

- High-risk: modal or Inspector confirm with entity summary + “AI suggested because…”  
- Medium-risk: primary button “Accept recommendation”  
- Low-risk opt-in: Settings → AI automations, default **off** for new orgs until Design Partner feedback  

---

## 7. Explainability requirements

Every surfaced recommendation / insight must expose:

| Field | Requirement |
| --- | --- |
| **Why** | One plain-language sentence |
| **Evidence** | Links/ids to source entities (WO, charge, thread, applicant) |
| **Signals** | Structured factors (age days, amount, status) when available |
| **Confidence** | Optional ordinal: low / medium / high — never fake precision |
| **Generated at** | Timestamp + job/version id |
| **Feedback** | Accept / edit / dismiss stored |

Forbidden: unexplained “AI says so”; cross-tenant evidence; hidden model chain-of-thought as product truth.

---

## 8. Privacy & compliance

| Topic | Rule |
| --- | --- |
| Tenancy | RLS-scoped context only; no cross-org prompts or training |
| Screening (API-003) | Explain results for PM review; never auto-decide; respect retention |
| Payments (API-005) | No card/bank secrets in prompts; amounts/status ok if authorized |
| Signatures (API-004) | Draft reminders; never act as signer |
| PII minimization | Prefer ids + role-needed fields; strip unnecessary DOB/SSN from LLM context |
| Resident communications | Drafts reviewed before send; frustration flags are internal ops signals |
| Audit | Store suggestion payload + human outcome before/with action |
| Retention | Align insight retention with org policy; purge with tenant delete |
| Providers | LLM keys server-side only; log redaction for prompts/responses |
| Subprocessors | Document when LLM provider enabled; partner disclosure |

Fair housing / adverse action: AI must not produce discriminatory decision language or scoring that replaces human judgment. Screening explanations stay factual and provider-grounded.

# IA-001 — Module Opportunities & Recommendation Catalog

**Status:** Draft — Ready for Approval

For each module: repetitive work / decisions / communication / data entry / follow-up · missed opportunities · forgotten tasks · hidden risks · continuous monitors.

---

## 3. Module-by-module opportunities

### Organization

| Class | Opportunities |
| --- | --- |
| Repetitive | Staff invite follow-up; capability gaps |
| Forgotten | Incomplete setup; missing notification prefs |
| Monitor | Setup completeness; orphaned roles |
| AI | Ops Manager: “Invite incomplete / no admin backup” |

### Properties / Units

| Class | Opportunities |
| --- | --- |
| Repetitive | Vacancy chase; amenity/notes cleanup |
| Missed | Units vacant too long without marketing/move-in start |
| Risk | Concentrated vacancy; units with open emergency WOs |
| Monitor | Days vacant; lease-less occupied; missing media |
| AI | Portfolio Health vacancy trends; Leasing: start Move in CTA |

### Residents

| Class | Opportunities |
| --- | --- |
| Repetitive | Contact updates; portal enrollment nudges |
| Comms | Common FAQ answers; late-pay tone |
| Risk | Frustration spikes; many open WOs per household |
| Monitor | Unanswered messages; preference gaps |
| AI | Resident Assistant drafts + frustration flag |

### Applicants / Screening

| Class | Opportunities |
| --- | --- |
| Repetitive | Incomplete app chase; doc requests |
| Decisions | Approve/reject (**human only**) |
| Risk | Stale apps; missing docs before decision |
| Monitor | Incomplete %, screening pending age, doc checklist |
| AI | Leasing Assistant: incomplete highlight, screening **explain**, missing docs — **never decide** ([API-003](../48-api-003-background-screening/README.md)) |

### Leases / Move In / Move Out

| Class | Opportunities |
| --- | --- |
| Repetitive | Signature reminders; checklist chase |
| Forgotten | Unsigned leases; stalled move-in steps |
| Risk | Occupancy without active lease; move-out without settle |
| Monitor | Signature age; checklist %; expiry window |
| AI | Leasing: draft lease comms; Ops: resume Move in/out ([WF-003](../55-wf-003-resident-lifecycle/00-executive-summary.md)) — **never sign** ([API-004](../50-api-004-electronic-signatures/README.md)) |

### Maintenance / Vendors

| Class | Opportunities |
| --- | --- |
| Repetitive | Assign vendor; status ping; triage urgency |
| Decisions | Who gets the job (**suggest only**) |
| Risk | Stalled WOs; recurring same-unit issues |
| Monitor | Age in status; vendor response SLA; recurrence |
| AI | Maintenance Coordinator: stall, vendor rank, urgency, recurrence |

### Payments / Financials

| Class | Opportunities |
| --- | --- |
| Repetitive | Late reminders; reconcile duplicates |
| Risk | Unusual balances; duplicate charges; rising delinquency |
| Monitor | Days past due; charge anomalies; payment failure patterns |
| AI | Financial Assistant: flag, predict, recommend collections **drafts** — **never move money** ([API-005](../51-api-005-resident-payments-billing/README.md)) |

### Documents / Media

| Class | Opportunities |
| --- | --- |
| Repetitive | Missing lease/ID attachments |
| Forgotten | Expired insurance certificates (if tracked) |
| Monitor | Required docs missing on applicant/lease |
| AI | Leasing: missing document list; Media: suggest attach targets |

### Communications / Announcements

| Class | Opportunities |
| --- | --- |
| Repetitive | Property-wide notices; thread replies |
| Missed | Unread critical announcements |
| Monitor | Unanswered threads; announcement readership |
| AI | Resident Assistant drafts; Ops: “draft announcement for outage” |

### Operations Center / Command Center

| Class | Opportunities |
| --- | --- |
| Repetitive | Morning triage across modules |
| Forgotten | Attention items without Resolve path |
| AI | Ops Manager briefing + Next Best Action; Palette Ask AI ([DX-004](../61-dx-004-five-minute-rule/README.md)) |

### Migration Center

| Class | Opportunities |
| --- | --- |
| Repetitive | Mapping review, error triage |
| Risk | Silent import failures; rollback windows |
| Monitor | Job stuck states; high error rates |
| AI | Summarize import errors; recommend next review step — **never auto-import** |

### Settings / Profile

| Class | Opportunities |
| --- | --- |
| Forgotten | Push/email prefs off; AI automation defaults |
| AI | Ops: “enable reminders” nudges; never change security alone |

---

## 4. AI recommendation catalog

IDs are design-stable for future implementation tickets (post-Approve).

### AI Operations Manager

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-OPS-01 | Morning briefing | L0 | Daily schedule |
| REC-OPS-02 | Today’s priority order | L1 | Open attentions |
| REC-OPS-03 | Overdue cluster alert | L1 | Age > SLA |
| REC-OPS-04 | Risk alert (multi-signal) | L1 | Composite score |
| REC-OPS-05 | Next Best Action card | L3 | Ranked queue |

### AI Resident Assistant

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-RES-01 | Draft reply | L1 | Thread open |
| REC-RES-02 | Conversation summary | L0 | Thread > N messages |
| REC-RES-03 | Predicted FAQ answer | L1 | Keyword/intent |
| REC-RES-04 | Frustration detected | L1 | Sentiment/proxy signals |
| REC-RES-05 | Suggest escalate to phone | L1 | Frustration + unpaid/WO |

### AI Maintenance Coordinator

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-MNT-01 | Stalled WO | L1 | Status age |
| REC-MNT-02 | Vendor recommendation | L3 | WO create/unassigned |
| REC-MNT-03 | Recurring issue | L1 | Same unit/category pattern |
| REC-MNT-04 | Urgency estimate | L1 | Keywords + context |
| REC-MNT-05 | Preventive follow-up | L1 | Post-complete pattern |

### AI Leasing Assistant

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-LSE-01 | Incomplete application | L1 | Checklist gaps |
| REC-LSE-02 | Explain screening results | L0 | Screening complete |
| REC-LSE-03 | Missing documents | L1 | Required docs absent |
| REC-LSE-04 | Draft lease communication | L1 | Unsigned / remind |
| REC-LSE-05 | Resume Move in | L3 | Incomplete guided job |
| REC-LSE-06 | Approve/Reject applicant | **L4 draft-only framing** | Ready-for-decision — human must decide |

### AI Financial Assistant

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-FIN-01 | Unusual balance | L1 | Anomaly rules |
| REC-FIN-02 | Late payment risk | L1 | History + days |
| REC-FIN-03 | Possible duplicate charge | L1 | Same lease/period/amount |
| REC-FIN-04 | Collections message draft | L1 | Delinquent |
| REC-FIN-05 | Record payment / adjust | **L4** | Surfaced as human action only |

### AI Portfolio Health

| ID | Recommendation | Tier | Trigger |
| --- | --- | --- | --- |
| REC-PFH-01 | Vacancy trend narrative | L0 | Weekly |
| REC-PFH-02 | Occupancy risk | L1 | Expiries + notices |
| REC-PFH-03 | Lease expiration forecast | L0 | 30/60/90 |
| REC-PFH-04 | Maintenance backlog health | L0 | Open WO aging |
| REC-PFH-05 | Communication health | L0 | Response lag |
| REC-PFH-06 | Satisfaction proxy | L0 | Frustration + WO reopen |

### Cross-cutting actions (always human-gated)

| Action | Allowed AI role |
| --- | --- |
| Approve/reject applicant | Explain readiness only |
| Move money | Flag + draft reminder only |
| Sign documents | Reminder draft only |
| Delete records | Never recommend delete as one-click |
| Change legal docs | Never |

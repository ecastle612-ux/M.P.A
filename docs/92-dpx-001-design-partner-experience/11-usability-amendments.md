# 11 — Usability Amendments (A–G) + Roadmap Rule

**Package:** DPX-001  
**Status:** **Approved** with `APPROVE DPX-001` (2026-07-21)  
**Binding:** Every Phase 6 / future product decision must satisfy these amendments.

---

## Amendment A — The 10-Second Rule

Every major screen must answer, within **10 seconds** of a first-time user opening it:

1. Where am I?  
2. What’s important right now?  
3. What should I do next?  

If the user hesitates, the page **fails certification**.

**Aligns with:** UX-009 Amendment B (one glance); DPX Priority 1–2.

---

## Amendment B — The Daily Operator Test

Do not only test features. Test an **entire workday**.

### Morning

- Review overnight issues  
- Open dashboard  
- Check maintenance  
- Respond to messages  
- Review payments  

### Leasing

- Review applicant  
- Approve applicant  
- Create lease  
- Send lease  
- Track signature  

### Maintenance

- Review work order  
- Assign vendor  
- Contact resident  
- Upload completion photos  
- Close job  

### Owner

- Review financials  
- Generate owner statement  
- Send report  

Measure **hesitation**, **navigation**, and **completion time** — not only whether the feature works.

**Capture in:** [07-certification-protocol.md](./07-certification-protocol.md) · [04-workflow-timing.md](./04-workflow-timing.md) · [05-friction-registry.md](./05-friction-registry.md)

---

## Amendment C — Workflow Time Budget

Every common workflow has a measurable target. If it consistently exceeds the target because of **UI friction**, redesign it.

| Workflow | Target |
| --- | --- |
| Find resident | &lt; 5 seconds |
| Create work order | &lt; 60 seconds |
| Send announcement | &lt; 30 seconds |
| Generate owner report | &lt; 60 seconds |

Extend the full matrix in [04-workflow-timing.md](./04-workflow-timing.md). Seed rows must be updated to match these budgets where applicable.

---

## Amendment D — Confidence Score

Every page receives a confidence rating (max 10).

Score against:

1. Would I trust this screen with my business?  
2. Is the hierarchy clear?  
3. Do I know the next action?  
4. Does it look polished?  
5. Would I hesitate before clicking?  

**Any page below 9/10 requires improvement** before DPX certification for that surface.

**Template:** [12-confidence-scores.md](./12-confidence-scores.md)

---

## Amendment E — Consistency Standard

Every major screen must feel like the same product.

Verify: headers · cards · buttons · empty states · tables · search · AI · toolbelts · typography · spacing.

No screen introduces a different interaction pattern without a strong, documented reason.

**Aligns with:** Canopy · UX-009 pattern system · DPX Priority 5.

---

## Amendment F — Friction Register

Permanent living document. Every hesitation during testing becomes an entry.

Required fields per item:

| Field | Required |
| --- | --- |
| Problem | ✔ |
| Impact | ✔ |
| Frequency | ✔ |
| Proposed solution | ✔ |
| Status | ✔ |
| Date resolved | when closed |

**Never discard friction observations — they become the roadmap.**

Authoritative file: [05-friction-registry.md](./05-friction-registry.md) (schema updated to match).

---

## Amendment G — Design Partner Council

Before public launch, recruit **3–5 design partner companies**.

Do **not** teach them how to use M.P.A. Observe silently.

Record:

- Every hesitation  
- Every question  
- Every place they look but don’t click  
- Every place they click but didn’t expect  

That feedback outranks another month of internal development.

**Protocol sketch:** [13-design-partner-council.md](./13-design-partner-council.md)

---

## Roadmap rule (permanent)

> **No feature enters the roadmap unless it clearly saves time, reduces risk, improves communication, or removes friction for a property manager.**

M.P.A. does not win by feature count. It wins by helping property managers get through their day faster and with less effort.

**Also binding:** [10-strategic-rule.md](./10-strategic-rule.md) (every new feature must replace friction, not create it).

### Roadmap intake filter

| Question | Required answer |
| --- | --- |
| Saves time? | How / how much |
| Reduces risk? | What risk |
| Improves communication? | For whom |
| Removes friction? | Which friction ID / category |
| Net operator experience | Better / unclear → redesign or reject |

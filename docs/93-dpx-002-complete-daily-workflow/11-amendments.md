# 11 — Amendments (A–G) + Freeze Rule

**Package:** DPX-002  
**Status:** ✅ **Approved** with `APPROVE DPX-002` (2026-07-21)  
**Binding:** Every change in this sprint — and every future workflow that copies this standard — must satisfy these amendments.

---

## Amendment A — Next Action Engine

Every screen must answer:

> What will the property manager most likely do next?

Surface that action automatically. **Never** force users to hunt for the next step.

### Reference examples

**Resident** → Collect Rent · Message · Maintenance · Lease  

**Property** → Residents · Vacancies · Inspection · Announcement  

**Work Order** → Assign Vendor · Message Resident · Upload Photos · Complete Work Order  

**Aligns with:** [03-predicted-next-actions.md](./03-predicted-next-actions.md) · UX-009 toolbelt / attention / AI suggestions.

---

## Amendment B — Continuous Workflow

The user must never feel they are moving between disconnected modules.

The experience is **one continuous operational flow**. Transitions are natural. Search, AI, and contextual actions eliminate unnecessary navigation.

**Fail if:** “I have to go find the module” or “I lost my place.”

---

## Amendment C — Friction Timer

Measure hesitation. Every time the tester pauses because they are unsure where to click, record:

| Field | Required |
| --- | --- |
| Screen | ✔ |
| Reason | ✔ |
| Time lost | ✔ (seconds) |
| Better alternative | ✔ |

**Treat hesitation as a product defect.**

Log in [10-friction-from-this-sprint.md](./10-friction-from-this-sprint.md) and promote to [DPX-001 friction register](../92-dpx-001-design-partner-experience/05-friction-registry.md).

---

## Amendment D — AI Copilot

AI is an **operational partner**. It proactively assists the current workflow and **reduces navigation** — it must not increase interaction.

| Context | Assist with |
| --- | --- |
| Resident | Summarize account · Draft message · Explain payment history |
| Maintenance | Suggest next step · Draft vendor message |
| Property | Outstanding issues · Vacancy recommendations |
| Dashboard | What should I work on first today? |

---

## Amendment E — Momentum Rule

Never interrupt productive work.

Avoid unnecessary: dialogs · confirmations · navigation · scrolling · context switches.

Users must maintain momentum from beginning to end of the certified path.

**Exceptions:** Security / compliance / irreversible money or legal actions — document in friction register (category C) if kept.

---

## Amendment F — Operator Confidence

At every step ask:

> Would an experienced property manager immediately trust this screen?

If not, improve: hierarchy · spacing · actions · terminology · information order.

**Aligns with:** DPX-001 Amendment D (confidence ≥ 9/10) · [12-confidence-scores](../92-dpx-001-design-partner-experience/12-confidence-scores.md).

---

## Amendment G — End-of-Day Test

In addition to the certified S1→S10 path, simulate an actual workday:

Morning → Priorities → Properties → Residents → Maintenance → Messages → Payments → Reports → Dashboard  

Observe: confusion · repeated clicks · repeated searches · scrolling · lost context.

Every interruption becomes a friction item (Amendment C).

**Aligns with:** DPX-001 Amendment B (Daily Operator Test) — DPX-002 End-of-Day is the first full simulation under the gold-standard path.

---

## Success definition (amendment-level)

DPX-002 is complete only when a property manager can finish an entire operational workflow **without thinking about the software itself**.

> The software should disappear. Only the work should remain.

---

## Freeze rule (strategic — after PASS)

When DPX-002 = **PASS**, **freeze** this workflow as the **reference workflow**.

Every future module / workflow must ask:

> Is this as smooth as DPX-002?

If not, **it does not ship.**

See [12-reference-workflow-freeze.md](./12-reference-workflow-freeze.md).

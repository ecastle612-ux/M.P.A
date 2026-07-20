# 05 — Property Manager Review

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Purpose

Define the PM decision workspace that turns normalized screening results into Approve / Reject / Conditional outcomes, with adverse action and lease handoff.

---

## Review workspace

Entry: Applicant detail → Screening tab · Ops “Ready for review” · Command Center.

### Layout (one job)

1. **Party strip** — primary + co-apps / guarantors with per-party status  
2. **Component summary** — identity, credit, criminal, eviction, SOR (flags only + “view report”)  
3. **Flags & notes** — provider flags + PM notes (audited)  
4. **Decision panel** — Approve / Conditional / Reject  
5. **Timeline** — consent → results → decision  

No dashboard clutter in the decision panel.

---

## Viewing reports

- Least privilege: `screening:read` vs `screening:read_full` (full consumer report)
- Every open/download audited
- Prefer vault-stored PDF via signed URL (short TTL)
- Mask SSN; show last4 only where needed

---

## Decisioning

| Action | Required inputs | Next |
|--------|-----------------|------|
| Approve | Optional note | Lease generation eligible |
| Conditional | ≥1 condition record | Track conditions; lease gated |
| Reject | Reason codes (org taxonomy) | Adverse action if consumer report used |

**Human required.** Future auto-rules may pre-select a *recommendation* only.

Fair housing: reason codes must be consistent and non-discriminatory; counsel reviews taxonomy.

---

## Adverse action workflow

When a consumer report contributed to an adverse decision:

1. System marks `adverse_action_pending`
2. Generate notices from versioned templates (pre-adverse / adverse as counsel requires)
3. Deliver via email (+ optional certified/mail provider later)
4. Attach copies to vault + applicant file
5. Record delivery timestamps
6. Mark `adverse_action_complete`

PMs cannot “quietly reject” without completing the packet when policy requires it (hard gate configurable per org with Security default = on).

---

## Conditional approval

Examples of conditions:

- Additional deposit
- Guarantor required / guarantor screening pass
- Proof of income upload
- Pet addendum
- Shorter initial term

Lease module checks open conditions before activation.

---

## Re-screening from review

“Request re-screen” creates a new case, notifies parties for fresh consent if needed, preserves prior case for audit.

---

## Operations Center widgets

| Widget | Metric |
|--------|--------|
| Pending Screenings | Cases in progress / partial |
| Completed Today | Decisions or ready_for_review completions |
| Awaiting Consent | Parties with outstanding authorization |
| Flagged Applicants | Components with review flags |
| Provider Failures | Failed / DLQ orders |
| Average Turnaround | Consent→ready_for_review duration |

---

## Command Center index

| Entity | Searchable fields (design) |
|--------|----------------------------|
| Applicants | Name, email, unit, status |
| Screenings | Case #, provider, state, package |
| Consent | Party, version, granted_at |
| Reports | Component, flag count, expires_at |
| Statuses | Case state filters |
| Flags | Flag code / severity |
| Timeline events | screening.* event types |

Provider capability: `screening:read`.

---

## Automatic rules (future UI)

Show “Suggested: Review” badge — never auto-write `approved` / `rejected`.

# 02 — Screening Workflow

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Purpose

Define the canonical applicant verification lifecycle that leasing, notifications, timeline, Ops Center, and Command Center all share.

---

## Lifecycle (canonical)

```
Application Submitted
  → Consent Requested
    → Consent Granted (electronic authorization)
      → Identity Verification
        → Background package runs in parallel where provider allows:
            Credit Screening
            Criminal Screening
            Eviction History
            Sex Offender Registry
          → Income Verification (future)
            → Results Ready (normalized summary + artifacts)
              → Manual Review
                → Approve | Reject | Conditional Approval
                  → (Approve/Conditional) Generate Lease
                    → Electronic Signature
                      → Resident Activated
```

Adverse action (on reject or adverse conditional paths) runs **in parallel with** decision recording — see [05](./05-property-manager-review.md).

---

## Case model

| Concept | Description |
|---------|-------------|
| **Application** | Existing RX-001 applicant record(s) for a unit/property opportunity |
| **Screening case** | One orchestration unit for a screening package (may cover one or more parties) |
| **Screening party** | Person under review: primary, co-applicant, guarantor, co-signer, adult occupant |
| **Consent record** | Electronic authorization artifact + timestamps + IP/UA + document version |
| **Component result** | Per-check outcome (credit, criminal, eviction, SOR, identity, income) |
| **Decision** | PM outcome with reason codes + optional conditions |
| **Adverse action packet** | Notices + delivery proof for FCRA-required paths |

**Rule:** Re-screening always creates a **new** screening case with `supersedes_case_id` / lineage — never mutates historical reports in place.

---

## State machine (screening case)

| State | Meaning |
|-------|---------|
| `draft` | Created; package selected; not yet sent to provider |
| `awaiting_consent` | Consent links issued; blocked on party authorization |
| `consent_complete` | All required parties authorized |
| `identity_in_progress` | ID verification running |
| `screening_in_progress` | Credit/criminal/eviction/SOR (and future income) running |
| `partial_results` | Some components complete; others pending/failed |
| `ready_for_review` | Normalized results available to authorized PMs |
| `in_review` | PM opened review workspace |
| `approved` | Decision approve |
| `conditionally_approved` | Decision conditional; conditions open |
| `rejected` | Decision reject |
| `adverse_action_pending` | Notices required / in flight |
| `adverse_action_complete` | Notices delivered / recorded |
| `expired` | Report past retention/usability window |
| `cancelled` | Withdrawn before decision |
| `failed` | Unrecoverable provider/system failure after retries |

Terminal for leasing handoff: `approved`, `conditionally_approved` (when conditions allow lease start).  
Terminal closed: `rejected` (+ adverse action complete when required), `cancelled`, `expired`, `failed`.

---

## Package components

| Component | Phase 1 | Notes |
|-----------|---------|-------|
| Identity verification | Yes | Provider-driven |
| Credit report | Yes | Consumer report |
| Criminal report | Yes | Jurisdiction coverage varies by vendor |
| Eviction history | Yes | |
| Sex offender registry | Yes | Often bundled |
| Income verification | Future | Reserve state `income_in_progress` |

Org configures **screening packages** (e.g., “Standard rental”, “Guarantor credit-only”) mapped to provider products — never hard-code SKUs in UI.

---

## Multi-party rules

| Role | Typical package | Consent |
|------|-----------------|---------|
| Primary applicant | Full package | Required |
| Co-applicant / joint | Full or shared policy | Required |
| Guarantor / co-signer | Credit-focused (+ optional criminal) | Required |
| Adult occupant (18+) | Criminal/eviction/SOR often; credit optional | Required if screened |

Application status rolls up: **blocked** while any required party lacks consent or has failed identity; **in screening** while any party case in progress; **ready** when all required parties `ready_for_review` or decided per org policy.

---

## Progress tracking

Expose a normalized progress model to UI:

```
steps: [
  { key: "consent", status },
  { key: "identity", status },
  { key: "credit", status },
  { key: "criminal", status },
  { key: "eviction", status },
  { key: "sex_offender", status },
  { key: "income", status },   // future / hidden when disabled
  { key: "review", status },
  { key: "decision", status }
]
```

Applicant sees non-sensitive progress (“Identity verification in progress”). PM sees component statuses + flags.

---

## Decision outcomes

| Outcome | Effect |
|---------|--------|
| **Approve** | Unlock lease generation for qualifying parties |
| **Reject** | Block lease; start adverse action if consumer report used |
| **Conditional approval** | Lease may proceed only when conditions satisfied (deposit, guarantor, income docs, pet restriction, etc.) |

Conditions are first-class records (`condition_type`, `description`, `due_at`, `status`).

---

## Automatic approval rules (future)

Documented for later slices:

- Rules may **suggest** Approve / Review / Likely decline
- Rules **must not** finalize a decision without human confirmation
- Fair housing review required before enabling any scoring UI

---

## Re-screening & expiration

- **Re-screen:** New case; prior case marked `superseded` for lineage; PM must re-consent if prior consent expired or package changed.
- **Expiration:** Cases/reports enter `expired` per [07](./07-data-retention.md); UI blocks using expired reports for new leases.

---

## Downstream handoffs

| Next system | Trigger |
|-------------|---------|
| Lease module | Approve / conditional (eligible) |
| Signature provider (INT-202) | Lease package ready |
| Resident conversion (RX-001) | Signed lease + move-in criteria |
| Document vault / API-002A | Consent PDFs, report PDFs, ID images |
| Notifications (API-001) | Consent request, complete, decision, adverse action |
| Timeline | All major state transitions |

---

## Notifications (event keys — design)

| Event | Audience |
|-------|----------|
| `screening.consent_requested` | Applicant party |
| `screening.consent_received` | PM |
| `screening.in_progress` | PM (optional) |
| `screening.ready_for_review` | PM |
| `screening.provider_failed` | PM / ops |
| `screening.decision_recorded` | Applicant (careful copy) |
| `screening.adverse_action_sent` | Applicant |
| `screening.expired` | PM |

Copy must be fair-housing safe and counsel-reviewed before production.

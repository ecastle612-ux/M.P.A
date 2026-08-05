# 17 — Phase 3 Design: Leasing Operations

**Package:** CORE-004  
**Phase:** 3  
**Status:** ✅ Authorized · Implemented  
**Date:** 2026-08-05  
**Authorize:** [16](./16-phase-3-authorization.md)

---

## Permanent rule

**Every operational workflow has exactly one canonical state machine.**

All leasing entry points (website, phone, referral, manual, import, existing resident) converge into:

```
Prospect → Inquiry → Lead Qualification → Tour Scheduling → Property Showing
  → Application → Screening → Approval → Lease Generation → SignWell Signature
  → Move-In Preparation → Move-In → Resident → Renewal → Move-Out → Archive
```

Legacy applicant `status` and lease `status` remain synced for existing UI; **`workflow_stage` is authoritative**.

---

## Reuse (ARCH-001)

| Extend | Do not create |
|--------|---------------|
| `applicants` (prospect → approval carrier) | Second applicant/lease CRUD system |
| `leases` (lease_generation → archive carrier) | Parallel leasing dashboard |
| API-004 SignWell · `signature/workflow-advance` | Alternate signature workflow |
| Screening foundation | New screening provider |
| Property Command Center · STD-001 UDF homes | Custom home anatomy |
| OPS bus · notify · global search | Duplicate tracking surfaces |

---

## Dual-entity carrier (one machine)

| Stages | Authoritative row |
|--------|-------------------|
| `prospect` … `approval` | `applicants.workflow_stage` |
| `lease_generation` … `archive` | `leases.workflow_stage` |

Crossing `approval → lease_generation` creates or links a draft lease (existing lease APIs), then continues on the lease carrier. Audit events always write to `leasing_workflow_events`.

---

## Stage contract

Every stage defines: entry · exit · required role · approvals · notifications · audit · timeline · Assistant · Waiting on Me · Waiting on Others · dashboard updates.  

Authoritative definitions: `apps/web/src/lib/lease/workflow.ts` (`LEASING_WORKFLOW_DEFINITIONS`).

---

## Roles

| Role | Responsibilities in machine |
|------|----------------------------|
| Prospect / Applicant | Inquiry responses, application, documents, SignWell signing, move-in tasks |
| Leasing Agent | Qualify, schedule/show, advance application, prepare lease |
| Property Manager | Approvals, exceptions, renewals, move-out |
| Resident | Post move-in renewal/move-out participation |
| Organization Admin | Org policy / override entitlements |
| Master Admin | View As / Test Mode only — no alternate workflow |

---

## Property integration

Every lease/application stage remains scoped to Property · Unit · Organization · Resident/Applicant · Documents · Financials · Maintenance · Timeline · Audit · Assistant · Property Command Center.  
**No duplicate lease tracking.**

---

## SignWell

Certified SignWell only:

```
Generate lease → Send package → Track progress → Completion webhook
  → Resident activation path → Timeline → Assistant → Audit
```

`advanceBusinessWorkflowAfterSignature` advances `signwell_signature → move_in_preparation` (and renewal path).

---

## Automation (example)

```
Application approved
  → Generate draft lease (lease_generation)
  → Queue SignWell package send
  → Notify applicant
  → Property Command Center vacancy / leasing signal
  → Assistant recommendation
  → Timeline + leasing_workflow_events audit
  → Move-In checklist seed
```

---

## Surfaces

| Audience | Surface | Pattern |
|----------|---------|---------|
| Leasing Agent / PM | `/leases` Leasing Home (STD-001) | UDF inherited |
| Lease detail | Workflow panel (canonical advances) | Extend detail — not new CRUD |
| Applicants | `/applicants` + applicant workflow API | Early-stage carrier |
| Property | Property Command Center leasing signals | No duplicate tracking |
| Resident / Applicant | Existing portal + SignWell | Mobile-capable |
| Master Admin | View As / Test Mode | No alternate machine |

---

## Search

Corpus: prospects/applicants · residents · properties · units · leases · status · workflow_stage · renewals · expirations.

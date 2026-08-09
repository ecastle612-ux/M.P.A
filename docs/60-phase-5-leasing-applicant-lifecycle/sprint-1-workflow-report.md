# Phase 5 · Sprint 1 — Workflow Report

## Happy path

```
Prospect (pm_residents)
    ↓ create application (same email → same person)
Applicant + lease_applications.draft
    ↓ submit
submitted
    ↓ enter screening (placeholder)
screening_pending · screening_status = planned
    ↓ approve
application.approved · person = Approved
    ↓ create lease (existing wizard / API)
lease draft · person = Lease Pending · application.lease_id set
    ↓ send SignWell (existing)
pending_signature · person = Pending Move-In
    ↓ signed + activate (existing)
lease active · person = Resident
```

## Screening

```
Application → Background Screening (Integration Planned) → Decision → Lease
```

Sprint 1 only prepares the **workflow location**. No provider credentials, webhooks, or API calls.

## Decision branches

| Action | Application | Person |
| --- | --- | --- |
| Mark incomplete | `incomplete` | `applicant` |
| Deny | `denied` | `applicant` (same record) |
| Approve | `approved` | `approved` |
| Withdraw (event reserved) | `withdrawn` | unchanged until staff archives |

## Notifications (catalog)

Registered keys (delivery via existing engine later/as wired):

- `leasing.application.received`
- `leasing.application.incomplete`
- `leasing.screening.pending`
- `leasing.application.approved` / `denied`
- `leasing.lease.ready` / `signed`
- `leasing.move_in.reminder`
- `leasing.renewal.upcoming`

## PDF templates (ids only)

- `rental_application`
- `approval_letter`
- `denial_letter`
- `lease_summary`
- `move_in_checklist`

## Mission Control priorities

Same attention model as existing daily-ops:

- Applications awaiting review  
- Leases ready to sign  
- Upcoming move-ins  
- Upcoming renewals  
- Pending screening results (waiting on others / integration planned)

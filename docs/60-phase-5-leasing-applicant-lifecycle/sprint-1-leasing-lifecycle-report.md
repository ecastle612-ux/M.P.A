# Phase 5 · Sprint 1 — Leasing Lifecycle Report

## Person model

**One record:** `pm_residents`  
Statuses change; identity (email unique per org) does not fork.

| Status | Label | Role in lifecycle |
| --- | --- | --- |
| `prospect` | Prospect | Interest before application |
| `applicant` | Applicant | Application in progress / denied history |
| `screening_pending` | Screening Pending | Workflow placeholder (no provider) |
| `approved` | Approved | Decision complete — ready for lease |
| `pending_lease` | Lease Pending | Lease draft attached / awaiting send |
| `pending_move_in` | Pending Move-In | Sent for signature / move-in prep |
| `active` | Resident | Activated lease |
| `former` | Former Resident | Move-out complete |
| `archived` | Archived | Retained history |

Canonical path: Prospect → Applicant → Screening Pending → Approved → Lease Pending → (Pending Move-In) → Resident → Former Resident → Archived.

`pending_move_in` remains for operational Move-ins without inventing a second person.

## Application model

**Table:** `lease_applications` (additive)  
Bound to `resident_id`, `property_id`, optional `unit_id` / `lease_id`.

Statuses: draft → submitted → incomplete | screening_pending → approved | denied | withdrawn.

Approving sets person status to **Approved**. Creating a lease (existing `/api/pm/leasing`) moves the same person to **Lease Pending** and links the approved application to the lease. SignWell send moves the person to **Pending Move-In**. Activation remains the existing path to **Resident**.

## Property Manager workspace

Extended **`/pm/leasing`** (not a new dashboard):

1. Prospects  
2. Applications  
3. Approvals  
4. Lease Signing  
5. Move-ins  
6. Renewals (active leases with `end_date` ≤ 60 days)  
7. Move-outs (former / archived)  
8. All leases (existing directory)

## Documents

Application documents use Document Intelligence entity type `application`, and continue to link to resident / property / lease as the lifecycle advances — no duplicate file uploads.

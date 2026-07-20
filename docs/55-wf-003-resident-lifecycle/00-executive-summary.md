# WF-003 — Resident Lifecycle Management

**Status:** Complete (guided workflows + automation + ops widgets)  
**Date:** 2026-07-18  
**Scope:** Workflow enhancement only — reuses Organizations, Properties, Units, Applicants, Leases, Signatures, Screening, Resident Portal, Document Vault, Payments, Notifications, Timeline, Operations Center, and Command Center.

## Executive Summary

M.P.A. now treats resident move-in and move-out as **one guided process** instead of a chain of disconnected CRUD screens. Property managers can activate a resident (from an approved applicant or directly), assign property/unit with occupancy guards, review auto-filled details, see a readiness checklist, and activate with automatic lease linking, portal invite, welcome notification, occupancy sync, and audit events.

Move-out closes the lease, vacates the unit, disables portal access, archives conversations/documents (without deleting history), and updates lifecycle status to Former Resident.

## Scores

| Score | Value |
| --- | --- |
| Design Partner Experience (overall) | **7.6 / 10** |
| Updated readiness (vs WF-002 ~7.2) | **7.2 → 7.6 / 10** |
| Production readiness | **4.5 / 10** (workflow UX improved; commercial hardening unchanged) |

### Why the score moved

- Move-in / move-out wizards collapse multi-screen hopping into a 4–5 step flow.
- Occupancy, lease, portal invite, and lifecycle status update from one activation action.
- Operations Center surfaces pending move-ins/outs and readiness gaps.
- Remaining gaps: SMS welcome channel, deep bulk move-in/out of many units in one click, and deposit settlement automation beyond checklist capture.

## Final recommendation

**Constrained design-partner beta: YES — stronger for resident onboarding/offboarding.**  
**Unsupervised Monday go-live for a 40-unit company: still NO** (same commercial/export/invite-delivery caveats as WF-002).

# 13 — Version 1.0 Acceptance Checklist

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

Use after implementation of each slice. All items require evidence (test id, screenshot, or runbook note).

---

## Platform invariants (every slice)

- [ ] Only `SignatureService` creates/sends packages  
- [ ] No provider brand strings in customer UX  
- [ ] Org isolation (RLS) verified  
- [ ] Webhook idempotency holds  
- [ ] Completed package stores executed artifact in Document Vault  
- [ ] Notifications use API-001 only  
- [ ] Audit events written with originating entity ids  

---

## Slice A

| ID | Criterion | Pass |
|----|-----------|------|
| A1 | Lease: create → send → tenant (+ optional manager) → complete → lease status updates → vault → notify → audit | ☐ |
| A1b | Multi-signer partial progress shows Awaiting Others | ☐ |
| A1c | Decline / expire leave lease non-active; recoverable via new package | ☐ |
| A1d | Permission failure on send without `signature:send` | ☐ |
| A2 | Renewal independent package + history retained | ☐ |
| A3 | Owner agreement stored on owner record; portal visibility | ☐ |
| A4 | Move-in ack blocks complete when setting on | ☐ |
| A5 | Move-out ack completes checklist + vault | ☐ |

---

## Slice B

| ID | Criterion | Pass |
|----|-----------|------|
| B1 | Vendor cannot become Active without completed agreement | ☐ |
| B2 | Contractor path identical with correct labeling | ☐ |
| B3 | Work authorization off by default; when on, blocks vendor start | ☐ |
| B4 | Inspection template sign-off completes vault + Facility Record link | ☐ |
| B5 | Safety ack off by default; when on, gates as configured | ☐ |
| B6 | Facility flows work with Property module entitlement off | ☐ |

---

## Slice C

| ID | Criterion | Pass |
|----|-----------|------|
| C1 | Employee ack send/complete/vault | ☐ |
| C2 | Policy version ack tracked per recipient | ☐ |
| C3 | General org document signature end-to-end | ☐ |
| C4 | Custom request uses SignatureService + vault | ☐ |
| C5 | Employee cannot download others’ packages without permission | ☐ |

---

## Slice D

| ID | Criterion | Pass |
|----|-----------|------|
| D1 | Outstanding / completed / expiring signature reports available | ☐ |
| D2 | Turnaround metric populated for completed packages | ☐ |
| D3 | Compliance summary by workflow | ☐ |
| D4 | QA journeys for A–C happy path + decline + expire | ☐ |
| D5 | Docs mark SIGN-002 V1.0 workflows as designed + implemented | ☐ |

---

## Definition of Done (package)

SIGN-002 V1.0 is **complete** when:

1. Status is Approved and Slices A–D are implemented and checklist-green.  
2. [14](./14-deferred-beyond-v1.md) items remain explicitly out of scope.  
3. API-004 platform tests still pass; no parallel signature subsystem exists.

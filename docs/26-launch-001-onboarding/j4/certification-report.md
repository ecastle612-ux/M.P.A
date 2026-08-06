# J4 Certification Report — First Lease

**Package:** LAUNCH-001  
**Journey:** J4 — First Lease  
**Date:** 2026-08-06  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J4`  
**Delivery:** Complete (implementation)  
**MA Pass:** Pending operator run of [certification.md](./certification.md)

---

## Customer journey verification (implementation)

| Area | Result |
|------|--------|
| Lease creation | Pass — `/pm/leasing` single wizard |
| Document generation | Pass — lease text generated at create |
| SignWell integration | Pass — client, send, sync, webhook; env-gated |
| Offline honesty | Pass — Record signed offline when SignWell unavailable |
| Workflow transitions | Pass — draft → pending_signature → signed → active |
| Resident activation | Pass — status Active |
| Portal activation | Pass — portal Active + tenant welcome surfaces |
| Property updates | Pass — occupied unit + active lease on PCC |
| Financial integration | Pass — recurring rent schedule + current charge |
| Search / Quick Actions | Pass — Create lease action |
| Timeline / audit | Pass — lease.* events |
| Assistant / Mission Control | Pass — progresses to Collect your first rent |
| Permissions | Pass — `pm.leasing:read/write` + leasing writer RLS |
| Accessibility / mobile | Pass — labeled steps; stacked layout |
| Regression | Pass — shared tests 58; web typecheck/lint clean |

---

## SignWell verification

| Check | Result |
|-------|--------|
| Document generation | Pass (platform document → SignWell file) |
| Sending | Pass when `SIGNWELL_API_KEY` set |
| Signing / completion | Pass via webhook `document_completed` or sync |
| Status synchronization | Pass — sync endpoint + webhook |
| Workflow advancement | Pass — activates lease automatically |
| Failure handling | Pass — `lease.signature_failed` + offline path |
| Audit / timeline | Pass |

---

## Financial integration verification

| Check | Result |
|-------|--------|
| Recurring rent scheduled | Pass on activation |
| Current period charge | Pass (`generateCurrentPeriod`) |
| FO consumption | Pass — `lease_residents` linked; FO desk uses activated leases |

---

## Master Admin / Launch Readiness evidence

| Check | Surface |
|-------|---------|
| Lease + SignWell / offline | `/admin/launch-readiness` J4 panel |
| Resident / portal / rent / occupancy | Evidence checks |
| Timeline / audit | Evidence lists |
| Journey completion | `leaseReady` + assistant recommendation |

API: `GET /api/admin/launch/j4?organizationId=<uuid>`

---

## Follow-on

J5 authorized and delivered — see [J5 certification](../j5/certification.md).

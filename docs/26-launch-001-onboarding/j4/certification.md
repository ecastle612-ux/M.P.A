# J4 Certification — First Lease

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J4](../customer-journeys.md#j4--first-lease)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J4`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can create a lease, have it signed electronically, activate it, and immediately begin managing the resident.

---

## Outcome

```
Mission Control → Create your first lease
  → /pm/leasing (one create experience)
  → Select resident (Pending Lease)
  → Lease wizard → review → generate document
  → Send through SignWell (or Record signed offline honesty path)
  → Resident (+ manager if required) signs
  → Lease activates automatically
  → Resident Active · Portal Active · Occupied unit · Recurring rent
  → Mission Control / Assistant → Collect your first rent
```

---

## SignWell

| Item | Behavior |
|------|----------|
| Env | `SIGNWELL_API_KEY` (required for e-sign send) |
| Optional | `SIGNWELL_WEBHOOK_ID`, `SIGNWELL_TEST_MODE` (default test) |
| Send | `POST /api/pm/leasing/[id]/send` → SignWell Create Document + signature page |
| Sync | `POST /api/pm/leasing/[id]/sync` |
| Webhook | `POST /api/leasing/webhooks/signwell` → `document_completed` activates lease |
| Failure | `lease.signature_failed` + offline signed path available |
| Honesty | When SignWell is not configured, **Record signed offline** completes the journey without claiming e-sign succeeded |

---

## Automatic platform events on activation

| Event | Result |
|-------|--------|
| Resident | status → Active |
| Portal | portal_status → Active |
| Unit | status → occupied |
| FO | `lease_residents` + recurring rent schedule + current period charge |
| Timeline / audit | `lease.signed`, `lease.activated` (+ property/resident mirrors) |
| Mission Control | → Collect your first rent |

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Leasing directory | `/pm/leasing` sole create UI |
| Lease Command Center | Review, SignWell send/sync, offline complete, timeline |
| Property Command Center | Active lease, occupied unit, resident, next rent, financial status |
| Resident Portal | Welcome, lease, rent summary, payment due, maintenance, documents |
| FO desk | Points to Leasing (no duplicate create) |
| Master Admin | Launch Readiness J4 evidence panel |

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J3; open Mission Control | Next = Create your first lease → `/pm/leasing?new=1` |
| 2 | Select Pending Lease resident | Wizard continues |
| 3 | Create draft | Document generated; status Draft |
| 4 | Send SignWell (if configured) | Pending Signature; SignWell document id |
| 5 | Complete signatures / sync / webhook | Lease Active |
| 5b | Or Record signed offline | Lease Active (honesty path) |
| 6 | Resident / portal / unit / rent | All activated automatically |
| 7 | Mission Control | Assistant: Collect your first rent |
| 8 | Negative | FO is not a second lease create path |

**Pass requires:** Workaround used? **No** (offline path is advertised honesty, not a silent workaround)

---

## Master Admin verification

| Check | Method |
|-------|--------|
| Lease creation / document | Admin Launch Readiness J4 |
| SignWell workflow | `signWellSent` when key set; else offline honesty noted |
| Resident + portal activation | Evidence checks |
| Financial activation | `recurringRentScheduled` |
| Occupancy | `occupancyUpdated` |
| Timeline / audit | Evidence lists |
| Journey completion | `leaseReady` + assistant recommendation |

API: `GET /api/admin/launch/j4?organizationId=<uuid>`

---

## Follow-on

J5 authorized and delivered — see [J5 certification](../j5/certification.md).

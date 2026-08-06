# J3 Certification — First Resident

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J3](../customer-journeys.md#j3--first-resident)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J3`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can add a resident and immediately begin managing their entire lifecycle.

---

## Outcome

```
Mission Control → Add your first resident
  → /pm/residents (one create experience)
  → Create resident → Assign property → Assign unit
  → Resident profile created
  → Resident appears on property
  → Resident Command Center opens
  → Resident Portal provisioned (Pending Activation if no lease)
  → Mission Control / Assistant → Create your first lease
```

---

## Launch-critical fields

| Field | Required |
|-------|----------|
| First name | Yes |
| Last name | Yes |
| Email | Yes |
| Property | Yes |
| Unit | Yes |

No optional fields in the create wizard.

---

## Resident status (workflow-driven)

| Status | When |
|--------|------|
| Prospect | Early inquiry (reserved; not default create) |
| Pending Lease | Created with property + unit, no lease yet (**J3 end state**) |
| Pending Move-In | Lease exists, not moved in (J4+) |
| Active Resident | Moved in |
| Former Resident | Moved out |

Portal: **Pending Activation** until lease is signed.

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Residents directory | `/pm/residents` — sole create UI (`?new=1`) |
| Resident Command Center | `/pm/residents/[id]` — status, portal, timeline, next journey |
| Property Command Center | Residents list + assignment occupancy |
| Search / Quick Actions | Resident live search; Add resident |
| Mission Control | After first resident → **Create your first lease** |
| FO desk | Resident-lease create form demoted → link to Residents |
| Master Admin | Launch Readiness J3 evidence panel |

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J2; open Mission Control | Next action = Add your first resident → `/pm/residents?new=1` |
| 2 | Create resident with property + unit | Profile created; status Pending Lease |
| 3 | Resident Command Center | Ready message; portal Pending Activation |
| 4 | Property Command Center | Resident listed; timeline shows assignment |
| 5 | Directory / Search | Resident discoverable |
| 6 | Timeline / Audit | `resident.created` (+ assign/portal events) |
| 7 | Mission Control after create | Assistant: Create your first lease |
| 8 | Negative | FO desk is not a second create path |

**Pass requires:** Workaround used? **No**

---

## Master Admin verification

| Check | Method |
|-------|--------|
| Resident creation | Admin Launch Readiness J3 / `GET /api/admin/launch/j3` |
| Property / unit assignment | Evidence `propertyAssigned` / `unitAssigned` |
| Resident status | `statusPendingLease` |
| Portal | `portalPendingActivation` |
| Timeline / audit | Evidence lists |
| Journey completion | `residentReady` + assistant recommendation |

API: `GET /api/admin/launch/j3?organizationId=<uuid>`

---

## Follow-on

J4 authorized and delivered — see [J4 certification](../j4/certification.md).

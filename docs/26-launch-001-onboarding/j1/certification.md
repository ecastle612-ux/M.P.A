# J1 Certification — First Property

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J1](../customer-journeys.md#j1--property-added)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J1`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can add my first property and immediately begin managing it.

---

## Outcome

```
Mission Control
  → Click “Add your first property”
  → Property creation wizard
  → Property created + active
  → Appears in directory / Command Center / MC / search / quick actions / timeline / audit / Assistant
  → Property Command Center opens
  → Mission Control updates
  → M.P.A. Assistant: “Invite your team.”
```

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Properties directory | `/pm/properties` portfolio list + **Add property** |
| Create wizard | 3 steps: name → unit count → confirm & activate |
| Create API | `POST /api/pm/properties` (`pm.properties:write`) |
| Activation | `status = active` immediately; units `available` |
| Property Command Center | `/pm/properties/[id]` — ready message, units, timeline, Assistant |
| Mission Control | Loads `/api/pm/mission-control`; after first property → **Invite your team** |
| Search | Property name results via `/api/pm/properties/search` |
| Quick Actions | Add property / Open Properties / Invite your team |
| Timeline / audit | `property.created` + `property.activated` domain + audit events |
| FO desk | Create form removed — links to Properties (single create path) |
| Master Admin | Launch Readiness → J1 evidence panel (`/api/admin/launch/j1`) |

---

## Honest boundary (not J1)

- Staff invite email / accept UX is **J2** (Assistant recommends it; invite completion is separate).
- Residents, leasing, maintenance remain later journeys.

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J0; open Mission Control | Next action = Add your first property |
| 2 | Click CTA | Opens `/pm/properties?new=1` wizard |
| 3 | Enter name + unit count; create | Redirect to Property Command Center |
| 4 | Command Center | Status active; “My property is ready.”; Assistant “Invite your team.” |
| 5 | Properties directory | Property listed |
| 6 | Mission Control refresh | Next action = Invite your team; property listed |
| 7 | Search property name | Result opens Command Center |
| 8 | Quick Actions ⌘K | Add property / Open Properties present |
| 9 | Negative | Facility-only org cannot open `/pm/properties` |

**Pass requires:** Workaround used? **No** (no FO create lore)

---

## Master Admin verification

| Check | Method |
|-------|--------|
| Property creation | Admin Launch Readiness → load org id → `propertyCreated` / `propertyActive` |
| Timeline | `property.created` / `property.activated` in evidence |
| Audit | Matching `audit_events` rows |
| Assistant | Recommendation = `Invite your team.` |
| Mission Control progression | `missionControlProgressed` yes |
| Permissions | Manager can write; owner read; entitlement fail-closed |

CLI/API: `GET /api/admin/launch/j1?organizationId=<uuid>`

---

## Accessibility / mobile smoke

| Check | Expected |
|-------|----------|
| Wizard labels | Associated with inputs; step announced |
| Primary CTAs | Keyboard reachable |
| Mobile viewport | Wizard and Command Center stack; no horizontal trap |
| Search | Combobox keyboard nav still works with property results |

---

## Evidence to record

- Organization id  
- Property id(s)  
- Event ids (`property.created`, `property.activated`)  
- Audit ids  
- Screenshot: MC next action after create  
- Screenshot: Command Center ready + Assistant  

---

## Result log

| Field | Value |
|-------|-------|
| Environment | _fill on cert_ |
| Cert org | _fill_ |
| Operator | _fill_ |
| Result | _Pass / Fail_ |
| Workaround used? | _Must be No for Pass_ |
| Date | _ISO_ |

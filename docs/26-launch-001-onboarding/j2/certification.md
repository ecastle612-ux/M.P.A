# J2 Certification — Build Your Team

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J2](../customer-journeys.md#j2--staff-invited)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J2`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can invite my team, they can join easily, and everyone lands in the correct workspace ready to work.

---

## Outcome

```
Mission Control → Invite your team
  → /settings/team (one invite experience)
  → Assign launch role
  → Email invitation (+ accept link in UI)
  → Accept → account linked → org joined → role assigned
  → Correct workspace opens
  → Mission Control / Assistant → Add your first resident
```

---

## Launch roles

| Label | Code | Default home |
|-------|------|--------------|
| Organization Admin | `organization_admin` | `/pm/mission-control` |
| Property Manager | `property_manager` | `/pm/mission-control` |
| Leasing Agent | `leasing_agent` | `/pm/leasing` |
| Maintenance Technician | `maintenance_technician` | `/pm/maintenance` |
| Vendor | `vendor` | `/portal/vendor` |
| Owner | `property_owner` | `/portal/owner` |

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Team settings | `/settings/team` — sole invite UI |
| Org settings | Links to Team (no duplicate invite form) |
| Invite API | Create + Resend email + accept URL + events/audit |
| Accept | Preview, login `?next=`, set active org cookie, role home |
| Mission Control | After teammate accepted → **Add your first resident** |
| Master Admin | Launch Readiness J2 evidence panel |

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J1; open Mission Control | Next action = Invite your team → `/settings/team` |
| 2 | Invite each launch role | Invitation created; accept link shown |
| 3 | Email | `email_status=sent` when `RESEND_API_KEY` set |
| 4 | Accept with invited email | Membership active; cookie set; lands on role home |
| 5 | Navigation/permissions | Role can open entitled surfaces; others fail closed |
| 6 | Mission Control after accept | Assistant: Add your first resident |
| 7 | Negative | Wrong email cannot accept |

**Pass requires:** Workaround used? **No** (accept link alone without email is incomplete for production Pass on `invitationEmailDelivered`)

---

## Master Admin verification

| Check | Method |
|-------|--------|
| Invitation sent | Admin Launch Readiness J2 / `GET /api/admin/launch/j2` |
| Invitation accepted | `invitationAccepted` + memberships |
| Role assignment | Memberships roles |
| Workspace assignment | Accept response `homeHref` / role home table |
| Timeline / audit | `invitation.*` events |
| Journey completion | `teamReady` + assistant `Add your first resident.` |

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

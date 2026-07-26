# 13 — Permissions & Notifications

**Package:** FAC-002

---

## Capabilities (proposed names — register in existing auth matrix)

| Capability | Intended roles |
|------------|----------------|
| `facility:dashboard` | technician, property_manager, org_admin |
| `facility:inventory:read` / `write` | tech (write), PM/admin |
| `facility:pm:read` / `write` | PM/admin; tech read |
| `facility:inspection:read` / `write` | tech write assigned; PM/admin |
| `facility:calendar:read` | tech, PM, admin |
| `facility:asset:write` | PM/admin (tech read; optional write) |
| Existing maintenance / vendor caps | Unchanged |

Exact capability strings may match repo conventions at implement time — **one matrix only**.

---

## Notifications (when appropriate)

| Event | Notify |
|-------|--------|
| WO assigned to me | Technician |
| PM occurrence created / WO draft ready | Assignee + optional PM |
| Inspection due / overdue | Assignee |
| Vendor accepted / declined | Manager |
| Warranty nearing expiry (asset/inventory) | PM (digest ok) |

Use existing notification + email providers. Push channel best-effort; **workflows must work without push** (PUSH real-device cert abandoned).

---

## Audit

Mutations on inventory, PM schedules, inspections, and official WO complete remain subject to existing audit/RLS patterns. Prefer org-scoped RLS on all new tables.

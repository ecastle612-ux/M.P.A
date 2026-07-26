# 04 — Technician Dashboard

**Package:** FAC-002

---

## Job to be done

Technician opens M.P.A. and immediately sees **what to do now** — not a PM portfolio dashboard.

---

## First viewport (required)

| Block | Content | Default |
|-------|---------|---------|
| Today | WOs due today assigned to me (or unassigned pool if policy allows) | Sorted by priority then due |
| Overdue | Assigned to me, past due | Count + list |
| Waiting | Waiting on parts / vendor / approval (assigned to me) | Honest empty state |
| Quick actions | New WO (if permitted), Open calendar, Scan/add inventory | Max 3 |

**No** AI brief required. Optional later.

---

## Role routing

| Role | Default home |
|------|----------------|
| `facility_technician` | Technician dashboard |
| `property_manager` / org admin | Existing Ops dashboard; Facility hub reachable from nav |
| Vendor | Existing vendor portal — unchanged |

---

## Data

Compose from existing maintenance queries + assignment fields. Prefer server composition with owner-style caps for large portfolios if needed.

---

## UX rules

- One primary CTA per card (Open work order).  
- Mobile: bottom or top priority list; large tap targets.  
- Desktop: same information density as mobile, not a second layout language.

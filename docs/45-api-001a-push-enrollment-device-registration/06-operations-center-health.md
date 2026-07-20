# 06 — Operations Center Health

**Package:** API-001A  
**Status:** Draft — Ready for Approval  
**Extends:** [API-001 / 07](../44-api-001-onesignal-notification-foundation/07-operations-command-center.md) Notification Health widget

---

## Goal

Give property managers and admins a single **Notification Health** surface for enrollment and delivery reachability — without redesigning the Operations Center layout language.

---

## Notification Health widget

**One job:** Show whether the org can reach people via push and whether delivery is healthy.

### Metrics (required)

| Metric | Definition |
|--------|------------|
| **Registered Devices** | Count of `resident_devices` rows for org (all statuses) |
| **Active Subscribers** | Count of active devices with non-null external subscription id |
| **Pending Registrations** | Users who saw enrollment / started enable but have no active device yet — *or* devices stuck in pending state if modeled; if not modeled, approximate: eligible residents with `push_enabled` intent but zero active devices (Product may accept “Needs enrollment” count instead) |
| **Push Success Rate** | `sent / (sent + failed)` for push attempts in rolling 24h (org-scoped) |
| **Failed Deliveries** | Count of push attempts with failed status in rolling 24h |

### Supporting signals (recommended)

| Signal | Purpose |
|--------|---------|
| Provider mode | `onesignal` vs `noop` warning |
| Users without devices | Audience gap |
| Last successful push | Freshness |

---

## Presentation rules

- Calm when healthy; emphasize failed deliveries / noop provider when not.
- Deep-link: Notification Settings (self), filtered failed notifications, or setup docs — not OneSignal dashboard embeds.
- Hide raw provider secrets and full subscription IDs.
- Roles: managers/admins with communications or integration read permission; not resident-facing.

---

## Data sources

| Metric | Source of truth |
|--------|-----------------|
| Devices / subscribers | `resident_devices` |
| Success / failure | In-app notification push delivery status fields (API-001) |
| Pending | Derived; avoid inventing a second enrollment table unless Approve requires it |

Do **not** scrape OneSignal analytics as the primary Ops source of truth. M.P.A. Postgres remains authoritative for org health.

---

## Empty / cold-start states

| State | Copy direction |
|-------|----------------|
| Zero registered devices | “No one has enabled push yet. Enrollment appears after sign-in.” |
| Provider noop | “Push provider is in noop mode — cloud delivery is off.” |
| Failures spike | “Push deliveries are failing — verify provider credentials and device registrations.” |

---

## Relationship to API-001 widgets

API-001 defined Unread, Critical, Emergency, Pending Responses, Recent Activity, and a high-level Notification Health. API-001A **specifies the Health metrics** above so implementation is unambiguous.

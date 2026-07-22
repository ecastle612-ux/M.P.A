# 08 — Observability (Phase 8)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Intent

Master Admin needs a **Notification Diagnostics** surface — commercial ops, not a new product module for PM orgs.

Reuse Master Admin HQ patterns (ADMIN-003). Prefer extending `/master-admin/` over inventing a parallel settings area.

---

## Per registered user / device fields

| Field | Source (proposed) |
| --- | --- |
| Registered devices | `resident_devices` |
| Browser / platform | device label + platform |
| PWA installed | client-reported flag or heuristic (document accuracy limits) |
| Permission state | client pulse or last-known |
| OneSignal subscription id | `external_subscription_id` |
| Last registration | device timestamps |
| Last notification sent | `in_app_notifications` + push status |
| Last delivered | **Gap today** — requires webhook or client ack (Implement must choose) |
| Last opened | **Gap today** — webhook `notification.clicked` or equivalent |
| Delivery errors | `push_last_error` |
| Retry count | new column or derived (if retries added) |
| Subscription health | derived: active + recent success − errors |

---

## Actions

| Action | Auth |
| --- | --- |
| **Send Test Notification** (per user) | Master Admin only; audit log |
| Open user / org context | Existing MA permissions |

---

## Global Notification Health

Dashboard cards:

- Active subscriptions  
- Registrations 24h  
- Push success rate 24h  
- Failed deliveries 24h  
- Provider health (OneSignal probe)  
- Orphan / inactive subscriptions  

Builds on existing ops metrics (`getNotificationOpsMetrics`, provider health) — consolidate into MA diagnostics rather than duplicating PM Operations Center only.

---

## Non-goals

- Exposing other users’ subscription ids to non–Master Admin roles  
- Scraping OneSignal as source of truth (Postgres remains authoritative for M.P.A. identity link)

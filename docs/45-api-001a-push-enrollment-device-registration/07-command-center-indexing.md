# 07 — Command Center Indexing

**Package:** API-001A  
**Status:** Draft — Ready for Approval  
**Extends:** [API-001 / 07](../44-api-001-onesignal-notification-foundation/07-operations-command-center.md)

---

## Goal

Make enrollment and device health discoverable in the Universal Command Center without scraping OneSignal.

---

## New / extended searchable entities

| Kind | Indexes | Result presentation | Click-through |
|------|---------|---------------------|---------------|
| **Push registrations** | User name/email (allowed), device label, platform, enrolledVia, active | “Push device · {label} · {user} · {active/inactive}” | User profile or Notification Settings (self) / resident device admin view if exists |
| **Device health** | Active/inactive, last registration, unhealthy flags | “Device health · {status} · last seen” | Same as above |
| **Failed registrations** | Client/server registration errors if persisted; else failed push with no_device / invalid_subscription codes | “Registration/delivery issue · {reason}” | Ops health or notification detail |

Existing notification / unread / emergency indexing from API-001 remains.

---

## Query behavior

- Org-scoped.
- PMs see org devices; residents only their own devices if indexed at all.
- Synonyms: `push`, `device`, `subscription`, `enroll`, `registration`, `onesignal` (label only — still Postgres-backed).
- Ranking: unhealthy / failed first, then recent registrations, then text relevance.

---

## What not to index

- API keys, full raw provider payloads with secrets
- Other users’ notification bodies beyond existing notification providers
- Cross-org devices

---

## Implementation note (post-Approve)

Register Command Center providers that query `resident_devices` (+ optional delivery failure aggregates). No change to NotificationService send path.

# 02 — Announcement → Dashboard Architecture

**Package:** UX-001 WI-8 · Architecture only (no tenant/owner/vendor dashboard implementation)

## Intent

Announcements created in Communications should naturally surface in:

| Surface | Future behavior |
| --- | --- |
| Tenant Dashboard | Active announcements for tenant’s property/unit/lease |
| Owner Dashboard | Property-scoped owner-facing announcements |
| Vendor Dashboard | Vendor-relevant notices (future) |
| Notification Center | Push/in-app when `NOTIFICATION_PROVIDER` delivers |
| Activity Timeline | `announcement.published` style events |

## Current foundation

- Table: `announcements` + recipients / reads
- APIs: `/api/announcements`, resident announcements route
- Portal: tenant announcements inbox exists; owner/vendor gated

## Non-goals (this sprint)

- No new portal dashboards
- No change to publish pipeline beyond creation UX polish

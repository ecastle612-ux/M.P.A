# 06 — Notification Center

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Goal

Extend the existing shell Notification Center into the durable, searchable inbox for all notification categories — without redesigning the application chrome or inventing a second inbox.

**Source of truth:** `in_app_notifications` (and designed extensions). Push delivery does not replace the center.

---

## Current baseline

| Capability | Status today |
|------------|--------------|
| List notifications | Yes (`GET /api/notifications`) |
| Unread count | Yes |
| Mark read / unread | Yes (`PATCH` mutation) |
| Mark all read | Yes (`/api/notifications/read-all`) |
| Category filter (partial) | Partial via query options |
| Archive | No |
| Delete | No |
| Search | No |
| Property filter | No |
| Delivery status display | No |
| Deep links (`href`) | Supported in data model |

---

## Target behaviors

### Unread badge

- Badge = count of notifications where `read_at IS NULL` and `deleted_at IS NULL` and `archived_at IS NULL` (or archived excluded from badge by default).
- Updates on open, mark-read, mark-all-read, and when new notifications arrive (poll or realtime).

### Read / mark all read

- Single: set `read_at = now()`.
- Mark all read: scoped to current org + user; optional category filter later.
- Mark unread supported for recovery.

### Archive

- Soft archive via `archived_at`.
- Archived items hidden from default inbox; available under “Archived” filter.
- Archive does not delete history required for audit.

### Delete

- Soft delete via `deleted_at` (user-initiated).
- Hard delete only via retention job / admin policy — not casual UI.
- Deleted items excluded from badge, search (default), and Command Center.

### Search

- Server-side search across `title`, `body`, and optional metadata keywords.
- Minimum: `q` query param with org+user scope.
- Respect RLS / ownership (user sees only own notifications).

### Filter

| Filter | Values |
|--------|--------|
| Status | Unread, Read, Archived, All active |
| Category | Any API-001 category + All |
| Property | Properties the user can access |
| Priority | High / Emergency shortcuts |
| Time | Last 24h / 7d / 30d / custom |

### Notification history

- Default sort: `created_at` desc.
- Pagination (cursor or limit/offset consistent with existing APIs).
- Retention: see below.

### Deep links

- Each item uses `href` when present.
- Fallback: route from `source_entity_type` + `source_entity_id` via a shared entity-link resolver (leases, work orders, threads, announcements, applicants, charges, migration jobs, AI insights).
- Opening via deep link marks read (unless user navigates away without open — prefer mark-read on click).

### Delivery status (optional UI affordance)

- Subtle status for push: Sent / Failed / Skipped — not the primary UX.
- Failure may surface “Push failed” only for high/emergency when useful to PM admins; residents see inbox content regardless.

---

## UX constraints (Canopy / Experience)

- Extend existing Notification Center pattern; do not introduce a competing “alerts inbox.”
- Keep first interaction fast: unread list first.
- No card explosion; list rows with category, title, time, unread marker.
- Emergency items use established urgency treatments from Experience Architecture — not a new visual language.

---

## API surface (design)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications` | List + unread count; add `q`, `propertyId`, `priority`, `archived` |
| PATCH | `/api/notifications/[id]` | `mark_read`, `mark_unread`, `archive`, `unarchive`, `delete` |
| POST | `/api/notifications/read-all` | Mark all read (existing) |

No OneSignal routes under `/api/notifications`. Device registration is a separate authenticated integration endpoint under `/api/notifications/devices` or `/api/integrations/push/devices`.

---

## Retention

| Class | Retention (proposed) |
|-------|----------------------|
| Active unread | Indefinite until read/archive |
| Read | 180 days default, then soft-delete eligible |
| Archived | 365 days |
| Emergency / system security | 365+ days or org policy |
| Soft-deleted | 30 days then purge |

Retention jobs are an implementation slice concern; design requires policy hooks and indexes on `created_at`, `archived_at`, `deleted_at`.

---

## Accessibility & responsive

- Keyboard open/close consistent with shell.
- Badge accessible name includes unread count.
- Mobile: full-screen sheet or existing responsive popover pattern — do not break shell layouts.

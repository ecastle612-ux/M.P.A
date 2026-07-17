# 07 — Operations & Command Center

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Goal

Surface notification health and actionable alerts in the Operations Center, and make notifications / alerts / emergencies discoverable in the Command Center — without redesigning either shell.

---

## Operations Center widgets

Add widgets to the existing Operations Center composition. Each widget has **one job** and deep-links into filtered Notification Center or entity queues.

| Widget | Purpose | Primary metric / content | Click-through |
|--------|---------|--------------------------|---------------|
| **Unread Notifications** | Volume of attention debt | Unread count (org-scoped for PM plane) | Notification Center · Unread |
| **Critical Alerts** | High-priority items needing action | Count + top N (`priority in high,emergency`) | Filtered critical list |
| **Pending Responses** | Threads / requests awaiting PM reply | Count derived from messaging + maintenance SLAs already in product | Inbox / maintenance queues |
| **Recent Activity** | Last notification events across categories | Timeline of last 10 org-relevant notifications | Full history |
| **Emergency Alerts** | Active emergencies only | Open emergency announcements + emergency-category notifications (last 24–72h) | Emergency filter |
| **Notification Health** | Delivery subsystem health | % push sent vs failed (24h), inactive devices, provider = noop warning | Admin / setup diagnostics |

### Widget data rules

- **Org-scoped** via existing session organization.
- Prefer aggregate queries; do not load full notification bodies into the Ops first viewport excessively.
- **Pending Responses** should reuse existing messaging/maintenance signals where available — not invent a parallel queue.
- **Notification Health** visible to roles that can administer integrations; hide raw provider errors from residents.

### Empty / healthy states

- Zero unread → calm empty state, not alarm styling.
- Provider `noop` in production-like env → explicit health warning for admins.
- Emergencies present → urgency treatment per Experience Architecture.

---

## Command Center search

Extend the Command Center registry with notification-domain providers.

### Searchable entities

| Kind | Indexes | Result presentation |
|------|---------|---------------------|
| Notifications | Title, body, category, property name | Title · category · relative time · unread badge |
| Announcements | Existing + ensure published/emergency boost | Title · priority · property |
| Messages | Thread subject / last message (existing messaging search if present) | Thread title · participants |
| Alerts | `priority in (high, emergency)` notifications | Alert styling |
| Emergency Notifications | Category `emergency` OR announcement priority emergency | Emergency badge |
| Unread Notifications | Subset where `read_at` is null | Unread badge |

### Query behavior

- Respect current organization context.
- Users only retrieve **their** notifications (RLS), plus announcements/messages they are allowed to see.
- Support intent prefixes / synonyms, e.g. `unread`, `emergency`, `alerts`.
- Results deep-link to the same `href` / entity resolver as Notification Center.
- Selecting a notification result marks it read (same as center click) unless modifier reserved for “open without mark.”

### Ranking (proposed)

1. Exact emergency matches  
2. Unread  
3. Recency  
4. Text relevance  

---

## Cross-module indexing

Command Center should not scrape OneSignal. Index **M.P.A. Postgres records** only:

- `in_app_notifications`
- `announcements`
- messaging threads (existing)
- optional future `notification_delivery_events` for admin diagnostics (not primary user search)

---

## Non-goals

- Rebuilding Operations Center layout system
- AI-generated command answers
- Global multi-org search for non-platform-admins
- Embedding OneSignal analytics dashboards in Ops

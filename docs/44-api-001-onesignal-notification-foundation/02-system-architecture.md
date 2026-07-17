# 02 — System Architecture

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Design principles

1. **Single orchestration entrypoint** — All modules notify through `NotificationService`. No direct OneSignal / FCM / APNs calls from domain code.
2. **In-app is source of truth** — Durable notification records live in Postgres. Push is a delivery channel with its own status.
3. **Provider swap without rewrite** — Registry selects provider via config (`NOTIFICATION_PROVIDER=onesignal|noop|…`).
4. **Preference-first delivery** — Resolve recipients → apply preferences → persist → deliver.
5. **Idempotent delivery** — Same event + recipient must not create duplicate inbox rows or duplicate pushes.
6. **Org isolation** — Organization ID is mandatory on every notification and every provider payload tag.
7. **Extend, don’t redesign** — Build on Phase 9 / MHF-001 foundations.

---

## Logical architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Domain modules (maintenance, leases, messaging, …)         │
│  emit Application Events  OR  call NotificationService       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  NotificationService                                        │
│  • resolve recipients                                       │
│  • apply preferences (quiet hours, category, property)      │
│  • emergency override                                       │
│  • persist in_app_notifications                             │
│  • enqueue provider delivery                                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  NotificationProvider (interface)                           │
│  registerDevice | unregisterDevice | send | getDeliveryStatus│
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       OneSignalProvider   NoopProvider   FutureProvider
              │                               │
              ▼                               ▼
       OneSignal Cloud                 Firebase / APNs / …
```

---

## Package / module boundaries (target)

| Layer | Location (proposed) | Responsibility |
|-------|---------------------|----------------|
| Contracts | `packages/` shared notification types **or** `apps/web/src/lib/notifications/contracts` | Categories, payload, preferences DTOs |
| Service | `apps/web/src/lib/notifications/service.ts` (or Edge Function consumer) | Orchestration only |
| Provider interface | `apps/web/src/lib/integrations/providers/notification/` | Vendor-neutral |
| OneSignal adapter | `…/providers/notification/onesignal.provider.ts` | HTTP REST to OneSignal (server-only) |
| Registry | `…/providers/notification/registry.ts` | Env-based selection |
| In-app persistence | Existing `notifications/server.ts` | Evolve into service internals |
| Client registration | Thin client SDK wrapper + server registration API | Player/subscription ID → `resident_devices` |

**Forbidden:** imports of OneSignal SDK or REST helpers from maintenance, leases, financials, messaging, AI, migration, or UI feature modules.

---

## Data flow — create notification

1. Workflow action succeeds (e.g., work order submitted).
2. Caller invokes `NotificationService.notify(input)` **or** event consumer maps domain event → notify.
3. Service expands audience (user IDs) from org/property/unit/lease/thread context.
4. For each recipient:
   - Load `notification_preferences`.
   - If category disabled → skip push; optionally still write in-app if in-app enabled.
   - If quiet hours active and not emergency → defer push or skip push (policy in 05).
   - If emergency → override quiet hours and category opt-outs except hard account disable (policy in 05).
5. Insert `in_app_notifications` row (unread).
6. If push eligible → `provider.send(...)` with external idempotency key.
7. Store delivery status on notification metadata or delivery table (see 04).
8. Realtime / polling updates Notification Center badge.

---

## Relationship to domain events (ADR-005)

Preferred long-term path:

```
Domain mutation (same txn)
  → event_domain_events (outbox)
    → notification consumer
      → NotificationService
```

Acceptable transitional path (existing codebase):

```
Domain mutation
  → NotificationService.notify(...)  // direct, but still never OneSignal
```

Implementation slices must migrate call sites that currently import `createInAppNotification` to `NotificationService` so push + preferences apply uniformly.

---

## Client vs server responsibilities

| Concern | Client (browser / PWA) | Server |
|---------|------------------------|--------|
| OneSignal REST API key | Never | Always |
| App ID (public) | Allowed for SDK init | Also known server-side |
| User Auth Key | Never in browser | Only if required; server-only |
| Permission prompt | Yes | No |
| Subscription / player ID | Obtained via SDK | Persisted to `resident_devices` |
| Send notification | Never | Only via NotificationService → provider |
| Mark read / archive | Via existing authenticated APIs | Enforces RLS / ownership |

---

## Multi-plane delivery

| Plane | Typical notifications |
|-------|------------------------|
| Property Manager | Maintenance updates, applicant events, financial alerts, AI recommendations, system alerts |
| Resident / Tenant | Announcements, messages, maintenance status, lease/payment reminders |
| Vendor | Work order assigned / accepted / completed, messages |
| Owner | Statement ready, high-severity property alerts (subset) |

Audience resolution is role-aware and org-scoped. Provider tags include `organization_id`, optional `property_id`, and plane hints for analytics — never used as sole auth.

---

## Failure modes

| Failure | Behavior |
|---------|----------|
| Provider down | In-app row still created; delivery status `failed` / retry queue |
| Invalid subscription | Mark device inactive; do not fail inbox write |
| Preference denies push | In-app may still succeed |
| Duplicate event replay | Idempotency key prevents duplicate inbox + push |
| Partial audience failure | Per-recipient status; others proceed |

---

## Non-goals of this architecture

- Replacing announcements, messaging, or community hub
- Building an email/SMS gateway
- Coupling notification UX to OneSignal’s dashboard UI
- Client-side “send to everyone” admin tools that bypass the service

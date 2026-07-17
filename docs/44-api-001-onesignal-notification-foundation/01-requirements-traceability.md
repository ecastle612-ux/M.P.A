# 01 — Requirements Traceability

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Initiative → PRR mapping

| Capability area | Primary PRR IDs | Existing foundation | Net-new (after Approve) |
|-----------------|-----------------|---------------------|-------------------------|
| Push delivery (production) | INT-301, MHF-001, MOB-002 | Placeholder `resident_devices`, preference flags | OneSignalProvider + registration lifecycle |
| Unified orchestration | INT-305, MHF-001, MHF-008 | Ad hoc `createInAppNotification` calls | NotificationService as sole entrypoint |
| Notification Center | INT-305, PMX-002 | Shell + list/mark-read APIs | Archive, delete, search, property filter, delivery status |
| Preferences | MHF-001 | `notification_preferences` table + form | Quiet hours enforcement, emergency override, category/property prefs |
| Operations Center widgets | PMX-002, MHF-011 | Ops shell | Critical / unread / emergency / health widgets |
| Command Center search | PMX-003, AI-007 | Search registry | Notification + alert + emergency indexes |
| Emergency delivery | MHF-001 | Announcement priority `emergency` | Override quiet hours; audit trail |
| Provider abstraction | MHF-015 | Phase 12 `PushProvider` stub design | Production `NotificationProvider` + registry |

---

## Must-have compliance

| ID | Requirement | API-001 obligation |
|----|-------------|--------------------|
| MHF-001 | Digital resident communication | Real push after enrollment; preferences honored |
| MHF-003 | Workflow-first | Notifications route from workflow events, not CRUD screens |
| MHF-005 | Multi-tenant RLS | All notification rows org-scoped; no cross-org delivery |
| MHF-008 | Domain events | Prefer event-driven routing; idempotent consumers |
| MHF-011 | Operations Center | Surface critical/unread/emergency notification health |
| MHF-015 | Build vs integrate | OneSignal behind provider boundary only |
| CA-003 | QR enrollment | Device registration path after join |
| CA-004 | Digital announcements | Publish → notification + optional push |
| INT-301 | Push delivery | Satisfied via OneSignal (see ADR-017); Firebase/APNs remain swappable |
| INT-305 | In-app notification center | Extend existing center; do not replace |
| MOB-002 | Push registration | Web/PWA registration via OneSignal SDK (client) + server API key (server) |
| PMX-002 | Operations Center | Notification widgets |
| PMX-003 | Command Center | Notification search providers |

---

## INT-301 reconciliation

The Integration Roadmap currently names **Firebase / APNs** for INT-301. API-001 proposes:

| Item | Decision |
|------|----------|
| Primary production provider | **OneSignal** ([ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md)) |
| INT-301 status after Accept | “Push delivery via OneSignal (default); Firebase/APNs/Web Push via same abstraction” |
| Abstraction preserved | Yes — no business logic couples to OneSignal |

Until ADR-017 is **Accepted** and this package is **Approved**, INT-301 remains unmet by production code.

---

## Requirements explicitly deferred

| ID | Item | Why deferred |
|----|------|--------------|
| INT-302 | Twilio SMS | Out of scope; preference schema reserved |
| INT-303 | Email (SendGrid/Resend) | Out of scope; preference schema reserved |
| INT-304 | Translation | Not part of push foundation |
| — | Native iOS/Android apps | Future mobile strategy (19) |
| — | AI auto-replies | Violates MHF-004 / out of scope |

---

## Existing surfaces this package extends (do not redesign)

| Surface | Path / artifact | Extend how |
|---------|-----------------|------------|
| In-app notifications table | `in_app_notifications` | Add fields/categories as designed in 04/06 |
| Notification preferences | `notification_preferences` | Enforce quiet hours + emergency override |
| Device enrollment | `resident_devices` | Store real OneSignal subscription IDs |
| Notification APIs | `/api/notifications*` | Archive/delete/search filters |
| Notification Center UI | `notification-center.tsx` | Filters, archive, deep links |
| Preferences UI | `notification-preferences-form.tsx` | Quiet hours + category/property |
| Ops Center | `operations-center-view.tsx` | Widgets |
| Command Center | `command-center` registry | Search providers |
| Messaging notifications | `messaging/server.ts` | Route through NotificationService |

---

## Traceability verdict

| Stage | Status |
|-------|--------|
| Requirements identified | Complete |
| Conflicts with approved “OneSignal out of scope” notes | Resolved by this package superseding the deferral **only after Approve** |
| Ready for Approve | Yes — pending ADR-017 + checklist on README |

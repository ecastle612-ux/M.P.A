# ADR-017: OneSignal as Primary Push Notification Provider

## Status
Accepted

## Date
2026-07-17

## Context
M.P.A. requires production push delivery to complete MHF-001 (resident communication), MOB-002 (push registration), and INT-301 (push delivery). Phase 9 and the MHF-001 foundation extension intentionally deferred real push providers and shipped in-app notifications plus preference/device placeholders.

The Product Requirements Registry currently names **Firebase / APNs** for INT-301. Independently, product direction for API-001 selects **OneSignal** as the managed push layer for web/PWA first, while still requiring a vendor-neutral provider abstraction so Firebase, APNs, FCM, or Web Push can replace or supplement the adapter later without rewriting business logic.

M.P.A. standards (MHF-015, Phase 12 provider abstractions, ADR-005 domain events) forbid domain modules from calling a vendor SDK directly.

## Decision
1. Adopt **OneSignal** as M.P.A.'s **default production push provider** for API-001.
2. Expose push exclusively through a **`NotificationProvider`** interface invoked only by **`NotificationService`**.
3. Treat INT-301 as satisfied by **push delivery via the abstraction**, with OneSignal as the initial adapter — not as a hard dependency baked into workflows.
4. Keep Firebase / APNs / FCM / Web Push as **future adapters**, not concurrent required primaries in API-001.
5. Keep in-app notifications in Postgres as the **source of truth**; OneSignal is a delivery channel.
6. Do not implement SMS (INT-302) or email (INT-303) in this decision’s scope.

Authoritative design package: [docs/44-api-001-onesignal-notification-foundation](../44-api-001-onesignal-notification-foundation/README.md).

Enrollment / device onboarding UX (workflow gap after live acceptance) is designed separately in [API-001A](../45-api-001a-push-enrollment-device-registration/README.md) and does not change this provider decision.

## Consequences
**Easier:** Faster path to multi-platform web push; unified dashboard for device reachability; single REST integration for server sends; aligns with preference-aware orchestration already designed for MHF-001.

**More difficult:** PRR INT-301 wording must be updated on Accept; team must maintain abstraction discipline; OneSignal outage requires reliance on in-app + retries; client Web SDK still needed for permission/subscription while REST keys remain server-only.

## Alternatives Considered
- **Firebase Cloud Messaging + APNs direct (literal INT-301):** Rejected as the *required primary* for API-001 because it increases native certificate/ops burden for a web/PWA-first phase. Remains a valid future `NotificationProvider` adapter.
- **Web Push (VAPID) only:** Rejected as sole production provider — weaker cross-platform device management and more custom infra for topics, analytics, and future native apps.
- **Call OneSignal directly from each module:** Rejected — violates MHF-015 and blocks provider swap; creates inconsistent preference/quiet-hours enforcement.
- **Delay push until native mobile:** Rejected — blocks MHF-001 push promises and QR enrollment value.

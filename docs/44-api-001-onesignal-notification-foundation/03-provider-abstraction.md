# 03 — Provider Abstraction

**Package:** API-001  
**Status:** Draft — awaiting Approve  
**Related:** [Phase 12 PushProvider stub](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md), [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md)

---

## Goal

Define a vendor-neutral **NotificationProvider** so OneSignal is the default production adapter while Firebase, APNs, FCM, and Web Push remain future-swappable without changing business logic.

Phase 12 sketched `PushProvider`. API-001 **supersedes that stub name** with a fuller `NotificationProvider` covering registration, send, revocation, and delivery status — still at the integration boundary (MHF-015).

---

## Interface (design contract)

```typescript
interface NotificationProvider {
  readonly key: "onesignal" | "noop" | "firebase" | "apns" | "web_push" | string;

  registerDevice(input: RegisterDeviceInput): Promise<DeviceRegistration>;
  unregisterDevice(input: UnregisterDeviceInput): Promise<void>;

  send(input: ProviderSendInput): Promise<ProviderSendResult>;

  /** Optional — providers that support async delivery receipts */
  getDeliveryStatus?(externalId: string): Promise<ProviderDeliveryStatus>;

  /** Optional — webhook verification + normalize to internal events */
  handleWebhook?(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ProviderWebhookResult>;
}
```

### Core input / output shapes

```typescript
type RegisterDeviceInput = {
  organizationId: string;
  userId: string;
  propertyId?: string | null;
  platform: "web" | "ios" | "android" | "unknown";
  /** Provider-specific subscription / player / token */
  externalSubscriptionId: string;
  deviceLabel?: string | null;
  enrolledVia: "qr" | "portal" | "manual" | "pwa";
  metadata?: Record<string, unknown>;
};

type DeviceRegistration = {
  deviceId: string; // internal resident_devices.id
  providerKey: string;
  externalSubscriptionId: string;
  isActive: boolean;
};

type ProviderSendInput = {
  organizationId: string;
  /** Internal notification id for correlation */
  notificationId: string;
  /** Idempotency key: org + event + recipient (+ attempt policy) */
  idempotencyKey: string;
  userId: string;
  externalSubscriptionIds: string[];
  title: string;
  body: string;
  category: string;
  priority: "low" | "normal" | "high" | "emergency";
  href?: string | null;
  data?: Record<string, string>;
  /** Collapse / replace key when supported */
  collapseKey?: string | null;
};

type ProviderSendResult = {
  status: "queued" | "sent" | "skipped" | "failed";
  externalId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  raw?: unknown; // stored redacted in audit logs only
};
```

---

## Registry

```
NOTIFICATION_PROVIDER=onesignal   # production default after Approve+Implement
NOTIFICATION_PROVIDER=noop        # local / CI default
```

```typescript
function getNotificationProvider(): NotificationProvider {
  switch (process.env.NOTIFICATION_PROVIDER ?? "noop") {
    case "onesignal":
      return onesignalProvider;
    case "noop":
    default:
      return noopProvider;
  }
}
```

CI and PR previews **must** default to `noop`. Production selects `onesignal` only when secrets are present and health checks pass.

---

## OneSignalProvider responsibilities

| Concern | Behavior |
|---------|----------|
| Auth | Server-side REST with `ONESIGNAL_API_KEY`; never expose to client |
| Targeting | Send to known subscription IDs / external user ids mapped from M.P.A. user |
| Tags / data | Include `organization_id`, `notification_id`, `category`, deep link `href` |
| Idempotency | Use external idempotency / dedupe strategy documented in implementation notes |
| Errors | Map HTTP failures to `ProviderSendResult`; never throw across service boundary unchecked |
| Webhooks | Optional delivery receipts → update delivery status |

### Client SDK (registration only)

- Browser may load OneSignal Web SDK **only** to obtain permission + subscription ID.
- Client posts subscription ID to an authenticated M.P.A. registration endpoint.
- Client never sends notifications and never holds REST keys.

---

## NoopProvider

- `registerDevice` persists local device row with placeholder external id.
- `send` returns `{ status: "skipped" }` and logs structured debug in non-prod.
- Used for unit tests, CI, and developers without OneSignal credentials.

---

## Future providers (not implemented in API-001)

| Provider key | When | Notes |
|--------------|------|-------|
| `firebase` | If org requires FCM-native path | Adapter only |
| `apns` | Native iOS direct | Usually via OneSignal or Firebase; keep interface ready |
| `web_push` | Self-hosted VAPID | Fallback / offline environments |
| `fcm` | Alias or distinct adapter | Avoid dual-send without explicit multi-provider policy |

**Multi-provider fan-out** (send via OneSignal + email) is out of scope. Channel expansion uses preferences + future channel adapters, not dual push providers by default.

---

## Mapping from Phase 12 `PushProvider`

| Phase 12 | API-001 |
|----------|---------|
| `PushProvider` | Renamed/expanded → `NotificationProvider` |
| `registerDevice` | Retained |
| `sendNotification` | → `send` |
| `validateSubscription` | Folded into register + periodic health |
| Web push stub | Becomes `noop` or future `web_push` |

Docs in Phase 12 remain historical design; **API-001 is authoritative for push after Approve**.

---

## Anti-patterns (reject in review)

- Importing `onesignal.provider` from a workflow module
- Passing REST API keys to the browser “for convenience”
- Hardcoding segment “All Users” for org-scoped sends
- Using OneSignal dashboard campaigns as the primary product notification path
- Storing full provider raw responses with PII in client-visible metadata

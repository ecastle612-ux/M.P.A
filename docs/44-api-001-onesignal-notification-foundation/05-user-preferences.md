# 05 — User Preferences

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Goal

Users control how M.P.A. notifies them. Preferences are evaluated **inside NotificationService** before any provider send. Future email/SMS channels reuse the same preference record without implementing those channels in API-001.

---

## Existing foundation

Table `notification_preferences` (Phase 9) already includes:

- `in_app_enabled`, `push_enabled`, `email_enabled`, `sms_enabled`
- `category_preferences` (jsonb)
- `quiet_hours` (jsonb)
- Unique `(organization_id, user_id)`

Profile APIs and `notification-preferences-form` already expose channel toggles. API-001 **designs enforcement and richer preference semantics**; it does not redesign the form chrome.

---

## Preference model (target)

```typescript
type NotificationPreferences = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  /** Reserved — do not deliver in API-001 */
  emailEnabled: boolean;
  /** Reserved — do not deliver in API-001 */
  smsEnabled: boolean;
  quietHours: QuietHours;
  emergencyOverride: boolean; // user acknowledges emergencies may bypass quiet hours
  categoryPreferences: Partial<Record<NotificationCategory, ChannelPreference>>;
  propertyPreferences?: PropertyPreference[]; // optional mute/focus per property
};

type ChannelPreference = {
  inApp: boolean;
  push: boolean;
  /** Reserved */
  email?: boolean;
  sms?: boolean;
};

type QuietHours = {
  enabled: boolean;
  /** IANA timezone; fall back to profile timezone */
  timezone?: string;
  startLocal: string; // "22:00"
  endLocal: string;   // "07:00"
  /** Days quiet hours apply; default all */
  daysOfWeek?: number[]; // 0=Sun … 6=Sat
};

type PropertyPreference = {
  propertyId: string;
  muted: boolean;
  /** If set, only these categories deliver for this property */
  allowedCategories?: NotificationCategory[];
};
```

---

## Evaluation order (mandatory)

For each recipient + notification:

1. **Hard disable** — If user has no org membership → do not notify.
2. **Deleted / archived preference edge cases** — Use defaults: in-app on, push off until enrolled.
3. **Emergency path** — If `priority === "emergency"` OR category `emergency`:
   - Always create in-app if `inAppEnabled` (default true).
   - Push: deliver if device registered **and** (`emergencyOverride !== false` org policy default true).
   - Quiet hours: **do not apply**.
   - Category opt-out for `emergency`: **ignored** (user cannot silence emergencies at platform level). Org admins may still disable push globally for compliance — document org policy separately if needed.
4. **Global channel flags** — If `pushEnabled === false` → skip push. If `inAppEnabled === false` → skip in-app (rare).
5. **Property preferences** — If muted for `propertyId` → skip (unless emergency).
6. **Category preferences** — If category channel disabled → skip that channel.
7. **Quiet hours** — If active and priority is not emergency → skip push (in-app still created unless deferred policy selected).
8. **Device availability** — If no active `resident_devices` / subscription → skip push with status `skipped`.
9. **Send** remaining channels.

### Quiet hours policy (default)

| Channel | During quiet hours (non-emergency) |
|---------|-------------------------------------|
| In-app | **Create immediately** (badge updates when user opens app) |
| Push | **Skip** (status `skipped`, reason `quiet_hours`) |
| Email / SMS | N/A (not implemented) |

Alternative “defer push until quiet hours end” may be a later enhancement; not required for v1.

---

## Enable / disable push

| Action | Effect |
|--------|--------|
| Enable Push | Sets `push_enabled=true`; client should request browser permission + register device |
| Disable Push | Sets `push_enabled=false`; existing devices remain but sends skip; optional unregister |

Enrollment via QR/portal should prompt enable-push with clear value proposition (MHF-001) without dark patterns.

---

## Category preferences UX

- Present all API-001 categories with in-app / push toggles.
- Email / SMS toggles visible as **Coming soon** / disabled, storing preference bits only.
- Emergency category: UI copy explains it cannot be fully silenced; push still respects global push disable only if product/legal requires — default design: emergencies still attempt push when devices exist and org allows.

---

## Property preferences

- Optional for multi-property PMs and multi-property residents.
- Mute reduces noise without deleting history.
- Emergency still delivers.

---

## Defaults

| Flag | Default |
|------|---------|
| `inAppEnabled` | `true` |
| `pushEnabled` | `false` until explicit enable + registration |
| `emailEnabled` | `true` (reserved; no send) |
| `smsEnabled` | `false` (reserved; no send) |
| Categories | All in-app on; push follows global push flag |
| `quietHours.enabled` | `false` |
| `emergencyOverride` | `true` |

---

## Persistence & API

- Continue org-scoped preference row per user.
- Extend profile / resident preference endpoints to accept quiet hours structure and property preferences.
- Server validates timezone and time format; reject unknown categories.

---

## Future email / SMS compatibility

When INT-302 / INT-303 are approved:

- Same evaluation pipeline adds `EmailProvider` / `SmsProvider` channel adapters.
- Preference bits already exist — no preference redesign required.
- Emergency override applies similarly.
- API-001 must not implement those providers.

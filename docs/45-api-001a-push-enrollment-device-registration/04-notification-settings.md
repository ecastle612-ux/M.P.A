# 04 — Notification Settings

**Package:** API-001A  
**Status:** Draft — Ready for Approval

---

## Goal

Provide a durable management surface for push enrollment, device state, preferences, and verification — without redesigning the broader profile chrome.

---

## Placement

| Shell | Entry |
|-------|--------|
| Tenant / Resident portal | Preferences (extend existing Notification Preferences) |
| Manager / Owner app shell | Profile or Settings → Notification Settings section |
| Deep link | From enrollment denied toast and Ops health “fix” CTAs |

Reuse existing preferences form patterns from Phase 9 / API-001; **add** the device and test controls defined here.

---

## Required section contents

### Push Status

| Display | Values |
|---------|--------|
| Status | Enabled · Disabled · Browser blocked · Not registered · Misconfigured (admin) |
| Explanation | One short sentence matching state |

### Current Device

| Display | Source |
|---------|--------|
| Label | `deviceLabel` / browser UA summary |
| Platform | `web` (later `ios` / `android`) |
| Subscription | Truncated external id (not full secret) |
| Active | Yes / No |

### Last Registration

Relative timestamp of last successful register (`registered_at` / `updated_at`).

### Enable / Disable Push

| Control | Behavior |
|---------|----------|
| Enable | Same registration flow as enrollment Enable |
| Disable | Sets `push_enabled` false and/or deactivates devices; confirm if needed |

### Re-register Device

Forces permission check (if needed) + SDK subscription refresh + device upsert. Use after browser permission reset or failed delivery.

### Test Notification

| Rule | Detail |
|------|--------|
| Visibility | User with active device + push enabled |
| Action | “Send Test Notification” |
| Pipeline | NotificationService only |
| Success | Browser push (when provider live) + Notification Center item |
| Failure | Explicit error (no device, provider error, preferences blocked) |

### Notification Categories

Existing category toggles (API-001 / 05). Defaults created on first enroll if missing.

### Quiet Hours

Existing quiet hours fields; disabled inputs when quiet hours off.

### Emergency Override

Existing emergency override; education: emergencies may notify during quiet hours.

---

## Settings information architecture

```text
Notification Settings
├── Push delivery
│   ├── Status
│   ├── Current device
│   ├── Last registration
│   ├── Enable / Disable
│   ├── Re-register
│   └── Send test notification
├── Quiet hours
│   ├── Enabled + window
│   └── Emergency override
└── Categories
    └── Per-category channel prefs (in-app / push)
```

Email / SMS remain “coming soon” / reserved — do not imply delivery.

---

## State matrix

| Browser permission | Device row | push_enabled | Status label |
|--------------------|------------|--------------|--------------|
| default | none | false | Not registered |
| granted | active | true | Enabled |
| granted | active | false | Disabled (device retained) |
| granted | none | true | Needs registration |
| denied | any | any | Browser blocked |
| granted | inactive | true | Needs re-register |

---

## Default preferences on first enroll

If no `notification_preferences` row:

| Field | Default |
|-------|---------|
| in_app_enabled | true |
| push_enabled | true (after successful enroll) |
| email_enabled / sms_enabled | false (reserved) |
| emergency_override | true |
| quiet_hours.enabled | false |
| categories | all in-app + push on (product may narrow) |

If row exists, do not wipe category choices; set `push_enabled` true on successful enroll unless user just disabled in the same session.

---

## Accessibility & empty states

- Controls labeled; test button disabled with reason when no device.
- Empty device: CTA Enable Push, not an error alarm.
- Provider noop: show “Local / development registration” badge — no fake success rate claims.

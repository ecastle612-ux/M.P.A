# 01 — Requirements

**Package:** API-001A  
**Status:** Draft — Ready for Approval  
**Parent:** [API-001](../44-api-001-onesignal-notification-foundation/README.md)

---

## Problem statement

API-001 provides push infrastructure. Live acceptance showed users can receive **zero** push notifications because nothing drives:

1. Browser notification permission
2. Device / subscription creation
3. Association of subscription to the authenticated user
4. Operator awareness when push reach is zero

API-001A closes that **workflow gap** without changing the notification operating layer.

---

## Goals

| # | Goal |
|---|------|
| G1 | Every authenticated user can enroll in push with a clear, dismissible first-session experience |
| G2 | Granted permission results in a durable `resident_devices` row linked to the user |
| G3 | Denied / dismissed users are not nagged every page load |
| G4 | Settings expose push status, device management, preferences, and a test notification |
| G5 | Announcement publish surfaces recipient count and warns when push reach is zero |
| G6 | Ops and Command Center show enrollment / device health |
| G7 | Architecture of API-001 remains unchanged |

---

## Non-goals

- Redesigning NotificationService, OneSignalProvider, or event routing
- SMS / email delivery
- Native app store builds
- Forcing push enrollment (must remain opt-in)
- Silently inventing recipients when count is zero

---

## PRR / package traceability

| ID / Source | Requirement | API-001A coverage |
|-------------|-------------|-------------------|
| MHF-001 | Digital resident communication with push | Enrollment unlocks real push recipients |
| CA-003 / CA-004 | QR enrollment & announcements | Post-join enrollment path; announcement reach warning |
| MOB-002 | Push registration | Web enrollment + multi-device strategy |
| INT-301 / ADR-017 | Push via abstraction | No change — clients still register; server still uses NotificationService |
| API-001 / 05 | Preferences | Settings completes preference UX + defaults on enroll |
| API-001 / 07 | Ops & Command Center | Notification Health + device indexing deepened |
| FEH-1006 | QR enrollment flows | Enrollment banner may appear after QR join (same rules) |

---

## Functional requirements

### Enrollment

| ID | Requirement |
|----|-------------|
| R-EN-01 | After sign-in, if the user has no active push device for the current org context, show a non-intrusive enrollment banner |
| R-EN-02 | Banner copy educates value without alarm: maintenance, announcements, lease reminders, emergencies |
| R-EN-03 | Primary action: **Enable Notifications**; secondary: **Not Now** |
| R-EN-04 | Enable triggers permission request → SDK init → register device → persist subscription → default preferences if missing → dismiss banner → success toast |
| R-EN-05 | Permission denied dismisses banner and shows Settings guidance; do not re-prompt every load |
| R-EN-06 | Not Now dismisses for a defined cooldown / persistence key (see [02](./02-user-enrollment-flow.md)) |

### Device registration

| ID | Requirement |
|----|-------------|
| R-DR-01 | Subscription ID stored and associated to authenticated user + organization |
| R-DR-02 | Create or update `resident_devices` (active subscription) |
| R-DR-03 | Create default `notification_preferences` when none exist (push enabled after successful enroll) |
| R-DR-04 | Re-register updates the same logical device or replaces stale subscription per [03](./03-device-registration.md) |
| R-DR-05 | Registration failures surface actionable error copy; do not claim success |

### Settings

| ID | Requirement |
|----|-------------|
| R-ST-01 | Notification Settings shows push status, current device, last registration, enable/disable, re-register, test notification |
| R-ST-02 | Categories, quiet hours, emergency override remain preference-driven (API-001 evaluation order) |
| R-ST-03 | Disable push updates preferences and/or deactivates device without deleting history |

### Announcements

| ID | Requirement |
|----|-------------|
| R-AN-01 | Before send/publish, show estimated push recipient count for the selected audience |
| R-AN-02 | If count is zero, warn: no users currently have push enabled; do not silently imply push delivery |
| R-AN-03 | Operator may still publish for in-app / other channels if product allows — warning must be explicit |

### Operations & Command Center

| ID | Requirement |
|----|-------------|
| R-OP-01 | Notification Health shows registered devices, active subscribers, pending registrations, push success rate, failed deliveries |
| R-CC-01 | Command Center indexes push registrations, device health, failed registrations |

### Verification

| ID | Requirement |
|----|-------------|
| R-VR-01 | Send Test Notification action delivers via NotificationService → provider |
| R-VR-02 | Brand-new user path: login → enable → receive test push → Notification Center updates → device persists |

---

## Non-functional requirements

| ID | Requirement |
|----|-------------|
| R-NF-01 | Canopy / Experience Architecture compliant; banner is not a modal wall |
| R-NF-02 | Org-scoped; users cannot register devices for other users |
| R-NF-03 | Secrets remain server-only (API-001 / 08); enrollment uses public App ID only on client |
| R-NF-04 | Works when `NOTIFICATION_PROVIDER=onesignal`; when `noop`, enrollment may register local/dev device but must not claim cloud push |
| R-NF-05 | Accessible: keyboard, screen reader labels on Enable / Not Now |

---

## Deferred

| Item | Reason |
|------|--------|
| SMS enrollment | INT-302 |
| Email channel delivery | INT-303 |
| Native push certificate flows | Future mobile; see [08](./08-multi-device-strategy.md) |
| Cross-org device sharing | Explicitly forbidden |

---

## Acceptance mapping

| Objective | Docs | Done when (post-Approve implement) |
|-----------|------|-------------------------------------|
| User enrollment | 02 | Banner → enable/deny/not now behaviors verified |
| Device registration | 03 | `resident_devices` row linked to user |
| Settings | 04 | Status + test + prefs operable |
| Announcement awareness | 05 | Zero-recipient warning shown |
| Ops health | 06 | Metrics visible to allowed roles |
| Command Center | 07 | Device entities searchable |
| Multi-device future | 08 | Model documented; web path shipped |
| Test push | 04, 10 | Real push when credentials valid |

# 05 — Announcement Delivery (Recipient Awareness)

**Package:** API-001A  
**Status:** Draft — Ready for Approval  
**Constraint:** No redesign of announcement authoring beyond **recipient reach** awareness. Push still goes through NotificationService.

---

## Problem

Operators can publish announcements successfully while **push recipients = 0** because nobody enrolled. Silent zero-reach undermines trust in the communication platform.

---

## Before send / publish

### Required UI

Display **push recipient count** for the selected audience (property / org / segment already chosen by the announcement form).

| Count | Presentation |
|-------|----------------|
| N > 0 | “Push will attempt delivery to **N** enrolled devices/users.” (wording may say users or devices — pick one metric and stick to it; prefer **users with ≥1 active push device** unless product standardizes on devices) |
| N = 0 | Warning callout (not a silent proceed) |

### Zero-recipient warning (required copy)

> No users currently have push notifications enabled.

### Operator choices when N = 0

| Option | Behavior |
|--------|----------|
| Cancel / go back | No publish |
| Continue publish | Allowed if in-app (or other) delivery still applies — but warning must remain visible; optional confirm checkbox “Publish without push recipients” |
| Open enrollment help | Link to ops guidance / resident enrollment tips (optional) |

**Do not** silently send push to zero recipients and report overall success as if push occurred.

---

## Count definition (design)

**Push recipient count** = number of distinct users in the announcement audience who have:

1. Active org membership in scope
2. `push_enabled` preference true (or default after enroll)
3. ≥1 **active** `resident_devices` row with a usable external subscription id

Exclude deactivated devices and users with browser-blocked state only if known server-side; unknown browser deny still counts as enrolled until send fails.

Audience filters (property, role) apply before the count.

---

## Relationship to NotificationService

```text
Publish announcement
  → existing announcement workflow
    → notify() per recipient (API-001)
      → preferences + devices
        → provider send (may no-op per user)
```

API-001A adds **preflight visibility** in the announcement UI. It does not add a second send path.

---

## In-app vs push

| Channel | Zero push recipients |
|---------|----------------------|
| In-app Notification Center | May still create rows for audience |
| Push | Skip / no devices — already true in API-001 |
| Operator UX | Must understand push reach before confirm |

If product treats announcement as push-primary for emergencies, zero count should **block** publish or require typed confirmation — Product decision at Approve:

| Mode | Proposal |
|------|----------|
| Default (recommended) | Warn + confirm to continue |
| Emergency announcements | Stronger confirm or block until N > 0 |

---

## Post-publish feedback (optional enhancement)

After publish, show summary: in-app targeted, push attempted, push skipped (no device). Defer if slice capacity limited; preflight warning is mandatory.

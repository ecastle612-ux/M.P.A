# 09 — Implementation Slices

**Package:** API-001A  
**Status:** Draft — Ready for Approval  
**Constraint:** No slice starts until this package is **Approved**. Do not modify NotificationService / OneSignalProvider contracts.

---

## Slice overview

| Slice | Name | Deployable outcome |
|-------|------|--------------------|
| 0 | Enrollment banner + suppression | Eligible users see Enable / Not Now; deny/Not Now do not nag |
| 1 | Registration hardening | Reliable permission → SDK → device upsert → prefs defaults → success/error terminal states |
| 2 | Notification Settings completion | Status, device, last reg, enable/disable, re-register, test notification, categories, quiet hours, emergency |
| 3 | Announcement recipient preflight | Count + zero-recipient warning before publish |
| 4 | Operations Notification Health | Metrics widget populated |
| 5 | Command Center device indexing | Registrations / health / failures searchable |
| 6 | Verification & closeout | Brand-new user live path; docs status → Implemented |

---

## Slice 0 — Enrollment banner + suppression

**Includes**

- Shell banner per [02](./02-user-enrollment-flow.md)
- Eligibility checks (no active device, not suppressed)
- Not Now / deny suppression
- Success / denied toasts

**Excludes**

- Settings redesign, Ops, announcement warning

**Done when**

- Banner appears once for eligible users and respects suppression
- Enable delegates to registration path (may land in slice 1 if split carefully — prefer thin Enable wiring)

---

## Slice 1 — Registration hardening

**Includes**

- Correct OneSignal deferred init ordering + timeouts
- Device API upsert + preference defaults
- enrolledVia metadata (`onboarding_banner`, etc.)
- Terminal UI states (never infinite Enabling)

**Excludes**

- Multi-native platforms

**Done when**

- Granted permission yields `resident_devices` row linked to user
- Denied path matches [02](./02-user-enrollment-flow.md)

---

## Slice 2 — Notification Settings

**Includes**

- Section fields in [04](./04-notification-settings.md)
- Test notification via NotificationService
- Re-register / disable

**Done when**

- User can manage push without relying on banner
- Test push creates center item (+ browser push when credentials valid)

---

## Slice 3 — Announcement recipient preflight

**Includes**

- Recipient count query for audience
- Zero-recipient warning + confirm behavior per [05](./05-announcement-delivery.md)

**Done when**

- Publish with N=0 cannot be silent about push reach

---

## Slice 4 — Operations Notification Health

**Includes**

- Metrics in [06](./06-operations-center-health.md)
- Role-gated visibility

**Done when**

- Ops shows device and delivery health for the org

---

## Slice 5 — Command Center indexing

**Includes**

- Providers per [07](./07-command-center-indexing.md)

**Done when**

- Queries for push/device/registration return expected entities

---

## Slice 6 — Verification & closeout

**Includes**

- Live brand-new user checklist ([10](./10-definition-of-done.md))
- Credential prerequisite note (ops)
- README status → Implemented after evidence

**Done when**

- Definition of Done implementation checklist complete
- Gate Implement stage closed for API-001A

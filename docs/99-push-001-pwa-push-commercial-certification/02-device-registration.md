# 02 — Device Registration (Phase 2)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Platforms (required)

| Client | Browser / mode | Required |
| --- | --- | --- |
| Desktop | Chrome | ✓ |
| Desktop | Edge | ✓ |
| Desktop | Safari (where supported) | ✓ |
| Android | Chrome (tab) | ✓ |
| Android | Installed PWA | ✓ |
| iPhone | Safari tab | Document capability limit |
| iPhone | Installed PWA (Add to Home Screen) | ✓ within Apple web push rules |

---

## Registration checklist (per device)

| Check | Pass |
| --- | --- |
| Permission granted | ☐ |
| OneSignal subscription created | ☐ |
| OneSignal user/subscription visible in dashboard (optional cross-check) | ☐ |
| `resident_devices` row with `external_subscription_id` | ☐ |
| User id linked | ☐ |
| Organization id linked | ☐ |
| Platform / device label recorded | ☐ |
| Role context correct for portal vs app shell | ☐ |

---

## Persistence matrix

| Event | Expectation |
| --- | --- |
| Logout | Device row remains for user; no orphaned sends to wrong session |
| Login | Same subscription still active or guided re-register |
| Hard refresh | Subscription survives |
| App / deploy update | SW update does not silently kill push; re-register if needed |
| Permission revoked | Detected; status = needs re-register; guided repair (Phase 9) |

---

## Enrollment surfaces

1. Shell / portal **Enable Notifications** banner  
2. **Settings → Notifications** — Enable / Re-register / Disable / Send Test  

Both must produce the same durable device row.

---

## Evidence

Per platform: screenshot of Settings push status + OS permission + (optional) OneSignal subscription id truncated.

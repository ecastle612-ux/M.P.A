# 09 — Self-Healing (Phase 9)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Detect

| Condition | Detection |
| --- | --- |
| Broken / expired subscription | OneSignal send failure codes; repeated fails |
| Permission revoked | Client permission ≠ granted on settings load / heartbeat |
| App reinstall | Missing SW / new subscription id |
| Service Worker mismatch | Registration script vs expected path/scope |

---

## Repair (automatic when safe)

| Condition | Auto repair |
| --- | --- |
| Soft stale subscription | Prompt silent re-`optIn` + upsert device when user is in-app |
| Permanent OneSignal invalid id | Deactivate `resident_devices` row; stop targeting |
| Permission still granted, no id | Re-run enrollment obtain + register |
| SW mismatch after deploy | Re-register SW once; then re-subscribe if needed |

---

## Guide user (when auto repair impossible)

| Condition | Guidance |
| --- | --- |
| Permission denied | Settings instructions + deep link to browser site settings where possible |
| iOS not installed as PWA | “Add to Home Screen” education |
| Provider noop / misconfig | Operator-facing only (Master Admin diagnostics) |

---

## Constraints

- No nag loops (respect API-001A suppression).  
- Never call OneSignal from domain modules — heal through enrollment + NotificationService paths.  
- Log repairs for diagnostics.

# 08 — Multi-Device Strategy

**Package:** API-001A  
**Status:** Draft — Ready for Approval

---

## Goal

Support **multiple devices per user** over time without redesigning NotificationService. API-001A ships the **web browser** path first; mobile is a compatible extension.

---

## Principles

1. One user may have many `resident_devices` rows.
2. NotificationService targets **all active** subscriptions for a user (subject to preferences).
3. Enrollment is per-browser / per-app install — not once globally forever.
4. Disabling push can mean preference-level (all devices) or device-level deactivate.

---

## Device matrix

| Device class | Platform value | Enrollment | Provider path |
|--------------|----------------|------------|---------------|
| Desktop browser | `web` | Banner + Settings | OneSignal Web SDK + REST send |
| Mobile browser / PWA | `web` | Same | Same |
| Future iOS app | `ios` | In-app OS permission | Future native SDK → same `resident_devices` + NotificationService |
| Future Android app | `android` | In-app OS permission | Future native SDK → same tables + service |

---

## Multiple browsers / computers

| Scenario | Behavior |
|----------|----------|
| Chrome + Firefox same user | Two devices; both receive push if active |
| Home + work laptop | Two devices |
| Reinstall / clear site data | New subscription; re-register; old row deactivated or left inactive |
| Shared computer | User must sign in; device tied to account — sign out does not auto-delete device (privacy: offer remove device in Settings) |

---

## Future mobile app integration

- Native apps obtain push tokens via platform APIs / OneSignal native SDKs.
- Registration still POSTs to M.P.A. device API with `platform` + external id.
- **No** domain module calls to OneSignal REST — NotificationService only.
- Enrollment banner pattern may adapt to native permission sheets; suppression rules still apply.

---

## Future SMS integration

- SMS is a **channel preference** (API-001 reserved), not a `resident_devices` push row.
- Enrollment for SMS (phone verify) is a separate initiative (INT-302).
- Do not overload push enrollment banner for SMS opt-in.

---

## Device cleanup

| Policy | Recommendation |
|--------|----------------|
| Soft-deactivate on repeated permanent send failures | Yes |
| Hard delete after N days inactive | Optional privacy / retention slice |
| User-initiated remove | Settings required |
| Org admin revoke | Optional for support |

---

## Caps (optional)

Product may cap active devices per user (e.g. 10) — deactivate oldest on overflow. Decide at Approve if needed for abuse control.

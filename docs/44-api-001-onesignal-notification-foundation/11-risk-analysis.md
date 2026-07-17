# 11 — Risk Analysis

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | OneSignal diverges from PRR INT-301 “Firebase/APNs” wording | Med | Med | ADR-017 + PRR update on Accept; abstraction keeps Firebase viable |
| R2 | Direct `createInAppNotification` call sites bypass push/prefs | High | High | Slice 0 migrates all call sites to NotificationService; lint/boundary ban on raw create from features |
| R3 | API key exposure via client bundle or logs | Low | Critical | Server-only env; review checklist in 08; no `NEXT_PUBLIC` secrets |
| R4 | Quiet hours / emergency policy surprises users | Med | Med | Explicit UX copy; defaults documented; org policy review at Approve |
| R5 | Duplicate notifications on retries | Med | Med | Idempotency keys + unique constraints |
| R6 | Category rename breaks existing rows | Med | Med | Migration aliases / dual-read mapping plan in Slice 2 |
| R7 | Provider outage drops awareness | Med | Med | In-app remains source of truth; health widget; retry queue |
| R8 | Scope creep into SMS/email/native | Med | High | Hard out-of-scope list; gate rejects unapproved slices |
| R9 | Web push permission fatigue after QR enroll | Med | Med | Value proposition timing; defer prompt until clear benefit |
| R10 | Multi-property mute hides critical property events | Low | High | Emergency bypass; careful defaults (mute opt-in) |
| R11 | Delivery webhooks forged | Low | Med | Signature verification; ignore create-notification actions from webhooks |
| R12 | Ops widgets performance on large orgs | Med | Med | Aggregate indexes; limit recent activity N; async counts |

---

## Open questions for Approve

1. Should user-level **global push disable** also suppress emergency push, or only quiet hours/category mutes?
2. Is **defer push until after quiet hours** required in v1, or is skip-push sufficient?
3. Should PM plane use the same OneSignal app as residents, or separate apps per plane?
4. Retention periods (06) — confirm 180/365 defaults for customer commitments.
5. Is realtime (Supabase) required for badge updates in Slice 2, or is polling acceptable?

---

## Dependencies

| Dependency | Risk if missing |
|------------|-----------------|
| Stable org session + RLS | Cross-tenant leakage |
| Existing Notification Center APIs | Rework cost |
| Device table `resident_devices` | New enrollment model |
| Domain event maturity (ADR-005) | Longer transitional direct-notify path |
| OneSignal account + apps for staging/prod | Cannot complete Slice 1 verification |

---

## Technical debt anticipated (acceptable if tracked)

- Transitional direct `NotificationService` calls before full outbox consumers
- Category alias layer during rename migration
- Polling before realtime badge subscription
- Noop provider in preview environments until secrets provisioned

---

## Kill criteria

Pause or re-scope implementation if:

- ADR-017 is rejected in favor of Firebase-first without abstraction capacity
- Security review rejects client SDK approach without an alternative registration design
- Product requires SMS/email in the same initiative (split packages; do not smuggle into API-001)

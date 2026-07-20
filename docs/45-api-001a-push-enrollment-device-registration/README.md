# API-001A — Push Enrollment & Device Registration

**Status:** Approved · Implemented  
**Initiative ID:** API-001A  
**Parent:** [API-001 — OneSignal Notification Foundation](../44-api-001-onesignal-notification-foundation/README.md) (Approved · Implemented)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Provider decision:** [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) (Accepted) — unchanged  
**Gate owner:** Product + Lead Architect (+ Security for enrollment privacy)

---

## Executive Summary

API-001 delivered M.P.A.'s **notification operating layer** (NotificationService → NotificationProvider → OneSignalProvider). Live acceptance testing proved infrastructure can resolve to OneSignal, but exposed a **workflow gap**:

> Users are never guided to grant browser permission, register a device, or create a push subscription tied to their authenticated identity.

Without enrollment, announcements and other workflows can publish successfully while **push reaches zero devices**. That is not an infrastructure defect — it is a missing onboarding and settings experience.

**API-001A designs that experience only.** It does **not** redesign NotificationService, OneSignalProvider, event routing, or provider abstraction. Business modules still never call OneSignal directly.

### What this package defines

| Area | Outcome |
|------|---------|
| User enrollment | Non-intrusive post-sign-in banner → Enable / Not Now |
| Permission lifecycle | Grant, deny, dismiss, re-enable, no nag loops |
| Device registration | Subscription ID → authenticated user → `resident_devices` |
| Notification settings | Status, device, categories, quiet hours, test push |
| Announcement awareness | Recipient count + zero-recipient warning before send |
| Operations health | Registered devices, success rate, failed deliveries |
| Command Center | Push registrations, device health, failed registrations |
| Multi-device | Web browsers today; mobile devices later without redesign |

### Explicitly out of scope

- Changes to NotificationService or OneSignalProvider contracts
- New push providers, SMS, or email delivery
- Native mobile app implementation
- Redesign of announcement authoring chrome beyond recipient awareness
- Application code, migrations, SDKs, or env commits (**this task is Design/Document only**)

---

## Problem analysis (from live acceptance)

| Observed | Interpretation |
|----------|----------------|
| Enable Push existed only on tenant preferences | Easy to miss; not part of first-session onboarding |
| Registration could hang / fail without clear recovery | Need explicit success / deny / retry UX |
| Notification Center empty; no devices | No subscribers → no push, even when provider is OneSignal |
| Announcements can publish with zero push reach | Operators need recipient count + hard warning |
| Ops / Command Center lack enrollment signals | Need device health indexing, not only notification inbox |

---

## Architecture notes (preservation)

```
User signs in
  → Enrollment UX (API-001A)
    → Browser permission
      → Client Web SDK subscription (existing OneSignal client path)
        → Device registration API (existing)
          → resident_devices + preferences defaults
            → Future events
              → NotificationService (API-001 — unchanged)
                → NotificationProvider
                  → OneSignalProvider
```

**Invariant:** NotificationService remains the only public write path for notifications. API-001A adds **experience and observability** around enrollment and reachability.

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | PRR mapping, acceptance criteria, deferred items |
| [02 — User Enrollment Flow](./02-user-enrollment-flow.md) | Banner, copy, when to prompt / not prompt |
| [03 — Device Registration](./03-device-registration.md) | Permission → subscription → persistence |
| [04 — Notification Settings](./04-notification-settings.md) | Settings surface, quiet hours, test push |
| [05 — Announcement Delivery](./05-announcement-delivery.md) | Recipient counts and zero-recipient warning |
| [06 — Operations Center Health](./06-operations-center-health.md) | Notification Health metrics |
| [07 — Command Center Indexing](./07-command-center-indexing.md) | Registrations and device health search |
| [08 — Multi-Device Strategy](./08-multi-device-strategy.md) | Browsers, computers, future mobile |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices after Approve |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Recommended rollout strategy

1. **Approve** this package (Product + Architect; Security review of dismissal/privacy rules).
2. Implement slices in order ([09](./09-implementation-slices.md)) — enrollment + registration first, then settings, then announcement warning, then Ops/Command, then test notification verification.
3. Re-run live acceptance: brand-new user → Enable → test push → announcement with ≥1 recipient.
4. Keep API-001 credential correctness as an **ops prerequisite** (invalid App ID / API key blocks COMPLETE regardless of UX).

---

## Approval checklist

- [x] Product sign-off on enrollment copy, prompt timing, and zero-recipient behavior
- [x] Architect sign-off that API-001 architecture is unchanged
- [x] Security sign-off on dismissal persistence, device association, and privacy copy
- [x] Status on this README changed to **Approved**
- [x] Implementation authorized only for approved slices in [09](./09-implementation-slices.md)

---

## Gate status

| Stage | State |
|-------|--------|
| Design | **Complete** |
| Document | **Complete** |
| Approve | **Complete** |
| Implement | **Complete (slices 0–6)** |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

# 03 — Notification Architecture

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Channels:** [API-001 Push](../44-api-001-onesignal-notification-foundation/README.md) · [EML-001 Email](../81-eml-001-transactional-email-experience/README.md) · MHF-001 in-app

---

## Binding rule

```
Event / Automation / Reminder / System
  → Notification Center (OPS)
    → Preference + quiet hours + entitlement checks
      → Channel adapters (Push | Email | SMS | In-app | Future)
```

**Every notification originates from one system** — the OPS Notification Center. Domain modules do not call OneSignal/Resend/Twilio directly.

---

## Channels

| Channel | Provider plane | MVP |
|---------|----------------|-----|
| **In-app** | Postgres notification records (SoT for “what user was told”) | ✔ |
| **Push** | API-001 / OneSignal adapter | ✔ (when enrolled) |
| **Email** | EML-001 / Resend adapter | ✔ |
| **SMS** | Future SMS provider adapter | Designed slot |
| **Future** | WhatsApp, voice, etc. | Adapter interface only |

In-app remains the **system of record** for notification history (align ADR-017).

---

## Notification object

| Field | Description |
|-------|-------------|
| `notification_id` | UUID |
| `organization_id` | Tenant |
| `recipient_principal_id` | Who |
| `event_id` | Causing event (optional for pure reminders) |
| `category` | maintenance / billing / leasing / security / system / commercial |
| `priority` | low / normal / high / urgent |
| `title` / `body` | Rendered copy |
| `deep_link` | App route |
| `channels_requested` | From rule |
| `channels_delivered` | Actual |
| `status` | queued / sent / failed / read / dismissed |
| `created_at` | UTC |

---

## Preferences

Users control preferences per category × channel (with org policy floors):

| Policy | Example |
|--------|---------|
| User opt-out | Marketing / non-critical |
| Org require | Security alerts, emergency maintenance |
| Role default | Technicians: push+in-app for WO |
| Quiet hours | Defer non-urgent |
| Emergency override | Bypass quiet hours |

Org Admin may set org defaults; cannot disable legally required notices without Level 4 exception.

---

## Fan-out algorithm

1. Resolve recipients (role, property scope, followers, explicit list)  
2. Apply RLS-equivalent recipient eligibility  
3. Apply preferences + quiet hours  
4. Enqueue per-channel jobs  
5. Write in-app row always (unless staff_only system alert)  
6. Record delivery results → timeline / health on failure  

---

## Templates

Templates live with channel packages (EML-001, push copy tables) but are **selected by** Notification Center using `template_key` from automation/event mapping.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| N-01 | Single Notification Center origin |
| N-02 | Push/Email/SMS/In-app + future adapter slots |
| N-03 | User preferences enforced with org floors |
| N-04 | Domain modules do not call channel SDKs |

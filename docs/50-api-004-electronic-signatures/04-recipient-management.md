# 04 — Recipient Management

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Supported signer roles

| Role | Phase 1 | Notes |
|------|---------|-------|
| Primary applicant / resident | ✔ | Usually first or parallel |
| Co-applicant | ✔ | Independent recipient status |
| Guarantor / co-signer | ✔ | May have distinct document set or same package |
| Property manager | ✔ | Often countersign last |
| Property owner | ✔ optional | Org policy may require |
| Witness | Future | Reserved; not Phase 1 |
| CC / viewer (non-signing) | ✔ optional | Receives copy; does not block completion |

---

## Recipient record (conceptual)

| Field | Purpose |
|-------|---------|
| `role` | Enum above |
| `full_name` / `email` | Invitation identity |
| `user_id` | Optional link to M.P.A. user |
| `party_link` | Optional applicant / tenant / membership ID |
| `signing_order` | Integer sequence |
| `signing_group` | Hybrid parallel group |
| `is_required` | Blocks completion if true |
| `auth_method` | `email` / `sms` / `access_code` / provider ID check (provider-dependent) |
| `status` | See [02](./02-signature-workflow.md) |
| `invited_at` / `viewed_at` / `signed_at` / `declined_at` | Audit timestamps |
| `external_recipient_id` | Provider signer ID |
| `last_reminder_at` / `reminder_count` | Reminder controls |

---

## Assignment rules

1. **Lease packages:** default recipients from lease parties + creating PM.
2. **Screening handoff:** approved applicant parties may pre-fill from screening household (API-003) without re-keying names/emails.
3. **Manual add/remove:** allowed in `draft` / `ready_to_send` only.
4. **Email required** for Phase 1 invitations (SMS auth future via provider capabilities).
5. **Duplicate emails** in one package forbidden for required signers.

---

## Signing order configuration

| Policy key (org) | Example |
|------------------|---------|
| `signature.default_order_mode` | `sequential` \| `parallel` \| `hybrid` |
| `signature.pm_countersign` | `required_last` \| `optional` \| `none` |
| `signature.owner_required` | boolean |
| `signature.expiration_days` | configurable integer |

UI must allow per-package override of order mode and recipient sequence before send.

---

## Invitations

- Sent only through `SignatureService.sendPackage`.
- Copy/branding: org name + property context; deep link back to M.P.A. progress page when possible.
- Provider may email directly; M.P.A. also records invitation and may send parallel in-app/push (API-001) for enrolled users.

---

## Reminders

| Type | Source |
|------|--------|
| Automatic | Org cadence relative to `invited_at` / last activity |
| Manual | PM dashboard “Remind” |
| Provider-native | Optional `SignatureProvider.remindRecipient` |

Rules:

- Do not remind `signed` / `declined` / `skipped` recipients
- Respect quiet hours via notification preferences where M.P.A. sends the channel
- Escalation: after max reminders → Ops **Reminder Queue** widget

---

## Decline & replacement

- Decline by required signer → package `declined`; PM notified
- PM may **restart** package with replacement recipient (new package lineage)
- Do not silently remove a declined required signer from an in-flight envelope without cancel + restart (audit clarity)

---

## Mobile signing

- Recipients open provider-hosted signing UI (responsive)
- M.P.A. progress page must be mobile-usable (status, CTA “Continue signing”)
- Offline signing is **not** required for Phase 1

---

## Privacy

- Recipient PII (email, IP, auth codes) least-privilege
- Full certificate download requires elevated permission (`signature:read_full` or equivalent)
- Logs redact emails where feasible; store structured refs instead

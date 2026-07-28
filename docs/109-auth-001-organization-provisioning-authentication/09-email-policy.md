# 09 — Email Policy

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Core rule

**Email is NOT identity.**

| Concern | Authority |
|---------|-----------|
| Authentication | Username + password (+ MFA) |
| Contact / notifications | Email (and optional phone) |
| Billing receipts | BILL-001 customer email (may match contact) |
| Invitations & welcome | Email delivery channel |

Changing email **must never** affect the ability to authenticate with username/password.

---

## Contact channels

| Channel | Cardinality | Rules |
|---------|-------------|-------|
| Primary email | Exactly one recommended | Used for invites, notices |
| Secondary email | Optional | Notifications / recovery contact (not Org Admin self-reset) |
| Phone | Optional | Verification / SMS later |

Emails should be unique **per organization** for operational clarity where possible, but global uniqueness is **not** required for identity (two orgs may have the same contact email on different principals).

---

## Verification

| Event | Requirement |
|-------|-------------|
| Org Admin provision | Buyer email captured from checkout; verify on first login |
| Subaccount invite | Email verified before or during first login |
| Email change | Re-verify new email; old email ceases to be primary after confirm |
| Org Admin recovery | Level 0 uses verified contacts + out-of-band identity checks |

Unverified email reduces notification reliability but does not create a second login identity.

---

## Email change workflow

```
User/Org Admin requests email change
  → Validate format
  → Send confirmation to NEW email
  → Optional notify OLD email
  → On confirm: update ContactChannel
  → Username unchanged
  → Sessions optionally remain valid
  → Audit event
```

Org Admin may change subaccount emails. Subaccounts may change their own email if permission allows.

---

## What email must not do

| Anti-pattern | Status |
|--------------|--------|
| Login with email as primary identifier | Forbidden under AUTH-001 |
| Forgot-password for Org Admin via email self-serve | Forbidden ([16](./16-recovery-workflows.md)) |
| Username derived from email forever | Forbidden (generator may use name, not email local-part as identity) |
| Sharing one email = shared account | Forbidden — one principal per human account |

---

## Transactional templates (EML-001)

Minimum templates:

1. Organization welcome (Org Admin credentials)  
2. Subaccount invitation  
3. Temporary password / reset issued by Org Admin  
4. Email change confirmation  
5. Security alerts (new login, recovery, suspension)

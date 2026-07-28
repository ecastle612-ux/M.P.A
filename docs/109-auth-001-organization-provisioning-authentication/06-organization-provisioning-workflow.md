# 06 — Organization Provisioning Workflow

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Trigger

Subscription activation event ([05](./05-subscription-activation-workflow.md)) or Level 0 manual create.

---

## Steps (atomic saga)

| Step | Action | State after |
|-----:|--------|-------------|
| 1 | Validate activation payload + idempotency | — |
| 2 | Create `Organization` with type, name, timezone defaults | `provisioning` |
| 3 | Bind SaaS subscription + plan | `provisioning` |
| 4 | Assign enabled modules / entitlements snapshot | `provisioning` |
| 5 | Generate Org Admin username | `provisioning` |
| 6 | Create Identity Principal + auth provider subject | `provisioning` |
| 7 | Issue temporary password (hash stored; plaintext to email channel only) | `provisioning` |
| 8 | Attach primary Org Admin membership + ownership flag | `provisioning` |
| 9 | Create empty Setup Wizard progress record | Commercial status **Pending Setup** ([28](./28-organization-status-lifecycle.md)) |
| 10 | Send welcome email | Pending Setup |
| 11 | Emit `organization.provisioned` domain event | Pending Setup |

If any step fails after org create, mark `provisioning_failed` and open Level 0 ops task.

---

## Org Admin credential package

Welcome email (EML-001) includes:

- Organization name  
- Permanent username  
- Temporary password (or one-time set-password link that still binds to username identity)  
- Login URL  
- Support contact for Org Admin recovery  
- Security notice: temporary password expires after first change  

**Design preference:** deliver temporary password **once** through email; never display again in UI/admin tools.

---

## Post-provision path

```
Pending Setup
  → first login + hardening
  → Setup Wizard (Professional OR AI Guided)
  → Active
```

(See [28](./28-organization-status-lifecycle.md).)

---

## What is NOT created at provision time

| Not auto-created | Why |
|------------------|-----|
| Properties / units / leases | Setup Wizard / import |
| Staff / tenants / vendors | Org Admin creates |
| Stripe Connect accounts | FIN-003 / wizard step |
| Demo seed data | Optional Level 0 only; never production default |

---

## Naming defaults

| Field | Default |
|-------|---------|
| Organization display name | Buyer company name from checkout |
| Organization slug | Derived unique slug for URLs (may differ from username) |
| Org Admin display name | Buyer legal name |
| Org Admin contact email | Buyer contact email |
| Timezone | Inferred from billing address / browser later in wizard |
| Locale | Default `en-US` until wizard |

Slug changes may be allowed in wizard; **username never changes**.

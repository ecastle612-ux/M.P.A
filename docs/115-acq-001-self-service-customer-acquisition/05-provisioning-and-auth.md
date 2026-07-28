# 05 — Provisioning & Authentication

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval  
**Integrates:** [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) · [COM-001](../110-com-001-customer-lifecycle-commercial-operations/README.md)

---

## Organization provisioning

Triggered **only** after Payment Successful (including Trial Checkout success), via existing COM activation → AUTH provision pipeline.

| Step | System |
|------|--------|
| Resolve / create opportunity | COM-001 (optional for pure self-serve) |
| Create organization | AUTH provision |
| Assign `plan_code` + commercial status | COM + BILL mirror |
| Bind entitlement snapshot | BILL / AUTH entitlements |
| Emit commercial + ops events | Existing emitters |

**Self-serve must not** create an empty org from a public form without payment success.

---

## Account creation (Organization Administrator)

| Rule | Detail |
|------|--------|
| Who | Buyer becomes Org Admin |
| Identity | MPA-generated **username** (AUTH-001) — email is contact, not login id |
| Credentials | Temporary password / first-login link via welcome delivery |
| Not public signup | System provision path — allowed under AUTH-001 A02 |

Team members continue to be **invited only** by Org Admin (seat limits enforced).

---

## Authentication

| Surface | Behavior |
|---------|----------|
| `/login` | Existing principals only |
| First-login | Password change / gates per AUTH |
| Contact verification | If required, complete before full ops (existing verify-contact flows) |
| No `/signup` | Remains forbidden for free org creation |

### Redirect handling

| Condition | Redirect |
|-----------|----------|
| Success page, provision ready | Prefer first-login deep link from email; success page links `/login` or `/first-login` |
| Authenticated, setup incomplete | `/setup` via SetupGate |
| Authenticated, setup complete, active | `/dashboard` |
| Authenticated, past_due | Allow billing/settings; create blocks remain |
| Anonymous hits `/dashboard` | `/login` |

---

## Existing email / multi-org

Reuse AUTH multi-org switcher architecture:

- New purchase → new organization membership for buyer email principal when principal already exists  
- Welcome email states which org was created  
- Default active org cookie set to new org on first login after purchase when possible  

Hard conflicts (employee Master Admin buying): refuse self-serve; Contact Sales.

---

## Subscription & entitlement assignment

| Concern | Owner |
|---------|-------|
| Stripe subscription mirror | BILL-001 |
| Entitlement snapshot | `bindEntitlementSnapshot` on plan |
| Module visibility | Entitlement gate + nav `requiredModule` |
| Seat / property limits | Phase C enforcement |

ACQ does not invent a second entitlement matrix.

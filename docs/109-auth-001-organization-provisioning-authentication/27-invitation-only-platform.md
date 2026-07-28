# 27 — Invitation-Only Platform

**Package:** AUTH-001  
**Amendment:** A02  
**Status:** Binding (Approved with Amendments)

---

## Non-negotiable security principle

**M.P.A. is NOT an open registration platform.**

Users must **NEVER** self-register.

Only **Organization Administrators** or **Master Administrators (Level 0)** may create accounts.

---

## Allowed

| Flow | Who initiates | Result |
|------|---------------|--------|
| **Invite User** | Org Admin (tenant) or Level 0 (control plane / Org Admin provision) | Invitation issued |
| **Accept Invitation** | Invitee | Principal binds; first-login begins |
| **Activate Account** | Invitee after first-login gate | `active` membership |

Provisioning of the Organization Administrator at subscription purchase (including **public self-serve Checkout** for Trial/Pro/Business per [COM-001 A10](../110-com-001-customer-lifecycle-commercial-operations/43-amendment-a10-self-service-acquisition.md) / [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md)) is a **system invitation/provision** path — not public signup.

---

## Forbidden

| Pattern | Status |
|---------|--------|
| Public Sign Up (free account / org without payment) | **Forbidden** |
| Create Free Account | **Forbidden** |
| Register Yourself | **Forbidden** |
| Open `/signup` creating a new org without purchase + provision pipeline | **Forbidden** |
| Social “Sign up with Google” creating a principal without invite | **Forbidden** (login linking only if later Approved for invited users) |
| Public Enterprise / Founder Checkout | **Forbidden** (sales-assisted / Master Admin grant) |

---

## Product surfaces

| Surface | Required behavior |
|---------|-------------------|
| Marketing site | CTA → **purchase / trial Checkout** / contact sales — **not** “Create free account” that yields an org without payment |
| `/login` | Username + password only for existing principals |
| `/signup` / “Register” | **Removed or redirected**; must not create principals without COM activation |
| UX-005 | Must align: no open registration presentation |

> **Note (2026-07-27):** COM-001 Amendment A10 permits public **self-serve purchase**. That does **not** weaken this AUTH amendment: anonymous users still cannot create principals or orgs except through the payment-success provision pipeline.
Existing design-partner or legacy open signup paths are **deprecated** under AUTH-001 and must be removed or gated in the first authorized implementation slice that touches auth entrypoints (Slice A / C per [31](./31-implementation-slices.md)).

---

## Account creation authority matrix

| Actor | May create |
|-------|------------|
| Anonymous public | **Nothing** |
| Subaccount without `org:users:create` | **Nothing** |
| Organization Administrator | Subaccounts inside their org |
| Delegated role with `org:users:create` | Subaccounts per grant |
| Master Admin / system provisioning | Organizations + Org Admin (and exceptional support creates with audit) |

---

## Invitation lifecycle (summary)

```
Invite issued → Email delivered → Accept → Username already issued by system
  → Temp password / set-password → First-login gate → Active
```

Username remains MPA-generated ([08](./08-username-policy.md)). Invitee does not choose username or self-originate an account.

---

## Acceptance (A02)

| ID | Criterion |
|----|-----------|
| INV-01 | No public self-registration path creates a principal or organization |
| INV-02 | All subaccounts originate from Org Admin (or Level 0) invite/provision |
| INV-03 | Accept Invitation + Activate Account remain the only join paths for humans |
| INV-04 | Security review treats open signup as a P0 defect |

# 21 — Sequence Diagrams

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## 1) Subscription → Org Admin provisioned

```mermaid
sequenceDiagram
  participant Buyer
  participant Stripe
  participant BILL as BILL-001
  participant Prov as Provisioning
  participant Auth as Identity Adapter
  participant Mail as EML-001

  Buyer->>Stripe: Checkout pay
  Stripe->>BILL: invoice.paid / subscription active
  BILL->>Prov: ActivationEvent(idempotent)
  Prov->>Prov: Create Organization + bind plan/modules
  Prov->>Auth: CreatePrincipal + GenerateUsername
  Auth->>Auth: Hash temp password
  Prov->>Mail: Welcome(username, temp)
  Mail->>Buyer: Credentials email
```

---

## 2) First login + Setup Wizard start

```mermaid
sequenceDiagram
  participant OA as Org Admin
  participant UI as Login / Gate
  participant Auth as Identity Adapter
  participant W as Setup Wizard

  OA->>UI: username + temp password
  UI->>Auth: authenticate
  Auth-->>UI: session + password_state=temporary_issued
  UI->>OA: Verify identity + Accept Terms
  OA->>UI: New password (+ optional MFA)
  UI->>Auth: setPermanentPassword
  Auth-->>UI: password_state=permanent_set
  UI->>W: Launch Setup Wizard
  OA->>W: Choose Professional OR AI Guided
```

---

## 3) Subaccount creation

```mermaid
sequenceDiagram
  participant OA as Org Admin
  participant API as User Admin API
  participant Auth as Identity Adapter
  participant Mail as EML-001
  participant U as New User

  OA->>API: name, email, role, permissions, properties
  API->>Auth: GenerateUsername + temp password
  API->>API: Create membership + scopes
  API->>Mail: Invitation email
  Mail->>U: username + temp
  U->>Auth: First login gate
  Auth-->>U: Active subaccount
```

---

## 4) Org Admin recovery (Level 0)

```mermaid
sequenceDiagram
  participant OA as Org Admin
  participant Sup as M.P.A. Support / Level 0
  participant RC as Recovery Contact
  participant Auth as Identity Adapter

  OA->>Sup: Cannot access
  Sup->>OA: Identity challenges
  Sup->>RC: Confirm recovery (as required)
  RC-->>Sup: Approved
  Sup->>Auth: Issue temp password + audit
  Auth->>OA: Secure delivery
  OA->>Auth: Login + new password
```

---

## 5) Subaccount password reset

```mermaid
sequenceDiagram
  participant U as Subaccount
  participant OA as Org Admin
  participant Auth as Identity Adapter
  participant Mail as EML-001

  U->>OA: Locked out
  OA->>Auth: ResetPassword(target)
  Auth->>Mail: Temp credential email
  Mail->>U: Temp password
  U->>Auth: Login + set new password
```

---

## 6) Organization suspension / reactivation

```mermaid
sequenceDiagram
  participant L0 as Level 0
  participant Org as Organization Service
  participant Sess as Session Service

  L0->>Org: Suspend(org, reason)
  Org->>Sess: Revoke tenant sessions
  Org-->>L0: state=suspended
  Note over Org: Members cannot use tenant plane
  L0->>Org: Reactivate(org, reason)
  Org-->>L0: state=active (or setup_in_progress)
```

---

## 7) Multi-org session switch (future UX)

```mermaid
sequenceDiagram
  participant P as Principal
  participant Auth as Session
  participant Z as AuthZ

  P->>Auth: Login(username, password)
  Auth-->>P: memberships[A,B,C]
  P->>Auth: Select active org B
  Auth->>Z: Resolve role/dashboard for B
  Z-->>P: Dashboard surface for B
```

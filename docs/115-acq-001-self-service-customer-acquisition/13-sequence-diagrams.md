# 13 — Sequence Diagrams

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## S1 — Happy path: public purchase → dashboard

```mermaid
sequenceDiagram
  actor Visitor
  participant Web as Public ACQ pages
  participant API as M.P.A. SaaS API
  participant Stripe
  participant WH as SaaS Webhooks
  participant COM as COM Activation
  participant AUTH as AUTH Provision
  participant Mail as Credential Delivery

  Visitor->>Web: Landing → Tour → Pricing
  Visitor->>Web: Select Pro/Business/Trial
  Web->>API: Create Checkout Session (plan, buyer hints)
  API->>Stripe: checkout.sessions.create
  Stripe-->>Visitor: Hosted Checkout
  Visitor->>Stripe: Pay / start Trial
  Stripe->>WH: checkout.session.completed
  WH->>COM: Activate / link opportunity
  COM->>AUTH: Provision org + Org Admin
  AUTH->>AUTH: Bind entitlements (via BILL mirror)
  AUTH->>Mail: Welcome credentials
  Stripe-->>Visitor: Redirect success URL
  Visitor->>Web: /acquire/success (poll ready)
  Mail-->>Visitor: Email with first-login
  Visitor->>AUTH: First login + password change
  Visitor->>Web: Guided Setup → Activate
  Visitor->>Web: Production Dashboard
```

---

## S2 — Payment failure / cancel

```mermaid
sequenceDiagram
  actor Visitor
  participant Stripe
  participant Web as ACQ pages

  Visitor->>Stripe: Checkout
  alt Declined
    Stripe-->>Visitor: Decline message
    Visitor->>Stripe: Retry or exit
  else Cancel
    Stripe-->>Web: cancel_url
    Web-->>Visitor: /acquire/canceled + resume CTA
  end
  Note over Visitor,Web: No organization created
```

---

## S3 — Enterprise contact sales

```mermaid
sequenceDiagram
  actor Buyer
  participant Web as Pricing / Contact
  participant COM as COM Opportunities
  participant Sales as Sales owner

  Buyer->>Web: Choose Enterprise / Contact Sales
  Web->>COM: Create Lead/MQL opportunity
  COM-->>Sales: Notify / timeline entry
  Sales->>Buyer: Demo / proposal (existing COM spine)
  Note over Buyer,Sales: No self-serve Checkout
```

---

## S4 — Resume incomplete setup

```mermaid
sequenceDiagram
  actor Admin as Org Admin
  participant Auth as Login
  participant Gate as SetupGate
  participant Setup as Guided Setup
  participant Dash as Dashboard

  Admin->>Auth: Login
  Auth->>Gate: Session + setup status
  alt Incomplete
    Gate-->>Admin: /setup
    Admin->>Setup: Complete Finish Setup
    Setup-->>Dash: Active → dashboard
  else Complete
    Gate-->>Dash: /dashboard
  end
```

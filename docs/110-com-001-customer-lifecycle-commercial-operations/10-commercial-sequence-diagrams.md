# 10 — Commercial Sequence Diagrams

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

## 1) Lead → Payment Successful → Provision

```mermaid
sequenceDiagram
  participant Lead
  participant Sales
  participant BILL as BILL-001
  participant COM as COM-001 Activation
  participant AUTH as AUTH-001 Provision
  participant Mail as EML-001

  Lead->>Sales: Qualify + Demo + Proposal
  Sales->>BILL: Checkout / Subscription purchase
  BILL->>BILL: Payment successful
  BILL->>COM: SubscriptionActivated
  COM->>AUTH: ProvisionOrganization
  AUTH->>AUTH: Create org + Org Admin
  AUTH->>Mail: Welcome credentials
  Mail->>Lead: Username + temp password
```

---

## 2) Setup Wizard → Active Customer

```mermaid
sequenceDiagram
  participant OA as Org Admin
  participant Wizard
  participant Impl as Professional or AI
  participant CS as Customer Success

  OA->>Wizard: First login hardening
  OA->>Wizard: Choose Professional OR AI Guided
  Wizard->>Impl: Execute setup path
  Impl->>OA: Checkpoints / confirmations
  OA->>Wizard: Finish Setup
  Wizard->>Wizard: Org Active Customer
  Wizard->>CS: Handoff + schedule 30-day
```

---

## 3) Past Due → Grace → Suspended / Restore

```mermaid
sequenceDiagram
  participant Stripe
  participant BILL as BILL-001
  participant CS as Customer Success
  participant OA as Org Admin
  participant AUTH as AUTH-001

  Stripe->>BILL: Invoice payment failed
  BILL->>AUTH: Mark Past Due
  BILL->>OA: Past-due notifications
  CS->>OA: Save / payment outreach
  alt Pays in grace
    OA->>BILL: Update PM + pay
    BILL->>AUTH: Active
  else Grace exhausted
    BILL->>AUTH: Suspended
    AUTH->>OA: Access blocked
  end
```

---

## 4) Renewal

```mermaid
sequenceDiagram
  participant Sys as Automation
  participant CS as Customer Success
  participant OA as Org Admin
  participant BILL as BILL-001

  Sys->>OA: T-90 / T-30 / T-7 reminders
  CS->>OA: Assisted renew (if tier)
  BILL->>BILL: Renewal charge
  alt Success
    BILL->>OA: Receipt; Active continues
  else Failure
    BILL->>OA: Past Due path
  end
```

---

## 5) Cancel → Archive / Reactivate

```mermaid
sequenceDiagram
  participant OA as Org Admin
  participant CS as Customer Success
  participant BILL as BILL-001
  participant AUTH as AUTH-001

  OA->>CS: Cancel request
  CS->>OA: Save attempt
  OA->>BILL: Confirm cancel
  BILL->>AUTH: Cancelled
  AUTH->>OA: Export window notice
  alt Win-back within retention
    CS->>BILL: Restore subscription
    BILL->>AUTH: Reactivate Active
  else Retention elapsed
    AUTH->>AUTH: Archived
  end
```

---

## 6) Cross-team handoff bus (logical)

```mermaid
flowchart LR
  Sales -->|Proposal accepted| Billing
  Billing -->|Payment Successful| Provisioning
  Provisioning -->|Welcome sent| Implementation
  Implementation -->|Finish Setup| CS
  CS -->|Renewal window| Renewals
  Renewals -->|Failure| Billing
  CS -->|Cancel| Billing
  Billing -->|Suspended| Support
  Support -->|Ownership issue| MasterAdmin
```

# 14 — State Diagrams

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Acquisition session states (public)

```mermaid
stateDiagram-v2
  [*] --> Exploring
  Exploring --> Touring: Start tour
  Touring --> Exploring: Exit
  Touring --> Pricing: See pricing
  Exploring --> Pricing: CTA
  Pricing --> CheckoutPending: Select self-serve plan
  Pricing --> SalesLead: Enterprise / Contact Sales
  CheckoutPending --> CheckoutCanceled: cancel_url
  CheckoutPending --> CheckoutExpired: session expired
  CheckoutPending --> Paid: payment success
  CheckoutCanceled --> Pricing: resume
  CheckoutExpired --> Pricing: new session
  Paid --> Provisioning: webhook / ledger
  Provisioning --> ProvisionReady: org + admin exist
  Provisioning --> ProvisionDelayed: timeout threshold
  Provisioning --> ProvisionFailed: hard failure
  ProvisionReady --> FirstLogin: credentials used
  ProvisionDelayed --> ProvisionReady: eventually
  ProvisionDelayed --> ProvisionFailed: give up / support
  SalesLead --> [*]
  FirstLogin --> [*]
```

---

## Organization commercial / setup states (post-purchase)

Aligns with AUTH org commercial lifecycle + Guided Setup Finish Setup:

```mermaid
stateDiagram-v2
  [*] --> PendingSetup: provisioned (paid/trialing)
  PendingSetup --> Trial: trial plan
  PendingSetup --> Active: Finish Setup + activate
  Trial --> Active: activate + convert/paid rules
  Active --> PastDue: invoice failure
  PastDue --> Active: payment recovered
  Active --> CancelAtPeriodEnd: customer cancels
  CancelAtPeriodEnd --> Canceled: period end
  PastDue --> Suspended: grace exhausted (COM)
  Suspended --> Active: recovered
  Canceled --> Archived: retention elapsed
```

---

## Entitlement enforcement overlay

```mermaid
stateDiagram-v2
  [*] --> Entitled
  Entitled --> CreateAllowed: active/trialing + under limits
  Entitled --> CreateBlocked: past_due OR at limit OR canceled
  CreateBlocked --> CreateAllowed: upgrade / pay / resume
```

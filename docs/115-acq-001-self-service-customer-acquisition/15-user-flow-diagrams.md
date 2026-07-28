# 15 — User Flow Diagrams

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## F1 — Self-serve Professional purchase

```mermaid
flowchart TD
  A[Visitor lands] --> B{Intent}
  B -->|Learn| C[Product tour]
  B -->|Buy| D[Pricing]
  C --> D
  D --> E{Plan}
  E -->|Professional / Business / Trial| F[Collect company + email]
  E -->|Enterprise| G[Contact Sales]
  F --> H[Stripe Checkout]
  H -->|Success| I[Success page provisioning]
  H -->|Cancel| J[Canceled page]
  I --> K[Email credentials]
  K --> L[First login]
  L --> M[Guided Setup]
  M --> N[Activate org]
  N --> O[Dashboard]
  G --> P[Sales pipeline]
```

---

## F2 — Existing customer hits pricing

```mermaid
flowchart TD
  A[Pricing page] --> B{Authenticated?}
  B -->|No| C[Self-serve CTAs]
  B -->|Yes + has open sub| D[Prompt: Manage billing]
  D --> E[Settings → Billing]
  B -->|Yes + no sub| C
```

---

## F3 — Error recovery (provision delayed)

```mermaid
flowchart TD
  A[Success page] --> B{Provision status}
  B -->|ready| C[Go to login / first-login]
  B -->|provisioning| D[Wait + auto-refresh]
  B -->|delayed| E[Show support + correlation id]
  B -->|failed| F[Support recovery path]
  D --> B
```

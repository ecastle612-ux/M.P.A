# S0 Architecture Diagrams — Financial Operations Foundation

**Slice:** FIN-OPS-001 S0  
**Date:** 2026-08-06

---

## 1. Commercial placement

```mermaid
flowchart TB
  subgraph products [Commercial Products]
    PM[Property Manager]
    FAC[Facility Operations]
    CP[Complete Platform]
  end

  FO[Financial Operations<br/>pm.financial_operations]
  SaaS[SaaS Billing<br/>platform.billing_self]

  PM --> FO
  CP --> FO
  FAC -.->|no access| FO
  PM --> SaaS
  FAC --> SaaS
  CP --> SaaS
```

---

## 2. S0 foundation stack

```mermaid
flowchart LR
  subgraph shared [packages/shared finance]
    Domain[Domain registration]
    Perms[pm.finance permissions]
    Events[Event catalog]
    Audit[Audit catalog]
    Notify[Notification catalog]
    Search[Search entities]
    Flags[Feature flags]
    Integs[Integration points]
  end

  subgraph data [Supabase]
    EDE[event_domain_events]
    AE[audit_events]
    FCA[financial_connect_accounts]
    FMS[financial_module_settings]
    Caps[permission_capabilities]
  end

  subgraph web [apps/web]
    CC[FO Command Center<br/>/pm/financial-operations]
    Nav[Sidebar + Launcher]
    MA[Master Admin discovery]
    NC[Notification Center]
    GS[Global Search]
  end

  Domain --> CC
  Perms --> Caps
  Events --> EDE
  Audit --> AE
  Flags --> FMS
  Integs --> CC
  Domain --> Nav
  Domain --> MA
  Notify --> NC
  Search --> GS
  FCA --> CC
```

---

## 3. Command Center (STD-001 / Operations Console)

```mermaid
flowchart TB
  subgraph foHome ["/pm/financial-operations"]
    Header[Brand + S0 badges]
    Sections[Section rail Overview · S1+ placeholders]
    subgraph console [Operations Console Shell]
      Queue[Attention queue<br/>Connect / no charges / no invoices]
      Plane[Work plane<br/>Integrations · Timeline · Empty S1–S6]
    end
    Progress[Slice progress S0 complete · S1–S8 blocked]
  end

  Header --> Sections --> console --> Progress
  Queue --- Plane
```

---

## 4. Integration points (no duplicate money systems)

```mermaid
flowchart LR
  FO[Financial Operations]
  Prop[Properties]
  Res[Residents]
  Vend[Vendors]

  Prop -->|property_id on future charges| FO
  Res -->|lease_id / resident context| FO
  Vend -->|vendor_id / work_order_id| FO
  FO -->|deep link panels only in S0| Prop
  FO -->|deep link panels only in S0| Res
  FO -->|deep link panels only in S0| Vend
```

---

## 5. Slice boundary

```mermaid
flowchart LR
  S0[S0 Foundation<br/>AUTHORIZED]
  S1[S1 Charges]
  S2[S2 Payments]
  S3[S3 Late fees]
  S4[S4 Vendor invoices]
  S5[S5 Vendor payments]
  S6[S6 Reports]
  S7[S7 Polish]
  S8[S8 Cert]

  S0 --> S1
  S1 --> S2
  S1 --> S3
  S0 --> S4
  S4 --> S5
  S2 --> S6
  S5 --> S6
  S6 --> S7 --> S8
```

S1–S8 require separate `AUTHORIZE FIN-OPS-001 SLICE Sn` messages.

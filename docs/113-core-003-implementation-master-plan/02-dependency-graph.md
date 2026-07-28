# 02 — Implementation Dependency Graph

**Package:** CORE-003  
**Legend:** `→` hard dependency (blocked until prior Validated/Certified/PASS) · `⋯` soft/integration dependency (may start earlier; validation waits)

---

## Graph (Mermaid)

```mermaid
flowchart TB
  subgraph Done["Already complete"]
    FINA[FIN-003 A ✅]
    FINB[FIN-003 B ✅]
    PAY1[PAY-001 S1 ✅]
    PAY2[PAY-001 S2 ✅]
    PMX1c[PMX-004 P1 code ✅]
  end

  subgraph Gate["Immediate gates"]
    PMX1v[PMX-004 P1 Final PASS]
    PAY3[PAY-001 S3 + Verified]
  end

  subgraph Foundation["M1 Foundation — parallel OK"]
    UXA[UX-012 A]
    OPSA[OPS-001 A]
    AUTHA[AUTH-001 A]
  end

  subgraph Customer["Customer spine"]
    AUTHB[AUTH-001 B]
    COMA[COM-001 A]
    AUTHC[AUTH-001 C]
    AUTHD[AUTH-001 D]
    AUTHE[AUTH-001 E]
    COMB[COM-001 B]
    COMC[COM-001 C]
    COMD[COM-001 D]
    COME[COM-001 E]
  end

  subgraph OpsUX["Platform OS + Experience"]
    UXB[UX-012 B]
    OPSC[OPS-001 B]
    OPSC2[OPS-001 C]
    OPSD[OPS-001 D]
    OPSE[OPS-001 E]
    UXC[UX-012 C]
    UXD[UX-012 D]
    UXE[UX-012 E]
  end

  subgraph Money["Money-out"]
    FINC[FIN-003 C]
    FIND[FIN-003 D]
    FINE[FIN-003 E]
  end

  subgraph PMX["Native PWA"]
    PMX2[PMX-004 P2+]
    PMX11[PMX-004 P11 COMPLETE]
  end

  FINA --> FINB
  PAY1 --> PAY2 --> PAY3
  FINB --> FINC
  PAY3 --> FINC
  FINC --> FIND --> FINE

  PMX1c --> PMX1v --> PMX2 --> PMX11

  UXA --> UXB --> UXC --> UXD --> UXE
  OPSA --> OPSC --> OPSC2 --> OPSD --> OPSE
  OPSE ⋯ UXC

  AUTHA --> AUTHB --> AUTHC --> AUTHD --> AUTHE
  AUTHB ⋯ COMA
  COMA --> COMB --> COMC --> COMD --> COME
  AUTHB --> COMA

  OPSA ⋯ COMA
  OPSA ⋯ AUTHB
  OPSC ⋯ FIND
  OPSC ⋯ AUTHC
```

---

## Edge justifications (cross-package)

| From | To | Type | Justification |
|------|----|------|---------------|
| AUTH-A | AUTH-B | Hard | Provisioning assumes username identity + invitation-only login model |
| AUTH-B | COM-A (integration) | Hard for end-to-end | Activation must call/idempotent-provision orgs; Won↛org without Payment Successful |
| COM-A | AUTH-B | Soft start | Pipeline/activation **contract** may be designed/stubbed with AUTH-A; **live handoff validate** needs AUTH-B |
| AUTH-B | AUTH-C | Hard | Invites attach to provisioned org + Org Admin |
| AUTH-C | AUTH-D | Hard | Roles/dashboards require active memberships |
| AUTH-D | AUTH-E | Hard | Recovery/audit build on permission model |
| COM-A→E | serial | Hard | Package slice board |
| OPS-A→E | serial | Hard | Package slice board; bus before consumers |
| UX-A→E | serial | Hard | Package slice board |
| OPS-A | AUTH-B / COM-A | Soft | Emit provision/activation events onto bus; avoid inventing side channels |
| OPS-B | AUTH-C | Soft | Invite/welcome notifications should use Notification Center / EML path, not ad-hoc forever |
| OPS-E | UX-C | Soft → Hard for validate | Command Center chrome can scaffold; **PASS** needs OPS Command Center data |
| PAY-001 Verified | FIN-003 C | Hard | Settlement funding must exist before owner transfers |
| FIN-B | FIN-C | Hard | Connect foundation + onboarding certified |
| FIN-C | FIN-D/E | Hard | Portal/notify/hardening after money path |
| PMX-1 Final PASS | PMX-2+ | Hard | Package gate [17] |
| UX-A/B | PMX-2+ UI | Soft | Install sheets / shell should consume tokens/components, not invent styles |
| OPS-B | FIN-D | Soft | Payout notifications should not invent a second notify stack |

---

## Blocked units (cannot Authorize yet)

| Unit | Blocked by |
|------|------------|
| FIN-003 Phase C | PAY-001 not fully Verified; Phase C Authorize not issued; P1–P10 prerequisites |
| FIN-003 D/E | Phase C |
| PMX-004 Phase 2+ | Phase 1 production Final PASS incomplete |
| COM-001 B–E | Prior COM slices |
| AUTH-001 B–E | Prior AUTH slices |
| OPS-001 B–E | Prior OPS slices |
| UX-012 B–E | Prior UX slices |
| UX-012 C full validate | OPS-001 E (or equivalent Command Center data contract delivered) |
| COM-001 E | ADMIN-003 alignment (staff surfaces) |

---

## Phase sets (Authorize is serial — see [05](./05-master-implementation-order.md))

| Phase | Units (authorized one at a time) | Notes |
|-------|----------------------------------|-------|
| M0 | PMX-1 Final PASS · PAY-001 verify · infra validation | Gates before any M1 code |
| M1 | UX-A → OPS-A → AUTH-A | UX-A is first implementation Authorize |
| M2 | AUTH-B · COM-A · OPS-B · UX-B · PMX-2 | COM owns activation; AUTH owns provision |
| M3–M6 | Per official sequence in [05](./05-master-implementation-order.md) | No multi-slice concurrent Authorize |

Capacity planning streams: [04](./04-parallel-workstreams.md) (prep only; not concurrent Authorize).

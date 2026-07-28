# 04 — Parallel Workstreams

**Package:** CORE-003  
**Status:** ✅ Approved — **capacity planning only**

> **Binding override (2026-07-23 approval):** Do **not** begin multiple slices simultaneously.  
> This document describes **team capacity assignment** and **which streams exist**.  
> **Authorize + implement remains serial** per [05](./05-master-implementation-order.md) and [09](./09-authorization-protocol.md).  
> Background work (docs, test plans, device lab scheduling, PAY verification evidence) may continue without a slice Authorize.

---

## Streams (staffing)

| Stream | Packages | Role |
|--------|----------|------|
| 1 Identity & Customer | AUTH-001, COM-001 | Customer spine |
| 2 Platform OS | OPS-001 | Events, notify, tasks, command data |
| 3 Experience | UX-012 | Tokens, components, surfaces |
| 4 Money & Native | PAY-001, FIN-003, PMX-004 | Money-out + PWA gates |

Streams may **prepare** the next unit while another is in Validate — they may **not** start a second Authorized implementation without amendment.

---

## Active phase focus

| Phase | Active Authorizes (serial) |
|-------|----------------------------|
| M0 | Gates only (PMX-1 Final PASS, PAY verify, infra) |
| M1 | UX-A → OPS-A → AUTH-A |
| M2 | AUTH-B → COM-A → OPS-B → UX-B → PMX-2 (order per [05](./05-master-implementation-order.md)) |
| M3–M6 | Per official sequence card in [05](./05-master-implementation-order.md) |

---

## Explicit anti-parallel (unchanged)

| Pair | Why |
|------|-----|
| Two Authorized slices at once | Approval forbids |
| FIN-003 C + ad-hoc transfer helpers | Custody |
| AUTH inventing customers / COM inventing identity | SoC |
| OPS-A + module-local buses | Fragmentation |
| UX-C COMPLETE without OPS-E data | False claim |

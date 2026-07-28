# 06 — Guided Setup & Activation

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Guided Setup integration

Self-serve customers use the **same** Guided Setup as sales-assisted customers.

| Requirement | Detail |
|-------------|--------|
| Mandatory | Cannot claim “ready to operate” without Finish Setup criteria |
| Finish Setup | Secondary recovery contact ready + `commercial_status=active` (existing) |
| SetupGate | Allows defined productive paths during incomplete setup; blocks premature “complete” claim |
| Resume | Refresh / revisit `/setup` restores progress |

ACQ-001 does not replace Setup; it ensures post-purchase redirects land users into it.

---

## Organization activation

| Actor | Action |
|-------|--------|
| Org Admin | Completes recovery + Mark organization active (existing commercial activation UX) |
| System | May set `pending_setup` / `trial` commercial status at provision |
| Staff | May assist Enterprise; not required for Pro/Business happy path |

---

## Production dashboard

When setup complete + active:

- Land on Command Center / dashboard  
- Nav shows entitled modules only  
- Upgrade prompts appear when limits hit (existing entitlement messages → Billing)  

---

## Implementation preference

COM-001 supports Professional Implementation vs AI Guided:

| Self-serve default | AI Guided / self Setup (no mandatory paid Professional Implementation) |
| Enterprise | Sales may attach Professional Implementation |

Customers may later purchase Professional Implementation as add-on (COM open question Q8) — out of ACQ V1 critical path.

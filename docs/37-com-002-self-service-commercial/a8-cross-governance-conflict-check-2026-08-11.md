# A8 Cross-Governance Conflict Check

**Date:** 2026-08-11  
**Scope:** Documentation review only — **no edits** to BILL-001, ADR-019, or Product Constitution in this amendment.  
**COM-002 change:** Amendment **A8** (unit-capacity model) applied inside `docs/37-com-002-self-service-commercial/`.

---

## BILL-001

| Question | Result |
|----------|--------|
| Dedicated BILL-001 governing package present on `main`? | **No** authoritative BILL-001 commercial policy document found under `docs/` |
| References found | Operational mention only (e.g. migration/recon notes in BUG-012 execution report) |
| Direct conflict with no seat limit / no property limit / unit-based capacity? | **NO** — no BILL-001 binding capacity rules located to conflict |

**Amendment required:** None identified. If a BILL-001 package is introduced later, it must adopt managed-unit capacity (A8), not seat/property caps.

---

## ADR-019 (Product Constitution ADR)

| Question | Result |
|----------|--------|
| Direct conflict with removing seat/property limits? | **NO** — ADR-019 does not define seat or property commercial caps |
| Direct conflict with unit-based capacity? | **NO** — silent on capacity meter; compatible |
| Relationship to PM Business removal? | **Aligned** — ADR-019 already forbids Professional/Business as customer-facing plan choosers; A8 makes COM-002 match |

**Amendment required:** None. Optional future clarification only if Owner wants ADR-019 to explicitly name managed-unit capacity (not required to unblock A8).

---

## Product Constitution

| Question | Result |
|----------|--------|
| Direct conflict with removing seat/property limits? | **NO** |
| Direct conflict with unit-based capacity? | **NO** |
| Relationship to PM Business / Enterprise product framing? | **Aligned** — Constitution forbids SaaS tiers (Professional, Business, …) as customer-facing plans and forbids Enterprise as a product/tier |

**Amendment required:** None. A8 updates COM-002 to follow the Constitution flow (Choose Product → Monthly/Annual) and removes Business as a customer product.

---

## STOP

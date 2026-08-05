# 08 — Phase 1: Property Lifecycle (Design)

**Package:** CORE-004  
**Phase:** 1 — Property Lifecycle  
**Status:** 📝 **Design / Document complete · Implement locked**  
**Date:** 2026-08-05  
**Authorize phrase (not yet issued):**

```
AUTHORIZE CORE-004 PHASE 1 – Property Lifecycle
```

**Inheritance:** [02](./02-ux-inheritance-contract.md)  
**Workflow law:** [07](./07-workflow-requirement.md)  
**Reuse:** [Phase 4 Core Property Foundation](../24-phase-4-core-property-foundation/index.md) · [ADR-015](../18-decision-log/adr-015-phase-4-core-property-foundation.md) · AUTH/COM org provisioning where applicable

---

## 1. Mission

Deliver the **end-to-end property lifecycle** as one operational capability — from acquisition through disposition — so operators can finish real portfolio outcomes on certified UDF / nav surfaces.

ARCH-001: **Extend** Phase 4 property/unit aggregates; **Reuse** Mission / Waiting / Assistant / audit patterns; **Consolidate** fragmented onboarding; **Create** only missing lifecycle states and handoffs.

---

## 2. Lifecycle stages (scope)

| Stage | Business outcome |
|-------|------------------|
| **Acquisition** | A candidate property enters the pipeline with owner/org intent |
| **Organization onboarding** | Org has minimum setup to operate (team, settings, entitlements) |
| **Property onboarding** | Property + units structured with required operational fields |
| **Activation** | Property is live for leasing / maintenance / resident ops |
| **Occupancy lifecycle** | Unit vacant ↔ occupied continuity with auditable transitions |
| **Turnover** | Make-ready between residents (checklist → ready to lease) |
| **Disposition** | Property exits active portfolio (sold / offboarded) with audit |

---

## 3. Workflow answers (phase-level)

| Question | Answer |
|----------|--------|
| Who starts it? | Organization Admin / Property Manager (acquisition & onboarding); system + PM for occupancy/turnover; Org Admin / PM for disposition |
| What triggers it? | Create acquisition / continue onboarding / activate property / lease move-in·out events / start turnover / initiate disposition |
| Who participates? | Org Admin · Property Manager · (optional) Owner via View As · Master Admin only via Hybrid C View As / Test Mode |
| What automations occur? | Status transitions; required-field gates; Waiting queue items; turnover checklist defaults; activation entitlement checks |
| What notifications occur? | Critical: blocked activation / disposition confirmation; Today: onboarding incomplete, turnover due; Later: disposition archive |
| What audit events occur? | `property.lifecycle.*` events for each stage transition (actor, org, property, from/to state, timestamp) |
| What dashboard updates? | Insights (portfolio counts, vacant, turnover); Waiting on Me (incomplete onboarding, pending activation, turnover blockers); Timeline |
| What does Assistant recommend? | Complete onboarding · Activate property · Start turnover for vacant unit · Review disposition checklist |
| What completes the workflow? | Stage-specific terminal states below; phase certifies when happy path Acquisition → … → Disposition is operable |

### Stage terminal states

| Stage | Complete when |
|-------|---------------|
| Acquisition | Record accepted into onboarding (or rejected/withdrawn) |
| Org onboarding | Org readiness checklist green for property ops |
| Property onboarding | Property + ≥1 unit meet activation requirements |
| Activation | `property.status = active` (or equivalent) and entitled modules can run |
| Occupancy | Unit occupancy state transitions recorded with lease/resident link when applicable |
| Turnover | Unit marked ready-to-lease; Waiting item cleared |
| Disposition | Property marked disposed/archived; no new ops work; audit closed |

---

## 4. Surfaces (STD-001)

| Surface | Role |
|---------|------|
| Properties home | UDF-mounted operational home (Greeting → Assistant → Waiting → Insights → Timeline → Quick Actions) |
| Property detail | Lifecycle stage, next action, timeline, documents links |
| Unit detail | Occupancy + turnover status |
| Mission Control | Platform health / search only — **not** a parallel property ops home |
| Workspace Launcher | Existing PM Open / View As paths — no new MA cards |

No new dashboard anatomy. No parallel sidebar.

---

## 5. Security

| Control | Requirement |
|---------|-------------|
| RBAC | Capability-gated create/update/activate/dispose |
| Tenant / org isolation | All reads/writes org-scoped (RLS) |
| Master Admin | Hybrid C — View As / Test Mode only for customer property data; no silent inherit |
| Audit | Fail-visible writes for lifecycle transitions |
| API / server actions | Same authorization plane as pages |

---

## 6. Implementation slices (suggested under Phase 1 Authorize)

When Phase 1 is authorized, implement in this internal order (still end-to-end per slice):

| Slice | Outcome |
|-------|---------|
| **P1-A** | Acquisition → Property onboarding → Activation (happy path) |
| **P1-B** | Occupancy lifecycle transitions (vacant ↔ occupied) wired to existing lease signals where present |
| **P1-C** | Turnover workflow (start → checklist → ready) |
| **P1-D** | Disposition workflow + portfolio removal from active ops |

Each slice must still answer [07](./07-workflow-requirement.md) and ship Verify artifacts.

---

## 7. Explicit non-goals (Phase 1)

- Full leasing pipeline (Phase 3)  
- Maintenance dispatch (Phase 2)  
- Financial distributions (Phase 6)  
- New SignWell product work beyond linking existing vault if a disposition/onboarding doc already exists  
- Master Admin redesign  
- New UX initiative  

---

## 8. Acceptance criteria (Authorize → Implement)

1. Operator can take a property from acquisition through activation without leaving STD-001 homes.  
2. Occupancy and turnover produce Waiting / Timeline / Assistant updates.  
3. Disposition removes property from active ops queues with audit.  
4. All lifecycle transitions are capability-checked and org-isolated.  
5. Unit + integration + a11y + performance + security checks pass.  
6. Before/after screenshots attached to certification.  
7. Workflow certification document answers all nine questions per shipped slice.

---

## 9. Gate status

| Stage | Status |
|-------|--------|
| Design | ✅ This document |
| Document | ✅ Package 120 |
| Approve (program) | ✅ CORE-004 Approved |
| Authorize (phase) | ❌ **Not issued** |
| Implement | 🔒 Locked |
| Verify / Certify | 🔒 Locked |

**Next human/agent action:** issue `AUTHORIZE CORE-004 PHASE 1 – Property Lifecycle` to unlock implementation.

# 19 — Implementation Slices

**Package:** UX-012  
**Amendment:** A08 (finalized slice board)  
**Status:** Binding (Approved with Amendments)  
**Implementation:** Slice A ✅ **VALIDATED** ([32](./32-slice-a-validation.md)) · Slice B ✅ **IMPLEMENTED** ([34](./34-slice-b-implementation.md)) · Validation 🔒 until `VALIDATE UX-012 SLICE B` · C–E 🔒 until each slice is explicitly authorized  
**Methodology:** Same gated pattern as OPS-001 / AUTH-001 / COM-001

---

## Gate per slice

```
Design → Authorize → Implementation → Validation
```

Each Validation includes the [Design Review Process](./28-design-review-process.md) (scoped to slice surfaces) and [Quality Standards](./25-design-quality-standards.md).

Phrases:

```
AUTHORIZE UX-012 SLICE A
VALIDATE UX-012 SLICE A
AUTHORIZE UX-012 SLICE B
VALIDATE UX-012 SLICE B
```

No UI slice implementation is authorized until its explicit `AUTHORIZE UX-012 SLICE …` phrase is recorded.

---

## Slice catalog (binding)

### Slice A — Design foundations

| Deliverable |
|-------------|
| Design Tokens |
| Typography |
| Spacing |
| Color System |

| Field | Content |
|-------|---------|
| **Also** | Token governance enforcement in `packages/ui`; no hardcoded values on touched surfaces |
| **Depends on** | UX-012 Approved with Amendments; Canopy |
| **Validation** | Token audit clean; light/dark semantic pairs |

### Slice B — Core components

| Deliverable |
|-------------|
| Core Components |
| Forms |
| Navigation |
| Tables |
| Cards |

| Field | Content |
|-------|---------|
| **Also** | Maturity ≥ Beta→Production for shared primitives; a11y basics |
| **Depends on** | Slice A Validated |
| **Validation** | Component states; nav patterns; table density |

### Slice C — Role surfaces

| Deliverable |
|-------------|
| Role Dashboards |
| Command Center |
| Role Experiences |

| Field | Content |
|-------|---------|
| **Also** | Playbooks ([23](./23-role-experience-playbooks.md)); Command Center spec ([24](./24-command-center-design-specification.md)) |
| **Depends on** | Slice B Validated; OPS Command Center data when required |
| **Validation** | Role homes purpose-built; signature Command Center |

### Slice D — AI + a11y + responsive

| Deliverable |
|-------------|
| AI Experience |
| Motion |
| Accessibility |
| Responsive Behavior |

| Field | Content |
|-------|---------|
| **Also** | Confidence/approval UI; reduced motion; mobile-first paths |
| **Depends on** | Slice C Validated |
| **Validation** | WCAG AA on touched journeys; AI integrated look |

### Slice E — Polish + final validation

| Deliverable |
|-------------|
| Visual Polish |
| Microinteractions |
| Performance |
| Final UX Validation |

| Field | Content |
|-------|---------|
| **Also** | Experience metrics baselines; full review gate on flagship journeys |
| **Depends on** | Slice D Validated |
| **Validation** | Quality standards Q-01–Q-14; review process complete |

---

## Slice status board

| Slice | Design | Authorize | Implement | Validate |
|-------|--------|-----------|-----------|----------|
| A | ✔ | ✅ | ✅ ([31](./31-slice-a-implementation.md)) | ✅ ([32](./32-slice-a-validation.md)) |
| B | ✔ | ✅ ([33](./33-slice-b-authorization.md)) | ⏳ | 🔒 |
| C | ✔ | 🔒 | 🔒 | 🔒 |
| D | ✔ | 🔒 | 🔒 | 🔒 |
| E | ✔ | 🔒 | 🔒 | 🔒 |

---

## Acceptance (A08)

| ID | Criterion |
|----|-----------|
| SL-01 | Slices A–E match amendment deliverables |
| SL-02 | Design → Approval → Implementation → Validation |
| SL-03 | No UI code without `AUTHORIZE UX-012 SLICE …` |

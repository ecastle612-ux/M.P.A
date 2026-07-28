# 26 — Implementation Slices

**Package:** COM-001  
**Amendment:** Approval condition (gated methodology)  
**Status:** Binding (Approved with Amendments)  
**Implementation:** Slice A ✅ **VALIDATED** ([30](./30-slice-a-validation.md) · **PASS**) · Slice B ✅ **VALIDATED** ([33](./33-slice-b-validation.md) · **PASS**) · Slice C ✅ **VALIDATED** ([36](./36-slice-c-validation.md) · **PASS**) · Slice D ✅ **VALIDATED** ([39](./39-slice-d-validation.md) · **PASS**) · Slice E ✅ **VALIDATED** ([42](./42-slice-e-validation.md) · **PASS**) · A–E ✅ **COMPLETE**  
**Methodology:** Same gated pattern as AUTH-001 / PMX-004

---

## Gate per slice

```
Design (this package) → Authorize slice → Implementation → Validation
```

**Default:** No slice begins until the prior slice is Validated.

Phrases:

```
AUTHORIZE COM-001 SLICE A
VALIDATE COM-001 SLICE A
AUTHORIZE COM-001 SLICE B
VALIDATE COM-001 SLICE B
AUTHORIZE COM-001 SLICE C
VALIDATE COM-001 SLICE C
AUTHORIZE COM-001 SLICE D
VALIDATE COM-001 SLICE D
AUTHORIZE COM-001 SLICE E
VALIDATE COM-001 SLICE E
```

---

## Slice catalog

### Slice A — Commercial data foundation

| Field | Content |
|-------|---------|
| **Scope** | Opportunity / pipeline model · activation event contract · org↔opportunity link |
| **Includes** | Sales pipeline stages ([17](./17-sales-pipeline.md)); handoff packet to AUTH-001; no UI required beyond ops minimum |
| **Depends on** | COM-001 Approved with Amendments; AUTH-001 / BILL-001 boundaries |
| **Validation** | Won↛org without Payment Successful; idempotent activation |

### Slice B — Implementation progress + trial experience

| Field | Content |
|-------|---------|
| **Scope** | Implementation score ([18](./18-implementation-progress.md)) · Trial experience ([24](./24-trial-experience.md)) |
| **Includes** | Milestone tracking; trial reminders/grace/upgrade hooks (BILL-001 compatible) |
| **Depends on** | Slice A Validated |
| **Validation** | Score visible to customer/CS; trial convert path |

### Slice C — Health + feature discovery + timeline

| Field | Content |
|-------|---------|
| **Scope** | Health score ([19](./19-customer-health-score.md)) · Feature discovery ([20](./20-feature-discovery.md)) · Communication timeline ([23](./23-customer-communication-timeline.md)) |
| **Depends on** | Slice B Validated |
| **Validation** | Bands drive CS priority; discoveries entitlement-safe; comms logged |

### Slice D — Offboarding + success automation

| Field | Content |
|-------|---------|
| **Scope** | Offboarding ([21](./21-customer-offboarding.md)) · CS motions automation (30/90, renewals alerts) |
| **Depends on** | Slice C Validated |
| **Validation** | Export/freeze/archive path; no surprise purge |

### Slice E — Commercial dashboard (+ marketplace prep)

| Field | Content |
|-------|---------|
| **Scope** | Staff commercial dashboard ([22](./22-commercial-dashboard.md)); marketplace data model stubs ([25](./25-implementation-marketplace.md)) |
| **Depends on** | Slice D Validated; ADMIN-003 alignment |
| **Validation** | Staff-only access; widgets populated from real aggregates |

---

## Explicitly deferred

| Item | Notes |
|------|-------|
| Certified partner marketplace UI | Post–E; separate Authorize |
| External CRM deep sync | Ops choice; Slice A may be event/API only |
| AUTH-001 / BILL-001 code | Their own slice authorizations |

---

## Slice status board

| Slice | Design | Authorize | Implement | Validate |
|-------|--------|-----------|-----------|----------|
| A | ✔ | ✅ ([28](./28-slice-a-authorization.md)) | ✅ ([29](./29-slice-a-implementation.md)) | ✅ **PASS** ([30](./30-slice-a-validation.md)) |
| B | ✔ | ✅ ([31](./31-slice-b-authorization.md)) | ✅ ([32](./32-slice-b-implementation.md)) | ✅ **PASS** ([33](./33-slice-b-validation.md)) |
| C | ✔ | ✅ ([34](./34-slice-c-authorization.md)) | ✅ ([35](./35-slice-c-implementation.md)) | ✅ **PASS** ([36](./36-slice-c-validation.md)) |
| D | ✔ | ✅ ([37](./37-slice-d-authorization.md)) | ✅ ([38](./38-slice-d-implementation.md)) | ✅ **PASS** ([39](./39-slice-d-validation.md)) |
| E | ✔ | ✅ ([40](./40-slice-e-authorization.md)) | ✅ ([41](./41-slice-e-implementation.md)) | ✅ **PASS** ([42](./42-slice-e-validation.md)) |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| SL-01 | Slices A–E defined with Design → Authorize → Implement → Validate |
| SL-02 | No implementation without `AUTHORIZE COM-001 SLICE …` |
| SL-03 | Methodology matches AUTH-001 / PMX-004 discipline |
